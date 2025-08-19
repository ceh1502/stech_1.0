import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { ClipData } from '../common/interfaces/clip-data.interface';

// TE 스탯 인터페이스 정의 (리턴 스탯 없음)
interface TeStats {
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
}


@Injectable()
export class TeStatsAnalyzerService {
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

  // 클립 데이터에서 TE 스탯 추출
  async analyzeTeStats(clips: ClipData[], playerId: string): Promise<TeStats> {
    const teStats: TeStats = {
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
      longestRushing: 0
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
    if (!player || player.position !== 'TE') {
      throw new Error('해당 선수는 TE가 아니거나 존재하지 않습니다.');
    }

    for (const clip of clips) {
      // 게임 ID 추가 (경기 수 계산)
      gameIds.add(clip.ClipKey);

      // 이 클립에서 해당 TE가 Carrier에 있는지 확인
      const carrier = clip.Carrier?.find(c => 
        (c.playercode == playerId || c.playercode === parseInt(playerId)) &&
        c.position === 'TE'
      );
      
      if (!carrier) {
        continue; // 이 클립은 해당 TE 플레이가 아님
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

      // TE 액션별 스탯 집계
      if (carrier.action.toLowerCase() === 'fumble_lost') {
        teStats.fumblesLost++;
      }

      // 플레이 타입별 스탯 집계 (리턴 제외)
      switch (clip.PlayType) {
        case 'Pass':
          this.analyzeReceivingPlay(clip, teStats, yards, hasTouchdown);
          break;
        case 'NoPass':
          // 타겟되었지만 캐치 실패
          teStats.target++;
          break;
        case 'Run':
          // TE가 러싱하는 경우
          this.analyzeRushingPlay(clip, teStats, yards, hasTouchdown);
          break;
        // TE는 리턴을 하지 않으므로 Kickoff, Punt 케이스 없음
      }

      // 펌블 카운트 (SignificantPlays에서)
      if (hasFumble) {
        teStats.fumbles++;
      }
    }

    // 계산된 스탯 업데이트
    teStats.games = gameIds.size;
    teStats.yardsPerCatch = teStats.reception > 0
      ? Math.round((teStats.receivingYards / teStats.reception) * 10) / 10
      : 0;
    teStats.yardsPerCarry = teStats.rushingAttempted > 0 
      ? Math.round((teStats.rushingYards / teStats.rushingAttempted) * 10) / 10
      : 0;

    return teStats;
  }

  // 리시빙 플레이 분석
  private analyzeReceivingPlay(clip: ClipData, stats: TeStats, yards: number, hasTouchdown: boolean): void {
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

  // 러싱 플레이 분석 (TE가 러싱하는 경우)
  private analyzeRushingPlay(clip: ClipData, stats: TeStats, yards: number, hasTouchdown: boolean): void {
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

  // 샘플 클립 데이터로 테스트
  async generateSampleTeStats(playerId: string = 'TE001'): Promise<TeStats> {
    const sampleClips: ClipData[] = [
      {
        ClipKey: 'SAMPLE_GAME_1',
        ClipUrl: 'https://example.com/clip1.mp4',
        Quarter: '1',
        OffensiveTeam: 'Away',
        PlayType: 'Pass',
        SpecialTeam: false,
        Down: 1,
        RemainYard: 8,
        StartYard: { side: 'own', yard: 25 },
        EndYard: { side: 'own', yard: 35 },
        Carrier: [{ 
          playercode: playerId, 
          backnumber: 87, 
          team: 'Away', 
          position: 'TE', 
          action: 'Catch' 
        }],
        SignificantPlays: [],
        StartScore: { Home: 0, Away: 0 }
      },
      {
        ClipKey: 'SAMPLE_GAME_1',
        ClipUrl: 'https://example.com/clip2.mp4',
        Quarter: '2',
        OffensiveTeam: 'Away',
        PlayType: 'Run',
        SpecialTeam: false,
        Down: 3,
        RemainYard: 2,
        StartYard: { side: 'opp', yard: 3 },
        EndYard: { side: 'opp', yard: 0 },
        Carrier: [{ 
          playercode: playerId, 
          backnumber: 87, 
          team: 'Away', 
          position: 'TE', 
          action: 'Rush' 
        }],
        SignificantPlays: [{ key: 'TOUCHDOWN', label: 'Touchdown' }],
        StartScore: { Home: 0, Away: 7 }
      }
    ];

    const result = await this.analyzeTeStats(sampleClips, playerId);
    return result;
  }
}