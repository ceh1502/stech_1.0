import { Injectable } from '@nestjs/common';
import { BaseAnalyzerService, ClipData, GameData } from './base-analyzer.service';

// TE 스탯 인터페이스
export interface TEStats {
  jerseyNumber: number;
  teamName: string;
  gamesPlayed: number;
  // 리시빙 스탯
  receivingTargets: number;
  receptions: number;
  receivingYards: number;
  yardsPerReception: number;
  receivingTouchdowns: number;
  longestReception: number;
  receivingFirstDowns: number;
  // 러싱 스탯
  rushingAttempts: number;
  frontRushYard: number;
  backRushYard: number;
  rushingYards: number;
  yardsPerCarry: number;
  rushingTouchdowns: number;
  longestRush: number;
  fumbles: number;
  fumblesLost: number;
}

@Injectable()
export class TeAnalyzerService extends BaseAnalyzerService {

  /**
   * TE 클립 분석 메인 메서드
   */
  async analyzeClips(clips: ClipData[], gameData: GameData): Promise<any> {
    console.log(`\n🎯 TE 분석 시작 - ${clips.length}개 클립`);
    
    if (clips.length === 0) {
      console.log('⚠️ TE 클립이 없습니다.');
      return { teCount: 0, message: 'TE 클립이 없습니다.' };
    }

    // TE 선수별로 스탯 수집
    const teStatsMap = new Map<string, TEStats>();

    for (const clip of clips) {
      this.processClipForTE(clip, teStatsMap, gameData);
    }

    // 각 TE의 최종 스탯 계산 및 저장
    let savedCount = 0;
    const results = [];

    for (const [teKey, teStats] of teStatsMap) {
      // 최종 계산
      this.calculateFinalStats(teStats);
      
      console.log(`🎯 TE ${teStats.jerseyNumber}번 (${teStats.teamName}) 최종 스탯:`);
      console.log(`   리시빙 타겟: ${teStats.receivingTargets}`);
      console.log(`   리셉션: ${teStats.receptions}`);
      console.log(`   리시빙야드: ${teStats.receivingYards}`);
      console.log(`   평균야드: ${teStats.yardsPerReception}`);
      console.log(`   리시빙TD: ${teStats.receivingTouchdowns}`);
      console.log(`   가장 긴 리셉션: ${teStats.longestReception}`);
      console.log(`   1다운: ${teStats.receivingFirstDowns}`);
      console.log(`   러싱 시도: ${teStats.rushingAttempts}, 야드: ${teStats.rushingYards}`);

      // 데이터베이스에 저장
      const saveResult = await this.savePlayerStats(
        teStats.jerseyNumber,
        teStats.teamName,
        'TE',
        {
          gamesPlayed: teStats.gamesPlayed,
          // 리시빙 스탯
          teReceivingTargets: teStats.receivingTargets,
          teReceptions: teStats.receptions,
          teReceivingYards: teStats.receivingYards,
          teYardsPerReception: teStats.yardsPerReception,
          teReceivingTouchdowns: teStats.receivingTouchdowns,
          teLongestReception: teStats.longestReception,
          teReceivingFirstDowns: teStats.receivingFirstDowns,
          // 러싱 스탯
          teRushingAttempts: teStats.rushingAttempts,
          frontRushYard: teStats.frontRushYard,
          backRushYard: teStats.backRushYard,
          teRushingYards: teStats.rushingYards,
          teYardsPerCarry: teStats.yardsPerCarry,
          teRushingTouchdowns: teStats.rushingTouchdowns,
          teLongestRush: teStats.longestRush,
          fumbles: teStats.fumbles,
          fumblesLost: teStats.fumblesLost,
        }
      );

      if (saveResult.success) {
        savedCount++;
      }
      results.push(saveResult);
    }

    console.log(`✅ TE 분석 완료: ${savedCount}명의 TE 스탯 저장\n`);

    return {
      teCount: savedCount,
      message: `${savedCount}명의 TE 스탯이 분석되었습니다.`,
      results
    };
  }

  /**
   * 개별 클립을 TE 관점에서 처리
   */
  private processClipForTE(clip: ClipData, teStatsMap: Map<string, TEStats>, gameData: GameData): void {
    // TE는 car나 car2에서 pos가 'TE'인 경우
    const tePlayers = [];
    
    if (clip.car?.pos === 'TE') {
      tePlayers.push({ number: clip.car.num, role: 'car' });
    }
    if (clip.car2?.pos === 'TE') {
      tePlayers.push({ number: clip.car2.num, role: 'car2' });
    }

    for (const tePlayer of tePlayers) {
      const teKey = this.getTEKey(tePlayer.number, clip.offensiveTeam, gameData);
      
      if (!teStatsMap.has(teKey)) {
        teStatsMap.set(teKey, this.initializeTEStats(tePlayer.number, clip.offensiveTeam, gameData));
      }

      const teStats = teStatsMap.get(teKey);
      this.processPlay(clip, teStats);
    }
  }

