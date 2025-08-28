import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GameStatsDocument = GameStats & Document;

@Schema({ timestamps: true })
export class GameStats {
  @Prop({ required: true, ref: 'Player' })
  playerId: Types.ObjectId;

  @Prop({ required: true })
  playerNumber: number;

  @Prop({ required: true })
  gameKey: string;

  @Prop({ required: true })
  gameDate: Date;

  @Prop({ required: true })
  homeTeam: string;

  @Prop({ required: true })
  awayTeam: string;

  @Prop({ required: true })
  position: string;

  // QB 스탯
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

  // RB 스탯
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

  // WR 스탯 (RB와 동일한 receiving 스탯 + return 스탯)

  // TE 스탯 (receiving만, return 없음)

  // Kicker 스탯
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

  // Punter 스탯
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

  // OL 스탯
  @Prop({ default: 0 })
  passBlockingGrade: number;

  @Prop({ default: 0 })
  runBlockingGrade: number;

  @Prop({ default: 0 })
  pancakeBlocks: number;

  @Prop({ default: 0 })
  penalties: number;

  // Defensive 스탯 (DL, LB, DB 공통)
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

  // 공통 스탯
  @Prop({ default: 0 })
  gamesPlayed: number;

  @Prop({ default: 0 })
  gamesStarted: number;
}

export const GameStatsSchema = SchemaFactory.createForClass(GameStats);

// 인덱스 생성
GameStatsSchema.index({ playerId: 1, gameKey: 1 }, { unique: true });
GameStatsSchema.index({ gameKey: 1 });
GameStatsSchema.index({ playerNumber: 1 });
GameStatsSchema.index({ position: 1 });
