import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { NewClipDto } from '../common/dto/new-clip.dto';

// WR 스탯 인터페이스 정의
export interface WrStats {
  gamesPlayed: number;
  receivingTargets: number;
  receptions: number;
  receivingYards: number;
  yardsPerReception: number;
  receivingTouchdowns: number;
  longestReception: number;
  receivingFirstDowns: number;
  fumbles: number;
  fumblesLost: number;
  rushingAttempts: number;
  rushingYards: number;
  yardsPerCarry: number;
  rushingTouchdowns: number;
  longestRush: number;
  kickReturns: number;
  kickReturnYards: number;
  yardsPerKickReturn: number;
  puntReturns: number;
  puntReturnYards: number;
  yardsPerPuntReturn: number;
  returnTouchdowns: number;
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
  async analyzeWrStats(clips: NewClipDto[], playerId: string): Promise<WrStats> {
    const wrStats: WrStats = {
      gamesPlayed: 0,
      receivingTargets: 0,
      receptions: 0,
      receivingYards: 0,
      yardsPerReception: 0,
      receivingTouchdowns: 0,
      longestReception: 0,
      receivingFirstDowns: 0,
      fumbles: 0,
      fumblesLost: 0,
      rushingAttempts: 0,
      rushingYards: 0,
      yardsPerCarry: 0,
      rushingTouchdowns: 0,
      longestRush: 0,
      kickReturns: 0,
      kickReturnYards: 0,
      yardsPerKickReturn: 0,
      puntReturns: 0,
      puntReturnYards: 0,
      yardsPerPuntReturn: 0,
      returnTouchdowns: 0
    };

    const gameIds = new Set(); // 경기 수 계산용

    // Player DB에서 해당 선수 정보 미리 조회 (jerseyNumber로 검색)
    const player = await this.playerModel.findOne({ 
      jerseyNumber: parseInt(playerId)
    });
    if (!player) {
      throw new Error(`등번호 ${playerId}번 선수를 찾을 수 없습니다.`);
    }

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const nextClip = clips[i + 1]; // 다음 클립 참조
      // 게임 ID 추가 (경기 수 계산)
      if (clip.clipKey) {
        gameIds.add(clip.clipKey);
      }

      // NewClipDto 구조 지원 - car, car2에서 찾기
      const isOffender = this.isPlayerInOffense(clip, playerId);
      
      if (!isOffender) {
        continue; // 이 클립은 해당 WR 플레이가 아님
      }

      // SignificantPlays 기반 스탯 분석
      this.analyzeSignificantPlaysNew(clip, wrStats, playerId, nextClip);

      // 기본 공격 플레이 분석
      this.analyzeBasicOffensivePlay(clip, wrStats, playerId, nextClip);
    }

    // 계산된 스탯 업데이트
    wrStats.gamesPlayed = (player.stats?.gamesPlayed || 0) + 1; // 기존 경기 수에 +1 추가
    wrStats.yardsPerReception = wrStats.receptions > 0
      ? Math.round((wrStats.receivingYards / wrStats.receptions) * 10) / 10
      : 0;
    wrStats.yardsPerCarry = wrStats.rushingAttempts > 0 
      ? Math.round((wrStats.rushingYards / wrStats.rushingAttempts) * 10) / 10
      : 0;
    wrStats.yardsPerKickReturn = wrStats.kickReturns > 0
      ? Math.round((wrStats.kickReturnYards / wrStats.kickReturns) * 10) / 10
      : 0;
    wrStats.yardsPerPuntReturn = wrStats.puntReturns > 0
      ? Math.round((wrStats.puntReturnYards / wrStats.puntReturns) * 10) / 10
      : 0;

