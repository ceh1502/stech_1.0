import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PlayerDocument = Player & Document;

// 포지션별 스탯 구조
@Schema()
export class QBStats {
  @Prop({ default: 0 }) passingYards?: number;
  @Prop({ default: 0 }) passingTouchdowns?: number;
  @Prop({ default: 0 }) passingCompletions?: number;
  @Prop({ default: 0 }) passingAttempts?: number;
  @Prop({ default: 0 }) passingInterceptions?: number;
  @Prop({ default: 0 }) completionPercentage?: number;
  @Prop({ default: 0 }) passerRating?: number;
  @Prop({ default: 0 }) longestPass?: number;
  @Prop({ default: 0 }) sacks?: number;
  @Prop({ default: 0 }) gamesPlayed?: number;
  // 러싱도 할 수 있음
  @Prop({ default: 0 }) rushingYards?: number;
  @Prop({ default: 0 }) rushingTouchdowns?: number;
  @Prop({ default: 0 }) rushingAttempts?: number;
  @Prop({ default: 0 }) yardsPerCarry?: number;
  @Prop({ default: 0 }) longestRush?: number;
}

@Schema()
export class RBStats {
  @Prop({ default: 0 }) rbRushingYards?: number;
  @Prop({ default: 0 }) rbRushingTouchdowns?: number;
  @Prop({ default: 0 }) rbRushingAttempts?: number;
  @Prop({ default: 0 }) rbYardsPerCarry?: number;
  @Prop({ default: 0 }) rbLongestRush?: number;
  @Prop({ default: 0 }) fumbles?: number;
  @Prop({ default: 0 }) fumblesLost?: number;
  @Prop({ default: 0 }) gamesPlayed?: number;
  // 스페셜팀
  @Prop({ default: 0 }) kickReturns?: number;
  @Prop({ default: 0 }) kickReturnYards?: number;
  @Prop({ default: 0 }) yardsPerKickReturn?: number;
  @Prop({ default: 0 }) puntReturns?: number;
  @Prop({ default: 0 }) puntReturnYards?: number;
  @Prop({ default: 0 }) yardsPerPuntReturn?: number;
  @Prop({ default: 0 }) returnTouchdowns?: number;
}

@Schema()
export class WRStats {
  @Prop({ default: 0 }) wrReceivingTargets?: number;
  @Prop({ default: 0 }) wrReceptions?: number;
  @Prop({ default: 0 }) wrReceivingYards?: number;
  @Prop({ default: 0 }) wrYardsPerReception?: number;
  @Prop({ default: 0 }) wrReceivingTouchdowns?: number;
  @Prop({ default: 0 }) wrLongestReception?: number;
  @Prop({ default: 0 }) wrReceivingFirstDowns?: number;
  @Prop({ default: 0 }) fumbles?: number;
  @Prop({ default: 0 }) fumblesLost?: number;
  @Prop({ default: 0 }) gamesPlayed?: number;
  // 러싱도 할 수 있음
  @Prop({ default: 0 }) wrRushingAttempts?: number;
  @Prop({ default: 0 }) wrRushingYards?: number;
  @Prop({ default: 0 }) wrYardsPerCarry?: number;
  @Prop({ default: 0 }) wrRushingTouchdowns?: number;
  @Prop({ default: 0 }) wrLongestRush?: number;
  // 스페셜팀
  @Prop({ default: 0 }) kickReturns?: number;
  @Prop({ default: 0 }) kickReturnYards?: number;
  @Prop({ default: 0 }) yardsPerKickReturn?: number;
  @Prop({ default: 0 }) puntReturns?: number;
  @Prop({ default: 0 }) puntReturnYards?: number;
  @Prop({ default: 0 }) yardsPerPuntReturn?: number;
  @Prop({ default: 0 }) returnTouchdowns?: number;
}

@Schema()
export class TEStats {
  @Prop({ default: 0 }) teReceivingTargets?: number;
  @Prop({ default: 0 }) teReceptions?: number;
  @Prop({ default: 0 }) teReceivingYards?: number;
  @Prop({ default: 0 }) teYardsPerReception?: number;
  @Prop({ default: 0 }) teReceivingTouchdowns?: number;
  @Prop({ default: 0 }) teLongestReception?: number;
  @Prop({ default: 0 }) teReceivingFirstDowns?: number;
  @Prop({ default: 0 }) fumbles?: number;
  @Prop({ default: 0 }) fumblesLost?: number;
  @Prop({ default: 0 }) gamesPlayed?: number;
  // 러싱도 할 수 있음
  @Prop({ default: 0 }) teRushingAttempts?: number;
  @Prop({ default: 0 }) frontRushYard?: number;
  @Prop({ default: 0 }) backRushYard?: number;
  @Prop({ default: 0 }) teRushingYards?: number;
  @Prop({ default: 0 }) teYardsPerCarry?: number;
  @Prop({ default: 0 }) teRushingTouchdowns?: number;
  @Prop({ default: 0 }) teLongestRush?: number;
}

@Schema()
export class KStats {
  @Prop({ default: 0 }) fieldGoalsMade?: number;
  @Prop({ default: 0 }) fieldGoalsAttempted?: number;
  @Prop({ default: 0 }) fieldGoalPercentage?: number;
  @Prop({ default: 0 }) longestFieldGoal?: number;
  @Prop({ default: 0 }) extraPointsMade?: number;
  @Prop({ default: 0 }) extraPointsAttempted?: number;
  @Prop({ default: 0 }) gamesPlayed?: number;
}