  /**
   * 개별 플레이 처리
   */
  private processPlay(clip: ClipData, teStats: TEStats): void {
    const playType = clip.playType?.toUpperCase();
    const gainYard = clip.gainYard || 0;
    const significantPlays = clip.significantPlays || [];

    // PASS 플레이 처리 (리시빙)
    if (playType === 'PASS') {
      teStats.receivingTargets++;

      // 패스 성공 여부 체크 (INCOMP가 없으면 성공으로 간주)
      const isIncomplete = significantPlays.includes('INCOMP');
      
      if (!isIncomplete) {
        // 패스 성공
        teStats.receptions++;
        teStats.receivingYards += gainYard;

        // 가장 긴 리셉션 업데이트
        if (gainYard > teStats.longestReception) {
          teStats.longestReception = gainYard;
        }

        // 1다운 체크
        if (significantPlays.includes('1STDOWN')) {
          teStats.receivingFirstDowns++;
        }
      }
    }

    // RUN 플레이 처리
    if (playType === 'RUN') {
      teStats.rushingAttempts++;

      // TFL(Tackle For Loss)나 SAFETY 체크
      const hasTFL = significantPlays.some(play => play === 'TFL');
      const hasSAFETY = significantPlays.some(play => play === 'SAFETY');

      if (hasTFL || hasSAFETY) {
        teStats.backRushYard += gainYard;
      } else {
        teStats.frontRushYard += gainYard;
      }

      // 가장 긴 러싱 업데이트
      if (gainYard > teStats.longestRush) {
        teStats.longestRush = gainYard;
      }
    }

    // FUMBLERECDEF 처리 (펌블을 잃었을 때)
    if (significantPlays.includes('FUMBLERECDEF')) {
      teStats.fumblesLost++;
    }

    // 공통 significantPlays 처리 (터치다운, 펌블 등)
    this.processSignificantPlays(clip, teStats, playType);
  }

  /**
   * 터치다운 처리 (BaseAnalyzer에서 오버라이드)
   */
  protected processTouchdown(stats: TEStats, playType: string): void {
    if (playType === 'PASS') {
      stats.receivingTouchdowns++;
      console.log(`   🏈 리시빙 터치다운!`);
    } else if (playType === 'RUN') {
      stats.rushingTouchdowns++;
      console.log(`   🏈 러싱 터치다운!`);
    }
  }

  /**
   * 최종 스탯 계산
   */
  private calculateFinalStats(teStats: TEStats): void {
    // 총 러싱야드 = FrontRushYard - BackRushYard
    teStats.rushingYards = teStats.frontRushYard - teStats.backRushYard;

    // 평균 야드 계산
    teStats.yardsPerCarry = teStats.rushingAttempts > 0 
      ? Math.round((teStats.rushingYards / teStats.rushingAttempts) * 10) / 10 
      : 0;

    teStats.yardsPerReception = teStats.receptions > 0 
      ? Math.round((teStats.receivingYards / teStats.receptions) * 10) / 10 
      : 0;

    // 게임 수는 1로 설정 (하나의 게임 데이터이므로)
    teStats.gamesPlayed = 1;
  }

  /**
   * TE 스탯 초기화
   */
  private initializeTEStats(jerseyNumber: number, offensiveTeam: string, gameData: GameData): TEStats {
    const teamName = offensiveTeam === 'Home' ? gameData.homeTeam : gameData.awayTeam;
    
    return {
      jerseyNumber,
      teamName,
      gamesPlayed: 1,
      // 리시빙 스탯
      receivingTargets: 0,
      receptions: 0,
      receivingYards: 0,
      yardsPerReception: 0,
      receivingTouchdowns: 0,
      longestReception: 0,
      receivingFirstDowns: 0,
      // 러싱 스탯
      rushingAttempts: 0,
      frontRushYard: 0,
      backRushYard: 0,
      rushingYards: 0,
      yardsPerCarry: 0,
      rushingTouchdowns: 0,
      longestRush: 0,
      fumbles: 0,
      fumblesLost: 0,
    };
  }

  /**
   * TE 키 생성
   */
  private getTEKey(jerseyNumber: number, offensiveTeam: string, gameData: GameData): string {
    const teamName = offensiveTeam === 'Home' ? gameData.homeTeam : gameData.awayTeam;
    return `${teamName}_TE_${jerseyNumber}`;
  }
}