import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { ClipData } from '../common/interfaces/clip-data.interface';

// TE 스탯 인터페이스 정의 (리턴 스탯 없음)
export interface TeStats {
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
      
      // NewClipDto 구조 지원 - car, car2에서 찾기
      const isOffender = this.isPlayerInOffense(clip, playerId);
      
      if (!carrier && !isOffender) {
        continue; // 이 클립은 해당 TE 플레이가 아님
      }

      // SignificantPlays 기반 스탯 분석
      this.analyzeSignificantPlaysNew(clip, teStats, playerId);

      // 기본 공격 플레이 분석
      this.analyzeBasicOffensivePlay(clip, teStats, playerId);
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

  // NewClipDto에서 해당 선수가 공격에 참여했는지 확인
  private isPlayerInOffense(clip: any, playerId: string): boolean {
    // car, car2에서 해당 선수 찾기
    const playerNum = parseInt(playerId);
    
    return (clip.car?.num === playerNum && clip.car?.pos === 'TE') ||
           (clip.car2?.num === playerNum && clip.car2?.pos === 'TE');
  }

  // 새로운 SignificantPlays 기반 스탯 분석
  private analyzeSignificantPlaysNew(clip: any, stats: TeStats, playerId: string): void {
    if (!clip.significantPlays) return;

    const playerNum = parseInt(playerId);
    const isThisPlayerCarrier = (clip.car?.num === playerNum && clip.car?.pos === 'TE') ||
                                (clip.car2?.num === playerNum && clip.car2?.pos === 'TE');

    if (!isThisPlayerCarrier) return;

    clip.significantPlays.forEach((play: string | null) => {
      if (!play) return;

      switch (play) {
        case 'TOUCHDOWN':
          // 플레이 타입에 따라 리시빙 TD 또는 러싱 TD
          if (clip.playType === 'Pass' || clip.playType === 'PASS') {
            stats.receivingTouchdown += 1;
            stats.target += 1;
            stats.reception += 1;
            if (clip.gainYard && clip.gainYard >= 0) {
              stats.receivingYards += clip.gainYard;
              if (clip.gainYard > stats.longestReception) {
                stats.longestReception = clip.gainYard;
              }
            }
          } else if (clip.playType === 'Run' || clip.playType === 'RUSH') {
            stats.rushingTouchdown += 1;
            stats.rushingAttempted += 1;
            if (clip.gainYard && clip.gainYard >= 0) {
              stats.rushingYards += clip.gainYard;
              if (clip.gainYard > stats.longestRushing) {
                stats.longestRushing = clip.gainYard;
              }
            }
          }
          break;

        case 'FUMBLE':
          // TE가 펌블한 경우
          stats.fumbles += 1;
          break;

        case 'FUMBLELOSOFF':
          // TE가 펌블 lost한 경우
          stats.fumbles += 1;
          stats.fumblesLost += 1;
          break;

        case 'FIRST_DOWN':
          // 퍼스트 다운 획득 (리시빙에만 적용)
          if (clip.playType === 'Pass' || clip.playType === 'PASS') {
            stats.receivingFirstDowns += 1;
          }
          break;
      }
    });
  }

  // 기본 공격 플레이 분석 (일반적인 Pass/Run 상황)
  private analyzeBasicOffensivePlay(clip: any, stats: TeStats, playerId: string): void {
    const playerNum = parseInt(playerId);
    const isThisPlayerCarrier = (clip.car?.num === playerNum && clip.car?.pos === 'TE') ||
                                (clip.car2?.num === playerNum && clip.car2?.pos === 'TE');

    if (!isThisPlayerCarrier) return;

    // SignificantPlays에서 이미 처리된 경우가 아니라면 기본 스탯 추가
    const hasSpecialPlay = clip.significantPlays?.some((play: string | null) => 
      play === 'TOUCHDOWN' || play === 'FUMBLE' || play === 'FUMBLELOSOFF'
    );

    if (!hasSpecialPlay) {
      // 일반적인 Pass 상황 (타겟 및 리셉션) - TE의 주요 플레이
      if (clip.playType === 'Pass' || clip.playType === 'PASS') {
        stats.target += 1;
        
        // 완성된 패스인지 확인 (gainYard가 0보다 크면 완성)
        if (clip.gainYard && clip.gainYard > 0) {
          stats.reception += 1;
          stats.receivingYards += clip.gainYard;
          if (clip.gainYard > stats.longestReception) {
            stats.longestReception = clip.gainYard;
          }
        }
      }
      
      // 일반적인 Rush 상황 (TE 러싱 - 트릭 플레이 등)
      else if (clip.playType === 'Run' || clip.playType === 'RUSH') {
        stats.rushingAttempted += 1;
        if (clip.gainYard && clip.gainYard >= 0) {
          stats.rushingYards += clip.gainYard;
          if (clip.gainYard > stats.longestRushing) {
            stats.longestRushing = clip.gainYard;
          }
        }
      }
      // TE는 일반적으로 킥오프/펀트 리턴을 하지 않으므로 해당 케이스 없음
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