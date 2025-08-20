import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { ClipData } from '../common/interfaces/clip-data.interface';

// QB 스탯 인터페이스 정의
export interface QbStats {
  games: number;
  passAttempted: number;
  passCompletion: number;
  completionPercentage: number;
  passingYards: number;
  passingTouchdown: number;
  interception: number;
  longestPass: number;
  sack: number;
  rushingAttempted: number;
  rushingYards: number;
  yardsPerCarry: number;
  rushingTouchdown: number;
  longestRushing: number;
  fumbles: number; // 펌블 추가
}

@Injectable()
export class QbStatsAnalyzerService {
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

  // 클립 데이터에서 QB 스탯 추출
  async analyzeQbStats(clips: ClipData[], playerId: string): Promise<QbStats> {
    const qbStats: QbStats = {
      games: 0,
      passAttempted: 0,
      passCompletion: 0,
      completionPercentage: 0,
      passingYards: 0,
      passingTouchdown: 0,
      interception: 0,
      longestPass: 0,
      sack: 0,
      rushingAttempted: 0,
      rushingYards: 0,
      yardsPerCarry: 0,
      rushingTouchdown: 0,
      longestRushing: 0,
      fumbles: 0
    };

    const gameIds = new Set(); // 경기 수 계산용

    // Player DB에서 해당 선수 정보 미리 조회 (playercode 또는 playerId로 검색)
    const player = await this.playerModel.findOne({ 
      $or: [
        { playerId: playerId },
        { playercode: playerId },
        { playercode: parseInt(playerId) }  // 숫자형 playercode 지원
      ]
    });
    if (!player || player.position !== 'QB') {
      throw new Error('해당 선수는 QB가 아니거나 존재하지 않습니다.');
    }

    for (const clip of clips) {
      // 게임 ID 추가 (경기 수 계산)
      if (clip.ClipKey) {
        gameIds.add(clip.ClipKey);
      }

      // 이 클립에서 해당 QB가 car 또는 car2에 있는지 확인 (공격수)
      const isCarrier1 = clip.Carrier?.find(c => 
        (c.playercode == playerId || c.playercode === parseInt(playerId)) &&
        c.position === 'QB'
      );
      
      // NewClipDto 구조 지원 - car, car2에서 찾기
      const isOffender = this.isPlayerInOffense(clip, playerId);
      
      if (!isCarrier1 && !isOffender) {
        continue; // 이 클립은 해당 QB 플레이가 아님
      }

      // SignificantPlays 기반 스탯 분석
      this.analyzeSignificantPlaysNew(clip, qbStats, playerId);

      // 기본 공격 플레이 분석
      this.analyzeBasicOffensivePlay(clip, qbStats, playerId);
    }

    // 계산된 스탯 업데이트
    qbStats.games = gameIds.size;
    qbStats.completionPercentage = qbStats.passAttempted > 0 
      ? Math.round((qbStats.passCompletion / qbStats.passAttempted) * 100) 
      : 0;
    qbStats.yardsPerCarry = qbStats.rushingAttempted > 0
      ? Math.round((qbStats.rushingYards / qbStats.rushingAttempted) * 10) / 10
      : 0;

    return qbStats;
  }

  // NewClipDto에서 해당 선수가 공격에 참여했는지 확인
  private isPlayerInOffense(clip: any, playerId: string): boolean {
    // car, car2에서 해당 선수 찾기
    const playerNum = parseInt(playerId);
    
    return (clip.car?.num === playerNum && clip.car?.pos === 'QB') ||
           (clip.car2?.num === playerNum && clip.car2?.pos === 'QB');
  }

  // 새로운 SignificantPlays 기반 스탯 분석
  private analyzeSignificantPlaysNew(clip: any, stats: QbStats, playerId: string): void {
    if (!clip.significantPlays) return;

    const playerNum = parseInt(playerId);
    const isThisPlayerCarrier = (clip.car?.num === playerNum && clip.car?.pos === 'QB') ||
                                (clip.car2?.num === playerNum && clip.car2?.pos === 'QB');

    if (!isThisPlayerCarrier) return;

    clip.significantPlays.forEach((play: string | null) => {
      if (!play) return;

      switch (play) {
        case 'TOUCHDOWN':
          // 플레이 타입에 따라 패싱 TD 또는 러싱 TD
          if (clip.playType === 'Pass' || clip.playType === 'PASS') {
            stats.passingTouchdown += 1;
            stats.passAttempted += 1;
            stats.passCompletion += 1;
            if (clip.gainYard && clip.gainYard > 0) {
              stats.passingYards += clip.gainYard;
              if (clip.gainYard > stats.longestPass) {
                stats.longestPass = clip.gainYard;
              }
            }
          } else if (clip.playType === 'Run' || clip.playType === 'RUSH') {
            stats.rushingTouchdown += 1;
            stats.rushingAttempted += 1;
            if (clip.gainYard && clip.gainYard > 0) {
              stats.rushingYards += clip.gainYard;
              if (clip.gainYard > stats.longestRushing) {
                stats.longestRushing = clip.gainYard;
              }
            }
          }
          break;

        case 'SACK':
          // QB가 sack 당한 경우
          stats.sack += 1;
          break;

        case 'INTERCEPT':
          // QB가 인터셉션 당한 경우
          stats.interception += 1;
          stats.passAttempted += 1;
          break;

        case 'FUMBLE':
          // QB가 펌블한 경우
          stats.fumbles += 1;
          break;
      }
    });
  }

