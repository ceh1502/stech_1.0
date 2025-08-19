import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { ClipData } from '../common/interfaces/clip-data.interface';

// Linebacker 스탯 인터페이스 정의 (DL과 동일)
export interface LBStats {
  games: number;
  tackles: number;
  sacks: number;
  forcedFumbles: number;
  fumbleRecovery: number;
  fumbleRecoveredYards: number;
  passDefended: number;
  interception: number;
  interceptionYards: number;
  touchdown: number;
}


@Injectable()
export class LBStatsAnalyzerService {
  constructor(
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
  ) {}
  
  // 필드 포지션 기반 야드 계산 (디펜스 리턴용)
  private calculateYards(startYard: number, startSide: string, endYard: number, endSide: string): number {
    // 시작과 끝이 같은 사이드인 경우
    if (startSide === endSide) {
      if (startSide === 'own') {
        return endYard - startYard; // own side에서는 야드가 클수록 전진
      } else {
        return startYard - endYard; // opp side에서는 야드가 작을수록 전진
      }
    }
    
    // 사이드를 넘나든 경우 (own -> opp 또는 opp -> own)
    if (startSide === 'own' && endSide === 'opp') {
      return (50 - startYard) + (50 - endYard); // own에서 50까지 + opp에서 50까지
    } else {
      return (50 - startYard) + (50 - endYard); // 반대의 경우도 동일한 계산
    }
  }

  // 클립 데이터에서 LB 스탯 추출
  async analyzeLBStats(clips: ClipData[], playerId: string): Promise<LBStats> {
    const lbStats: LBStats = {
      games: 0,
      tackles: 0,
      sacks: 0,
      forcedFumbles: 0,
      fumbleRecovery: 0,
      fumbleRecoveredYards: 0,
      passDefended: 0,
      interception: 0,
      interceptionYards: 0,
      touchdown: 0
    };

    const gameIds = new Set(); // 경기 수 계산용

    // Player DB에서 해당 선수 정보 미리 조회 (playercode 또는 playerId로 검색)
    const player = await this.playerModel.findOne({ 
      $or: [
        { playerId: playerId },
        { playercode: playerId },
        { playercode: parseInt(playerId) }
      ]
    });
    if (!player || player.position !== 'LB') {
      throw new Error('해당 선수는 LB가 아니거나 존재하지 않습니다.');
    }

    for (const clip of clips) {
      // 게임 ID 추가 (경기 수 계산)
      gameIds.add(clip.ClipKey);

      // 이 클립에서 해당 LB가 Carrier에 있는지 확인
      const carrier = clip.Carrier?.find(c => 
        (c.playercode == playerId || c.playercode === parseInt(playerId)) &&
        c.position === 'LB'
      );
      
      if (!carrier) {
        continue; // 이 클립은 해당 LB 플레이가 아님
      }

      // 액션별 스탯 집계
      this.analyzeDefensiveAction(clip, carrier, lbStats);

      // SignificantPlays 확인
      this.analyzeSignificantPlays(clip, lbStats);

      // 색 확인 (PlayType이 'Sack'이고 해당 LB가 Carrier에 있는 경우)
      if (clip.PlayType === 'Sack') {
        lbStats.sacks++;
      }

      // 수비 터치다운 확인 (LB가 Carrier이고 터치다운인 경우)
      const hasTouchdown = clip.SignificantPlays?.some(play => 
        play.key === 'TOUCHDOWN'
      );
      if (hasTouchdown) {
        lbStats.touchdown++;
      }
    }

    // 계산된 스탯 업데이트
    lbStats.games = gameIds.size;

    return lbStats;
  }

  // 수비 액션 분석
  private analyzeDefensiveAction(clip: ClipData, carrier: any, stats: LBStats): void {
    switch (carrier.action.toLowerCase()) {
      case 'tackle':
        stats.tackles++;
        break;
      case 'fumble_recovery':
        stats.fumbleRecovery++;
        // 펌블 리커버리 야드 계산
        const recoveryYards = this.calculateYards(
          clip.StartYard.yard,
          clip.StartYard.side,
          clip.EndYard.yard,
          clip.EndYard.side
        );
        stats.fumbleRecoveredYards += recoveryYards;
        break;
      case 'pass_defended':
        stats.passDefended++;
        break;
      case 'interception':
        stats.interception++;
        // 인터셉션 리턴 야드 계산
        const interceptionYards = this.calculateYards(
          clip.StartYard.yard,
          clip.StartYard.side,
          clip.EndYard.yard,
          clip.EndYard.side
        );
        stats.interceptionYards += interceptionYards;
        break;
    }
  }

  // SignificantPlays 분석
  private analyzeSignificantPlays(clip: ClipData, stats: LBStats): void {
    clip.SignificantPlays?.forEach(play => {
      switch (play.key) {
        case 'FORCED_FUMBLE':
          stats.forcedFumbles++;
          break;
        case 'INTERCEPTION':
          // 액션에서 이미 처리되지 않은 경우를 위해
          if (!clip.Carrier?.some(c => c.action.toLowerCase() === 'interception')) {
            stats.interception++;
          }
          break;
      }
    });
  }

  // 샘플 클립 데이터로 테스트
  async generateSampleLBStats(playerId: string = 'LB001'): Promise<LBStats> {
    const sampleClips: ClipData[] = [
      {
        ClipKey: 'SAMPLE_GAME_1',
        ClipUrl: 'https://example.com/clip1.mp4',
        Quarter: '1',
        OffensiveTeam: 'Home',
        PlayType: 'Run',
        SpecialTeam: false,
        Down: 1,
        RemainYard: 10,
        StartYard: { side: 'own', yard: 25 },
        EndYard: { side: 'own', yard: 27 },
        Carrier: [{ 
          playercode: playerId, 
          backnumber: 54, 
          team: 'Away', 
          position: 'LB', 
          action: 'tackle' 
        }],
        SignificantPlays: [],
        StartScore: { Home: 0, Away: 0 }
      },
      {
        ClipKey: 'SAMPLE_GAME_1',
        ClipUrl: 'https://example.com/clip2.mp4',
        Quarter: '2',
        OffensiveTeam: 'Home',
        PlayType: 'Pass',
        SpecialTeam: false,
        Down: 2,
        RemainYard: 8,
        StartYard: { side: 'own', yard: 27 },
        EndYard: { side: 'opp', yard: 35 },
        Carrier: [{ 
          playercode: playerId, 
          backnumber: 54, 
          team: 'Away', 
          position: 'LB', 
          action: 'interception' 
        }],
        SignificantPlays: [{ key: 'INTERCEPTION', label: 'Interception' }],
        StartScore: { Home: 0, Away: 0 }
      },
      {
        ClipKey: 'SAMPLE_GAME_1',
        ClipUrl: 'https://example.com/clip3.mp4',
        Quarter: '3',
        OffensiveTeam: 'Home',
        PlayType: 'Sack',
        SpecialTeam: false,
        Down: 3,
        RemainYard: 8,
        StartYard: { side: 'own', yard: 27 },
        EndYard: { side: 'own', yard: 22 },
        Carrier: [{ 
          playercode: playerId, 
          backnumber: 54, 
          team: 'Away', 
          position: 'LB', 
          action: 'sack' 
        }],
        SignificantPlays: [],
        StartScore: { Home: 0, Away: 7 }
      }
    ];

    const result = await this.analyzeLBStats(sampleClips, playerId);
    return result;
  }
}