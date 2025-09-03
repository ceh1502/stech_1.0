import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TeamDocument = Team & Document;

// 팀 스탯 구조
@Schema()
export class TeamStatsDetail {
  // 득점/경기
  @Prop({ default: 0 }) averagePointsPerGame?: number;
  @Prop({ default: 0 }) totalPoints?: number;
  @Prop({ default: 0 }) totalTouchdowns?: number;
  @Prop({ default: 0 }) totalOffenseYards?: number;
  @Prop({ default: 0 }) averageOffenseYardsPerGame?: number;
  
  // 런
  @Prop({ default: 0 }) rushingAttempts?: number;
  @Prop({ default: 0 }) rushingYards?: number;
  @Prop({ default: 0 }) yardsPerCarry?: number;
  @Prop({ default: 0 }) averageRushingYardsPerGame?: number;
  @Prop({ default: 0 }) rushingTouchdowns?: number;
  
  // 패스
  @Prop({ default: 0 }) passingCompletions?: number;
  @Prop({ default: 0 }) passingAttempts?: number;
  @Prop({ default: 0 }) passingYards?: number;
  @Prop({ default: 0 }) yardsPerPass?: number;
  @Prop({ default: 0 }) averagePassingYardsPerGame?: number;
  @Prop({ default: 0 }) passingTouchdowns?: number;
  @Prop({ default: 0 }) interceptions?: number;
  
  // 스페셜팀
  @Prop({ default: 0 }) totalPuntYards?: number;
  @Prop({ default: 0 }) averagePuntYards?: number;
  @Prop({ default: 0 }) touchbackPercentage?: number;
  @Prop({ default: 0 }) fieldGoalsMade?: number;
  @Prop({ default: 0 }) fieldGoalsAttempted?: number;
  @Prop({ default: 0 }) averageKickReturnYards?: number;
  @Prop({ default: 0 }) averagePuntReturnYards?: number;
  @Prop({ default: 0 }) totalReturnYards?: number;
  
  // 기타
  @Prop({ default: 0 }) fumbles?: number;
  @Prop({ default: 0 }) fumblesLost?: number;
  @Prop({ default: 0 }) averageTurnoversPerGame?: number;
  @Prop({ default: 0 }) turnoverRatio?: number; // +/- 형태
  @Prop({ default: 0 }) totalPenalties?: number;
  @Prop({ default: 0 }) totalPenaltyYards?: number;
  @Prop({ default: 0 }) averagePenaltyYardsPerGame?: number;
  
  // 게임 수
  @Prop({ default: 0 }) gamesPlayed?: number;
}

@Schema()
export class TeamPlayer {
  @Prop({ required: true }) playerId: string;
  @Prop({ required: true }) name: string;
  @Prop({ required: true }) jerseyNumber: number;
  @Prop({ required: true, type: [String] }) positions: string[];
  @Prop({ enum: ['Active', 'Military', 'Graduate'], default: 'Active' }) status: string;
}

@Schema()
export class TeamStaff {
  @Prop({ type: [String], default: [] }) coaches: string[];
  @Prop({ type: [String], default: [] }) directors: string[];
  @Prop({ type: [String], default: [] }) managers: string[];
  @Prop({ type: [String], default: [] }) graduates: string[];
}

@Schema()
export class Championships {
  @Prop({ default: 0 }) regional?: number; // 지역
  @Prop({ default: 0 }) tigerBowl?: number; // 타이거볼
  @Prop({ default: 0 }) challengeBowl?: number; // 챌린지볼
}

@Schema({ collection: 'teams', timestamps: true })
export class Team {
  @Prop({ required: true, unique: true })
  teamKey: string; // 팀Key값

  @Prop({ required: true, unique: true })
  teamId: string;

  @Prop({ required: true, trim: true })
  teamName: string;

  @Prop({ trim: true })
  teamAbbr: string; // 팀 약자

  @Prop({ default: null })
  logoUrl: string; // 팀 로고

  @Prop({ default: null })
  teamColor: string; // 팀 컬러

  @Prop({ type: [TeamPlayer], default: [] })
  players: TeamPlayer[]; // 선수 목록

  @Prop({ type: TeamStaff, default: () => ({}) })
  staff: TeamStaff; // 관계자

  @Prop({ trim: true })
  region: string; // 지역

  @Prop({ type: Championships, default: () => ({}) })
  championships: Championships; // 우승횟수

  @Prop({ type: TeamStatsDetail, default: () => ({}) })
  stats: TeamStatsDetail; // 팀 통계

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;
}

export const TeamSchema = SchemaFactory.createForClass(Team);

// 인덱스 설정
TeamSchema.index({ teamId: 1 });
TeamSchema.index({ ownerId: 1 });

// 가상 필드: 팀에 속한 선수들 (Player 컬렉션 참조)
TeamSchema.virtual('playerDetails', {
  ref: 'Player',
  localField: '_id',
  foreignField: 'teamId',
});
