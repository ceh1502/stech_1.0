import { Injectable } from '@nestjs/common';
import { BaseAnalyzerService, ClipData, GameData } from './base-analyzer.service';

// RB 스탯 인터페이스
export interface RBStats {
  jerseyNumber: number;
  teamName: string;
  gamesPlayed: number;
  rushingAttempts: number;
  frontRushYard: number; // TFL/SAFETY 없을 때의 러싱야드
  backRushYard: number;  // TFL/SAFETY 있을 때의 러싱야드
  rushingYards: number;  // frontRushYard - backRushYard
  yardsPerCarry: number;
  rushingTouchdowns: number;
  longestRush: number;
  fumbles: number;
  fumblesLost: number; // FUMBLERECDEF가 있을 때
  // 스페셜팀 스탯
  kickoffReturn: number;
  kickoffReturnYard: number;
  yardPerKickoffReturn: number;
  puntReturn: number;
  puntReturnYard: number;
  yardPerPuntReturn: number;
  returnTouchdown: number;
}

@Injectable()
export class RbAnalyzerService extends BaseAnalyzerService {

  /**
   * RB 클립 분석 메인 메서드
   */
  async analyzeClips(clips: ClipData[], gameData: GameData): Promise<any> {
    console.log(`\n🏃‍♂️ RB 분석 시작 - ${clips.length}개 클립`);
    
    if (clips.length === 0) {
      console.log('⚠️ RB 클립이 없습니다.');
      return { rbCount: 0, message: 'RB 클립이 없습니다.' };
    }

    // RB 선수별로 스탯 수집
    const rbStatsMap = new Map<string, RBStats>();

    for (const clip of clips) {
      this.processClipForRB(clip, rbStatsMap, gameData);
    }

    // 각 RB의 최종 스탯 계산 및 저장
    let savedCount = 0;
    const results = [];

    for (const [rbKey, rbStats] of rbStatsMap) {
      // 최종 계산
      this.calculateFinalStats(rbStats);
      
      console.log(`🏈 RB ${rbStats.jerseyNumber}번 (${rbStats.teamName}) 최종 스탯:`);
      console.log(`   러싱 시도: ${rbStats.rushingAttempts}`);
      console.log(`   FrontRushYard: ${rbStats.frontRushYard}`);
      console.log(`   BackRushYard: ${rbStats.backRushYard}`);
      console.log(`   러싱야드: ${rbStats.rushingYards} (${rbStats.frontRushYard} - ${rbStats.backRushYard})`);
      console.log(`   평균야드: ${rbStats.yardsPerCarry}`);
      console.log(`   러싱TD: ${rbStats.rushingTouchdowns}`);
      console.log(`   가장 긴 러싱: ${rbStats.longestRush}`);
      console.log(`   펌블: ${rbStats.fumbles}, 펌블 잃음: ${rbStats.fumblesLost}`);
      console.log(`   킥오프 리턴: ${rbStats.kickoffReturn}, 야드: ${rbStats.kickoffReturnYard}, 평균: ${rbStats.yardPerKickoffReturn}`);
      console.log(`   펀트 리턴: ${rbStats.puntReturn}, 야드: ${rbStats.puntReturnYard}, 평균: ${rbStats.yardPerPuntReturn}`);
      console.log(`   리턴 TD: ${rbStats.returnTouchdown}`);

      // 데이터베이스에 저장
      const saveResult = await this.savePlayerStats(
        rbStats.jerseyNumber,
        rbStats.teamName,
        'RB',
        {
          gamesPlayed: rbStats.gamesPlayed,
          rbRushingAttempts: rbStats.rushingAttempts,
          rbRushingYards: rbStats.rushingYards,
          rbYardsPerCarry: rbStats.yardsPerCarry,
          rbRushingTouchdowns: rbStats.rushingTouchdowns,
          rbLongestRush: rbStats.longestRush,
          fumbles: rbStats.fumbles,
          fumblesLost: rbStats.fumblesLost,
          // 스페셜팀 스탯
          kickReturns: rbStats.kickoffReturn,
          kickReturnYards: rbStats.kickoffReturnYard,
          yardsPerKickReturn: rbStats.yardPerKickoffReturn,
          puntReturns: rbStats.puntReturn,
          puntReturnYards: rbStats.puntReturnYard,
          yardsPerPuntReturn: rbStats.yardPerPuntReturn,
          returnTouchdowns: rbStats.returnTouchdown,
        }
      );

      if (saveResult.success) {
        savedCount++;
      }
      results.push(saveResult);
    }

    console.log(`✅ RB 분석 완료: ${savedCount}명의 RB 스탯 저장\n`);

    return {
      rbCount: savedCount,
      message: `${savedCount}명의 RB 스탯이 분석되었습니다.`,
      results
    };
  }

  /**
   * 개별 클립을 RB 관점에서 처리
   */
  private processClipForRB(clip: ClipData, rbStatsMap: Map<string, RBStats>, gameData: GameData): void {
    // RB는 car나 car2에서 pos가 'RB'인 경우
    const rbPlayers = [];
    
    if (clip.car?.pos === 'RB') {
      rbPlayers.push({ number: clip.car.num, role: 'car' });
    }
    if (clip.car2?.pos === 'RB') {
      rbPlayers.push({ number: clip.car2.num, role: 'car2' });
    }

    for (const rbPlayer of rbPlayers) {
      const rbKey = this.getRBKey(rbPlayer.number, clip.offensiveTeam, gameData);
      
      if (!rbStatsMap.has(rbKey)) {
        rbStatsMap.set(rbKey, this.initializeRBStats(rbPlayer.number, clip.offensiveTeam, gameData));
      }

      const rbStats = rbStatsMap.get(rbKey);
      this.processPlay(clip, rbStats);
    }
  }

