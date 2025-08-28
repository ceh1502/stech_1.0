import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';

// 클립 데이터 인터페이스
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

// 게임 데이터 인터페이스
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

// QB 스탯 인터페이스
export interface QBStats {
  jerseyNumber: number;
  teamName: string;
  gamesPlayed: number;
  passingAttempts: number;
  passingCompletions: number;
  completionPercentage: number;
  passingYards: number;
  passingTouchdowns: number;
  passingInterceptions: number;
  longestPass: number;
  sacks: number;
  rushingAttempts: number;
  rushingYards: number;
  yardsPerCarry: number;
  rushingTouchdowns: number;
  longestRush: number;
  fumbles: number;
}

@Injectable()
export class ClipAnalyzerService {
  constructor(
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
  ) {}

  /**
   * 게임 데이터 분석해서 QB 스탯 추출 및 저장
   */
  async analyzeGameData(gameData: GameData): Promise<any> {
    console.log(`\n🎮 게임 분석 시작: ${gameData.gameKey}`);
    console.log(`📍 ${gameData.homeTeam} vs ${gameData.awayTeam}`);
    console.log(`📊 총 클립 수: ${gameData.Clips.length}`);

    // QB별 스탯 누적을 위한 Map
    const qbStatsMap = new Map<string, QBStats>();

    // 클립 하나씩 분석
    for (const clip of gameData.Clips) {
      await this.analyzeClip(clip, gameData, qbStatsMap);
    }

    // 최종 스탯 계산 및 저장
    const results = [];
    for (const [qbKey, qbStats] of qbStatsMap) {
      // 계산된 스탯 완성
      this.calculateFinalStats(qbStats);

      // 데이터베이스에 저장
      const saveResult = await this.saveQBStats(qbStats);
      results.push(saveResult);

      console.log(
        `\n🏈 QB ${qbStats.jerseyNumber}번 (${qbStats.teamName}) 최종 스탯:`,
      );
      console.log(
        `   패싱: ${qbStats.passingAttempts}시도/${qbStats.passingCompletions}성공 (${qbStats.completionPercentage}%)`,
      );
      console.log(
        `   패싱야드: ${qbStats.passingYards}, TD: ${qbStats.passingTouchdowns}, INT: ${qbStats.passingInterceptions}`,
      );
      console.log(
        `   러싱: ${qbStats.rushingAttempts}시도, ${qbStats.rushingYards}야드, TD: ${qbStats.rushingTouchdowns}`,
      );
      console.log(`   색: ${qbStats.sacks}, 펌블: ${qbStats.fumbles}`);
    }

    console.log(`\n✅ 게임 분석 완료 - ${qbStatsMap.size}명의 QB 처리됨`);
    return {
      success: true,
      message: `${qbStatsMap.size}명의 QB 스탯이 업데이트되었습니다.`,
      qbCount: qbStatsMap.size,
      results,
    };
  }

  /**
   * 개별 클립 분석
   */
  private async analyzeClip(
    clip: ClipData,
    gameData: GameData,
    qbStatsMap: Map<string, QBStats>,
  ) {
    // 공격팀 결정
    const offensiveTeam =
      clip.offensiveTeam === 'Home' ? gameData.homeTeam : gameData.awayTeam;

    // QB 찾기
    let qb: { num: number; pos: string } | null = null;
    if (clip.car?.pos === 'QB') {
      qb = clip.car;
    } else if (clip.car2?.pos === 'QB') {
      qb = { num: clip.car2.num, pos: clip.car2.pos };
    }

    if (!qb) return; // QB가 없으면 스킵

    // QB 스탯 객체 가져오기 또는 생성
    const qbKey = `${offensiveTeam}-${qb.num}`;
    if (!qbStatsMap.has(qbKey)) {
      qbStatsMap.set(qbKey, this.createEmptyQBStats(qb.num, offensiveTeam));
    }

    const qbStats = qbStatsMap.get(qbKey);

    // 플레이 타입별 스탯 처리
    this.processPlay(clip, qbStats);

    console.log(
      `📡 QB ${qb.num}번 (${offensiveTeam}): ${clip.playType}, ${clip.gainYard}야드`,
    );
  }

