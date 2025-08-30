import { Injectable } from '@nestjs/common';
import { BaseAnalyzerService, ClipData, GameData } from './base-analyzer.service';

// DL 스탯 인터페이스
export interface DLStats {
  jerseyNumber: number;
  teamName: string;
  gamesPlayed: number;
  tackles: number;
  tfl: number;
  sacks: number;
  interceptions: number;
  forcedFumbles: number;
  fumbleRecoveries: number;
  fumbleRecoveryYards: number;
  passesDefended: number;
  interceptionYards: number;
  defensiveTouchdowns: number;
}

@Injectable()
export class DlAnalyzerService extends BaseAnalyzerService {

  /**
   * DL 클립 분석 메인 메서드
   */
  async analyzeClips(clips: ClipData[], gameData: GameData): Promise<any> {
    console.log(`\n⚔️ DL 분석 시작 - ${clips.length}개 클립`);
    
    if (clips.length === 0) {
      console.log('⚠️ DL 클립이 없습니다.');
      return { dlCount: 0, message: 'DL 클립이 없습니다.' };
    }

    // DL 선수별로 스탯 수집
    const dlStatsMap = new Map<string, DLStats>();

    for (const clip of clips) {
      this.processClipForDL(clip, dlStatsMap, gameData);
    }

    // 각 DL의 최종 스탯 계산 및 저장
    let savedCount = 0;
    const results = [];

    for (const [dlKey, dlStats] of dlStatsMap) {
      // 최종 계산
      this.calculateFinalStats(dlStats);
      
      console.log(`⚔️ DL ${dlStats.jerseyNumber}번 (${dlStats.teamName}) 최종 스탯:`);
      console.log(`   태클 수: ${dlStats.tackles}`);
      console.log(`   TFL: ${dlStats.tfl}`);
      console.log(`   색: ${dlStats.sacks}`);
      console.log(`   인터셉션: ${dlStats.interceptions}`);

      // 데이터베이스에 저장
      const saveResult = await this.savePlayerStats(
        dlStats.jerseyNumber,
        dlStats.teamName,
        'DL',
        {
          gamesPlayed: dlStats.gamesPlayed,
          tackles: dlStats.tackles,
          tfl: dlStats.tfl,
          sacks: dlStats.sacks,
          interceptions: dlStats.interceptions,
          forcedFumbles: dlStats.forcedFumbles,
          fumbleRecoveries: dlStats.fumbleRecoveries,
          fumbleRecoveryYards: dlStats.fumbleRecoveryYards,
          passesDefended: dlStats.passesDefended,
          interceptionYards: dlStats.interceptionYards,
          defensiveTouchdowns: dlStats.defensiveTouchdowns,
        }
      );

      if (saveResult.success) {
        savedCount++;
      }
      results.push(saveResult);
    }

    console.log(`✅ DL 분석 완료: ${savedCount}명의 DL 스탯 저장\n`);

    return {
      dlCount: savedCount,
      message: `${savedCount}명의 DL 스탯이 분석되었습니다.`,
      results
    };
  }

  /**
   * 개별 클립을 DL 관점에서 처리
   */
  private processClipForDL(clip: ClipData, dlStatsMap: Map<string, DLStats>, gameData: GameData): void {
    // DL은 tkl나 tkl2에서 pos가 'DL'인 경우
    const dlPlayers = [];
    
    if (clip.tkl?.pos === 'DL') {
      dlPlayers.push({ number: clip.tkl.num, role: 'tkl' });
    }
    if (clip.tkl2?.pos === 'DL') {
      dlPlayers.push({ number: clip.tkl2.num, role: 'tkl2' });
    }

    for (const dlPlayer of dlPlayers) {
      const dlKey = this.getDLKey(dlPlayer.number, clip.offensiveTeam, gameData);
      
      if (!dlStatsMap.has(dlKey)) {
        dlStatsMap.set(dlKey, this.initializeDLStats(dlPlayer.number, clip.offensiveTeam, gameData));
      }

      const dlStats = dlStatsMap.get(dlKey);
      this.processPlay(clip, dlStats);
    }
  }

  /**
   * 개별 플레이 처리
   */
  private processPlay(clip: ClipData, dlStats: DLStats): void {
    const playType = clip.playType?.toUpperCase();
    const significantPlays = clip.significantPlays || [];

    // 태클 수 처리 (PASS, RUN, SACK 플레이에서)
    if (playType === 'PASS' || playType === 'RUN' || playType === 'SACK') {
      dlStats.tackles++;
      console.log(`   🏈 DL 태클! (${playType})`);
    }

    // TFL 처리 (PASS, RUN 플레이에서 TFL significantPlay가 있을 때)
    if ((playType === 'PASS' || playType === 'RUN') && significantPlays.includes('TFL')) {
      dlStats.tfl++;
      console.log(`   ⚡ DL TFL!`);
    }

    // 색 처리 (playType과 significantPlay 둘 다 SACK일 때)
    if (playType === 'SACK' && significantPlays.includes('SACK')) {
      dlStats.sacks++;
      console.log(`   💥 DL 색!`);
    }

    // 인터셉션 처리 (NOPASS이고 significantPlay에 INTERCEPT가 있을 때)
    if (playType === 'NOPASS' && significantPlays.includes('INTERCEPT')) {
      dlStats.interceptions++;
      console.log(`   🛡️ DL 인터셉션!`);
    }
  }

  /**
   * 최종 스탯 계산
   */
  private calculateFinalStats(dlStats: DLStats): void {
    // 게임 수는 1로 설정 (하나의 게임 데이터이므로)
    dlStats.gamesPlayed = 1;
  }

  /**
   * DL 스탯 초기화
   */
  private initializeDLStats(jerseyNumber: number, offensiveTeam: string, gameData: GameData): DLStats {
    // 수비팀 결정 (공격팀의 반대)
    const defensiveTeam = offensiveTeam === 'Home' ? gameData.awayTeam : gameData.homeTeam;
    
    return {
      jerseyNumber,
      teamName: defensiveTeam,
      gamesPlayed: 1,
      tackles: 0,
      tfl: 0,
      sacks: 0,
      interceptions: 0,
      forcedFumbles: 999,
      fumbleRecoveries: 999,
      fumbleRecoveryYards: 999,
      passesDefended: 999,
      interceptionYards: 999,
      defensiveTouchdowns: 999,
    };
  }

  /**
   * DL 키 생성
   */
  private getDLKey(jerseyNumber: number, offensiveTeam: string, gameData: GameData): string {
    const defensiveTeam = offensiveTeam === 'Home' ? gameData.awayTeam : gameData.homeTeam;
    return `${defensiveTeam}_DL_${jerseyNumber}`;
  }
}