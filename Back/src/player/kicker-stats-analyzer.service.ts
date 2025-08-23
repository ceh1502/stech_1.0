import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { NewClipDto } from '../common/dto/new-clip.dto';

// Kicker 스탯 인터페이스 정의
export interface KickerStats {
  gamesPlayed: number;
  extra_point_attempts: number;
  extra_point_made: number;
  field_goal: string; // "made-attempted" format
  field_goal_percentage: number;
  field_goal_1_19: number;
  field_goal_20_29: number;
  field_goal_30_39: number;
  field_goal_40_49: number;
  field_goal_50_plus: number;
  average_field_goal_length: number;
  longest_field_goal: number;
}


@Injectable()
export class KickerStatsAnalyzerService {
  constructor(
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
  ) {}
  
  // 필드골 거리 계산 (터치다운까지 남은 거리 + 17야드)
  private calculateFieldGoalDistance(remainYard: number): number {
    return remainYard + 17;
  }

  // 필드 포지션에서 필드골 거리 계산
  private calculateFieldGoalDistanceFromPosition(side: string, yard: number): number {
    const normalizedSide = side.toUpperCase();
    if (normalizedSide === 'OPP') {
      return yard + 17; // 상대편 진영에서 골대선까지 거리 + 17야드
    } else {
      return 50 + yard + 17; // 자진영에서 50야드 + 상대편 진영 + 17야드
    }
  }

  // 클립 데이터에서 Kicker 스탯 추출
  async analyzeKickerStats(clips: NewClipDto[], playerId: string): Promise<KickerStats> {
    const kickerStats: KickerStats = {
      gamesPlayed: 0,
      extra_point_attempts: 0,
      extra_point_made: 0,
      field_goal: "0-0",
      field_goal_percentage: 0,
      field_goal_1_19: 0,
      field_goal_20_29: 0,
      field_goal_30_39: 0,
      field_goal_40_49: 0,
      field_goal_50_plus: 0,
      average_field_goal_length: 0,
      longest_field_goal: 0
    };

    // Track field goal attempts and makes for calculation
    let fieldGoalAttempts = 0;
    let fieldGoalMade = 0;

    const gameIds = new Set(); // 경기 수 계산용
    let totalFieldGoalYards = 0; // 평균 계산용

    // Player DB에서 해당 선수 정보 미리 조회 (jerseyNumber로 검색)
    const player = await this.playerModel.findOne({ 
      jerseyNumber: parseInt(playerId)
    });
    if (!player) {
      throw new Error(`등번호 ${playerId}번 선수를 찾을 수 없습니다.`);
    }

    for (const clip of clips) {
      // 게임 ID 추가 (경기 수 계산)
      if (clip.clipKey) {
        gameIds.add(clip.clipKey);
      }

      // NewClipDto 구조 지원 - car, car2에서 찾기
      const isKicker = this.isPlayerKicker(clip, playerId);
      
      if (!isKicker) {
        continue; // 이 클립은 해당 Kicker 플레이가 아님
      }

      // SignificantPlays 기반 스탯 분석 (신규 방식)
      const fgResult = this.analyzeSignificantPlaysNew(clip, kickerStats, playerId);
      fieldGoalAttempts += fgResult.attempts;
      fieldGoalMade += fgResult.made;
      
      // 기본 특수팀 플레이 분석 (레거시 방식)  
      const fgResult2 = this.analyzeBasicKickingPlay(clip, kickerStats);
      fieldGoalAttempts += fgResult2.attempts;
      fieldGoalMade += fgResult2.made;
      
      // 필드골 야드 누적 (평균 계산용)
      totalFieldGoalYards += fgResult.yards + fgResult2.yards;
    }

    // 계산된 스탯 업데이트
    kickerStats.gamesPlayed = (player.stats?.gamesPlayed || 0) + gameIds.size;
    kickerStats.field_goal = `${fieldGoalMade}-${fieldGoalAttempts}`;
    kickerStats.field_goal_percentage = fieldGoalAttempts > 0
      ? Math.round((fieldGoalMade / fieldGoalAttempts) * 100 * 10) / 10
      : 0;
    kickerStats.average_field_goal_length = fieldGoalAttempts > 0 
      ? Math.round((totalFieldGoalYards / fieldGoalAttempts) * 10) / 10
      : 0;

    return kickerStats;
  }

