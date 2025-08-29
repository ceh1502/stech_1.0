import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PlayerDocument = Player & Document;

// 포지션별 스탯 인터페이스
@Schema()
export class PlayerStats {
  // Quarterback 스탯
  @Prop({ default: 0 })
  passingYards?: number;

  @Prop({ default: 0 })
  passingTouchdowns?: number;

  @Prop({ default: 0 })
  passingCompletions?: number;

  @Prop({ default: 0 })
  passingAttempts?: number;

  @Prop({ default: 0 })
  passingInterceptions?: number;

  @Prop({ default: 0 })
  completionPercentage?: number;

  @Prop({ default: 0 })
  passerRating?: number;

  // Running Back 스탯
  @Prop({ default: 0 })
  rushingYards?: number;

  @Prop({ default: 0 })
  rushingTouchdowns?: number;

  @Prop({ default: 0 })
  rushingAttempts?: number;

  @Prop({ default: 0 })
  yardsPerCarry?: number;

  @Prop({ default: 0 })
  longestRush?: number;

  @Prop({ default: 0 })
  rushingFirstDowns?: number;

  // Receiver 스탯 (WR, TE)
  @Prop({ default: 0 })
  receivingYards?: number;

  @Prop({ default: 0 })
  receivingTouchdowns?: number;

  @Prop({ default: 0 })
  receptions?: number;

  @Prop({ default: 0 })
  receivingTargets?: number;

  @Prop({ default: 0 })
  yardsPerReception?: number;

  @Prop({ default: 0 })
  longestReception?: number;

  @Prop({ default: 0 })
  receivingFirstDowns?: number;

  // Kicker 스탯
  @Prop({ default: 0 })
  fieldGoalsMade?: number;

  @Prop({ default: 0 })
  fieldGoalsAttempted?: number;

  @Prop({ default: 0 })
  fieldGoalPercentage?: number;

  @Prop({ default: 0 })
  longestFieldGoal?: number;

  @Prop({ default: 0 })
  extraPointsMade?: number;

  @Prop({ default: 0 })
  extraPointsAttempted?: number;

  // Punter 스탯
  @Prop({ default: 0 })
  puntingYards?: number;

  @Prop({ default: 0 })
  puntingAttempts?: number;

  @Prop({ default: 0 })
  puntingAverage?: number;

  @Prop({ default: 0 })
  longestPunt?: number;

  @Prop({ default: 0 })
  puntsInside20?: number;

  // Defensive 스탯
  @Prop({ default: 0 })
  tackles?: number;

  @Prop({ default: 0 })
  sacks?: number;

  @Prop({ default: 0 })
  interceptions?: number;

  @Prop({ default: 0 })
  passesDefended?: number;

  @Prop({ default: 0 })
  forcedFumbles?: number;

  @Prop({ default: 0 })
  fumbleRecoveries?: number;

  @Prop({ default: 0 })
  defensiveTouchdowns?: number;

  // RB 전용 필드들
  @Prop({ default: 0 })
  rbFrontRushYard?: number;

  @Prop({ default: 0 })
  rbBackRushYard?: number;

  @Prop({ default: 0 })
  rbRushingAttempts?: number;

  @Prop({ default: 0 })
  rbRushingYards?: number;

  @Prop({ default: 0 })
  rbYardsPerCarry?: number;

  @Prop({ default: 0 })
  rbRushingTouchdowns?: number;

  @Prop({ default: 0 })
  rbLongestRush?: number;

  @Prop({ default: 0 })
  rbFumbles?: number;

  @Prop({ default: 0 })
  rbFumblesLost?: number;

  // RB 리시빙 스탯
  @Prop({ default: 0 })
  rbReceivingTargets?: number;

  @Prop({ default: 0 })
  rbReceptions?: number;

  @Prop({ default: 0 })
  rbReceivingYards?: number;

  @Prop({ default: 0 })
  rbYardsPerReception?: number;

  @Prop({ default: 0 })
  rbReceivingTouchdowns?: number;

  @Prop({ default: 0 })
  rbLongestReception?: number;

  @Prop({ default: 0 })
  rbReceivingFirstDowns?: number;

  // RB 스페셜팀 스탯
  @Prop({ default: 0 })
  rbKickReturns?: number;

  @Prop({ default: 0 })
  rbKickReturnYards?: number;

  @Prop({ default: 0 })
  rbYardsPerKickReturn?: number;