  // 기본 공격 플레이 분석 (일반적인 Pass/Run 상황)
  private analyzeBasicOffensivePlay(clip: any, stats: QbStats, playerId: string): void {
    const playerNum = parseInt(playerId);
    const isThisPlayerCarrier = (clip.car?.num === playerNum && clip.car?.pos === 'QB') ||
                                (clip.car2?.num === playerNum && clip.car2?.pos === 'QB');

    if (!isThisPlayerCarrier) return;

    // SignificantPlays에서 이미 처리된 경우가 아니라면 기본 스탯 추가
    const hasSpecialPlay = clip.significantPlays?.some((play: string | null) => 
      play === 'TOUCHDOWN' || play === 'SACK' || play === 'INTERCEPT' || play === 'FUMBLE'
    );

    if (!hasSpecialPlay) {
      // 일반적인 Pass 상황
      if (clip.playType === 'Pass' || clip.playType === 'PASS') {
        stats.passAttempted += 1;
        
        // 완성된 패스인지 확인 (gainYard가 0보다 크면 완성)
        if (clip.gainYard && clip.gainYard > 0) {
          stats.passCompletion += 1;
          stats.passingYards += clip.gainYard;
          if (clip.gainYard > stats.longestPass) {
            stats.longestPass = clip.gainYard;
          }
        }
      }
      
      // 일반적인 Run 상황 (QB 스크램블 등)
      else if (clip.playType === 'Run' || clip.playType === 'RUSH') {
        stats.rushingAttempted += 1;
        if (clip.gainYard && clip.gainYard >= 0) {
          stats.rushingYards += clip.gainYard;
          if (clip.gainYard > stats.longestRushing) {
            stats.longestRushing = clip.gainYard;
          }
        }
      }
    }
  }

  // 샘플 클립 데이터로 테스트 (실제 구조)
  async generateSampleQbStats(playerId: string = 'QB001'): Promise<QbStats> {
    const sampleClips = [
      {
        ClipKey: 'SAMPLE_QB_001',
        Gamekey: 'KMHY241110',
        PlayType: 'Pass',
        StartYard: { side: 'own', yard: 35 },
        EndYard: { side: 'opp', yard: 15 },
        Carrier: [{ playercode: 'QB001', position: 'QB', action: 'Pass' }],
        SignificantPlays: []
      },
      {
        ClipKey: 'SAMPLE_QB_002',
        Gamekey: 'KMHY241110',
        PlayType: 'Pass',
        StartYard: { side: 'opp', yard: 25 },
        EndYard: { side: 'opp', yard: 0 },
        Carrier: [{ playercode: 'QB001', position: 'QB', action: 'Pass' }],
        SignificantPlays: [{ key: 'TOUCHDOWN', label: 'Touchdown' }]
      },
      {
        ClipKey: 'SAMPLE_QB_003',
        Gamekey: 'KMHY241110',
        PlayType: 'NoPass',
        Carrier: [{ playercode: 'QB001', position: 'QB', action: 'Pass' }],
        SignificantPlays: []
      },
      {
        ClipKey: 'SAMPLE_QB_004',
        Gamekey: 'KMHY241110',
        PlayType: 'Pass',
        Carrier: [{ playercode: 'QB001', position: 'QB', action: 'Pass' }],
        SignificantPlays: [{ key: 'INTERCEPTION', label: 'Interception' }]
      },
      {
        ClipKey: 'SAMPLE_QB_005',
        Gamekey: 'KMHY241110',
        PlayType: 'Run',
        StartYard: { side: 'own', yard: 30 },
        EndYard: { side: 'own', yard: 38 },
        Carrier: [{ playercode: 'QB001', position: 'QB', action: 'Rush' }],
        SignificantPlays: []
      },
      {
        ClipKey: 'SAMPLE_QB_006',
        Gamekey: 'KMHY241117',
        PlayType: 'Pass',
        Carrier: [{ playercode: 'QB001', position: 'QB', action: 'Sack' }],
        SignificantPlays: []
      },
      {
        ClipKey: 'SAMPLE_QB_007',
        Gamekey: 'KMHY241117',
        PlayType: 'Run',
        StartYard: { side: 'opp', yard: 20 },
        EndYard: { side: 'opp', yard: 0 },
        Carrier: [{ playercode: 'QB001', position: 'QB', action: 'Rush' }],
        SignificantPlays: [{ key: 'TOUCHDOWN', label: 'Touchdown' }]
      }
    ];

    const result = await this.analyzeQbStats(sampleClips, playerId);
    return result;
  }
}