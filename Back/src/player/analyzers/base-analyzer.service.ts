import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../../schemas/player.schema';

// 클립 데이터 기본 인터페이스
export interface ClipData {
  clipKey: string;
  offensiveTeam: string; // "Home" or "Away"
  quarter: number;
  down: string | null;
  toGoYard: number | null;
  playType: string;
  specialTeam: boolean;
  start: { side: string; yard: number };
  end: { side: string; yard: number };
  gainYard: number;
  car: { num: number; pos: string };
  car2: { num: number | null; pos: string | null };
  tkl: { num: number | null; pos: string | null };
  tkl2: { num: number | null; pos: string | null };
  significantPlays: (string | null)[];
}

// 게임 데이터 기본 인터페이스
export interface GameData {
  gameKey: string;
  date: string;
  type: string;
  score: { home: number; away: number };
  region: string;
  location: string;
  homeTeam: string;
  awayTeam: string;
  Clips: ClipData[];
}

@Injectable()
export abstract class BaseAnalyzerService {
  constructor(
    @InjectModel(Player.name) protected playerModel: Model<PlayerDocument>,
  ) {}

  /**
   * 공통: significantPlays 처리
   * 터치다운, 인터셉션, 펌블, 색 등 특별한 플레이 처리
   */
  protected processSignificantPlays(
    clip: ClipData,
    stats: any,
    playType: string,
  ): void {
    if (!clip.significantPlays || !Array.isArray(clip.significantPlays)) return;

    for (const play of clip.significantPlays) {
      if (!play) continue;

      switch (play) {
        case 'TOUCHDOWN':
          this.processTouchdown(stats, playType);
          break;
        case 'INTERCEPT':
        case 'INTERCEPTION':
          this.processInterception(stats, playType);
          break;
        case 'FUMBLE':
          this.processFumble(stats, playType);
          break;
        case 'SACK':
          this.processSack(stats);
          break;
      }
    }
  }

  /**
   * 공통: 터치다운 처리 (포지션별로 오버라이드 가능)
   */
  protected processTouchdown(stats: any, playType: string): void {
    // 기본 구현 - 각 포지션에서 오버라이드
  }

  /**
   * 공통: 인터셉션 처리
   */
  protected processInterception(stats: any, playType: string): void {
    if (stats.passingInterceptions !== undefined) {
      stats.passingInterceptions++;
    }
  }

  /**
   * 공통: 펌블 처리
   */
  protected processFumble(stats: any, playType: string): void {
    if (stats.fumbles !== undefined) {
      stats.fumbles++;
    }
  }

  /**
   * 공통: 색 처리
   */
  protected processSack(stats: any): void {
    if (stats.sacks !== undefined) {
      stats.sacks++;
    }
  }

  /**
   * 멀티포지션 지원: 선수 데이터베이스 저장
   */
  protected async savePlayerStats(
    jerseyNumber: number,
    teamName: string,
    position: string,
    stats: any,
  ): Promise<any> {
    try {
      const playerId = `${teamName}_${jerseyNumber}`;
      console.log(`💾 선수 저장/업데이트 시도: playerId = ${playerId}, position = ${position}`);
      
      // 팀명+등번호로 기존 선수 찾기 (멀티포지션 지원)
      let existingPlayer = await this.playerModel.findOne({ 
        teamName, 
        jerseyNumber 
      });

      if (existingPlayer) {
        console.log(`🔄 기존 선수 발견 (멀티포지션 스탯 추가): ${existingPlayer.name}`);
        
        // DB 스페셜팀 스탯 디버깅
        if (position === 'DB') {
          console.log(`🐛 DB 저장할 스탯:`, stats);
          console.log(`🐛 DB 기존 포지션 스탯:`, existingPlayer.stats[position]);
        }
        
        // 포지션이 기존 리스트에 없으면 추가
        if (!existingPlayer.positions.includes(position)) {
          existingPlayer.positions.push(position);
          console.log(`📍 새 포지션 추가: ${position} -> 총 포지션: ${existingPlayer.positions.join(', ')}`);
        }
        
        // 해당 포지션의 스탯을 추가/업데이트
        if (!existingPlayer.stats[position]) {
          existingPlayer.stats[position] = {};
        }
        
        // 포지션별 스탯 업데이트
        const positionStats = existingPlayer.stats[position] || {};
        
        // 새로운 스탯 필드들을 모두 명시적으로 설정
        for (const [key, value] of Object.entries(stats)) {
          if (typeof value === 'number') {
            positionStats[key] = (positionStats[key] || 0) + value;
          } else {
            positionStats[key] = value;
          }
        }
        
        existingPlayer.stats[position] = positionStats;
        existingPlayer.stats.totalGamesPlayed = (existingPlayer.stats.totalGamesPlayed || 0) + (stats.gamesPlayed || 0);
        
        await existingPlayer.save();
        console.log(`✅ ${position} 선수 멀티포지션 스탯 업데이트 성공`);
        
        // DB 스페셜팀 저장 확인
        if (position === 'DB') {
          const saved = await this.playerModel.findOne({ teamName, jerseyNumber });
          console.log(`🐛 DB 저장 후 확인:`, saved?.stats?.DB);
        }

        return {
          success: true,
          message: `${jerseyNumber}번 (${teamName}) ${position} 포지션 스탯 업데이트 완료`,
          player: existingPlayer.name,
        };
      } else {
        // 새 선수 생성
        console.log(`🆕 새 선수 생성: ${playerId}`);
        console.log(`📊 저장할 스탯:`, stats);
        
        const initialStats = {
          [position]: { ...stats },  // 스프레드로 명시적 복사
          totalGamesPlayed: stats.gamesPlayed || 0
        };
        
        const newPlayer = new this.playerModel({
          name: `${jerseyNumber}번`,
          playerId,
          positions: [position],
          primaryPosition: position,
          teamName,
          jerseyNumber,
          league: '1부',
          season: '2024',
          stats: initialStats,
        });

        await newPlayer.save();
        console.log(`✅ ${position} 선수 저장 성공: ${playerId}`);
        
        // DB 스페셜팀 저장 확인 (신규)
        if (position === 'DB') {
          const saved = await this.playerModel.findOne({ teamName, jerseyNumber });
          console.log(`🐛 DB 신규 저장 후 확인:`, saved?.stats?.DB);
        }

        return {
          success: true,
          message: `${jerseyNumber}번 (${teamName}) 신규 선수 생성 및 ${position} 스탯 저장 완료`,
          player: newPlayer.name,
        };
      }
    } catch (error) {
      console.error(`${position} 스탯 저장 실패:`, error);
      return {
        success: false,
        message: `${position} ${jerseyNumber}번 스탯 저장 실패: ${error.message}`,
      };
    }
  }

  /**
   * 추상 메서드: 각 포지션별로 구현 필요
   */
  abstract analyzeClips(clips: ClipData[], gameData: GameData): Promise<any>;
}