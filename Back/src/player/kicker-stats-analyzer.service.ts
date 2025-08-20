import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { ClipData } from '../common/interfaces/clip-data.interface';
import { PLAY_TYPE, SIGNIFICANT_PLAY, PlayAnalysisHelper } from './constants/play-types.constants';

// Kicker 스탯 인터페이스 정의
export interface KickerStats {
  games: number;
  extraPointAttempted: number;
  extraPointMade: number;
  fieldGoalMade: number;
  fieldGoalAttempted: number;
  fieldGoalPercentage: number;
  fg1to19Made: number;
  fg1to19Attempted: number;
  fg20to29Made: number;
  fg20to29Attempted: number;
  fg30to39Made: number;
  fg30to39Attempted: number;
  fg40to49Made: number;
  fg40to49Attempted: number;
  fg50plusMade: number;
  fg50plusAttempted: number;
  averageFieldGoalLength: number;
  longestFieldGoalMade: number;
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

  // 클립 데이터에서 Kicker 스탯 추출
  async analyzeKickerStats(clips: ClipData[], playerId: string): Promise<KickerStats> {
    const kickerStats: KickerStats = {
      games: 0,
      extraPointAttempted: 0,
      extraPointMade: 0,
      fieldGoalMade: 0,
      fieldGoalAttempted: 0,
      fieldGoalPercentage: 0,
      fg1to19Made: 0,
      fg1to19Attempted: 0,
      fg20to29Made: 0,
      fg20to29Attempted: 0,
      fg30to39Made: 0,
      fg30to39Attempted: 0,
      fg40to49Made: 0,
      fg40to49Attempted: 0,
      fg50plusMade: 0,
      fg50plusAttempted: 0,
      averageFieldGoalLength: 0,
      longestFieldGoalMade: 0
    };

    const gameIds = new Set(); // 경기 수 계산용
    let totalFieldGoalYards = 0; // 평균 계산용

    // Player DB에서 해당 선수 정보 미리 조회 (playercode 또는 playerId로 검색)
    const player = await this.playerModel.findOne({ 
      $or: [
        { playerId: playerId },
        { playercode: playerId },
        { playercode: parseInt(playerId) }
      ]
    });
    if (!player || player.position !== 'Kicker') {
      throw new Error('해당 선수는 Kicker가 아니거나 존재하지 않습니다.');
    }

    for (const clip of clips) {
      // 게임 ID 추가 (경기 수 계산)
      gameIds.add(clip.ClipKey);

      // 이 클립에서 해당 Kicker가 Carrier에 있는지 확인
      const carrier = clip.Carrier?.find(c => 
        (c.playercode == playerId || c.playercode === parseInt(playerId)) &&
        c.position === 'Kicker'
      );
      
      // NewClipDto 구조 지원 - car, car2에서 찾기
      const isKicker = this.isPlayerKicker(clip, playerId);
      
      if (!carrier && !isKicker) {
        continue; // 이 클립은 해당 Kicker 플레이가 아님
      }

      // SignificantPlays 기반 스탯 분석 (신규 방식)
      const fgYards = this.analyzeSignificantPlaysNew(clip, kickerStats, playerId);
      
      // 기본 특수팀 플레이 분석 (레거시 방식)  
      const fgYards2 = this.analyzeBasicKickingPlay(clip, kickerStats);
      
      // 필드골 야드 누적 (평균 계산용)
      totalFieldGoalYards += fgYards + fgYards2;
    }

    // 계산된 스탯 업데이트
    kickerStats.games = gameIds.size;
    kickerStats.fieldGoalPercentage = kickerStats.fieldGoalAttempted > 0
      ? Math.round((kickerStats.fieldGoalMade / kickerStats.fieldGoalAttempted) * 100 * 10) / 10
      : 0;
    kickerStats.averageFieldGoalLength = kickerStats.fieldGoalAttempted > 0 
      ? Math.round((totalFieldGoalYards / kickerStats.fieldGoalAttempted) * 10) / 10
      : 0;

    return kickerStats;
  }

  // PAT 플레이 분석
  private analyzePATPlay(clip: ClipData, stats: KickerStats, isSuccessful: boolean): void {
    stats.extraPointAttempted++;
    if (isSuccessful) {
      stats.extraPointMade++;
    }
  }

