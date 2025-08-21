import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { NewClipDto } from '../common/dto/new-clip.dto';

// RB 스탯 인터페이스 정의
export interface RbStats {
  games: number;
  rushingAttempted: number;
  rushingYards: number;
  yardsPerCarry: number;
  rushingTouchdown: number;
  longestRushing: number;
  target: number;
  reception: number;
  receivingYards: number;
  yardsPerCatch: number;
  receivingTouchdown: number;
  longestReception: number;
  receivingFirstDowns: number;
  fumbles: number;
  fumblesLost: number;
  kickReturn: number;
  kickReturnYards: number;
  yardsPerKickReturn: number;
  puntReturn: number;
  puntReturnYards: number;
  yardsPerPuntReturn: number;
  returnTouchdown: number;
}

@Injectable()
export class RbStatsAnalyzerService {
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

  // 클립 데이터에서 RB 스탯 추출
  async analyzeRbStats(clips: NewClipDto[], playerId: string): Promise<RbStats> {
    const rbStats: RbStats = {
      games: 0,
      rushingAttempted: 0,
      rushingYards: 0,
      yardsPerCarry: 0,
      rushingTouchdown: 0,
      longestRushing: 0,
      target: 0,
      reception: 0,
      receivingYards: 0,
      yardsPerCatch: 0,
      receivingTouchdown: 0,
      longestReception: 0,
      receivingFirstDowns: 0,
      fumbles: 0,
      fumblesLost: 0,
      kickReturn: 0,
      kickReturnYards: 0,
      yardsPerKickReturn: 0,
      puntReturn: 0,
      puntReturnYards: 0,
      yardsPerPuntReturn: 0,
      returnTouchdown: 0
    };

    const gameIds = new Set(); // 경기 수 계산용

    // Player DB에서 해당 선수 정보 미리 조회 (jerseyNumber로 검색)
    const player = await this.playerModel.findOne({ 
      jerseyNumber: parseInt(playerId)
    });
    if (!player) {
      throw new Error(`등번호 ${playerId}번 선수를 찾을 수 없습니다.`);
    }

    for (const clip of clips) {
      // 게임 ID 추가 (경기 수 계산)
      if (clip.clipKey) {
        gameIds.add(clip.clipKey);
      }

      // NewClipDto 구조 지원 - car, car2에서 찾기
      const isOffender = this.isPlayerInOffense(clip, playerId);
      
      if (!isOffender) {
        continue; // 이 클립은 해당 RB 플레이가 아님
      }

      // SignificantPlays 기반 스탯 분석
      this.analyzeSignificantPlaysNew(clip, rbStats, playerId);

      // 기본 공격 플레이 분석
      this.analyzeBasicOffensivePlay(clip, rbStats, playerId);
    }

    // 계산된 스탯 업데이트
    rbStats.games = gameIds.size;
    rbStats.yardsPerCarry = rbStats.rushingAttempted > 0 
      ? Math.round((rbStats.rushingYards / rbStats.rushingAttempted) * 10) / 10
      : 0;
    rbStats.yardsPerCatch = rbStats.reception > 0
      ? Math.round((rbStats.receivingYards / rbStats.reception) * 10) / 10
      : 0;
    rbStats.yardsPerKickReturn = rbStats.kickReturn > 0
      ? Math.round((rbStats.kickReturnYards / rbStats.kickReturn) * 10) / 10
      : 0;
    rbStats.yardsPerPuntReturn = rbStats.puntReturn > 0
      ? Math.round((rbStats.puntReturnYards / rbStats.puntReturn) * 10) / 10
      : 0;

    return rbStats;
  }

