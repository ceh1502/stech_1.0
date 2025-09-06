import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TeamTotalStatsDocument = TeamTotalStats & Document;

@Schema({
  collection: 'team_total_stats',
  timestamps: true,
})
export class TeamTotalStats {
  @Prop({ required: true, unique: true })
  teamName: string; // 예: "건국대 레이징불스"

  @Prop({ default: 0 })
  totalPoints: number;

  @Prop({ default: 0 })
  totalTouchdowns: number;

  @Prop({ default: 0 })
  totalYards: number;

  @Prop({ default: 0 })
  rushingAttempts: number;

  @Prop({ default: 0 })
  rushingYards: number;

  @Prop({ default: 0 })
  rushingTouchdowns: number;

  @Prop({ default: 0 })
  passAttempts: number;

  @Prop({ default: 0 })
  passCompletions: number;

  @Prop({ default: 0 })
  passingYards: number;

  @Prop({ default: 0 })
  passingTouchdowns: number;

  @Prop({ default: 0 })
  interceptions: number;

  @Prop({ default: 0 })
  totalPuntYards: number;

  @Prop({ default: 0 })
  totalPunts: number;

  @Prop({ default: 0 })
  puntTouchbacks: number;

  @Prop({ default: 0 })
  fieldGoalAttempts: number;

  @Prop({ default: 0 })
  fieldGoalMakes: number;

  @Prop({ default: 0 })
  kickReturnYards: number;

  @Prop({ default: 0 })
  kickReturns: number;

  @Prop({ default: 0 })
  puntReturnYards: number;

  @Prop({ default: 0 })
  puntReturns: number;

  @Prop({ default: 0 })
  fumbles: number;

  @Prop({ default: 0 })
  fumblesLost: number;

  @Prop({ default: 0 })
  totalTurnovers: number;

  @Prop({ default: 0 })
  opponentTurnovers: number;

  @Prop({ default: 0 })
  penalties: number;

  @Prop({ default: 0 })
  penaltyYards: number;

  @Prop()
  season: string;

  @Prop({ type: [String], default: [] })
  processedGames: string[];

  @Prop({ default: 0 })
  gamesPlayed: number;

  @Prop({ default: 0 })
  wins: number;

  @Prop({ default: 0 })
  losses: number;

  @Prop({ default: 0 })
  ties: number;

  @Prop()
  updatedAt: Date;

  @Prop()
  createdAt: Date;

}

export const TeamTotalStatsSchema = SchemaFactory.createForClass(TeamTotalStats);

// 인덱스 설정
TeamTotalStatsSchema.index({ teamName: 1 });