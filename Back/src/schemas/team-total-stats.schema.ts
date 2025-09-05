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

  @Prop({ type: Object })
  stats: {
    // 오펜스 스탯 (누적)
    totalYards?: number;
    passingYards?: number;
    rushingYards?: number;
    passingAttempts?: number;
    passingCompletions?: number;
    rushingAttempts?: number;
    touchdowns?: number;
    fieldGoals?: number;
    patGood?: number;
    twoPtGood?: number;
    safeties?: number;
    totalPoints?: number;
    turnovers?: number;
    fumbles?: number;
    fumblesLost?: number;
    
    // 평균
    avgYardsPerGame?: number;
    avgPassingYards?: number;
    avgRushingYards?: number;
    avgPointsScored?: number;
    avgPointsAllowed?: number;
    
    // 디펜스 스탯 (누적)
    yardsAllowed?: number;
    sacks?: number;
    interceptions?: number;
    fumblesRecovered?: number;
    
    // 스페셜팀 스탯 (누적)
    puntAttempts?: number;
    puntYards?: number;
    avgPuntYards?: number;
    puntReturns?: number;
    kickReturns?: number;
    returnYards?: number;
    fieldGoalAttempts?: number;
    touchbacks?: number;
    
    // 팀 전체
    penalties?: number;
    penaltyYards?: number;
  };

  @Prop({ default: 0 })
  gamesPlayed: number;

  @Prop({ default: 0 })
  wins: number;

  @Prop({ default: 0 })
  losses: number;

  @Prop({ default: 0 })
  ties: number;

  @Prop()
  winRate?: number; // 승률

  @Prop({ type: [String], default: [] })
  seasons: string[]; // 활동한 시즌 목록

  @Prop({ type: [String], default: [] })
  gameKeys: string[]; // 모든 경기 목록

  @Prop()
  lastUpdated?: Date;
}

export const TeamTotalStatsSchema = SchemaFactory.createForClass(TeamTotalStats);

// 인덱스 설정
TeamTotalStatsSchema.index({ teamName: 1 });