  // 러싱 플레이 분석
  private analyzeRushingPlay(clip: NewClipDto, stats: RbStats, yards: number, hasTouchdown: boolean): void {
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

  // 리시빙 플레이 분석
  private analyzeReceivingPlay(clip: NewClipDto, stats: RbStats, yards: number, hasTouchdown: boolean): void {
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
    if (yards >= (clip.toGoYard || 0)) {
      stats.receivingFirstDowns++;
    }
  }

  // 킥 리턴 플레이 분석
  private analyzeKickReturnPlay(clip: NewClipDto, stats: RbStats, yards: number, hasTouchdown: boolean): void {
    stats.kickReturn++;
    stats.kickReturnYards += yards;

    // 리턴 터치다운 체크
    if (hasTouchdown) {
      stats.returnTouchdown++;
    }
  }

  // 펀트 리턴 플레이 분석
  private analyzePuntReturnPlay(clip: NewClipDto, stats: RbStats, yards: number, hasTouchdown: boolean): void {
    stats.puntReturn++;
    stats.puntReturnYards += yards;

    // 리턴 터치다운 체크
    if (hasTouchdown) {
      stats.returnTouchdown++;
    }
  }

  // NewClipDto에서 해당 선수가 공격에 참여했는지 확인
  private isPlayerInOffense(clip: any, playerId: string): boolean {
    // car, car2에서 해당 선수 찾기
    const playerNum = parseInt(playerId);
    
    return (clip.car?.num === playerNum && clip.car?.pos === 'RB') ||
           (clip.car2?.num === playerNum && clip.car2?.pos === 'RB');
  }

  // 새로운 특수 케이스 분석 로직
  private analyzeSignificantPlaysNew(clip: any, stats: RbStats, playerId: string): void {
    if (!clip.significantPlays) return;

    const playerNum = parseInt(playerId);
    const isRB = (clip.car?.num === playerNum && clip.car?.pos === 'RB') ||
                 (clip.car2?.num === playerNum && clip.car2?.pos === 'RB');

    if (!isRB) return;

    const significantPlays = clip.significantPlays;
    const playType = clip.playType;
    const gainYard = clip.gainYard || 0;

    // Rushing Touchdown
    if (significantPlays.includes('TOUCHDOWN') && playType === 'RUN') {
      stats.rushingTouchdown += 1;
      stats.rushingAttempted += 1;
      stats.rushingYards += gainYard;
      if (gainYard > stats.longestRushing) {
        stats.longestRushing = gainYard;
      }
    }

    // Receiving Touchdown (Pass로 받은 경우)
    else if (significantPlays.includes('TOUCHDOWN') && 
             (playType === 'PASS' || playType === 'PassComplete')) {
      stats.receivingTouchdown += 1;
      stats.target += 1;
      stats.reception += 1;
      stats.receivingYards += gainYard;
      if (gainYard > stats.longestReception) {
        stats.longestReception = gainYard;
      }
    }

    // Kickoff Return Touchdown
    else if (significantPlays.includes('TOUCHDOWN') && playType === 'Kickoff') {
      stats.returnTouchdown += 1;
      stats.kickReturn += 1;
      stats.kickReturnYards += gainYard;
    }

    // Punt Return Touchdown
    else if (significantPlays.includes('TOUCHDOWN') && playType === 'Punt') {
      stats.returnTouchdown += 1;
      stats.puntReturn += 1;
      stats.puntReturnYards += gainYard;
    }

    // Fumble (Run)
    else if (significantPlays.includes('FUMBLE') && playType === 'RUN') {
      stats.fumbles += 1;
      stats.rushingAttempted += 1;
      
      if (significantPlays.includes('FUMBLERECOFF')) {
        // 오펜스 리커버리 시 - 스크리미지 라인 기준 야드 계산
        const startYard = clip.start?.yard || 0;
        const endYard = clip.end?.yard || 0;
        const actualGain = gainYard < 0 ? gainYard : Math.min(gainYard, endYard - startYard);
        stats.rushingYards += actualGain;
      } else if (significantPlays.includes('FUMBLERECDEF')) {
        // 디펜스 리커버리 시 
        stats.rushingYards += gainYard;
        stats.fumblesLost += 1;
      }
    }

    // Fumble (Pass)
    else if (significantPlays.includes('FUMBLE') && 
             (playType === 'PASS' || playType === 'PassComplete')) {
      stats.fumbles += 1;
      stats.target += 1;
      stats.reception += 1;
      stats.receivingYards += gainYard;
      
      if (significantPlays.includes('FUMBLERECDEF')) {
        stats.fumblesLost += 1;
      }
    }

    // TFL (Tackle for Loss)
    else if (significantPlays.includes('TFL') && playType === 'RUN') {
      stats.rushingAttempted += 1;
      stats.rushingYards += gainYard; // 음수 야드
    }

    // Pass Complete (일반)
    else if (playType === 'PASS' || playType === 'PassComplete') {
      stats.target += 1;
      if (gainYard > 0) {
        stats.reception += 1;
        stats.receivingYards += gainYard;
        if (gainYard > stats.longestReception) {
          stats.longestReception = gainYard;
        }
      }
    }

    // Pass Incomplete
    else if (playType === 'NOPASS' || playType === 'PassIncomplete') {
      stats.target += 1;
    }

    // Run (일반)
    else if (playType === 'RUN') {
      stats.rushingAttempted += 1;
      stats.rushingYards += gainYard;
      if (gainYard > stats.longestRushing) {
        stats.longestRushing = gainYard;
      }
    }

    // Kickoff Return (일반)
    else if (playType === 'Kickoff') {
      stats.kickReturn += 1;
      stats.kickReturnYards += gainYard;
    }

    // Punt Return (일반)
    else if (playType === 'Punt') {
      stats.puntReturn += 1;
      stats.puntReturnYards += gainYard;
    }
  }

  // 기본 공격 플레이 분석 (일반적인 Pass/Run 상황)
  private analyzeBasicOffensivePlay(clip: any, stats: RbStats, playerId: string): void {
    const playerNum = parseInt(playerId);
    const isThisPlayerCarrier = (clip.car?.num === playerNum && clip.car?.pos === 'RB') ||
                                (clip.car2?.num === playerNum && clip.car2?.pos === 'RB');

    if (!isThisPlayerCarrier) return;

    // SignificantPlays에서 이미 처리된 경우가 아니라면 기본 스탯 추가
    const hasSpecialPlay = clip.significantPlays?.some((play: string | null) => 
      play === 'TOUCHDOWN' || play === 'FUMBLE' || play === 'FUMBLELOSOFF'
    );

    if (!hasSpecialPlay) {
      // 일반적인 Rush 상황
      if (clip.playType === 'RUN') {
        stats.rushingAttempted += 1;
        if (clip.gainYard && clip.gainYard >= 0) {
          stats.rushingYards += clip.gainYard;
          if (clip.gainYard > stats.longestRushing) {
            stats.longestRushing = clip.gainYard;
          }
        }
      }
      
      // 일반적인 Pass 상황 (타겟 및 리셉션)
      else if (clip.playType === 'PASS' || clip.playType === 'PassComplete') {
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

      // 킥오프/펀트 리턴
      else if (clip.playType === 'Kickoff') {
        stats.kickReturn += 1;
        if (clip.gainYard && clip.gainYard >= 0) {
          stats.kickReturnYards += clip.gainYard;
        }
      } else if (clip.playType === 'Punt') {
        stats.puntReturn += 1;
        if (clip.gainYard && clip.gainYard >= 0) {
          stats.puntReturnYards += clip.gainYard;
        }
      }
    }
  }

  // 샘플 클립 데이터로 테스트
  async generateSampleRbStats(playerId: string = 'RB001'): Promise<RbStats> {
    const sampleClips: NewClipDto[] = [
      {
        clipKey: 'SAMPLE_GAME_1',
        offensiveTeam: 'Away',
        quarter: 1,
        down: '1',
        toGoYard: 10,
        playType: 'RUN',
        specialTeam: false,
        start: { side: 'OWN', yard: 30 },
        end: { side: 'OWN', yard: 38 },
        gainYard: 8,
        car: { num: parseInt(playerId), pos: 'RB' },
        car2: { num: null, pos: null },
        tkl: { num: null, pos: null },
        tkl2: { num: null, pos: null },
        significantPlays: [null, null, null, null]
      },
      {
        clipKey: 'SAMPLE_GAME_1',
        offensiveTeam: 'Away',
        quarter: 1,
        down: '2',
        toGoYard: 5,
        playType: 'PASS',
        specialTeam: false,
        start: { side: 'OWN', yard: 38 },
        end: { side: 'OPP', yard: 47 },
        gainYard: 25,
        car: { num: parseInt(playerId), pos: 'RB' },
        car2: { num: null, pos: null },
        tkl: { num: null, pos: null },
        tkl2: { num: null, pos: null },
        significantPlays: ['TOUCHDOWN', null, null, null]
      }
    ];

    const result = await this.analyzeRbStats(sampleClips, playerId);
    return result;
  }
}