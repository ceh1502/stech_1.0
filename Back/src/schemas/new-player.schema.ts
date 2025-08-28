import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NewPlayerDocument = NewPlayer & Document;

// 포지션별 스탯 인터페이스
@Schema()
export class PlayerStats {
  // QB 스탯
  @Prop({ default: 0 })
  qbPassingYards?: number;

  @Prop({ default: 0 })
  qbPassingTouchdowns?: number;

  @Prop({ default: 0 })
  qbPassingCompletions?: number;

  @Prop({ default: 0 })
  qbPassingAttempts?: number;

  @Prop({ default: 0 })
  qbPassingInterceptions?: number;

  @Prop({ default: 0 })
  qbCompletionPercentage?: number;

  @Prop({ default: 0 })
  qbLongestPass?: number;

  @Prop({ default: 0 })
  qbSacks?: number;

  @Prop({ default: 0 })
  qbRushingYards?: number;

  @Prop({ default: 0 })
  qbRushingAttempts?: number;

  @Prop({ default: 0 })
  qbRushingTouchdowns?: number;

  @Prop({ default: 0 })
  qbYardsPerCarry?: number;

  @Prop({ default: 0 })
  qbLongestRush?: number;

  // RB 스탯
  @Prop({ default: 0 })
  rbRushingYards?: number;

  @Prop({ default: 0 })
  rbRushingTouchdowns?: number;

  @Prop({ default: 0 })
  rbRushingAttempts?: number;

  @Prop({ default: 0 })
  rbYardsPerCarry?: number;

  @Prop({ default: 0 })
  rbLongestRush?: number;

  @Prop({ default: 0 })
  rbReceivingYards?: number;

  @Prop({ default: 0 })
  rbReceivingTouchdowns?: number;

  @Prop({ default: 0 })
  rbReceptions?: number;

  @Prop({ default: 0 })
  rbReceivingTargets?: number;

  @Prop({ default: 0 })
  rbYardsPerReception?: number;

  @Prop({ default: 0 })
  rbLongestReception?: number;

  // WR 스탯
  @Prop({ default: 0 })
  wrReceivingYards?: number;

  @Prop({ default: 0 })
  wrReceivingTouchdowns?: number;

  @Prop({ default: 0 })
  wrReceptions?: number;

  @Prop({ default: 0 })
  wrReceivingTargets?: number;

  @Prop({ default: 0 })
  wrYardsPerReception?: number;

  @Prop({ default: 0 })
  wrLongestReception?: number;

  @Prop({ default: 0 })
  wrRushingYards?: number;

  @Prop({ default: 0 })
  wrRushingAttempts?: number;

  @Prop({ default: 0 })
  wrRushingTouchdowns?: number;

  // TE 스탯
  @Prop({ default: 0 })
  teReceivingYards?: number;

  @Prop({ default: 0 })
  teReceivingTouchdowns?: number;

  @Prop({ default: 0 })
  teReceptions?: number;

  @Prop({ default: 0 })
  teReceivingTargets?: number;

  @Prop({ default: 0 })
  teYardsPerReception?: number;

  @Prop({ default: 0 })
  teLongestReception?: number;

  @Prop({ default: 0 })
  teRushingYards?: number;

  @Prop({ default: 0 })
  teRushingAttempts?: number;

  @Prop({ default: 0 })
  teRushingTouchdowns?: number;

  // Kicker 스탯
  @Prop({ default: 0 })
  kickerFieldGoalsMade?: number;

  @Prop({ default: 0 })
  kickerFieldGoalsAttempted?: number;

  @Prop({ default: 0 })
  kickerFieldGoalPercentage?: number;

  @Prop({ default: 0 })
  kickerLongestFieldGoal?: number;

  @Prop({ default: 0 })
  kickerExtraPointsMade?: number;

  @Prop({ default: 0 })
  kickerExtraPointsAttempted?: number;

  // Punter 스탯
  @Prop({ default: 0 })
  punterPuntingYards?: number;

  @Prop({ default: 0 })
  punterPuntingAttempts?: number;

  @Prop({ default: 0 })
  punterPuntingAverage?: number;

  @Prop({ default: 0 })
  punterLongestPunt?: number;

  @Prop({ default: 0 })
  punterPuntsInside20?: number;

  // DL 스탯
  @Prop({ default: 0 })
  dlTackles?: number;

  @Prop({ default: 0 })
  dlSacks?: number;

  @Prop({ default: 0 })
  dlInterceptions?: number;

  @Prop({ default: 0 })
  dlPassesDefended?: number;

  @Prop({ default: 0 })
  dlForcedFumbles?: number;

  @Prop({ default: 0 })
  dlFumbleRecoveries?: number;

  @Prop({ default: 0 })
  dlDefensiveTouchdowns?: number;

  // LB 스탯
  @Prop({ default: 0 })
  lbTackles?: number;

  @Prop({ default: 0 })
  lbSacks?: number;

  @Prop({ default: 0 })
  lbInterceptions?: number;

  @Prop({ default: 0 })
  lbPassesDefended?: number;

  @Prop({ default: 0 })
  lbForcedFumbles?: number;

  @Prop({ default: 0 })
  lbFumbleRecoveries?: number;

  @Prop({ default: 0 })
  lbDefensiveTouchdowns?: number;

  // DB 스탯
  @Prop({ default: 0 })
  dbTackles?: number;

  @Prop({ default: 0 })
  dbSacks?: number;

  @Prop({ default: 0 })
  dbInterceptions?: number;

  @Prop({ default: 0 })
  dbPassesDefended?: number;

  @Prop({ default: 0 })
  dbForcedFumbles?: number;

  @Prop({ default: 0 })
  dbFumbleRecoveries?: number;

  @Prop({ default: 0 })
  dbDefensiveTouchdowns?: number;

  // OL 스탯
  @Prop({ default: 0 })
  olSacksAllowed?: number;

  // 공통 스탯
  @Prop({ default: 0 })
  gamesPlayed?: number;

  @Prop({ default: 0 })
  gamesStarted?: number;
}

@Schema({ timestamps: true })
export class NewPlayer {
  @Prop({ required: true, unique: true })
  playerId: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true })
  jerseyNumber: number;

  @Prop({ trim: true })
  position?: string;

  @Prop({ trim: true })
  studentId?: string;

  @Prop({ trim: true })
  email?: string;

  @Prop({ trim: true })
  nickname?: string;

  @Prop({ type: Types.ObjectId, ref: 'Team' })
  teamId?: Types.ObjectId;

  @Prop({ trim: true, required: true })
  teamName: string;

  @Prop({ type: PlayerStats, default: () => ({}) })
  stats: PlayerStats;

  @Prop({ enum: ['1부', '2부'], default: '1부' })
  league: string;

  @Prop({ default: '2024' })
  season: string;
}

export const NewPlayerSchema = SchemaFactory.createForClass(NewPlayer);

NewPlayerSchema.index({ playerId: 1 });
NewPlayerSchema.index({ teamId: 1 });
NewPlayerSchema.index({ teamName: 1, jerseyNumber: 1 }, { unique: true });

NewPlayerSchema.virtual('team', {
  ref: 'Team',
  localField: 'teamId',
  foreignField: '_id',
  justOne: true,
});