  // 필드골 플레이 분석
  private analyzeFieldGoalPlay(clip: ClipData, stats: KickerStats, isSuccessful: boolean): void {
    const distance = this.calculateFieldGoalDistance(clip.RemainYard);
    
    stats.fieldGoalAttempted++;
    if (isSuccessful) {
      stats.fieldGoalMade++;
      
      // 최장 필드골 기록 업데이트
      if (distance > stats.longestFieldGoalMade) {
        stats.longestFieldGoalMade = distance;
      }
    }

    // 거리별 필드골 통계
    if (distance >= 1 && distance <= 19) {
      stats.fg1to19Attempted++;
      if (isSuccessful) stats.fg1to19Made++;
    } else if (distance >= 20 && distance <= 29) {
      stats.fg20to29Attempted++;
      if (isSuccessful) stats.fg20to29Made++;
    } else if (distance >= 30 && distance <= 39) {
      stats.fg30to39Attempted++;
      if (isSuccessful) stats.fg30to39Made++;
    } else if (distance >= 40 && distance <= 49) {
      stats.fg40to49Attempted++;
      if (isSuccessful) stats.fg40to49Made++;
    } else if (distance >= 50) {
      stats.fg50plusAttempted++;
      if (isSuccessful) stats.fg50plusMade++;
    }
  }

  // NewClipDto에서 해당 선수가 킥커인지 확인
  private isPlayerKicker(clip: any, playerId: string): boolean {
    // car, car2에서 해당 선수 찾기 (킥커는 보통 car에만 있음)
    const playerNum = parseInt(playerId);
    
    return (clip.car?.num === playerNum && clip.car?.pos === 'Kicker') ||
           (clip.car2?.num === playerNum && clip.car2?.pos === 'Kicker');
  }

  // 새로운 특수 케이스 분석 로직
  private analyzeSignificantPlaysNew(clip: any, stats: KickerStats, playerId: string): number {
    if (!clip.significantPlays) return 0;

    const playerNum = parseInt(playerId);
    const isKicker = (clip.car?.num === playerNum && clip.car?.pos === 'K') ||
                     (clip.car2?.num === playerNum && clip.car2?.pos === 'K');

    if (!isKicker) return 0;

    const significantPlays = clip.significantPlays;
    const playType = clip.playType;
    let totalFgYards = 0;

    // PAT(Good)
    if (PlayAnalysisHelper.hasSignificantPlay(significantPlays, SIGNIFICANT_PLAY.PAT.GOOD) && 
        playType === PLAY_TYPE.PAT) {
      stats.extraPointAttempted += 1;
      stats.extraPointMade += 1;
    }

    // PAT(No Good)
    else if (PlayAnalysisHelper.hasSignificantPlay(significantPlays, SIGNIFICANT_PLAY.PAT.NOGOOD) && 
             playType === PLAY_TYPE.PAT) {
      stats.extraPointAttempted += 1;
    }

    // Field Goal(Good)
    else if (PlayAnalysisHelper.hasSignificantPlay(significantPlays, SIGNIFICANT_PLAY.FIELDGOAL.GOOD) && 
             playType === PLAY_TYPE.FG) {
      const distance = PlayAnalysisHelper.calculateFieldGoalDistance(clip.start?.side || '', clip.start?.yard || 0);
      if (distance > 0) {
        this.updateFieldGoalStats(stats, distance, true);
        totalFgYards += distance;
      }
    }

    // Field Goal(No Good)
    else if (PlayAnalysisHelper.hasSignificantPlay(significantPlays, SIGNIFICANT_PLAY.FIELDGOAL.NOGOOD) && 
             playType === PLAY_TYPE.FG) {
      const distance = PlayAnalysisHelper.calculateFieldGoalDistance(clip.start?.side || '', clip.start?.yard || 0);
      if (distance > 0) {
        this.updateFieldGoalStats(stats, distance, false);
        totalFgYards += distance;
      }
    }

    return totalFgYards;
  }