  @Prop({ default: 0 })
  rbPuntReturns?: number;

  @Prop({ default: 0 })
  rbPuntReturnYards?: number;

  @Prop({ default: 0 })
  rbYardsPerPuntReturn?: number;

  @Prop({ default: 0 })
  rbReturnTouchdowns?: number;

  // WR 리시빙 스탯
  @Prop({ default: 0 })
  wrReceivingTargets?: number;

  @Prop({ default: 0 })
  wrReceptions?: number;

  @Prop({ default: 0 })
  wrReceivingYards?: number;

  @Prop({ default: 0 })
  wrYardsPerReception?: number;

  @Prop({ default: 0 })
  wrReceivingTouchdowns?: number;

  @Prop({ default: 0 })
  wrLongestReception?: number;

  @Prop({ default: 0 })
  wrReceivingFirstDowns?: number;

  // WR 러싱 스탯
  @Prop({ default: 0 })
  wrRushingAttempts?: number;

  @Prop({ default: 0 })
  wrRushingYards?: number;

  @Prop({ default: 0 })
  wrYardsPerCarry?: number;

  @Prop({ default: 0 })
  wrRushingTouchdowns?: number;

  @Prop({ default: 0 })
  wrLongestRush?: number;

  // WR 스페셜팀 스탯
  @Prop({ default: 0 })
  wrKickReturns?: number;

  @Prop({ default: 0 })
  wrKickReturnYards?: number;

  @Prop({ default: 0 })
  wrYardsPerKickReturn?: number;

  @Prop({ default: 0 })
  wrPuntReturns?: number;

  @Prop({ default: 0 })
  wrPuntReturnYards?: number;

  @Prop({ default: 0 })
  wrYardsPerPuntReturn?: number;

  @Prop({ default: 0 })
  wrReturnTouchdowns?: number;

  // TE 리시빙 스탯
  @Prop({ default: 0 })
  teReceivingTargets?: number;

  @Prop({ default: 0 })
  teReceptions?: number;

  @Prop({ default: 0 })
  teReceivingYards?: number;

  @Prop({ default: 0 })
  teYardsPerReception?: number;

  @Prop({ default: 0 })
  teReceivingTouchdowns?: number;

  @Prop({ default: 0 })
  teLongestReception?: number;

  // TE 러싱 스탯
  @Prop({ default: 0 })
  teRushingAttempts?: number;

  @Prop({ default: 0 })
  teRushingYards?: number;

  @Prop({ default: 0 })
  teYardsPerCarry?: number;

  @Prop({ default: 0 })
  teRushingTouchdowns?: number;

  @Prop({ default: 0 })
  teLongestRush?: number;

  @Prop({ default: 0 })
  fumbles?: number;

  // 공통 스탯
  @Prop({ default: 0 })
  totalYards?: number;

  @Prop({ default: 0 })
  totalTouchdowns?: number;

  @Prop({ default: 0 })
  gamesPlayed?: number;

  @Prop({ default: 0 })
  gamesStarted?: number;
}

@Schema({ timestamps: true, autoIndex: false })
export class Player {
  @Prop({ required: true })
  playerId: string; // PlayerCode로 사용

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  position: string;

  @Prop({ trim: true })
  studentId: string;

  @Prop({ trim: true })
  email: string;

  @Prop({ trim: true })
  nickname: string;

  @Prop({ type: Types.ObjectId, ref: 'Team' })
  teamId: Types.ObjectId;

  @Prop({ trim: true, required: true })
  teamName: string;

  @Prop({ required: true })
  jerseyNumber: number;

  // 새로 추가된 스탯 필드
  @Prop({ type: PlayerStats, default: () => ({}) })
  stats: PlayerStats;

  // 리그 구분 추가
  @Prop({ enum: ['1부', '2부'], default: '1부' })
  league: string;

  // 시즌 정보 추가
  @Prop({ default: '2024' })
  season: string;
}

export const PlayerSchema = SchemaFactory.createForClass(Player);

// 인덱스 설정
PlayerSchema.index({ playerId: 1 });
PlayerSchema.index({ teamId: 1 });
PlayerSchema.index({ teamName: 1, jerseyNumber: 1, position: 1 }, { unique: true }); // 중복 방지

// 가상 필드: 속한 팀 정보
PlayerSchema.virtual('team', {
  ref: 'Team',
  localField: 'teamId',
  foreignField: '_id',
  justOne: true,
});
