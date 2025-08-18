import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';

// QB 스탯 인터페이스 정의
interface QbStats {
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
}

// 클립 데이터 인터페이스 정의
interface ClipData {
  ClipKey?: string;
  Gamekey?: string;
  PlayType: string;
  StartYard?: {
    side: string;
    yard: number;
  };
  EndYard?: {
    side: string;
    yard: number;
  };
  Carrier?: Array<{
    playercode: string | number;
    position: string;
    action: string;
  }>;
  SignificantPlays?: Array<{
    key: string;
    label?: string;
  }>;
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
    const qbStats = {
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
      longestRushing: 0
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
      // 게임 ID 추가 (경기 수 계산) - ClipKey나 Gamekey 사용
      const gameId = clip.ClipKey || clip.Gamekey || 'unknown';
      gameIds.add(gameId);

      // 이 클립에서 해당 QB가 Carrier에 있는지 확인 (playercode로 매칭)
      const carrier = clip.Carrier?.find(c => 
        c.playercode == playerId || c.playercode === parseInt(playerId)
      );
      
      if (!carrier) {
        continue; // 이 클립은 해당 QB 플레이가 아님
      }

      // QB 액션별 스탯 집계
      if (carrier.action) {
        switch (carrier.action.toLowerCase()) {
          case 'sack':
            qbStats.sack++;
            break;
          case 'rush':
            this.analyzeRushingPlay(clip, qbStats);
            break;
        }
      }

      // 플레이 타입별 스탯 집계 (러싱은 이미 처리했으므로 제외)
      if (carrier.action?.toLowerCase() !== 'rush') {
        switch (clip.PlayType) {
          case 'Pass':
          case 'NoPass':
            this.analyzePassingPlay(clip, qbStats);
            break;
          // Kick은 QB 스탯에 포함 안함
        }
      }
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

  // 패싱 플레이 분석
  private analyzePassingPlay(clip: ClipData, stats: QbStats): void {
    // Pass, NoPass 둘 다 시도 횟수에 포함
    stats.passAttempted++;
    
    // Pass만 성공으로 카운트
    if (clip.PlayType === 'Pass') {
      stats.passCompletion++;
      
      // 필드 포지션 기반 야드 계산
      let yards = 0;
      if (clip.StartYard && clip.EndYard) {
        yards = this.calculateYards(
          clip.StartYard.yard, 
          clip.StartYard.side, 
          clip.EndYard.yard, 
          clip.EndYard.side
        );
      } else {
        // fallback - 계산 불가능한 경우
        yards = 0;
      }
      
      stats.passingYards += yards;
      
      // 최장 패스 기록 업데이트 (Pass일 때만)
      if (yards > stats.longestPass) {
        stats.longestPass = yards;
      }

      // 터치다운 체크 (Pass일 때만)
      const hasTouchdown = clip.SignificantPlays?.some(play => 
        play.key === 'TOUCHDOWN'
      );
      if (hasTouchdown) {
        stats.passingTouchdown++;
      }
    }

    // 인터셉션 체크 (Pass일 때만)
    if (clip.PlayType === 'Pass') {
      const hasInterception = clip.SignificantPlays?.some(play => 
        play.key === 'INTERCEPTION'
      );
      if (hasInterception) {
        stats.interception++;
      }
    }
  }

  // 러싱 플레이 분석 (QB가 직접 뛴 경우)
  private analyzeRushingPlay(clip: ClipData, stats: QbStats): void {
    stats.rushingAttempted++;
    
    // 필드 포지션 기반 야드 계산
    let yards = 0;
    if (clip.StartYard && clip.EndYard) {
      yards = this.calculateYards(
        clip.StartYard.yard, 
        clip.StartYard.side, 
        clip.EndYard.yard, 
        clip.EndYard.side
      );
    } else {
      // fallback - 계산 불가능한 경우
      yards = 0;
    }
    
    stats.rushingYards += yards;

    // 최장 러싱 기록 업데이트
    if (yards > stats.longestRushing) {
      stats.longestRushing = yards;
    }

    // 러싱 터치다운 체크 (이미 carrier.action이 rush일 때만 이 함수가 호출됨)
    const hasTouchdown = clip.SignificantPlays?.some(play => 
      play.key === 'TOUCHDOWN'
    );
    if (hasTouchdown) {
      stats.rushingTouchdown++;
    }
  }

  // 샘플 클립 데이터로 테스트 (실제 구조)
  async generateSampleQbStats(playerId: string = 'QB001'): Promise<QbStats> {
    const sampleClips = [
      {
        Gamekey: 'KMHY241110',
        PlayType: 'Pass',
        StartYard: { side: 'own', yard: 35 },
        EndYard: { side: 'opp', yard: 15 },
        Carrier: [{ playercode: 'QB001', position: 'QB', action: 'Pass' }],
        SignificantPlays: []
      },
      {
        Gamekey: 'KMHY241110',
        PlayType: 'Pass',
        StartYard: { side: 'opp', yard: 25 },
        EndYard: { side: 'opp', yard: 0 },
        Carrier: [{ playercode: 'QB001', position: 'QB', action: 'Pass' }],
        SignificantPlays: [{ key: 'TOUCHDOWN', label: 'Touchdown' }]
      },
      {
        Gamekey: 'KMHY241110',
        PlayType: 'NoPass',
        Carrier: [{ playercode: 'QB001', position: 'QB', action: 'Pass' }],
        SignificantPlays: []
      },
      {
        Gamekey: 'KMHY241110',
        PlayType: 'Pass',
        Carrier: [{ playercode: 'QB001', position: 'QB', action: 'Pass' }],
        SignificantPlays: [{ key: 'INTERCEPTION', label: 'Interception' }]
      },
      {
        Gamekey: 'KMHY241110',
        PlayType: 'Run',
        StartYard: { side: 'own', yard: 30 },
        EndYard: { side: 'own', yard: 38 },
        Carrier: [{ playercode: 'QB001', position: 'QB', action: 'Rush' }],
        SignificantPlays: []
      },
      {
        Gamekey: 'KMHY241117',
        PlayType: 'Pass',
        Carrier: [{ playercode: 'QB001', position: 'QB', action: 'Sack' }],
        SignificantPlays: []
      },
      {
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