@Schema()
export class PStats {
  @Prop({ default: 0 }) puntCount?: number;
  @Prop({ default: 0 }) puntYards?: number;
  @Prop({ default: 0 }) averagePuntYard?: number;
  @Prop({ default: 0 }) longestPunt?: number;
  @Prop({ default: 0 }) touchbacks?: number;
  @Prop({ default: 0 }) touchbackPercentage?: number;
  @Prop({ default: 0 }) inside20?: number;
  @Prop({ default: 0 }) inside20Percentage?: number;
  @Prop({ default: 0 }) gamesPlayed?: number;
}

@Schema()
export class OLStats {
  @Prop({ default: 0 }) penalties?: number;
  @Prop({ default: 0 }) sacksAllowed?: number;
  @Prop({ default: 0 }) gamesPlayed?: number;
}

@Schema()
export class DLStats {
  @Prop({ default: 0 }) tackles?: number;
  @Prop({ default: 0 }) tfl?: number;
  @Prop({ default: 0 }) sacks?: number;
  @Prop({ default: 0 }) interceptions?: number;
  @Prop({ default: 999 }) forcedFumbles?: number;
  @Prop({ default: 999 }) fumbleRecoveries?: number;
  @Prop({ default: 999 }) fumbleRecoveryYards?: number;
  @Prop({ default: 999 }) passesDefended?: number;
  @Prop({ default: 999 }) interceptionYards?: number;
  @Prop({ default: 999 }) defensiveTouchdowns?: number;
  @Prop({ default: 0 }) gamesPlayed?: number;
}

@Schema()
export class LBStats {
  @Prop({ default: 0 }) tackles?: number;
  @Prop({ default: 0 }) tfl?: number;
  @Prop({ default: 0 }) sacks?: number;
  @Prop({ default: 0 }) interceptions?: number;
  @Prop({ default: 999 }) forcedFumbles?: number;
  @Prop({ default: 999 }) fumbleRecoveries?: number;
  @Prop({ default: 999 }) fumbleRecoveryYards?: number;
  @Prop({ default: 999 }) passesDefended?: number;
  @Prop({ default: 999 }) interceptionYards?: number;
  @Prop({ default: 999 }) defensiveTouchdowns?: number;
  @Prop({ default: 0 }) gamesPlayed?: number;
}

@Schema()
export class DBStats {
  @Prop({ default: 0 }) tackles?: number;
  @Prop({ default: 0 }) tfl?: number;
  @Prop({ default: 0 }) sacks?: number;
  @Prop({ default: 0 }) interceptions?: number;
  @Prop({ default: 999 }) forcedFumbles?: number;
  @Prop({ default: 999 }) fumbleRecoveries?: number;
  @Prop({ default: 999 }) fumbleRecoveryYards?: number;
  @Prop({ default: 999 }) passesDefended?: number;
  @Prop({ default: 999 }) interceptionYards?: number;
  @Prop({ default: 999 }) defensiveTouchdowns?: number;
  @Prop({ default: 0 }) gamesPlayed?: number;
}

@Schema()
export class DefensiveStats {
  @Prop({ default: 0 }) tackles?: number;
  @Prop({ default: 0 }) sacks?: number;
  @Prop({ default: 0 }) interceptions?: number;
  @Prop({ default: 0 }) passesDefended?: number;
  @Prop({ default: 0 }) forcedFumbles?: number;
  @Prop({ default: 0 }) fumbleRecoveries?: number;
  @Prop({ default: 0 }) defensiveTouchdowns?: number;
  @Prop({ default: 0 }) gamesPlayed?: number;
}

// 멀티포지션을 위한 통합 스탯 클래스
@Schema()
export class PlayerStats {
  // 포지션별 개별 스탯 객체들
  @Prop({ type: QBStats, default: null })
  QB?: QBStats;

  @Prop({ type: RBStats, default: null })
  RB?: RBStats;

  @Prop({ type: WRStats, default: null })
  WR?: WRStats;

  @Prop({ type: TEStats, default: null })
  TE?: TEStats;

  @Prop({ type: KStats, default: null })
  K?: KStats;

  @Prop({ type: PStats, default: null })
  P?: PStats;

  @Prop({ type: OLStats, default: null })
  OL?: OLStats;

  @Prop({ type: DLStats, default: null })
  DL?: DLStats;

  @Prop({ type: LBStats, default: null })
  LB?: LBStats;

  @Prop({ type: DBStats, default: null })
  DB?: DBStats;

  @Prop({ type: DefensiveStats, default: null })
  Defense?: DefensiveStats;

  // 공통 정보
  @Prop({ default: 0 })
  totalGamesPlayed?: number;
}

@Schema({ timestamps: true, autoIndex: false })
export class Player {
  @Prop({ required: true })
  playerId: string; // PlayerCode로 사용

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, type: [String] }) // 배열로 변경하여 멀티포지션 지원
  positions: string[];

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

  // 멀티포지션 스탯 필드
  @Prop({ type: PlayerStats, default: () => ({}) })
  stats: PlayerStats;

  // 리그 구분 추가
  @Prop({ enum: ['1부', '2부'], default: '1부' })
  league: string;

  // 시즌 정보 추가
  @Prop({ default: '2024' })
  season: string;

  // 주 포지션 (기본 포지션)
  @Prop({ trim: true })
  primaryPosition?: string;
}

export const PlayerSchema = SchemaFactory.createForClass(Player);

// 인덱스 설정
PlayerSchema.index({ playerId: 1 });
PlayerSchema.index({ teamId: 1 });
PlayerSchema.index({ teamName: 1, jerseyNumber: 1 }, { unique: true }); // 한 팀에서 같은 등번호는 하나만 (멀티포지션 지원)

// 가상 필드: 속한 팀 정보
PlayerSchema.virtual('team', {
  ref: 'Team',
  localField: 'teamId',
  foreignField: '_id',
  justOne: true,
});
