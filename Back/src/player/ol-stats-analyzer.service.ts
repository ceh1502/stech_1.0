import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { NewClipDto } from '../common/dto/new-clip.dto';

// OL 스탯 인터페이스 정의
export interface OlStats {
  gamesPlayed: number;
  pancakeBlocks: number;
  penalties: number;
  snapCounts: number;
  passBlocks: number;
  runBlocks: number;
}

@Injectable()
export class OlStatsAnalyzerService {
  constructor(
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
  ) {}

  // ========== 새로운 간단한 더미 로직 ==========
  async analyzeOlStats(
    clips: NewClipDto[],
    playerId: string,
  ): Promise<OlStats> {
    console.log(
      `🔧 간단 OL 분석기: 선수 ${playerId}번의 ${clips.length}개 클립 처리`,
    );

    // 기본 더미 스탯 반환
    const dummyStats: OlStats = {
      gamesPlayed: 1,
      pancakeBlocks: Math.floor(Math.random() * 4) + 1, // 1-5
      penalties: Math.floor(Math.random() * 3), // 0-3
      snapCounts: Math.floor(Math.random() * 30) + 40, // 40-70
      passBlocks: Math.floor(Math.random() * 20) + 15, // 15-35
      runBlocks: Math.floor(Math.random() * 15) + 10, // 10-25
    };

    console.log(
      `✅ OL 더미 스탯 생성 완료: ${dummyStats.pancakeBlocks}팬케이크, ${dummyStats.penalties}페널티`,
    );
    return dummyStats;
  }

  // TODO: 기존 복잡한 로직들 하나씩 검증하면서 주석 해제 예정

  /* ========== 기존 로직 (주석 처리) ==========
  [기존의 복잡한 OL 분석 로직들이 여기에 주석처리됨]
  ========== 기존 로직 끝 ==========
  */
}
