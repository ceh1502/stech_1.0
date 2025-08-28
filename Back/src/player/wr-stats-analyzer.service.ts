import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { NewClipDto } from '../common/dto/new-clip.dto';

// WR 스탯 인터페이스 정의
export interface WrStats {
  gamesPlayed: number;
  receivingTargets: number;
  receptions: number;
  receivingYards: number;
  yardsPerReception: number;
  receivingTouchdowns: number;
  longestReception: number;
  receivingFirstDowns: number;
  fumbles: number;
  fumblesLost: number;
  rushingAttempts: number;
  rushingYards: number;
  yardsPerCarry: number;
  rushingTouchdowns: number;
  longestRush: number;
  kickReturns: number;
  kickReturnYards: number;
  yardsPerKickReturn: number;
  puntReturns: number;
  puntReturnYards: number;
  yardsPerPuntReturn: number;
  returnTouchdowns: number;
}

@Injectable()
export class WrStatsAnalyzerService {
  constructor(
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
  ) {}

  // ========== 새로운 간단한 더미 로직 ==========
  async analyzeWrStats(
    clips: NewClipDto[],
    playerId: string,
  ): Promise<WrStats> {
    console.log(
      `🔧 간단 WR 분석기: 선수 ${playerId}번의 ${clips.length}개 클립 처리`,
    );

    // 기본 더미 스탯 반환
    const dummyStats: WrStats = {
      gamesPlayed: 1,
      receivingTargets: Math.floor(Math.random() * 10) + 5, // 5-15
      receptions: Math.floor(Math.random() * 8) + 3, // 3-11
      receivingYards: Math.floor(Math.random() * 80) + 30, // 30-110
      yardsPerReception: 0, // 아래에서 계산
      receivingTouchdowns: Math.floor(Math.random() * 2), // 0-2
      longestReception: Math.floor(Math.random() * 30) + 10, // 10-40
      receivingFirstDowns: Math.floor(Math.random() * 5) + 1, // 1-6
      fumbles: Math.floor(Math.random() * 1), // 0-1
      fumblesLost: Math.floor(Math.random() * 1), // 0-1
      rushingAttempts: Math.floor(Math.random() * 3), // 0-3
      rushingYards: Math.floor(Math.random() * 20), // 0-20
      yardsPerCarry: 0, // 아래에서 계산
      rushingTouchdowns: Math.floor(Math.random() * 1), // 0-1
      longestRush: Math.floor(Math.random() * 15), // 0-15
      kickReturns: Math.floor(Math.random() * 2), // 0-2
      kickReturnYards: Math.floor(Math.random() * 40), // 0-40
      yardsPerKickReturn: 0, // 아래에서 계산
      puntReturns: Math.floor(Math.random() * 3), // 0-3
      puntReturnYards: Math.floor(Math.random() * 30), // 0-30
      yardsPerPuntReturn: 0, // 아래에서 계산
      returnTouchdowns: Math.floor(Math.random() * 1), // 0-1
    };

    // 계산된 스탯 업데이트
    dummyStats.yardsPerReception =
      dummyStats.receptions > 0
        ? Math.round((dummyStats.receivingYards / dummyStats.receptions) * 10) /
          10
        : 0;
    dummyStats.yardsPerCarry =
      dummyStats.rushingAttempts > 0
        ? Math.round(
            (dummyStats.rushingYards / dummyStats.rushingAttempts) * 10,
          ) / 10
        : 0;
    dummyStats.yardsPerKickReturn =
      dummyStats.kickReturns > 0
        ? Math.round(
            (dummyStats.kickReturnYards / dummyStats.kickReturns) * 10,
          ) / 10
        : 0;
    dummyStats.yardsPerPuntReturn =
      dummyStats.puntReturns > 0
        ? Math.round(
            (dummyStats.puntReturnYards / dummyStats.puntReturns) * 10,
          ) / 10
        : 0;

    console.log(
      `✅ WR 더미 스탯 생성 완료: ${dummyStats.receptions}리셉션, ${dummyStats.receivingYards}야드`,
    );
    return dummyStats;
  }

  // TODO: 기존 복잡한 로직들 하나씩 검증하면서 주석 해제 예정

  /* ========== 기존 로직 (주석 처리) ==========
  [기존의 복잡한 WR 분석 로직들이 여기에 주석처리됨]
  ========== 기존 로직 끝 ==========
  */
}
