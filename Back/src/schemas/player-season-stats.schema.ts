import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlayerSeasonStatsDocument = PlayerSeasonStats & Document;

@Schema({
  collection: 'players_season_stats',
  timestamps: true,
})
export class PlayerSeasonStats {
  @Prop({ required: true })
  playerId: string; // 예: "KKRagingBulls_15"

  @Prop({ required: true })
  season: string; // 예: "2024"

  @Prop({ required: true })
  teamName: string;

  @Prop({ required: true })
  jerseyNumber: number;

  @Prop({ required: true })
  position: string;

  @Prop({ type: Object })
  stats: any; // 포지션별 다른 스탯 구조 (시즌 합계)

  @Prop({ default: 0 })
  gamesPlayed: number; // 이 시즌 출전 경기 수

  @Prop({ type: [String], default: [] })
  gameKeys: string[]; // 이 시즌에 출전한 경기 목록
}

export const PlayerSeasonStatsSchema = SchemaFactory.createForClass(PlayerSeasonStats);

// 인덱스 설정
PlayerSeasonStatsSchema.index({ playerId: 1 });
PlayerSeasonStatsSchema.index({ season: 1 });
PlayerSeasonStatsSchema.index({ playerId: 1, season: 1 }, { unique: true });