  /**
   * 개별 플레이 처리
   */
  private processPlay(clip: ClipData, rbStats: RBStats): void {
    const playType = clip.playType?.toUpperCase();
    const gainYard = clip.gainYard || 0;
    const significantPlays = clip.significantPlays || [];

    // RUN 플레이 처리
    if (playType === 'RUN') {
      rbStats.rushingAttempts++;

      // TFL(Tackle For Loss)나 SAFETY 체크
      const hasTFL = significantPlays.some(play => play === 'TFL');
      const hasSAFETY = significantPlays.some(play => play === 'SAFETY');

      if (hasTFL || hasSAFETY) {
        // TFL이나 SAFETY가 있으면 BackRushYard에 저장
        rbStats.backRushYard += gainYard;
        console.log(`   🔴 BackRushYard: ${gainYard}야드 (TFL: ${hasTFL}, SAFETY: ${hasSAFETY})`);
      } else {
        // 정상적인 러싱이면 FrontRushYard에 저장
        rbStats.frontRushYard += gainYard;
        console.log(`   🟢 FrontRushYard: ${gainYard}야드`);
      }

      // 가장 긴 러싱 업데이트
      if (gainYard > rbStats.longestRush) {
        rbStats.longestRush = gainYard;
      }
    }

    // 스페셜팀 리턴 처리 (playType이 RETURN이고 significantPlays에 KICKOFF/PUNT가 있을 때)
    if (playType === 'RETURN') {
      const hasKickoff = significantPlays.some(play => play === 'KICKOFF');
      const hasPunt = significantPlays.some(play => play === 'PUNT');

      if (hasKickoff) {
        rbStats.kickoffReturn++;
        rbStats.kickoffReturnYard += gainYard;
        console.log(`   🟡 킥오프 리턴: ${gainYard}야드`);
      }

      if (hasPunt) {
        rbStats.puntReturn++;
        rbStats.puntReturnYard += gainYard;
        console.log(`   🟡 펀트 리턴: ${gainYard}야드`);
      }
    }

    // FUMBLERECDEF 처리 (펌블을 잃었을 때)
    if (significantPlays.includes('FUMBLERECDEF')) {
      rbStats.fumblesLost++;
      console.log(`   🔴 펌블 잃음`);
    }

    // 공통 significantPlays 처리 (터치다운, 펌블 등)
    this.processSignificantPlays(clip, rbStats, playType);
  }

  /**
   * 터치다운 처리 (BaseAnalyzer에서 오버라이드)
   */
  protected processTouchdown(stats: RBStats, playType: string): void {
    if (playType === 'RUN') {
      stats.rushingTouchdowns++;
      console.log(`   🏈 러싱 터치다운!`);
    } else if (playType === 'RETURN') {
      stats.returnTouchdown++;
      console.log(`   🏈 리턴 터치다운!`);
    }
  }

  /**
   * 최종 스탯 계산
   */
  private calculateFinalStats(rbStats: RBStats): void {
    // 총 러싱야드 = FrontRushYard - BackRushYard
    rbStats.rushingYards = rbStats.frontRushYard - rbStats.backRushYard;

    // 평균 야드 계산
    rbStats.yardsPerCarry = rbStats.rushingAttempts > 0 
      ? Math.round((rbStats.rushingYards / rbStats.rushingAttempts) * 10) / 10 
      : 0;

    // 스페셜팀 평균 야드 계산
    rbStats.yardPerKickoffReturn = rbStats.kickoffReturn > 0 
      ? Math.round((rbStats.kickoffReturnYard / rbStats.kickoffReturn) * 10) / 10 
      : 0;

    rbStats.yardPerPuntReturn = rbStats.puntReturn > 0 
      ? Math.round((rbStats.puntReturnYard / rbStats.puntReturn) * 10) / 10 
      : 0;

    // 게임 수는 1로 설정 (하나의 게임 데이터이므로)
    rbStats.gamesPlayed = 1;
  }

  /**
   * RB 스탯 초기화
   */
  private initializeRBStats(jerseyNumber: number, offensiveTeam: string, gameData: GameData): RBStats {
    const teamName = offensiveTeam === 'Home' ? gameData.homeTeam : gameData.awayTeam;
    
    return {
      jerseyNumber,
      teamName,
      gamesPlayed: 1,
      rushingAttempts: 0,
      frontRushYard: 0,
      backRushYard: 0,
      rushingYards: 0,
      yardsPerCarry: 0,
      rushingTouchdowns: 0,
      longestRush: 0,
      fumbles: 0,
      fumblesLost: 0,
      // 스페셜팀 스탯 초기화
      kickoffReturn: 0,
      kickoffReturnYard: 0,
      yardPerKickoffReturn: 0,
      puntReturn: 0,
      puntReturnYard: 0,
      yardPerPuntReturn: 0,
      returnTouchdown: 0,
    };
  }

  /**
   * RB 키 생성
   */
  private getRBKey(jerseyNumber: number, offensiveTeam: string, gameData: GameData): string {
    const teamName = offensiveTeam === 'Home' ? gameData.homeTeam : gameData.awayTeam;
    return `${teamName}_RB_${jerseyNumber}`;
  }
}