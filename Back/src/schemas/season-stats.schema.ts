import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SeasonStatsDocument = SeasonStats & Document;

@Schema({ timestamps: true })
export class SeasonStats {
  @Prop({ required: true, ref: 'Player' })
  playerId: Types.ObjectId;

  @Prop({ required: true })
  playerNumber: number;

  @Prop({ required: true })
  season: string; // '2024', '2025' etc.

  @Prop({ required: true })
  position: string;

  @Prop({ required: true })
  league: string; // '1부', '2부'

  // QB 시즌 스탯
  @Prop({ default: 0 })
  passingYards: number;

  @Prop({ default: 0 })
  passingTouchdowns: number;

  @Prop({ default: 0 })
  passingInterceptions: number;

  @Prop({ default: 0 })
  completions: number;

  @Prop({ default: 0 })
  passingAttempts: number;

  @Prop({ default: 0 })
  completionPercentage: number;

  @Prop({ default: 0 })
  passerRating: number;

  @Prop({ default: 0 })
  longestPass: number;

  @Prop({ default: 0 })
  sacks: number;

  @Prop({ default: 0 })
  rushing20Plus: number;

  @Prop({ default: 0 })
  fumbles: number;

  @Prop({ default: 0 })
  redZoneAttempts: number;

  @Prop({ default: 0 })
  redZoneCompletions: number;

  @Prop({ default: 0 })
  thirdDownAttempts: number;

  @Prop({ default: 0 })
  thirdDownCompletions: number;

  // RB 시즌 스탯
  @Prop({ default: 0 })
  rushingYards: number;

  @Prop({ default: 0 })
  rushingTouchdowns: number;

  @Prop({ default: 0 })
  rushingAttempts: number;

  @Prop({ default: 0 })
  yardsPerCarry: number;

  @Prop({ default: 0 })
  longestRush: number;

  @Prop({ default: 0 })
  rushes20Plus: number;

  @Prop({ default: 0 })
  rushingFirstDowns: number;

  @Prop({ default: 0 })
  receivingYards: number;

  @Prop({ default: 0 })
  receivingTouchdowns: number;

  @Prop({ default: 0 })
  receptions: number;

  @Prop({ default: 0 })
  receivingTargets: number;

  @Prop({ default: 0 })
  yardsPerReception: number;

  @Prop({ default: 0 })
  longestReception: number;

  @Prop({ default: 0 })
  catches20Plus: number;

  @Prop({ default: 0 })
  receivingFirstDowns: number;

  @Prop({ default: 0 })
  kickoffReturnYards: number;

  @Prop({ default: 0 })
  kickoffReturns: number;

  @Prop({ default: 0 })
  kickoffReturnTouchdowns: number;

  @Prop({ default: 0 })
  puntReturnYards: number;

  @Prop({ default: 0 })
  puntReturns: number;

  @Prop({ default: 0 })
  puntReturnTouchdowns: number;

  @Prop({ default: 0 })
  totalYards: number;

  @Prop({ default: 0 })
  totalTouchdowns: number;

  // Kicker 시즌 스탯
  @Prop({ default: 0 })
  fieldGoalsMade: number;

  @Prop({ default: 0 })
  fieldGoalAttempts: number;

  @Prop({ default: 0 })
  fieldGoalPercentage: number;

  @Prop({ default: 0 })
  longestFieldGoal: number;

  @Prop({ default: 0 })
  extraPointsMade: number;

  @Prop({ default: 0 })
  extraPointAttempts: number;

  @Prop({ default: 0 })
  extraPointPercentage: number;

  @Prop({ default: 0 })
  kickoffYards: number;

  @Prop({ default: 0 })
  kickoffs: number;

  @Prop({ default: 0 })
  kickoffTouchbacks: number;

  @Prop({ default: 0 })
  inside20Kicks: number;

  @Prop({ default: 0 })
  inside10Kicks: number;

  @Prop({ default: 0 })
  fieldGoals0_29: number;

  @Prop({ default: 0 })
  fieldGoals30_39: number;

  @Prop({ default: 0 })
  fieldGoals40_49: number;

  @Prop({ default: 0 })
  fieldGoals50Plus: number;

  @Prop({ default: 0 })
  totalKickingPoints: number;

  // Punter 시즌 스탯
  @Prop({ default: 0 })
  puntingYards: number;

  @Prop({ default: 0 })
  punts: number;

  @Prop({ default: 0 })
  puntAverage: number;

  @Prop({ default: 0 })
  longestPunt: number;

  @Prop({ default: 0 })
  puntsInside20: number;

  @Prop({ default: 0 })
  puntTouchbacks: number;

  @Prop({ default: 0 })
  blockedPunts: number;

  // OL 시즌 스탯
  @Prop({ default: 0 })
  passBlockingGrade: number;

  @Prop({ default: 0 })
  runBlockingGrade: number;

  @Prop({ default: 0 })
  pancakeBlocks: number;

  @Prop({ default: 0 })
  penalties: number;

  // Defensive 시즌 스탯
  @Prop({ default: 0 })
  tackles: number;

  @Prop({ default: 0 })
  assistedTackles: number;

  @Prop({ default: 0 })
  totalTackles: number;

  @Prop({ default: 0 })
  tacklesForLoss: number;

  @Prop({ default: 0 })
  quarterbackSacks: number;

  @Prop({ default: 0 })
  interceptions: number;

  @Prop({ default: 0 })
  passesDefended: number;

  @Prop({ default: 0 })
  forcedFumbles: number;

  @Prop({ default: 0 })
  fumbleRecoveries: number;

  @Prop({ default: 0 })
  defensiveTouchdowns: number;

  // 시즌 공통 스탯
  @Prop({ default: 0 })
  gamesPlayed: number;

  @Prop({ default: 0 })
  gamesStarted: number;

  @Prop({ type: [String], default: [] })
  gameKeys: string[]; // 이 시즌에 참여한 모든 게임들의 키

  // 시즌 성과
  @Prop({ default: 0 })
  wins: number;

  @Prop({ default: 0 })
  losses: number;

  @Prop({ default: 0 })
  ties: number;

  @Prop({ default: '' })
  seasonRank: string; // 시즌 순위

  @Prop({ type: [String], default: [] })
  achievements: string[]; // 시즌 성취사항 (MVP, 신인상 등)
}

export const SeasonStatsSchema = SchemaFactory.createForClass(SeasonStats);

// 인덱스 생성
SeasonStatsSchema.index({ playerId: 1, season: 1 }, { unique: true });
SeasonStatsSchema.index({ season: 1 });
SeasonStatsSchema.index({ playerNumber: 1 });
SeasonStatsSchema.index({ position: 1 });
SeasonStatsSchema.index({ league: 1 });