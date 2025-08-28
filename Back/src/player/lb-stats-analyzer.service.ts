import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { NewClipDto } from '../common/dto/new-clip.dto';

// LB 스탯 인터페이스 정의
export interface LbStats {
  gamesPlayed: number;
  tackles: number;
  sacks: number;
  tacklesForLoss: number;
  forcedFumbles: number;
  fumbleRecovery: number;
  fumbleRecoveredYards: number;
  passDefended: number;
  interception: number;
  interceptionYards: number;
  touchdown: number;
}

@Injectable()
export class LbStatsAnalyzerService {
  constructor(
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
  ) {}

  // ========== 새로운 간단한 더미 로직 ==========
  async analyzeLbStats(
    clips: NewClipDto[],
    playerId: string,
  ): Promise<LbStats> {
    console.log(
      `🔧 간단 LB 분석기: 선수 ${playerId}번의 ${clips.length}개 클립 처리`,
    );

    // 기본 더미 스탯 반환
    const dummyStats: LbStats = {
      gamesPlayed: 1,
      tackles: Math.floor(Math.random() * 10) + 5, // 5-15
      sacks: Math.floor(Math.random() * 2), // 0-2
      tacklesForLoss: Math.floor(Math.random() * 3), // 0-3
      forcedFumbles: Math.floor(Math.random() * 1), // 0-1
      fumbleRecovery: Math.floor(Math.random() * 1), // 0-1
      fumbleRecoveredYards: Math.floor(Math.random() * 10), // 0-10
      passDefended: Math.floor(Math.random() * 3), // 0-3
      interception: Math.floor(Math.random() * 2), // 0-2
      interceptionYards: Math.floor(Math.random() * 20), // 0-20
      touchdown: Math.floor(Math.random() * 1), // 0-1
    };

    console.log(
      `✅ LB 더미 스탯 생성 완료: ${dummyStats.tackles}태클, ${dummyStats.interception}인트`,
    );
    return dummyStats;
  }

  // TODO: 기존 복잡한 로직들 하나씩 검증하면서 주석 해제 예정

  /* ========== 기존 로직 (주석 처리) ==========
  [기존의 복잡한 LB 분석 로직들이 여기에 주석처리됨]
  ========== 기존 로직 끝 ==========
  */
}