  // PAT 플레이 분석
  private analyzePATPlay(clip: NewClipDto, stats: KickerStats, isSuccessful: boolean): void {
    stats.extra_point_attempts++;
    if (isSuccessful) {
      stats.extra_point_made++;
    }
  }

  // 필드골 플레이 분석
  private analyzeFieldGoalPlay(clip: NewClipDto, stats: KickerStats, isSuccessful: boolean): {attempts: number, made: number, yards: number} {
    const distance = this.calculateFieldGoalDistance(clip.toGoYard || 0);
    
    if (isSuccessful) {
      // 최장 필드골 기록 업데이트
      if (distance > stats.longest_field_goal) {
        stats.longest_field_goal = distance;
      }
    }

    // 거리별 필드골 통계 (성공한 것만 기록)
    if (isSuccessful) {
      if (distance >= 1 && distance <= 19) {
        stats.field_goal_1_19++;
      } else if (distance >= 20 && distance <= 29) {
        stats.field_goal_20_29++;
      } else if (distance >= 30 && distance <= 39) {
        stats.field_goal_30_39++;
      } else if (distance >= 40 && distance <= 49) {
        stats.field_goal_40_49++;
      } else if (distance >= 50) {
        stats.field_goal_50_plus++;
      }
    }

    return {
      attempts: 1,
      made: isSuccessful ? 1 : 0,
      yards: distance
    };
  }

  // NewClipDto에서 해당 선수가 킥커인지 확인
  private isPlayerKicker(clip: any, playerId: string): boolean {
    // car, car2에서 해당 선수 찾기 (킥커는 보통 car에만 있음)
    const playerNum = parseInt(playerId);
    
    return (clip.car?.num === playerNum && (clip.car?.pos === 'Kicker' || clip.car?.pos === 'K')) ||
           (clip.car2?.num === playerNum && (clip.car2?.pos === 'Kicker' || clip.car2?.pos === 'K'));
  }

  // 새로운 특수 케이스 분석 로직
  private analyzeSignificantPlaysNew(clip: any, stats: KickerStats, playerId: string): {attempts: number, made: number, yards: number} {
    if (!clip.significantPlays) return {attempts: 0, made: 0, yards: 0};

    const playerNum = parseInt(playerId);
    const isKicker = (clip.car?.num === playerNum && (clip.car?.pos === 'K' || clip.car?.pos === 'Kicker')) ||
                     (clip.car2?.num === playerNum && (clip.car2?.pos === 'K' || clip.car2?.pos === 'Kicker'));

    if (!isKicker) return {attempts: 0, made: 0, yards: 0};

    const significantPlays = clip.significantPlays;
    const playType = clip.playType;
    let totalFgYards = 0;
    let attempts = 0;
    let made = 0;

    // PAT(Good)
    if (significantPlays.includes('EXTRAPOINT') && playType === 'PAT') {
      stats.extra_point_attempts += 1;
      stats.extra_point_made += 1;
    }

    // PAT(No Good)
    else if (significantPlays.includes('EXTRAPOINTMISS') && playType === 'PAT') {
      stats.extra_point_attempts += 1;
    }

    // Field Goal(Good)
    else if (significantPlays.includes('FIELDGOAL') && playType === 'FieldGoal') {
      const distance = this.calculateFieldGoalDistanceFromPosition(clip.start?.side || '', clip.start?.yard || 0);
      if (distance > 0) {
        this.updateFieldGoalStats(stats, distance, true);
        totalFgYards += distance;
        attempts += 1;
        made += 1;
      }
    }

    // Field Goal(No Good)
    else if (significantPlays.includes('FIELDGOALMISS') && playType === 'FieldGoal') {
      const distance = this.calculateFieldGoalDistanceFromPosition(clip.start?.side || '', clip.start?.yard || 0);
      if (distance > 0) {
        this.updateFieldGoalStats(stats, distance, false);
        totalFgYards += distance;
        attempts += 1;
      }
    }

    return {attempts, made, yards: totalFgYards};
  }

