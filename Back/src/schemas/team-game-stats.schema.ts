import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TeamGameStatsDocument = TeamGameStats & Document;

@Schema({
  collection: 'team_game_stats',
  timestamps: true,
})
export class TeamGameStats {
  @Prop({ required: true })
  teamName: string; // 예: "건국대 레이징불스"

  @Prop({ required: true })
  gameKey: string; // 예: "KMHY241110"

  @Prop({ required: true })
  date: string; // 예: "2024-09-07(토) 16:00"

  @Prop({ required: true })
  season: string; // date에서 추출한 연도

  @Prop({ required: true })
  opponent: string;

  @Prop({ required: true })
  isHomeGame: boolean;

  @Prop()
  gameResult?: string; // "W" or "L"

  @Prop({ type: Object })
  stats: {
    // 오펜스 스탯
    totalYards?: number;
    passingYards?: number;
    rushingYards?: number;
    passingAttempts?: number;
    passingCompletions?: number;
    rushingAttempts?: number;
    touchdowns?: number;
    fieldGoals?: number;
    turnovers?: number;
    
    // 디펜스 스탯
    yardsAllowed?: number;
    sacks?: number;
    interceptions?: number;
    fumblesRecovered?: number;
    
    // 스페셜팀 스탯
    puntingYards?: number;
    puntReturns?: number;
    kickReturns?: number;
    returnYards?: number;
    
    // 팀 전체
    penalties?: number;
    penaltyYards?: number;
    timeOfPossession?: string;
    thirdDownConversions?: string; // "5/12"
    fourthDownConversions?: string; // "1/2"
  };

  @Prop({ 
    type: {
      own: Number,
      opponent: Number,
    },
    default: { own: 0, opponent: 0 }
  })
  finalScore?: {
    own: number;
    opponent: number;
  };
}

export const TeamGameStatsSchema = SchemaFactory.createForClass(TeamGameStats);

// 인덱스 설정
TeamGameStatsSchema.index({ teamName: 1 });
TeamGameStatsSchema.index({ gameKey: 1 });
TeamGameStatsSchema.index({ season: 1 });
TeamGameStatsSchema.index({ teamName: 1, gameKey: 1 }, { unique: true });