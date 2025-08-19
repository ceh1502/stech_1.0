import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { ClipData } from '../common/interfaces/clip-data.interface';

// Kicker 스탯 인터페이스 정의
interface KickerStats {
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
      
      if (!carrier) {
        continue; // 이 클립은 해당 Kicker 플레이가 아님
      }

      // 플레이 타입별 스탯 집계
      switch (clip.PlayType) {
        case 'PAT':
          this.analyzePATPlay(clip, kickerStats, true); // 성공한 PAT
          break;
        case 'NoPAT':
          this.analyzePATPlay(clip, kickerStats, false); // 실패한 PAT
          break;
        case 'FieldGoal':
          this.analyzeFieldGoalPlay(clip, kickerStats, true); // 성공한 필드골
          totalFieldGoalYards += this.calculateFieldGoalDistance(clip.RemainYard);
          break;
        case 'NoFieldGoal':
          this.analyzeFieldGoalPlay(clip, kickerStats, false); // 실패한 필드골
          totalFieldGoalYards += this.calculateFieldGoalDistance(clip.RemainYard);
          break;
      }
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