import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PlayerGameStatsDocument = PlayerGameStats & Document;

@Schema({
  collection: 'players_game_stats',
  timestamps: true,
})
export class PlayerGameStats {
  @Prop({ required: true })
  playerId: string; // 예: "KKRagingBulls_15"

  @Prop({ required: true })
  gameKey: string; // 예: "KMHY241110"

  @Prop({ required: true })
  date: string; // 예: "2024-09-07(토) 16:00"

  @Prop({ required: true })
  season: string; // date에서 추출한 연도 예: "2024"

  @Prop({ required: true })
  teamName: string;

  @Prop({ required: true })
  jerseyNumber: number;

  @Prop({ required: true })
  position: string;

  @Prop()
  opponent?: string;

  @Prop({ type: Object })
  stats: any; // 포지션별 다른 스탯 구조

  @Prop({ default: false })
  isHomeGame?: boolean;

  @Prop()
  gameResult?: string; // "W" or "L"
}

export const PlayerGameStatsSchema = SchemaFactory.createForClass(PlayerGameStats);

// 인덱스 설정
PlayerGameStatsSchema.index({ playerId: 1 });
PlayerGameStatsSchema.index({ gameKey: 1 });
PlayerGameStatsSchema.index({ season: 1 });
PlayerGameStatsSchema.index({ playerId: 1, gameKey: 1 }, { unique: true });