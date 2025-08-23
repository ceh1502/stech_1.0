import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TeamSeasonStatsDocument = TeamSeasonStats & Document;

@Schema({ timestamps: true })
export class TeamSeasonStats {
  @Prop({ required: true })
  teamName: string; // 팀 이름

  @Prop({ required: true })
  season: string; // 시즌 (예: "2024")

  // 1. 득점
  @Prop({ default: 0 })
  totalPoints: number; // 총 득점 (시즌 기준)
  
  @Prop({ default: 0 })
  totalTouchdowns: number; // 총 터치다운 (시즌 기준)
  
  @Prop({ default: 0 })
  totalYards: number; // 총 전진야드
  
  @Prop({ default: 0 })
  gamesPlayed: number; // 경기 수

  // 2. 런
  @Prop({ default: 0 })
  rushingAttempts: number; // 러싱 시도
  
  @Prop({ default: 0 })
  rushingYards: number; // 러싱 야드
  
  @Prop({ default: 0 })
  rushingTouchdowns: number; // 러싱 터치다운

  // 3. 패스
  @Prop({ default: 0 })
  passAttempts: number; // 패스 시도
  
  @Prop({ default: 0 })
  passCompletions: number; // 패스 성공
  
  @Prop({ default: 0 })
  passingYards: number; // 패싱 야드
  
  @Prop({ default: 0 })
  passingTouchdowns: number; // 패싱 터치다운
  
  @Prop({ default: 0 })
  interceptions: number; // 인터셉트

  // 4. 스페셜팀
  @Prop({ default: 0 })
  totalPuntYards: number; // 총 펀트 야드
  
  @Prop({ default: 0 })
  totalPunts: number; // 총 펀트 수
  
  @Prop({ default: 0 })
  puntTouchbacks: number; // 펀트 터치백 수
  
  @Prop({ default: 0 })
  fieldGoalAttempts: number; // 필드골 시도
  
  @Prop({ default: 0 })
  fieldGoalMakes: number; // 필드골 성공
  
  @Prop({ default: 0 })
  kickReturnYards: number; // 킥 리턴 야드
  
  @Prop({ default: 0 })
  kickReturns: number; // 킥 리턴 수
  
  @Prop({ default: 0 })
  puntReturnYards: number; // 펀트 리턴 야드
  
  @Prop({ default: 0 })
  puntReturns: number; // 펀트 리턴 수

  // 5. 기타
  @Prop({ default: 0 })
  fumbles: number; // 펌블 수
  
  @Prop({ default: 0 })
  fumblesLost: number; // 펌블 턴오버 수
  
  @Prop({ default: 0 })
  totalTurnovers: number; // 경기 당 턴오버 수 (인터셉트 + 펌블 로스트)
  
  @Prop({ default: 0 })
  opponentTurnovers: number; // 상대방 턴오버 수
  
  @Prop({ default: 0 })
  penalties: number; // 총 페널티 수
  
  @Prop({ default: 0 })
  penaltyYards: number; // 총 페널티 야드

  // 처리된 게임 목록 (중복 방지용)
  @Prop({ type: [String], default: [] })
  processedGames: string[];
}

export const TeamSeasonStatsSchema = SchemaFactory.createForClass(TeamSeasonStats);