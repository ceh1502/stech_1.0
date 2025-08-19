import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { ClipData } from '../common/interfaces/clip-data.interface';

// WR 스탯 인터페이스 정의
interface WrStats {
  games: number;
  target: number;
  reception: number;
  receivingYards: number;
  yardsPerCatch: number;
  receivingTouchdown: number;
  longestReception: number;
  receivingFirstDowns: number;
  fumbles: number;
  fumblesLost: number;
  rushingAttempted: number;
  rushingYards: number;
  yardsPerCarry: number;
  rushingTouchdown: number;
  longestRushing: number;
  kickReturn: number;
  kickReturnYards: number;
  yardsPerKickReturn: number;
  puntReturn: number;
  puntReturnYards: number;
  yardsPerPuntReturn: number;
  returnTouchdown: number;
}


@Injectable()
export class WrStatsAnalyzerService {
  constructor(
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
  ) {}
  
  // 필드 포지션 기반 야드 계산
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

  // 클립 데이터에서 WR 스탯 추출
  async analyzeWrStats(clips: ClipData[], playerId: string): Promise<WrStats> {
    const wrStats: WrStats = {
      games: 0,
      target: 0,
      reception: 0,
      receivingYards: 0,
      yardsPerCatch: 0,
      receivingTouchdown: 0,
      longestReception: 0,
      receivingFirstDowns: 0,
      fumbles: 0,
      fumblesLost: 0,
      rushingAttempted: 0,
      rushingYards: 0,
      yardsPerCarry: 0,
      rushingTouchdown: 0,
      longestRushing: 0,
      kickReturn: 0,
      kickReturnYards: 0,
      yardsPerKickReturn: 0,
      puntReturn: 0,
      puntReturnYards: 0,
      yardsPerPuntReturn: 0,
      returnTouchdown: 0
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
    if (!player || player.position !== 'WR') {
      throw new Error('해당 선수는 WR이 아니거나 존재하지 않습니다.');
    }

    for (const clip of clips) {
      // 게임 ID 추가 (경기 수 계산)
      gameIds.add(clip.ClipKey);

      // 이 클립에서 해당 WR이 Carrier에 있는지 확인
      const carrier = clip.Carrier?.find(c => 
        (c.playercode == playerId || c.playercode === parseInt(playerId)) &&
        c.position === 'WR'
      );
      
      if (!carrier) {
        continue; // 이 클립은 해당 WR 플레이가 아님
      }

      // 야드 계산
      const yards = this.calculateYards(
        clip.StartYard.yard,
        clip.StartYard.side,
        clip.EndYard.yard,
        clip.EndYard.side
      );

      // 터치다운 체크
      const hasTouchdown = clip.SignificantPlays?.some(play => 
        play.key === 'TOUCHDOWN'
      );

      // 펌블 체크
      const hasFumble = clip.SignificantPlays?.some(play => 
        play.key === 'FUMBLE'
      );

      // WR 액션별 스탯 집계
      if (carrier.action.toLowerCase() === 'fumble_lost') {
        wrStats.fumblesLost++;
      }

      // 플레이 타입별 스탯 집계
      switch (clip.PlayType) {
        case 'Pass':
          this.analyzeReceivingPlay(clip, wrStats, yards, hasTouchdown);
          break;
        case 'NoPass':
          // 타겟되었지만 캐치 실패
          wrStats.target++;
          break;
        case 'Run':
          // WR이 러싱하는 경우
          this.analyzeRushingPlay(clip, wrStats, yards, hasTouchdown);
          break;
        case 'Kickoff':
          this.analyzeKickReturnPlay(clip, wrStats, yards, hasTouchdown);
          break;
        case 'Punt':
          this.analyzePuntReturnPlay(clip, wrStats, yards, hasTouchdown);
          break;
      }

      // 펌블 카운트 (SignificantPlays에서)
      if (hasFumble) {
        wrStats.fumbles++;
      }
    }

    // 계산된 스탯 업데이트
    wrStats.games = gameIds.size;
    wrStats.yardsPerCatch = wrStats.reception > 0
      ? Math.round((wrStats.receivingYards / wrStats.reception) * 10) / 10
      : 0;
    wrStats.yardsPerCarry = wrStats.rushingAttempted > 0 
      ? Math.round((wrStats.rushingYards / wrStats.rushingAttempted) * 10) / 10
      : 0;
    wrStats.yardsPerKickReturn = wrStats.kickReturn > 0
      ? Math.round((wrStats.kickReturnYards / wrStats.kickReturn) * 10) / 10
      : 0;
    wrStats.yardsPerPuntReturn = wrStats.puntReturn > 0
      ? Math.round((wrStats.puntReturnYards / wrStats.puntReturn) * 10) / 10
      : 0;

    return wrStats;
  }

  // 리시빙 플레이 분석
  private analyzeReceivingPlay(clip: ClipData, stats: WrStats, yards: number, hasTouchdown: boolean): void {
    stats.target++; // 타겟된 횟수
    stats.reception++; // 성공한 리셉션
    stats.receivingYards += yards;

    // 최장 리셉션 기록 업데이트
    if (yards > stats.longestReception) {
      stats.longestReception = yards;
    }

    // 리시빙 터치다운 체크
    if (hasTouchdown) {
      stats.receivingTouchdown++;
    }

    // 퍼스트 다운 체크 (획득 야드가 필요 야드 이상이면)
    if (yards >= clip.RemainYard) {
      stats.receivingFirstDowns++;
    }
  }

  // 러싱 플레이 분석 (WR이 러싱하는 경우)
  private analyzeRushingPlay(clip: ClipData, stats: WrStats, yards: number, hasTouchdown: boolean): void {
    stats.rushingAttempted++;
    stats.rushingYards += yards;

    // 최장 러싱 기록 업데이트
    if (yards > stats.longestRushing) {
      stats.longestRushing = yards;
    }

    // 러싱 터치다운 체크
    if (hasTouchdown) {
      stats.rushingTouchdown++;
    }
  }

  // 킥 리턴 플레이 분석
  private analyzeKickReturnPlay(clip: ClipData, stats: WrStats, yards: number, hasTouchdown: boolean): void {
    stats.kickReturn++;
    stats.kickReturnYards += yards;

    // 리턴 터치다운 체크
    if (hasTouchdown) {
      stats.returnTouchdown++;
    }
  }

  // 펀트 리턴 플레이 분석
  private analyzePuntReturnPlay(clip: ClipData, stats: WrStats, yards: number, hasTouchdown: boolean): void {
    stats.puntReturn++;
    stats.puntReturnYards += yards;

    // 리턴 터치다운 체크
    if (hasTouchdown) {
      stats.returnTouchdown++;
    }
  }

  // 샘플 클립 데이터로 테스트
  async generateSampleWrStats(playerId: string = 'WR001'): Promise<WrStats> {
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
        StartYard: { side: 'own', yard: 30 },
        EndYard: { side: 'own', yard: 45 },
        Carrier: [{ 
          playercode: playerId, 
          backnumber: 88, 
          team: 'Away', 
          position: 'WR', 
          action: 'Catch' 
        }],
        SignificantPlays: [{ key: 'TOUCHDOWN', label: 'Touchdown' }],
        StartScore: { Home: 0, Away: 0 }
      },
      {
        ClipKey: 'SAMPLE_GAME_1',
        ClipUrl: 'https://example.com/clip2.mp4',
        Quarter: '2',
        OffensiveTeam: 'Away',
        PlayType: 'Run',
        SpecialTeam: false,
        Down: 2,
        RemainYard: 5,
        StartYard: { side: 'own', yard: 45 },
        EndYard: { side: 'opp', yard: 40 },
        Carrier: [{ 
          playercode: playerId, 
          backnumber: 88, 
          team: 'Away', 
          position: 'WR', 
          action: 'Rush' 
        }],
        SignificantPlays: [],
        StartScore: { Home: 0, Away: 7 }
      }
    ];

    const result = await this.analyzeWrStats(sampleClips, playerId);
    return result;
  }
}