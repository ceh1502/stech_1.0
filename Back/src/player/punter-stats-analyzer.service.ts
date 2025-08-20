import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { ClipData } from '../common/interfaces/clip-data.interface';
import { PLAY_TYPE, SIGNIFICANT_PLAY, PlayAnalysisHelper } from './constants/play-types.constants';

// Punter 스탯 인터페이스 정의
export interface PunterStats {
  games: number;
  punts: number;
  averagePuntYards: number;
  longestPunt: number;
  puntYards: number;
  touchbackPercentage: number;
  puntsInside20Percentage: number;
}


@Injectable()
export class PunterStatsAnalyzerService {
  constructor(
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
  ) {}
  
  // 필드 포지션 기반 야드 계산 + 10야드 추가 (펀트 거리)
  private calculatePuntYards(startYard: number, startSide: string, endYard: number, endSide: string): number {
    let baseYards = 0;
    
    // 시작과 끝이 같은 사이드인 경우
    if (startSide === endSide) {
      if (startSide === 'own') {
        baseYards = endYard - startYard; // own side에서는 야드가 클수록 전진
      } else {
        baseYards = startYard - endYard; // opp side에서는 야드가 작을수록 전진
      }
    } else {
      // 사이드를 넘나든 경우 (own -> opp 또는 opp -> own)
      if (startSide === 'own' && endSide === 'opp') {
        baseYards = (50 - startYard) + (50 - endYard); // own에서 50까지 + opp에서 50까지
      } else {
        baseYards = (50 - startYard) + (50 - endYard); // 반대의 경우도 동일한 계산
      }
    }
    
    // 펀트 거리는 기본 야드 + 10야드
    return baseYards + 10;
  }

  // 20야드 안쪽 판단 (상대편 20야드 라인 안쪽)
  private isPuntInside20(endYard: number, endSide: string): boolean {
    return endSide === 'opp' && endYard <= 20;
  }

  // 클립 데이터에서 Punter 스탯 추출
  async analyzePunterStats(clips: ClipData[], playerId: string): Promise<PunterStats> {
    const punterStats: PunterStats = {
      games: 0,
      punts: 0,
      averagePuntYards: 0,
      longestPunt: 0,
      puntYards: 0,
      touchbackPercentage: 0,
      puntsInside20Percentage: 0
    };

    const gameIds = new Set(); // 경기 수 계산용
    let touchbacks = 0; // 터치백 횟수
    let puntsInside20 = 0; // 20야드 안쪽 펀트 횟수

    // Player DB에서 해당 선수 정보 미리 조회 (playercode 또는 playerId로 검색)
    const player = await this.playerModel.findOne({ 
      $or: [
        { playerId: playerId },
        { playercode: playerId },
        { playercode: parseInt(playerId) }
      ]
    });
    if (!player || player.position !== 'Punter') {
      throw new Error('해당 선수는 Punter가 아니거나 존재하지 않습니다.');
    }

    for (const clip of clips) {
      // 게임 ID 추가 (경기 수 계산)
      gameIds.add(clip.ClipKey);

      // 이 클립에서 해당 Punter가 Carrier에 있는지 확인
      const carrier = clip.Carrier?.find(c => 
        (c.playercode == playerId || c.playercode === parseInt(playerId)) &&
        c.position === 'Punter'
      );
      
      if (!carrier) {
        continue; // 이 클립은 해당 Punter 플레이가 아님
      }

      // 펀트 플레이만 처리
      if (clip.PlayType === 'Punt') {
        this.analyzePuntPlay(clip, punterStats, touchbacks, puntsInside20);
      }
    }

    // 계산된 스탯 업데이트
    punterStats.games = gameIds.size;
    punterStats.averagePuntYards = punterStats.punts > 0
      ? Math.round((punterStats.puntYards / punterStats.punts) * 10) / 10
      : 0;
    punterStats.touchbackPercentage = punterStats.punts > 0
      ? Math.round((touchbacks / punterStats.punts) * 100 * 10) / 10
      : 0;
    punterStats.puntsInside20Percentage = punterStats.punts > 0
      ? Math.round((puntsInside20 / punterStats.punts) * 100 * 10) / 10
      : 0;

    return punterStats;
  }

  // 펀트 플레이 분석
  private analyzePuntPlay(clip: ClipData, stats: PunterStats, touchbacks: number, puntsInside20: number): void {
    stats.punts++;
    
    const puntYards = this.calculatePuntYards(
      clip.StartYard.yard,
      clip.StartYard.side,
      clip.EndYard.yard,
      clip.EndYard.side
    );
    
    stats.puntYards += puntYards;

    // 최장 펀트 기록 업데이트
    if (puntYards > stats.longestPunt) {
      stats.longestPunt = puntYards;
    }

    // 터치백 체크
    const hasTouchback = clip.SignificantPlays?.some(play => 
      play.key === 'TOUCHBACK'
    );
    if (hasTouchback) {
      touchbacks++;
    }

    // 20야드 안쪽 펀트 체크
    if (this.isPuntInside20(clip.EndYard.yard, clip.EndYard.side)) {
      puntsInside20++;
    }
  }

  // 샘플 클립 데이터로 테스트
  async generateSamplePunterStats(playerId: string = 'P001'): Promise<PunterStats> {
    const sampleClips: ClipData[] = [
      {
        ClipKey: 'SAMPLE_GAME_1',
        ClipUrl: 'https://example.com/clip1.mp4',
        Quarter: '1',
        OffensiveTeam: 'Away',
        PlayType: 'Punt',
        SpecialTeam: true,
        Down: 4,
        RemainYard: 8,
        StartYard: { side: 'own', yard: 30 },
        EndYard: { side: 'opp', yard: 15 },
        Carrier: [{ 
          playercode: playerId, 
          backnumber: 8, 
          team: 'Away', 
          position: 'Punter', 
          action: 'Punt' 
        }],
        SignificantPlays: [],
        StartScore: { Home: 0, Away: 0 }
      },
      {
        ClipKey: 'SAMPLE_GAME_1',
        ClipUrl: 'https://example.com/clip2.mp4',
        Quarter: '2',
        OffensiveTeam: 'Away',
        PlayType: 'Punt',
        SpecialTeam: true,
        Down: 4,
        RemainYard: 12,
        StartYard: { side: 'own', yard: 25 },
        EndYard: { side: 'opp', yard: 5 },
        Carrier: [{ 
          playercode: playerId, 
          backnumber: 8, 
          team: 'Away', 
          position: 'Punter', 
          action: 'Punt' 
        }],
        SignificantPlays: [],
        StartScore: { Home: 0, Away: 0 }
      }
    ];

    const result = await this.analyzePunterStats(sampleClips, playerId);
    return result;
  }
}