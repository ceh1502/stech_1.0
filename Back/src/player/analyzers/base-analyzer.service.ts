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
   * 공통: 선수 데이터베이스 저장
   */
  protected async savePlayerStats(
    jerseyNumber: number,
    teamName: string,
    position: string,
    stats: any,
  ): Promise<any> {
    try {
      const playerId = `${position}_${teamName}_${jerseyNumber}`;
      console.log(`💾 선수 저장/업데이트 시도: playerId = ${playerId}`);
      
      // 기존 선수 찾기 - 먼저 playerId로, 그 다음 팀명+등번호로
      let existingPlayer = await this.playerModel.findOne({ playerId });
      
      if (!existingPlayer) {
        // playerId로 못 찾으면 팀명+등번호로 찾기 (멀티 포지션 지원)
        existingPlayer = await this.playerModel.findOne({ 
          teamName, 
          jerseyNumber 
        });
        
        if (existingPlayer) {
          console.log(`🔄 기존 선수 발견 (${existingPlayer.position} -> ${position} 스탯 추가): ${existingPlayer.name}`);
        }
      }

      if (existingPlayer) {
        // 기존 선수 스탯 업데이트 (기존 값에 추가)
        console.log(`🔄 기존 선수 업데이트: ${playerId}`);
        
        const updatedStats = { ...existingPlayer.stats };
        
        // 각 스탯 값을 기존 값에 추가
        for (const [key, value] of Object.entries(stats)) {
          if (typeof value === 'number') {
            updatedStats[key] = (updatedStats[key] || 0) + value;
          } else {
            updatedStats[key] = value;
          }
        }
        
        existingPlayer.stats = updatedStats;
        await existingPlayer.save();

        console.log(`✅ ${position} 선수 업데이트 성공: ${playerId}`);

        return {
          success: true,
          message: `${position} ${jerseyNumber}번 (${teamName}) 스탯 업데이트 완료`,
          player: existingPlayer.name,
        };
      } else {
        // 새 선수 생성
        console.log(`🆕 새 ${position} 선수 생성: ${playerId}`);
        console.log(`📊 저장할 스탯:`, stats);
        
        const newPlayer = new this.playerModel({
          name: `${position} ${jerseyNumber}번`,
          playerId,
          position,
          teamName,
          jerseyNumber,
          league: '1부',
          season: '2024',
          stats,
        });

        await newPlayer.save();
        console.log(`✅ ${position} 선수 저장 성공: ${playerId}`);

        return {
          success: true,
          message: `${position} ${jerseyNumber}번 (${teamName}) 신규 선수 생성 및 스탯 저장 완료`,
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