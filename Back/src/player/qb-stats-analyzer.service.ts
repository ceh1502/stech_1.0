import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { NewClipDto } from '../common/dto/new-clip.dto';

// QB 스탯 인터페이스 정의
export interface QbStats {
  gamesPlayed: number;
  passingAttempts: number;
  passingCompletions: number;
  completionPercentage: number;
  passingYards: number;
  passingTouchdowns: number;
  passingInterceptions: number;
  longestPass: number;
  sacks: number;
  rushingAttempts: number;
  rushingYards: number;
  yardsPerCarry: number;
  rushingTouchdowns: number;
  longestRush: number;
  fumbles: number; // 펌블 추가
}

@Injectable()
export class QbStatsAnalyzerService {
  constructor(
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
  ) {}
  
  // 필드 포지션 기반 야드 계산
  private calculateYards(startYard: number, startSide: string, endYard: number, endSide: string): number {
    // 대소문자 통일 (OWN/OPP)
    const normalizedStartSide = startSide.toUpperCase();
    const normalizedEndSide = endSide.toUpperCase();
    
    // 시작과 끝이 같은 사이드인 경우
    if (normalizedStartSide === normalizedEndSide) {
      if (normalizedStartSide === 'OWN') {
        return endYard - startYard; // own side에서는 야드가 클수록 전진
      } else {
        return startYard - endYard; // opp side에서는 야드가 작을수록 전진
      }
    }
    
    // 사이드를 넘나든 경우 (OWN -> OPP 또는 OPP -> OWN)
    if (normalizedStartSide === 'OWN' && normalizedEndSide === 'OPP') {
      return (50 - startYard) + (50 - endYard); // own에서 50까지 + opp에서 50까지
    } else {
      return (50 - startYard) + (50 - endYard); // 반대의 경우도 동일한 계산
    }
  }

  // 클립 데이터에서 QB 스탯 추출
  async analyzeQbStats(clips: NewClipDto[], playerId: string): Promise<QbStats> {
    console.log(`🏈 QB 스탯 분석 시작 - 선수 ID: ${playerId}, 클립 수: ${clips.length}`);
    
    const qbStats: QbStats = {
      gamesPlayed: 0,
      passingAttempts: 0,
      passingCompletions: 0,
      completionPercentage: 0,
      passingYards: 0,
      passingTouchdowns: 0,
      passingInterceptions: 0,
      longestPass: 0,
      sacks: 0,
      rushingAttempts: 0,
      rushingYards: 0,
      yardsPerCarry: 0,
      rushingTouchdowns: 0,
      longestRush: 0,
      fumbles: 0
    };

    // Player DB에서 해당 선수 정보 미리 조회 (jerseyNumber로 검색)
    const player = await this.playerModel.findOne({ 
      jerseyNumber: parseInt(playerId)
    });
    if (!player) {
      throw new Error(`등번호 ${playerId}번 선수를 찾을 수 없습니다.`);
    }

    for (const clip of clips) {
      console.log(`📎 클립 분석 중 - PlayType: ${(clip as any).PlayType}, playType: ${(clip as any).playType}, car: ${JSON.stringify((clip as any).car)}, car2: ${JSON.stringify((clip as any).car2)}`);

      // 이 클립에서 해당 QB가 car 또는 car2에 있는지 확인 (공격수) - 레거시 제거
      
      // NewClipDto 구조 지원 - car, car2에서 찾기
      const isOffender = this.isPlayerInOffense(clip, playerId);
      
      console.log(`🔍 선수 ${playerId} 찾기 결과 - isOffender: ${isOffender}`);
      
      if (!isOffender) {
        console.log(`⏭️ 이 클립은 선수 ${playerId}의 플레이가 아님 - 스킵`);
        continue; // 이 클립은 해당 QB 플레이가 아님
      }

      // SignificantPlays 기반 스탯 분석
      this.analyzeSignificantPlaysNew(clip, qbStats, playerId);

      // 기본 공격 플레이 분석
      this.analyzeBasicOffensivePlay(clip, qbStats, playerId);
    }

    // 계산된 스탯 업데이트
    qbStats.gamesPlayed = (player.stats?.gamesPlayed || 0) + 1; // 기존 경기 수에 +1 추가
    qbStats.completionPercentage = qbStats.passingAttempts > 0 
      ? Math.round((qbStats.passingCompletions / qbStats.passingAttempts) * 100) 
      : 0;
    qbStats.yardsPerCarry = qbStats.rushingAttempts > 0
      ? Math.round((qbStats.rushingYards / qbStats.rushingAttempts) * 10) / 10
      : 0;

    return qbStats;
  }

