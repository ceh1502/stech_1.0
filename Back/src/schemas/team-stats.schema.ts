import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TeamStatsDocument = TeamStats & Document;

@Schema({ timestamps: true })
export class TeamStats {
  @Prop({ required: true })
  gameKey: string;

  @Prop({ required: true })
  teamName: string;

  @Prop({ required: true })
  homeAway: string; // 'home' | 'away'

  @Prop({ default: 0 })
  totalYards: number; // 패싱+러싱+인터셉트리턴+펀트리턴+킥오프리턴

  @Prop({ default: 0 })
  passingYards: number; // 패싱야드

  @Prop({ default: 0 })
  rushingYards: number; // 러싱야드 - sack야드 - 펌블리턴야드

  @Prop({ default: 0 })
  interceptionReturnYards: number; // 인터셉트 리턴 야드

  @Prop({ default: 0 })
  puntReturnYards: number; // 펀트 리턴 야드

  @Prop({ default: 0 })
  kickoffReturnYards: number; // 킥오프 리턴 야드

  @Prop({ default: 0 })
  turnovers: number; // significantPlays에서 "turnover" 개수

  @Prop({ default: 0 })
  penaltyYards: number; // 페널티 야드 총합 (나중에 구현)

  @Prop({ default: 0 })
  sackYards: number; // sack 당한 야드 (러싱야드에서 차감용)

  // 추가 통계들 (향후 확장)
  @Prop({ default: 0 })
  firstDowns: number;

  @Prop({ default: 0 })
  thirdDownAttempts: number;

  @Prop({ default: 0 })
  thirdDownConversions: number;

  @Prop({ default: 0 })
  fourthDownAttempts: number;

  @Prop({ default: 0 })
  fourthDownConversions: number;

  @Prop({ default: 0 })
  redZoneAttempts: number;

  @Prop({ default: 0 })
  redZoneScores: number;

  @Prop({ default: 0 })
  timeOfPossession: number; // 초 단위

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const TeamStatsSchema = SchemaFactory.createForClass(TeamStats);
