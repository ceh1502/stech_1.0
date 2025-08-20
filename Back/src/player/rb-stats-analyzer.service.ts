import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { ClipData } from '../common/interfaces/clip-data.interface';
import { PLAY_TYPE, SIGNIFICANT_PLAY, PlayAnalysisHelper } from './constants/play-types.constants';

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
  async analyzeRbStats(clips: ClipData[], playerId: string): Promise<RbStats> {
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

    // Player DB에서 해당 선수 정보 미리 조회 (playercode 또는 playerId로 검색)
    const player = await this.playerModel.findOne({ 
      $or: [
        { playerId: playerId },
        { playercode: playerId },
        { playercode: parseInt(playerId) }
      ]
    });
    if (!player || player.position !== 'RB') {
      throw new Error('해당 선수는 RB가 아니거나 존재하지 않습니다.');
    }

    for (const clip of clips) {
      // 게임 ID 추가 (경기 수 계산)
      gameIds.add(clip.ClipKey);

      // 이 클립에서 해당 RB가 Carrier에 있는지 확인 (playercode로 매칭)
      const carrier = clip.Carrier?.find(c => 
        (c.playercode == playerId || c.playercode === parseInt(playerId)) &&
        c.team === clip.OffensiveTeam // 공격팀일 때만
      );
      
      // NewClipDto 구조 지원 - car, car2에서 찾기
      const isOffender = this.isPlayerInOffense(clip, playerId);
      
      if (!carrier && !isOffender) {
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
  private analyzeRushingPlay(clip: ClipData, stats: RbStats, yards: number, hasTouchdown: boolean): void {
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
  private analyzeReceivingPlay(clip: ClipData, stats: RbStats, yards: number, hasTouchdown: boolean): void {
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

  // 킥 리턴 플레이 분석
  private analyzeKickReturnPlay(clip: ClipData, stats: RbStats, yards: number, hasTouchdown: boolean): void {
    stats.kickReturn++;
    stats.kickReturnYards += yards;

    // 리턴 터치다운 체크
    if (hasTouchdown) {
      stats.returnTouchdown++;
    }
  }

  // 펀트 리턴 플레이 분석
  private analyzePuntReturnPlay(clip: ClipData, stats: RbStats, yards: number, hasTouchdown: boolean): void {
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
    if (PlayAnalysisHelper.hasSignificantPlay(significantPlays, SIGNIFICANT_PLAY.TOUCHDOWN) && 
        playType === PLAY_TYPE.RUN) {
      stats.rushingTouchdown += 1;
      stats.rushingAttempted += 1;
      stats.rushingYards += gainYard;
      if (gainYard > stats.longestRushing) {
        stats.longestRushing = gainYard;
      }
    }

    // Receiving Touchdown (Pass로 받은 경우)
    else if (PlayAnalysisHelper.hasSignificantPlay(significantPlays, SIGNIFICANT_PLAY.TOUCHDOWN) && 
             (playType === PLAY_TYPE.PASS || playType === 'PassComplete')) {
      stats.receivingTouchdown += 1;
      stats.target += 1;
      stats.reception += 1;
      stats.receivingYards += gainYard;
      if (gainYard > stats.longestReception) {
        stats.longestReception = gainYard;
      }
    }

    // Kickoff Return Touchdown
    else if (PlayAnalysisHelper.hasSignificantPlay(significantPlays, SIGNIFICANT_PLAY.TOUCHDOWN) && 
             playType === PLAY_TYPE.KICKOFF) {
      stats.returnTouchdown += 1;
      stats.kickReturn += 1;
      stats.kickReturnYards += gainYard;
    }

    // Punt Return Touchdown
    else if (PlayAnalysisHelper.hasSignificantPlay(significantPlays, SIGNIFICANT_PLAY.TOUCHDOWN) && 
             playType === PLAY_TYPE.PUNT) {
      stats.returnTouchdown += 1;
      stats.puntReturn += 1;
      stats.puntReturnYards += gainYard;
    }

    // Fumble (Run, Off Recovery, 스크리미지 라인 뒤에서)
    else if (PlayAnalysisHelper.hasSignificantPlay(significantPlays, SIGNIFICANT_PLAY.FUMBLE) && 
             playType === PLAY_TYPE.RUN) {
      stats.fumbles += 1;
      stats.rushingAttempted += 1;
      
      if (PlayAnalysisHelper.hasSignificantPlay(significantPlays, SIGNIFICANT_PLAY.FUMBLERECOFF)) {
        // 오펜스 리커버리 시 - 스크리미지 라인 기준 야드 계산
        const startYard = clip.start?.yard || 0;
        const endYard = clip.end?.yard || 0;
        const actualGain = gainYard < 0 ? gainYard : Math.min(gainYard, endYard - startYard);
        stats.rushingYards += actualGain;
      } else if (PlayAnalysisHelper.hasSignificantPlay(significantPlays, SIGNIFICANT_PLAY.FUMBLERECDEF)) {
        // 디펜스 리커버리 시 
        stats.rushingYards += gainYard;
        stats.fumblesLost += 1;
      }
    }

    // Fumble (Pass, Off Recovery)
    else if (PlayAnalysisHelper.hasSignificantPlay(significantPlays, SIGNIFICANT_PLAY.FUMBLE) && 
             (playType === PLAY_TYPE.PASS || playType === 'PassComplete')) {
      stats.fumbles += 1;
      stats.target += 1;
      stats.reception += 1;
      stats.receivingYards += gainYard;
      
      if (PlayAnalysisHelper.hasSignificantPlay(significantPlays, SIGNIFICANT_PLAY.FUMBLERECDEF)) {
        stats.fumblesLost += 1;
      }
    }

    // TFL (Tackle for Loss)
    else if (PlayAnalysisHelper.hasSignificantPlay(significantPlays, SIGNIFICANT_PLAY.TFL) && 
             playType === PLAY_TYPE.RUN) {
      stats.rushingAttempted += 1;
      stats.rushingYards += gainYard; // 음수 야드
    }

    // Pass Complete (일반)
    else if (playType === PLAY_TYPE.PASS || playType === 'PassComplete') {
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
    else if (playType === PLAY_TYPE.NOPASS || playType === 'PassIncomplete') {
      stats.target += 1;
    }

    // Run (일반)
    else if (playType === PLAY_TYPE.RUN) {
      stats.rushingAttempted += 1;
      stats.rushingYards += gainYard;
      if (gainYard > stats.longestRushing) {
        stats.longestRushing = gainYard;
      }
    }

    // Kickoff Return (일반)
    else if (playType === PLAY_TYPE.KICKOFF) {
      stats.kickReturn += 1;
      stats.kickReturnYards += gainYard;
    }

    // Punt Return (일반)
    else if (playType === PLAY_TYPE.PUNT) {
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
      if (clip.playType === 'Run' || clip.playType === 'RUSH') {
        stats.rushingAttempted += 1;
        if (clip.gainYard && clip.gainYard >= 0) {
          stats.rushingYards += clip.gainYard;
          if (clip.gainYard > stats.longestRushing) {
            stats.longestRushing = clip.gainYard;
          }
        }
      }
      
      // 일반적인 Pass 상황 (타겟 및 리셉션)
      else if (clip.playType === 'Pass' || clip.playType === 'PASS') {
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
    const sampleClips: ClipData[] = [
      {
        ClipKey: 'SAMPLE_GAME_1',
        ClipUrl: 'https://example.com/clip1.mp4',
        Quarter: '1',
        OffensiveTeam: 'Away',
        PlayType: 'Run',
        SpecialTeam: false,
        Down: 1,
        RemainYard: 10,
        StartYard: { side: 'own', yard: 30 },
        EndYard: { side: 'own', yard: 38 },
        Carrier: [{ 
          playercode: playerId, 
          backnumber: 21, 
          team: 'Away', 
          position: 'RB', 
          action: 'Rush' 
        }],
        SignificantPlays: [],
        StartScore: { Home: 0, Away: 0 }
      },
      {
        ClipKey: 'SAMPLE_GAME_1',
        ClipUrl: 'https://example.com/clip2.mp4',
        Quarter: '1',
        OffensiveTeam: 'Away',
        PlayType: 'Pass',
        SpecialTeam: false,
        Down: 2,
        RemainYard: 5,
        StartYard: { side: 'own', yard: 38 },
        EndYard: { side: 'opp', yard: 47 },
        Carrier: [{ 
          playercode: playerId, 
          backnumber: 21, 
          team: 'Away', 
          position: 'RB', 
          action: 'Catch' 
        }],
        SignificantPlays: [{ key: 'TOUCHDOWN', label: 'Touchdown' }],
        StartScore: { Home: 0, Away: 0 }
      }
    ];

    const result = await this.analyzeRbStats(sampleClips, playerId);
    return result;
  }
}