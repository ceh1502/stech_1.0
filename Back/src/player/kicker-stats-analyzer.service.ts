import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { NewClipDto } from '../common/dto/new-clip.dto';

// Kicker 스탯 인터페이스 정의
export interface KickerStats {
  gamesPlayed: number;
  fieldGoalsMade: number;
  fieldGoalAttempts: number;
  fieldGoalPercentage: number;
  longestFieldGoal: number;
  extraPointsMade: number;
  extraPointAttempts: number;
  extraPointPercentage: number;
}

@Injectable()
export class KickerStatsAnalyzerService {
  constructor(
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
  ) {}

  // ========== 새로운 간단한 더미 로직 ==========
  async analyzeKickerStats(
    clips: NewClipDto[],
    playerId: string,
  ): Promise<KickerStats> {
    console.log(
      `🔧 간단 K 분석기: 선수 ${playerId}번의 ${clips.length}개 클립 처리`,
    );

    // 기본 더미 스탯 반환
    const dummyStats: KickerStats = {
      gamesPlayed: 1,
      fieldGoalsMade: Math.floor(Math.random() * 3) + 1, // 1-4
      fieldGoalAttempts: Math.floor(Math.random() * 4) + 2, // 2-6
      fieldGoalPercentage: 0, // 아래에서 계산
      longestFieldGoal: Math.floor(Math.random() * 20) + 35, // 35-55
      extraPointsMade: Math.floor(Math.random() * 4) + 1, // 1-5
      extraPointAttempts: Math.floor(Math.random() * 5) + 1, // 1-6
      extraPointPercentage: 0, // 아래에서 계산
    };

    // 계산된 스탯 업데이트
    dummyStats.fieldGoalPercentage =
      dummyStats.fieldGoalAttempts > 0
        ? Math.round(
            (dummyStats.fieldGoalsMade / dummyStats.fieldGoalAttempts) * 100,
          )
        : 0;
    dummyStats.extraPointPercentage =
      dummyStats.extraPointAttempts > 0
        ? Math.round(
            (dummyStats.extraPointsMade / dummyStats.extraPointAttempts) * 100,
          )
        : 0;

    console.log(
      `✅ K 더미 스탯 생성 완료: ${dummyStats.fieldGoalsMade}/${dummyStats.fieldGoalAttempts} FG`,
    );
    return dummyStats;
  }

  // TODO: 기존 복잡한 로직들 하나씩 검증하면서 주석 해제 예정

  /* ========== 기존 로직 (주석 처리) ==========
  [기존의 복잡한 K 분석 로직들이 여기에 주석처리됨]
  ========== 기존 로직 끝 ==========
  */
}
