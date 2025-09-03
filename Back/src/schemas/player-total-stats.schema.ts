import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlayerTotalStatsDocument = PlayerTotalStats & Document;

@Schema({
  collection: 'players_total_stats',
  timestamps: true,
})
export class PlayerTotalStats {
  @Prop({ required: true, unique: true })
  playerId: string; // 예: "KKRagingBulls_15"

  @Prop({ required: true })
  teamName: string;

  @Prop({ required: true })
  jerseyNumber: number;

  @Prop({ required: true })
  position: string;

  @Prop({ type: Object })
  stats: any; // 포지션별 다른 스탯 구조 (통합 합계)

  @Prop({ default: 0 })
  totalGamesPlayed: number; // 전체 출전 경기 수

  @Prop({ type: [String], default: [] })
  seasons: string[]; // 활동한 시즌 목록

  @Prop()
  firstGameDate?: string;

  @Prop()
  lastGameDate?: string;
}

export const PlayerTotalStatsSchema = SchemaFactory.createForClass(PlayerTotalStats);

// 인덱스 설정
PlayerTotalStatsSchema.index({ playerId: 1 });
PlayerTotalStatsSchema.index({ teamName: 1 });
PlayerTotalStatsSchema.index({ jerseyNumber: 1 });