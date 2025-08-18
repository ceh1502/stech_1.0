import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';

// Offensive Lineman 스탯 인터페이스 정의
interface OLStats {
  games: number;
  offensiveSnapsPlayed: number;
  penalties: number;
  sacksAllowed: number;
}

// 클립 데이터 인터페이스 정의
interface ClipData {
  ClipKey: string;
  ClipUrl: string;
  Quarter: string;
  OffensiveTeam: string;
  PlayType: string;
  SpecialTeam: boolean;
  Down: number;
  RemainYard: number;
  StartYard: {
    side: string;
    yard: number;
  };
  EndYard: {
    side: string;
    yard: number;
  };
  Carrier: Array<{
    playercode: string | number;
    backnumber: number;
    team: string;
    position: string;
    action: string;
  }>;
  SignificantPlays: Array<{
    key: string;
    label?: string;
  }>;
  StartScore: {
    Home: number;
    Away: number;
  };
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

      // 이 클립에서 해당 OL이 Carrier에 있는지 확인
      const carrier = clip.Carrier?.find(c => 
        (c.playercode == playerId || c.playercode === parseInt(playerId)) &&
        c.position === 'OL'
      );
      
      if (!carrier) {
        continue; // 이 클립은 해당 OL 플레이가 아님
      }

      // 플레이 타입별 스탯 집계
      switch (clip.PlayType) {
        case 'Pass':
        case 'Run':
          // 공격 스냅 카운트
          olStats.offensiveSnapsPlayed++;
          break;
        case 'None':
          // 반칙인 경우
          olStats.penalties++;
          break;
        case 'Sack':
          // 색 허용
          olStats.sacksAllowed++;
          olStats.offensiveSnapsPlayed++; // 색도 스냅으로 카운트
          break;
        default:
          // 기타 공격 플레이들도 스냅으로 카운트
          if (!clip.SpecialTeam) {
            olStats.offensiveSnapsPlayed++;
          }
          break;
      }
    }

    // 계산된 스탯 업데이트
    olStats.games = gameIds.size;

    return olStats;
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