  // 기본 특수팀 플레이 분석 (레거시 PlayType 방식)
  private analyzeBasicKickingPlay(clip: any, stats: KickerStats): {attempts: number, made: number, yards: number} {
    const playerNum = parseInt(clip.playerId || '0');
    const isThisPlayerKicker = (clip.car?.num === playerNum && (clip.car?.pos === 'Kicker' || clip.car?.pos === 'K')) ||
                               (clip.car2?.num === playerNum && (clip.car2?.pos === 'Kicker' || clip.car2?.pos === 'K'));

    if (!isThisPlayerKicker) return {attempts: 0, made: 0, yards: 0};

    // SignificantPlays에서 이미 처리된 경우가 아니라면 레거시 방식 적용
    const hasSpecialPlay = clip.significantPlays?.some((play: string | null) => 
      play === 'FIELDGOAL' || play === 'FIELDGOALMISS' || play === 'EXTRAPOINT' || play === 'EXTRAPOINTMISS'
    );

    if (!hasSpecialPlay) {
      let totalFgYards = 0;
      let attempts = 0;
      let made = 0;

      // 레거시 PlayType 방식
      switch (clip.playType) {
        case 'PAT':
          stats.extra_point_attempts += 1;
          stats.extra_point_made += 1;
          break;
        case 'NoPAT':
          stats.extra_point_attempts += 1;
          break;
        case 'FieldGoal':
          const fgDistance = clip.toGoYard ? this.calculateFieldGoalDistance(clip.toGoYard) : 0;
          if (fgDistance > 0) {
            this.updateFieldGoalStats(stats, fgDistance, true);
            totalFgYards += fgDistance;
            attempts += 1;
            made += 1;
          }
          break;
        case 'NoFieldGoal':
          const fgMissDistance = clip.toGoYard ? this.calculateFieldGoalDistance(clip.toGoYard) : 0;
          if (fgMissDistance > 0) {
            this.updateFieldGoalStats(stats, fgMissDistance, false);
            totalFgYards += fgMissDistance;
            attempts += 1;
          }
          break;
      }

      return {attempts, made, yards: totalFgYards};
    }

    return {attempts: 0, made: 0, yards: 0};
  }

  // 필드골 스탯 업데이트 헬퍼 메소드
  private updateFieldGoalStats(stats: KickerStats, distance: number, isSuccessful: boolean): void {
    if (isSuccessful) {
      // 최장 필드골 기록 업데이트
      if (distance > stats.longest_field_goal) {
        stats.longest_field_goal = distance;
      }

      // 거리별 필드골 통계 (성공한 것만 기록)
      if (distance >= 1 && distance <= 19) {
        stats.field_goal_1_19++;
      } else if (distance >= 20 && distance <= 29) {
        stats.field_goal_20_29++;
      } else if (distance >= 30 && distance <= 39) {
        stats.field_goal_30_39++;
      } else if (distance >= 40 && distance <= 49) {
        stats.field_goal_40_49++;
      } else if (distance >= 50) {
        stats.field_goal_50_plus++;
      }
    }
  }

  // 샘플 클립 데이터로 테스트
  async generateSampleKickerStats(playerId: string = 'K001'): Promise<KickerStats> {
    const sampleClips: NewClipDto[] = [
      {
        clipKey: 'SAMPLE_GAME_1',
        offensiveTeam: 'Away',
        quarter: 1,
        down: '0',
        toGoYard: 2,
        playType: 'PAT',
        specialTeam: true,
        start: { side: 'OPP', yard: 2 },
        end: { side: 'OPP', yard: 0 },
        gainYard: 0,
        car: { num: parseInt(playerId), pos: 'K' },
        car2: { num: null, pos: null },
        tkl: { num: null, pos: null },
        tkl2: { num: null, pos: null },
        significantPlays: [null, null, null, null]
      },
      {
        clipKey: 'SAMPLE_GAME_1',
        offensiveTeam: 'Away',
        quarter: 2,
        down: '4',
        toGoYard: 25,
        playType: 'FieldGoal',
        specialTeam: true,
        start: { side: 'OPP', yard: 25 },
        end: { side: 'OPP', yard: 0 },
        gainYard: 0,
        car: { num: parseInt(playerId), pos: 'K' },
        car2: { num: null, pos: null },
        tkl: { num: null, pos: null },
        tkl2: { num: null, pos: null },
        significantPlays: [null, null, null, null]
      }
    ];

    const result = await this.analyzeKickerStats(sampleClips, playerId);
    return result;
  }
}