  /**
   * 플레이별 스탯 처리
   */
  private processPlay(clip: ClipData, qbStats: QBStats) {
    const playType = clip.playType;
    const gainYard = clip.gainYard;

    // 패싱 플레이 처리
    if (playType === 'PASS') {
      qbStats.passingAttempts++;
      qbStats.passingCompletions++;
      qbStats.passingYards += gainYard;

      // 최장 패스 업데이트
      if (gainYard > qbStats.longestPass) {
        qbStats.longestPass = gainYard;
      }
    } else if (playType === 'NOPASS') {
      qbStats.passingAttempts++; // 패스 시도했지만 실패
    } else if (playType === 'SACK') {
      qbStats.sacks++;
    } else if (playType === 'RUN') {
      // QB 러시 (QB가 car에 있을 때만)
      qbStats.rushingAttempts++;
      qbStats.rushingYards += gainYard;

      // 최장 러시 업데이트
      if (gainYard > qbStats.longestRush) {
        qbStats.longestRush = gainYard;
      }
    }

    // significantPlays 처리
    this.processSignificantPlays(clip, qbStats, playType);
  }

  /**
   * 특별한 플레이 처리 (터치다운, 인터셉션 등)
   */
  private processSignificantPlays(
    clip: ClipData,
    qbStats: QBStats,
    playType: string,
  ) {
    if (!clip.significantPlays || !Array.isArray(clip.significantPlays)) return;

    for (const play of clip.significantPlays) {
      if (!play) continue;

      switch (play) {
        case 'TOUCHDOWN':
          if (playType === 'PASS') {
            qbStats.passingTouchdowns++;
          } else if (playType === 'RUN') {
            qbStats.rushingTouchdowns++;
          }
          break;
        case 'INTERCEPT':
        case 'INTERCEPTION':
          qbStats.passingInterceptions++;
          break;
        case 'FUMBLE':
          qbStats.fumbles++;
          break;
        case 'SACK':
          qbStats.sacks++;
          break;
      }
    }
  }

  /**
   * 최종 계산된 스탯 완성
   */
  private calculateFinalStats(qbStats: QBStats) {
    // 완주율 계산
    qbStats.completionPercentage =
      qbStats.passingAttempts > 0
        ? Math.round(
            (qbStats.passingCompletions / qbStats.passingAttempts) * 100,
          )
        : 0;

    // 러시 평균 계산
    qbStats.yardsPerCarry =
      qbStats.rushingAttempts > 0
        ? Math.round((qbStats.rushingYards / qbStats.rushingAttempts) * 10) / 10
        : 0;

    // 게임 수 (임시로 1)
    qbStats.gamesPlayed = 1;
  }

  /**
   * QB 스탯을 데이터베이스에 저장
   */
  private async saveQBStats(qbStats: QBStats): Promise<any> {
    try {
      // 해당 QB 찾기
      const qbPlayer = await this.playerModel.findOne({
        jerseyNumber: qbStats.jerseyNumber,
        teamName: qbStats.teamName,
      });

      if (qbPlayer) {
        // 기존 스탯과 병합
        qbPlayer.stats = { ...qbPlayer.stats, ...qbStats };
        await qbPlayer.save();

        return {
          success: true,
          message: `QB ${qbStats.jerseyNumber}번 (${qbStats.teamName}) 스탯 업데이트 완료`,
          player: qbPlayer.name,
        };
      } else {
        return {
          success: false,
          message: `QB ${qbStats.jerseyNumber}번 (${qbStats.teamName}) 선수를 데이터베이스에서 찾을 수 없습니다`,
        };
      }
    } catch (error) {
      console.error(`QB 스탯 저장 실패:`, error);
      return {
        success: false,
        message: `QB ${qbStats.jerseyNumber}번 스탯 저장 실패: ${error.message}`,
      };
    }
  }

  /**
   * 빈 QB 스탯 객체 생성
   */
  private createEmptyQBStats(jerseyNumber: number, teamName: string): QBStats {
    return {
      jerseyNumber,
      teamName,
      gamesPlayed: 0,
      passingAttempts: 0,
      passingCompletions: 0,
      completionPercentage: 0,
      passingYards: 0,
      passingTouchdowns: 0,
      passingInterceptions: 0,
      longestPass: 0,
      sacks: 0,
      rushingAttempts: 0,
      rushingYards: 0,
      yardsPerCarry: 0,
      rushingTouchdowns: 0,
      longestRush: 0,
      fumbles: 0,
    };
  }
}