  // 기본 특수팀 플레이 분석 (레거시 PlayType 방식)
  private analyzeBasicKickingPlay(clip: any, stats: KickerStats): number {
    const playerNum = parseInt(clip.playerId || '0');
    const isThisPlayerKicker = (clip.car?.num === playerNum && clip.car?.pos === 'Kicker') ||
                               (clip.car2?.num === playerNum && clip.car2?.pos === 'Kicker');

    if (!isThisPlayerKicker) return 0;

    // SignificantPlays에서 이미 처리된 경우가 아니라면 레거시 방식 적용
    const hasSpecialPlay = clip.significantPlays?.some((play: string | null) => 
      play === 'FIELDGOAL' || play === 'FIELDGOALMISS' || play === 'EXTRAPOINT' || play === 'EXTRAPOINTMISS'
    );

    if (!hasSpecialPlay) {
      let totalFgYards = 0;

      // 레거시 PlayType 방식
      switch (clip.playType) {
        case 'PAT':
          stats.extraPointAttempted += 1;
          stats.extraPointMade += 1;
          break;
        case 'NoPAT':
          stats.extraPointAttempted += 1;
          break;
        case 'FieldGoal':
          const fgDistance = clip.remainYard ? this.calculateFieldGoalDistance(clip.remainYard) : 0;
          if (fgDistance > 0) {
            this.updateFieldGoalStats(stats, fgDistance, true);
            totalFgYards += fgDistance;
          }
          break;
        case 'NoFieldGoal':
          const fgMissDistance = clip.remainYard ? this.calculateFieldGoalDistance(clip.remainYard) : 0;
          if (fgMissDistance > 0) {
            this.updateFieldGoalStats(stats, fgMissDistance, false);
            totalFgYards += fgMissDistance;
          }
          break;
      }

      return totalFgYards;
    }

    return 0;
  }

  // 필드골 스탯 업데이트 헬퍼 메소드
  private updateFieldGoalStats(stats: KickerStats, distance: number, isSuccessful: boolean): void {
    stats.fieldGoalAttempted++;
    if (isSuccessful) {
      stats.fieldGoalMade++;
      
      // 최장 필드골 기록 업데이트
      if (distance > stats.longestFieldGoalMade) {
        stats.longestFieldGoalMade = distance;
      }
    }

    // 거리별 필드골 통계
    if (distance >= 1 && distance <= 19) {
      stats.fg1to19Attempted++;
      if (isSuccessful) stats.fg1to19Made++;
    } else if (distance >= 20 && distance <= 29) {
      stats.fg20to29Attempted++;
      if (isSuccessful) stats.fg20to29Made++;
    } else if (distance >= 30 && distance <= 39) {
      stats.fg30to39Attempted++;
      if (isSuccessful) stats.fg30to39Made++;
    } else if (distance >= 40 && distance <= 49) {
      stats.fg40to49Attempted++;
      if (isSuccessful) stats.fg40to49Made++;
    } else if (distance >= 50) {
      stats.fg50plusAttempted++;
      if (isSuccessful) stats.fg50plusMade++;
    }
  }

  // 샘플 클립 데이터로 테스트
  async generateSampleKickerStats(playerId: string = 'K001'): Promise<KickerStats> {
    const sampleClips: ClipData[] = [
      {
        ClipKey: 'SAMPLE_GAME_1',
        ClipUrl: 'https://example.com/clip1.mp4',
        Quarter: '1',
        OffensiveTeam: 'Away',
        PlayType: 'PAT',
        SpecialTeam: true,
        Down: 0,
        RemainYard: 2,
        StartYard: { side: 'opp', yard: 2 },
        EndYard: { side: 'opp', yard: 0 },
        Carrier: [{ 
          playercode: playerId, 
          backnumber: 5, 
          team: 'Away', 
          position: 'Kicker', 
          action: 'Kick' 
        }],
        SignificantPlays: [],
        StartScore: { Home: 0, Away: 6 }
      },
      {
        ClipKey: 'SAMPLE_GAME_1',
        ClipUrl: 'https://example.com/clip2.mp4',
        Quarter: '2',
        OffensiveTeam: 'Away',
        PlayType: 'FieldGoal',
        SpecialTeam: true,
        Down: 4,
        RemainYard: 25,
        StartYard: { side: 'opp', yard: 25 },
        EndYard: { side: 'opp', yard: 0 },
        Carrier: [{ 
          playercode: playerId, 
          backnumber: 5, 
          team: 'Away', 
          position: 'Kicker', 
          action: 'Kick' 
        }],
        SignificantPlays: [],
        StartScore: { Home: 0, Away: 7 }
      }
    ];

    const result = await this.analyzeKickerStats(sampleClips, playerId);
    return result;
  }
}