  // NewClipDto에서 해당 선수가 공격에 참여했는지 확인
  private isPlayerInOffense(clip: any, playerId: string): boolean {
    // car, car2에서 해당 선수 찾기
    const playerNum = parseInt(playerId);
    
    console.log(`🔍 선수 검색 - playerNum: ${playerNum}, clip.car: ${JSON.stringify(clip.car)}, clip.car2: ${JSON.stringify(clip.car2)}`);
    
    // QB인지 확인 (포지션 상관없이 등번호만 먼저 확인)
    const isPlayerInCar = clip.car?.num === playerNum;
    const isPlayerInCar2 = clip.car2?.num === playerNum;
    
    console.log(`🔍 등번호 매칭 - isPlayerInCar: ${isPlayerInCar}, isPlayerInCar2: ${isPlayerInCar2}`);
    
    return isPlayerInCar || isPlayerInCar2;
  }

  // 새로운 특수 케이스 분석 로직
  private analyzeSignificantPlaysNew(clip: any, stats: QbStats, playerId: string): void {
    if (!clip.significantPlays || !Array.isArray(clip.significantPlays)) return;

    const playerNum = parseInt(playerId);
    
    // QB 분석기에서 호출되므로 해당 선수가 QB임을 가정하고, 클립에 참여했는지만 확인
    const isPlayerInClip = (clip.car?.num === playerNum) || (clip.car2?.num === playerNum);

    if (!isPlayerInClip) return;

    const significantPlays = clip.significantPlays;
    const playType = clip.playType;
    const gainYard = clip.gainYard || 0;

    // Passing Touchdown
    if (significantPlays.includes('TOUCHDOWN') && 
        (playType === 'PASS' || playType === 'PassComplete')) {
      stats.passingTouchdowns += 1;
      stats.passingAttempts += 1;
      stats.passingCompletions += 1;
      stats.passingYards += gainYard;
      if (gainYard > stats.longestPass) {
        stats.longestPass = gainYard;
      }
    }

    // Rushing Touchdown (QB Scramble/Designed Run)
    else if (significantPlays.includes('TOUCHDOWN') && 
             playType === 'RUN') {
      stats.rushingTouchdowns += 1;
      stats.rushingAttempts += 1;
      stats.rushingYards += gainYard;
      if (gainYard > stats.longestRush) {
        stats.longestRush = gainYard;
      }
    }

    // Sack
    else if (significantPlays.includes('SACK')) {
      stats.sacks += 1;
    }

    // Interception
    else if (significantPlays.includes('INTERCEPT') || significantPlays.includes('INTERCEPTION')) {
      stats.passingInterceptions += 1;
      stats.passingAttempts += 1;
    }

    // Fumble (Pass)
    else if (significantPlays.includes('FUMBLE') && 
             (playType === 'PASS' || playType === 'PassComplete')) {
      stats.fumbles += 1;
      stats.passingAttempts += 1;
      stats.passingCompletions += 1;
      stats.passingYards += gainYard;
    }

    // Fumble (Run) - 스크리미지 라인 뒤에서 펌블
    else if (significantPlays.includes('FUMBLE') && 
             playType === 'RUN') {
      stats.fumbles += 1;
      stats.rushingAttempts += 1;
      
      // 스크리미지 라인 기준으로 야드 계산
      if (significantPlays.includes('FUMBLERECOFF')) {
        // 오펜스 리커버리 시
        const startYard = clip.start?.yard || 0;
        const endYard = clip.end?.yard || 0;
        const actualGain = gainYard < 0 ? gainYard : Math.min(gainYard, endYard - startYard);
        stats.rushingYards += actualGain;
      } else {
        // 디펜스 리커버리 시
        stats.rushingYards += gainYard;
      }
    }

    // Pass Complete (일반)
    else if (playType === 'PASS' || playType === 'PassComplete') {
      stats.passingAttempts += 1;
      if (gainYard > 0) {
        stats.passingCompletions += 1;
        stats.passingYards += gainYard;
        if (gainYard > stats.longestPass) {
          stats.longestPass = gainYard;
        }
      }
    }

    // Pass Incomplete
    else if (playType === 'NOPASS' || playType === 'PassIncomplete') {
      stats.passingAttempts += 1;
    }

    // Run (일반)
    else if (playType === 'RUN') {
      stats.rushingAttempts += 1;
      stats.rushingYards += gainYard;
      if (gainYard > stats.longestRush) {
        stats.longestRush = gainYard;
      }
    }
  }

