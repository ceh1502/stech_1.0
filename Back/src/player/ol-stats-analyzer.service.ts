import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { ClipData } from '../common/interfaces/clip-data.interface';
import { PLAY_TYPE, SIGNIFICANT_PLAY, PlayAnalysisHelper } from './constants/play-types.constants';

// Offensive Lineman 스탯 인터페이스 정의
export interface OLStats {
  games: number;
  offensiveSnapsPlayed: number;
  penalties: number;
  sacksAllowed: number;
}


@Injectable()
export class OLStatsAnalyzerService {
  constructor(
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
  ) {}

  // 클립 데이터에서 OL 스탯 추출
  async analyzeOLStats(clips: ClipData[], playerId: string): Promise<OLStats> {
    const olStats: OLStats = {
      games: 0,
      offensiveSnapsPlayed: 0,
      penalties: 0,
      sacksAllowed: 0
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
    if (!player || player.position !== 'OL') {
      throw new Error('해당 선수는 OL이 아니거나 존재하지 않습니다.');
    }

    for (const clip of clips) {
      // 게임 ID 추가 (경기 수 계산)
      gameIds.add(clip.ClipKey);

      // 이 클립에서 해당 OL이 참여했는지 확인 (car, car2에서 찾기)
      const isOLInPlay = this.isPlayerInOffense(clip, playerId);
      
      if (!isOLInPlay) {
        continue; // 이 클립은 해당 OL 플레이가 아님
      }

      // 새로운 특수 케이스 분석 로직
      this.analyzeSignificantPlaysNew(clip, olStats, playerId);

      // 기본 공격 플레이 분석
      this.analyzeBasicOffensivePlay(clip, olStats, playerId);
    }

    // 계산된 스탯 업데이트
    olStats.games = gameIds.size;

    return olStats;
  }

  // NewClipDto에서 해당 선수가 공격에 참여했는지 확인
  private isPlayerInOffense(clip: any, playerId: string): boolean {
    // car, car2에서 해당 선수 찾기
    const playerNum = parseInt(playerId);
    
    return (clip.car?.num === playerNum && clip.car?.pos === 'OL') ||
           (clip.car2?.num === playerNum && clip.car2?.pos === 'OL');
  }

  // 새로운 특수 케이스 분석 로직
  private analyzeSignificantPlaysNew(clip: any, stats: OLStats, playerId: string): void {
    if (!clip.significantPlays) return;

    const playerNum = parseInt(playerId);
    const isOL = (clip.car?.num === playerNum && clip.car?.pos === 'OL') ||
                 (clip.car2?.num === playerNum && clip.car2?.pos === 'OL');

    if (!isOL) return;

    const significantPlays = clip.significantPlays;
    const playType = clip.playType;

    // Sack - OL이 Sack Allowed 당한 경우
    if (PlayAnalysisHelper.hasSignificantPlay(significantPlays, SIGNIFICANT_PLAY.SACK)) {
      stats.sacksAllowed += 1;
      stats.offensiveSnapsPlayed += 1; // Sack도 스냅으로 카운트
    }

    // 일반 공격 플레이 - 스냅 카운트
    else if (playType === PLAY_TYPE.PASS || playType === PLAY_TYPE.RUN || 
             playType === PLAY_TYPE.NOPASS || playType === 'PassComplete' || playType === 'PassIncomplete') {
      stats.offensiveSnapsPlayed += 1;
    }

    // 패널티 상황
    if (PlayAnalysisHelper.hasSignificantPlay(significantPlays, SIGNIFICANT_PLAY.PENALTY.TEAM)) {
      // OL 관련 패널티인 경우 (Holding, False Start 등)
      stats.penalties += 1;
    }
  }

  // 기본 공격 플레이 분석
  private analyzeBasicOffensivePlay(clip: any, stats: OLStats, playerId: string): void {
    const playerNum = parseInt(playerId);
    const isOL = (clip.car?.num === playerNum && clip.car?.pos === 'OL') ||
                 (clip.car2?.num === playerNum && clip.car2?.pos === 'OL');

    if (!isOL) return;

    // SignificantPlays에서 이미 처리된 경우가 아니라면 기본 스탯 추가
    const hasSpecialPlay = clip.significantPlays?.some((play: string | null) => 
      play === SIGNIFICANT_PLAY.SACK || 
      play === SIGNIFICANT_PLAY.PENALTY.TEAM
    );

    if (!hasSpecialPlay) {
      // 일반적인 공격 플레이는 모두 스냅으로 카운트
      if (clip.playType === PLAY_TYPE.PASS || clip.playType === PLAY_TYPE.RUN || 
          clip.playType === PLAY_TYPE.NOPASS || clip.playType === 'PassComplete' || 
          clip.playType === 'PassIncomplete') {
        stats.offensiveSnapsPlayed += 1;
      }
    }
  }

  // 샘플 클립 데이터로 테스트
  async generateSampleOLStats(playerId: string = 'OL001'): Promise<OLStats> {
    const sampleClips: ClipData[] = [
      {
        ClipKey: 'SAMPLE_GAME_1',
        ClipUrl: 'https://example.com/clip1.mp4',
        Quarter: '1',
        OffensiveTeam: 'Away',
        PlayType: 'Pass',
        SpecialTeam: false,
        Down: 1,
        RemainYard: 10,
        StartYard: { side: 'own', yard: 25 },
        EndYard: { side: 'own', yard: 35 },
        Carrier: [{ 
          playercode: playerId, 
          backnumber: 75, 
          team: 'Away', 
          position: 'OL', 
          action: 'Block' 
        }],
        SignificantPlays: [],
        StartScore: { Home: 0, Away: 0 }
      },
      {
        ClipKey: 'SAMPLE_GAME_1',
        ClipUrl: 'https://example.com/clip2.mp4',
        Quarter: '1',
        OffensiveTeam: 'Away',
        PlayType: 'Run',
        SpecialTeam: false,
        Down: 2,
        RemainYard: 5,
        StartYard: { side: 'own', yard: 35 },
        EndYard: { side: 'own', yard: 42 },
        Carrier: [{ 
          playercode: playerId, 
          backnumber: 75, 
          team: 'Away', 
          position: 'OL', 
          action: 'Block' 
        }],
        SignificantPlays: [],
        StartScore: { Home: 0, Away: 0 }
      },
      {
        ClipKey: 'SAMPLE_GAME_1',
        ClipUrl: 'https://example.com/clip3.mp4',
        Quarter: '2',
        OffensiveTeam: 'Away',
        PlayType: 'Sack',
        SpecialTeam: false,
        Down: 3,
        RemainYard: 8,
        StartYard: { side: 'own', yard: 42 },
        EndYard: { side: 'own', yard: 37 },
        Carrier: [{ 
          playercode: playerId, 
          backnumber: 75, 
          team: 'Away', 
          position: 'OL', 
          action: 'Block' 
        }],
        SignificantPlays: [],
        StartScore: { Home: 0, Away: 0 }
      },
      {
        ClipKey: 'SAMPLE_GAME_1',
        ClipUrl: 'https://example.com/clip4.mp4',
        Quarter: '2',
        OffensiveTeam: 'Away',
        PlayType: 'None',
        SpecialTeam: false,
        Down: 1,
        RemainYard: 10,
        StartYard: { side: 'own', yard: 37 },
        EndYard: { side: 'own', yard: 37 },
        Carrier: [{ 
          playercode: playerId, 
          backnumber: 75, 
          team: 'Away', 
          position: 'OL', 
          action: 'Penalty' 
        }],
        SignificantPlays: [],
        StartScore: { Home: 0, Away: 0 }
      }
    ];

    const result = await this.analyzeOLStats(sampleClips, playerId);
    return result;
  }
}