    return wrStats;
  }

  // 리시빙 플레이 분석
  private analyzeReceivingPlay(clip: NewClipDto, stats: WrStats, yards: number, hasTouchdown: boolean, nextClip?: NewClipDto): void {
    stats.receivingTargets++; // 타겟된 횟수
    stats.receptions++; // 성공한 리셉션
    stats.receivingYards += yards;

    // 최장 리셉션 기록 업데이트
    if (yards > stats.longestReception) {
      stats.longestReception = yards;
    }

    // 리시빙 터치다운 체크
    if (hasTouchdown) {
      stats.receivingTouchdowns++;
    }

    // 퍼스트 다운 체크 (다음 클립의 다운이 1인 경우)
    if (nextClip && nextClip.down === '1') {
      stats.receivingFirstDowns++;
    }
  }

  // 러싱 플레이 분석 (WR이 러싱하는 경우)
  private analyzeRushingPlay(clip: NewClipDto, stats: WrStats, yards: number, hasTouchdown: boolean): void {
    stats.rushingAttempts++;
    stats.rushingYards += yards;

    // 최장 러싱 기록 업데이트
    if (yards > stats.longestRush) {
      stats.longestRush = yards;
    }

    // 러싱 터치다운 체크
    if (hasTouchdown) {
      stats.rushingTouchdowns++;
    }
  }

  // 킥 리턴 플레이 분석
  private analyzeKickReturnPlay(clip: NewClipDto, stats: WrStats, yards: number, hasTouchdown: boolean): void {
    stats.kickReturns++;
    stats.kickReturnYards += yards;

    // 리턴 터치다운 체크
    if (hasTouchdown) {
      stats.returnTouchdowns++;
    }
  }

  // 펀트 리턴 플레이 분석
  private analyzePuntReturnPlay(clip: NewClipDto, stats: WrStats, yards: number, hasTouchdown: boolean): void {
    stats.puntReturns++;
    stats.puntReturnYards += yards;

    // 리턴 터치다운 체크
    if (hasTouchdown) {
      stats.returnTouchdowns++;
    }
  }

  // NewClipDto에서 해당 선수가 공격에 참여했는지 확인
  private isPlayerInOffense(clip: any, playerId: string): boolean {
    // car, car2에서 해당 선수 찾기
    const playerNum = parseInt(playerId);
    
    return (clip.car?.num === playerNum && clip.car?.pos === 'WR') ||
           (clip.car2?.num === playerNum && clip.car2?.pos === 'WR');
  }

  // 새로운 SignificantPlays 기반 스탯 분석
  private analyzeSignificantPlaysNew(clip: any, stats: WrStats, playerId: string, nextClip?: any): void {
    if (!clip.significantPlays) return;

    const playerNum = parseInt(playerId);
    const isThisPlayerCarrier = (clip.car?.num === playerNum && clip.car?.pos === 'WR') ||
                                (clip.car2?.num === playerNum && clip.car2?.pos === 'WR');

    if (!isThisPlayerCarrier) return;

    clip.significantPlays.forEach((play: string | null) => {
      if (!play) return;

      switch (play) {
        case 'TOUCHDOWN':
          // 플레이 타입에 따라 리시빙 TD 또는 러싱 TD
          if (clip.playType === 'PASS' || clip.playType === 'PassComplete') {
            stats.receivingTouchdowns += 1;
            stats.receivingTargets += 1;
            stats.receptions += 1;
            if (clip.gainYard && clip.gainYard >= 0) {
              stats.receivingYards += clip.gainYard;
              if (clip.gainYard > stats.longestReception) {
                stats.longestReception = clip.gainYard;
              }
            }
            // 터치다운은 항상 퍼스트 다운으로 간주
            stats.receivingFirstDowns += 1;
          } else if (clip.playType === 'RUN') {
            stats.rushingTouchdowns += 1;
            stats.rushingAttempts += 1;
            if (clip.gainYard && clip.gainYard >= 0) {
              stats.rushingYards += clip.gainYard;
              if (clip.gainYard > stats.longestRush) {
                stats.longestRush = clip.gainYard;
              }
            }
          } else if (clip.playType === 'Kickoff' || clip.playType === 'Punt') {
            stats.returnTouchdowns += 1;
            if (clip.playType === 'Kickoff') {
              stats.kickReturns += 1;
              if (clip.gainYard && clip.gainYard >= 0) {
                stats.kickReturnYards += clip.gainYard;
              }
            } else {
              stats.puntReturns += 1;
              if (clip.gainYard && clip.gainYard >= 0) {
                stats.puntReturnYards += clip.gainYard;
              }
            }
          }
          break;

        case 'FUMBLE':
          // WR이 펌블한 경우
          stats.fumbles += 1;
          break;

        case 'FUMBLELOSOFF':
          // WR이 펌블 lost한 경우
          stats.fumbles += 1;
          stats.fumblesLost += 1;
          break;

        case 'FIRST_DOWN':
          // 퍼스트 다운은 이제 nextClip.down === '1' 체크로 대체
          break;
      }
    });
  }

  // 기본 공격 플레이 분석 (일반적인 Pass/Run 상황)
  private analyzeBasicOffensivePlay(clip: any, stats: WrStats, playerId: string, nextClip?: any): void {
    const playerNum = parseInt(playerId);
    const isThisPlayerCarrier = (clip.car?.num === playerNum && clip.car?.pos === 'WR') ||
                                (clip.car2?.num === playerNum && clip.car2?.pos === 'WR');

    if (!isThisPlayerCarrier) return;

    // SignificantPlays에서 이미 처리된 경우가 아니라면 기본 스탯 추가
    const hasSpecialPlay = clip.significantPlays?.some((play: string | null) => 
      play === 'TOUCHDOWN' || play === 'FUMBLE' || play === 'FUMBLELOSOFF'
    );

    if (!hasSpecialPlay) {
      // 일반적인 Pass 상황 (타겟 및 리셉션) - WR의 주요 플레이
      if (clip.playType === 'PASS' || clip.playType === 'PassComplete') {
        stats.receivingTargets += 1;
        
        // 완성된 패스인지 확인 (gainYard가 0보다 크면 완성)
        if (clip.gainYard && clip.gainYard > 0) {
          stats.receptions += 1;
          stats.receivingYards += clip.gainYard;
          if (clip.gainYard > stats.longestReception) {
            stats.longestReception = clip.gainYard;
          }
          // 퍼스트 다운 체크 (다음 클립의 다운이 1인 경우)
          if (nextClip && nextClip.down === '1') {
            stats.receivingFirstDowns += 1;
          }
        }
      }
      
      // 일반적인 Rush 상황 (WR 러싱 - 리버스 플래이 등)
      else if (clip.playType === 'RUN') {
        stats.rushingAttempts += 1;
        if (clip.gainYard && clip.gainYard >= 0) {
          stats.rushingYards += clip.gainYard;
          if (clip.gainYard > stats.longestRush) {
            stats.longestRush = clip.gainYard;
          }
        }
      }

      // 킥오프/펀트 리턴
      else if (clip.playType === 'Kickoff') {
        stats.kickReturns += 1;
        if (clip.gainYard && clip.gainYard >= 0) {
          stats.kickReturnYards += clip.gainYard;
        }
      } else if (clip.playType === 'Punt') {
        stats.puntReturns += 1;
        if (clip.gainYard && clip.gainYard >= 0) {
          stats.puntReturnYards += clip.gainYard;
        }
      }
    }
  }

  // 샘플 클립 데이터로 테스트
  async generateSampleWrStats(playerId: string = 'WR001'): Promise<WrStats> {
    const sampleClips: NewClipDto[] = [
      {
        clipKey: 'SAMPLE_GAME_1',
        offensiveTeam: 'Away',
        quarter: 1,
        down: '1',
        toGoYard: 10,
        playType: 'PASS',
        specialTeam: false,
        start: { side: 'OWN', yard: 30 },
        end: { side: 'OWN', yard: 45 },
        gainYard: 15,
        car: { num: parseInt(playerId), pos: 'WR' },
        car2: { num: null, pos: null },
        tkl: { num: null, pos: null },
        tkl2: { num: null, pos: null },
        significantPlays: ['TOUCHDOWN', null, null, null]
      },
      {
        clipKey: 'SAMPLE_GAME_1',
        offensiveTeam: 'Away',
        quarter: 2,
        down: '2',
        toGoYard: 5,
        playType: 'RUN',
        specialTeam: false,
        start: { side: 'OWN', yard: 45 },
        end: { side: 'OPP', yard: 40 },
        gainYard: 15,
        car: { num: parseInt(playerId), pos: 'WR' },
        car2: { num: null, pos: null },
        tkl: { num: null, pos: null },
        tkl2: { num: null, pos: null },
        significantPlays: [null, null, null, null]
      }
    ];

    const result = await this.analyzeWrStats(sampleClips, playerId);
    return result;
  }
}