  // 기본 공격 플레이 분석 (일반적인 Pass/Run 상황)
  private analyzeBasicOffensivePlay(clip: any, stats: QbStats, playerId: string): void {
    const playerNum = parseInt(playerId);
    
    // QB 분석기에서 호출되므로 선수가 클립에 참여했는지만 확인 (포지션 무관)
    const isPlayerInClip = (clip.car?.num === playerNum) || (clip.car2?.num === playerNum);

    console.log(`🏈 QB 기본 플레이 분석 - 선수: ${playerId}, 클립 playType: ${clip.playType}, isCarrier: ${isPlayerInClip}`);

    if (!isPlayerInClip) return;

    // SignificantPlays에서 이미 처리된 경우가 아니라면 기본 스탯 추가
    const hasSpecialPlay = Array.isArray(clip.significantPlays) && clip.significantPlays.some((play: string | null) => 
      play === 'TOUCHDOWN' || play === 'SACK' || play === 'INTERCEPT' || play === 'INTERCEPTION' || play === 'FUMBLE'
    );

    console.log(`🏈 특수 플레이 여부: ${hasSpecialPlay}, significantPlays: ${JSON.stringify(clip.significantPlays)}`);

    if (!hasSpecialPlay) {
      // 일반적인 Pass 상황
      if (clip.playType === 'PASS') {
        stats.passingAttempts += 1;
        console.log(`✅ 패스 시도 추가! 총 ${stats.passingAttempts}회`);
        
        // 완성된 패스인지 확인 (gainYard가 0보다 크면 완성)
        if (clip.gainYard && clip.gainYard > 0) {
          stats.passingCompletions += 1;
          stats.passingYards += clip.gainYard;
          console.log(`✅ 패스 완성! ${clip.gainYard}야드 추가, 총 ${stats.passingYards}야드`);
          if (clip.gainYard > stats.longestPass) {
            stats.longestPass = clip.gainYard;
          }
        }
      }
      
      // 일반적인 Run 상황 (QB 스크램블 등)
      else if (clip.playType === 'RUN') {
        stats.rushingAttempts += 1;
        console.log(`✅ 러시 시도 추가! 총 ${stats.rushingAttempts}회`);
        if (clip.gainYard && clip.gainYard >= 0) {
          stats.rushingYards += clip.gainYard;
          console.log(`✅ 러시 야드 추가! ${clip.gainYard}야드, 총 ${stats.rushingYards}야드`);
          if (clip.gainYard > stats.longestRush) {
            stats.longestRush = clip.gainYard;
          }
        }
      } else {
        console.log(`❌ 매칭되지 않는 playType: ${clip.playType}`);
      }
    }
  }

}