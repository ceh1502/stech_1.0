import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CareerStatsDocument = CareerStats & Document;

@Schema({ timestamps: true })
export class CareerStats {
  @Prop({ required: true, ref: 'Player' })
  playerId: Types.ObjectId;

  @Prop({ required: true })
  playerNumber: number;

  @Prop({ required: true })
  position: string;

  @Prop({ type: [String], default: [] })
  seasonsPlayed: string[]; // ['2024', '2025', ...]

  @Prop({ type: [String], default: [] })
  leaguesPlayed: string[]; // ['1부', '2부']

  // QB 커리어 스탯
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

  // RB 커리어 스탯
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

  // Kicker 커리어 스탯
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

  // Punter 커리어 스탯
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

  // OL 커리어 스탯
  @Prop({ default: 0 })
  passBlockingGrade: number;

  @Prop({ default: 0 })
  runBlockingGrade: number;

  @Prop({ default: 0 })
  pancakeBlocks: number;

  @Prop({ default: 0 })
  penalties: number;

  // Defensive 커리어 스탯
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

  // 커리어 공통 스탯
  @Prop({ default: 0 })
  totalGamesPlayed: number;

  @Prop({ default: 0 })
  totalGamesStarted: number;

  @Prop({ default: 0 })
  totalSeasons: number;

  // 커리어 성과
  @Prop({ default: 0 })
  totalWins: number;

  @Prop({ default: 0 })
  totalLosses: number;

  @Prop({ default: 0 })
  totalTies: number;

  @Prop({ type: [String], default: [] })
  careerAchievements: string[]; // 커리어 전체 성취사항

  @Prop({ type: [String], default: [] })
  careerRecords: string[]; // 개인 기록들

  @Prop({ type: [String], default: [] })
  hallOfFameStatus: string[]; // 명예의 전당 관련

  // 최고 기록들
  @Prop({ default: 0 })
  bestSeasonYards: number;

  @Prop({ default: '' })
  bestSeasonYear: string;

  @Prop({ default: 0 })
  mostTouchdownsInSeason: number;

  @Prop({ default: 0 })
  mostYardsInGame: number;

  @Prop({ default: '' })
  mostYardsGameDate: string;

  @Prop({ default: Date.now })
  careerStartDate: Date;

  @Prop()
  careerEndDate?: Date;

  @Prop({ default: true })
  isActive: boolean;
}

export const CareerStatsSchema = SchemaFactory.createForClass(CareerStats);

// 인덱스 생성
CareerStatsSchema.index({ playerId: 1 }, { unique: true });
CareerStatsSchema.index({ playerNumber: 1 });
CareerStatsSchema.index({ position: 1 });
CareerStatsSchema.index({ isActive: 1 });
