import { Injectable } from '@nestjs/common';
import { BaseAnalyzerService, ClipData, GameData } from './base-analyzer.service';

// LB 스탯 인터페이스
export interface LBStats {
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
  // 협회 데이터
  soloTackles: number;
  comboTackles: number;
  att: number;
  longestInterception: number;
}

@Injectable()
export class LbAnalyzerService extends BaseAnalyzerService {

  /**
   * LB 클립 분석 메인 메서드
   */
  async analyzeClips(clips: ClipData[], gameData: GameData): Promise<any> {
    console.log(`\n🛡️ LB 분석 시작 - ${clips.length}개 클립`);
    
    if (clips.length === 0) {
      console.log('⚠️ LB 클립이 없습니다.');
      return { lbCount: 0, message: 'LB 클립이 없습니다.' };
    }

    // LB 선수별로 스탯 수집
    const lbStatsMap = new Map<string, LBStats>();

    for (const clip of clips) {
      this.processClipForLB(clip, lbStatsMap, gameData);
    }

    // 각 LB의 최종 스탯 계산 및 저장
    let savedCount = 0;
    const results = [];

    for (const [lbKey, lbStats] of lbStatsMap) {
      // 최종 계산
      this.calculateFinalStats(lbStats);
      
      console.log(`🛡️ LB ${lbStats.jerseyNumber}번 (${lbStats.teamName}) 최종 스탯:`);
      console.log(`   태클 수: ${lbStats.tackles}`);
      console.log(`   TFL: ${lbStats.tfl}`);
      console.log(`   색: ${lbStats.sacks}`);
      console.log(`   인터셉션: ${lbStats.interceptions}`);

      // 데이터베이스에 저장
      const saveResult = await this.savePlayerStats(
        lbStats.jerseyNumber,
        lbStats.teamName,
        'LB',
        {
          gamesPlayed: lbStats.gamesPlayed,
          tackles: lbStats.tackles,
          tfl: lbStats.tfl,
          sacks: lbStats.sacks,
          interceptions: lbStats.interceptions,
          forcedFumbles: lbStats.forcedFumbles,
          fumbleRecoveries: lbStats.fumbleRecoveries,
          fumbleRecoveryYards: lbStats.fumbleRecoveryYards,
          passesDefended: lbStats.passesDefended,
          interceptionYards: lbStats.interceptionYards,
          defensiveTouchdowns: lbStats.defensiveTouchdowns,
          // 협회 데이터
          soloTackles: lbStats.soloTackles,
          comboTackles: lbStats.comboTackles,
          att: lbStats.att,
          longestInterception: lbStats.longestInterception,
        }
      );

      if (saveResult.success) {
        savedCount++;
      }
      results.push(saveResult);
    }

    console.log(`✅ LB 분석 완료: ${savedCount}명의 LB 스탯 저장\n`);

    return {
      lbCount: savedCount,
      message: `${savedCount}명의 LB 스탯이 분석되었습니다.`,
      results
    };
  }

  /**
   * 개별 클립을 LB 관점에서 처리
   */
  private processClipForLB(clip: ClipData, lbStatsMap: Map<string, LBStats>, gameData: GameData): void {
    // LB는 tkl나 tkl2에서 pos가 'LB'인 경우
    const lbPlayers = [];
    
    if (clip.tkl?.pos === 'LB') {
      lbPlayers.push({ number: clip.tkl.num, role: 'tkl' });
    }
    if (clip.tkl2?.pos === 'LB') {
      lbPlayers.push({ number: clip.tkl2.num, role: 'tkl2' });
    }

    for (const lbPlayer of lbPlayers) {
      const lbKey = this.getLBKey(lbPlayer.number, clip.offensiveTeam, gameData);
      
      if (!lbStatsMap.has(lbKey)) {
        lbStatsMap.set(lbKey, this.initializeLBStats(lbPlayer.number, clip.offensiveTeam, gameData));
      }

      const lbStats = lbStatsMap.get(lbKey);
      this.processPlay(clip, lbStats);
    }
  }

  /**
   * 개별 플레이 처리
   */
  private processPlay(clip: ClipData, lbStats: LBStats): void {
    const playType = clip.playType?.toUpperCase();
    const significantPlays = clip.significantPlays || [];

    // 협회 데이터: 태클 타입 처리 (RUN, PASS 플레이에서)
    if (playType === 'RUN' || playType === 'PASS') {
      const hasTkl = clip.tkl?.pos === 'LB';
      const hasTkl2 = clip.tkl2?.pos === 'LB';
      
      if (hasTkl && hasTkl2) {
        // 콤보 태클 (두 명 다 LB)
        lbStats.comboTackles++;
        console.log(`   🤝 LB 콤보 태클!`);
      } else if (hasTkl || hasTkl2) {
        // 솔로 태클 (한 명만 LB)
        lbStats.soloTackles++;
        console.log(`   🎯 LB 솔로 태클!`);
      }
    }

    // 태클 수 처리 (PASS, RUN, SACK 플레이에서)
    if (playType === 'PASS' || playType === 'RUN' || playType === 'SACK') {
      lbStats.tackles++;
      console.log(`   🏈 LB 태클! (${playType})`);
    }

    // TFL 처리 (PASS, RUN 플레이에서 TFL significantPlay가 있을 때)
    if ((playType === 'PASS' || playType === 'RUN') && significantPlays.includes('TFL')) {
      lbStats.tfl++;
      console.log(`   ⚡ LB TFL!`);
    }

    // 색 처리 (significantPlay에 SACK이 있을 때)
    if (significantPlays.includes('SACK')) {
      const hasTkl = clip.tkl?.pos === 'LB';
      const hasTkl2 = clip.tkl2?.pos === 'LB';
      
      if (hasTkl && hasTkl2) {
        // 두 명이 함께 색한 경우 각자 0.5씩
        lbStats.sacks += 0.5;
        console.log(`   💥 LB 색! (0.5 - 공동)`);
      } else {
        // 혼자 색한 경우 1.0
        lbStats.sacks++;
        console.log(`   💥 LB 색!`);
      }
    }

    // 인터셉션 처리 (NOPASS이고 significantPlay에 INTERCEPT가 있을 때)
    if (playType === 'NOPASS' && significantPlays.includes('INTERCEPT')) {
      lbStats.interceptions++;
      console.log(`   🛡️ LB 인터셉션!`);
    }
    
    // 인터셉션 야드 처리 (RETURN 플레이에서 TURNOVER가 있을 때)
    if (playType === 'RETURN' && significantPlays.includes('TURNOVER')) {
      const returnYards = Math.abs(clip.gainYard || 0);
      lbStats.interceptionYards += returnYards;
      
      // 가장 긴 인터셉션 업데이트
      if (returnYards > lbStats.longestInterception) {
        lbStats.longestInterception = returnYards;
        console.log(`   🏃 LB 인터셉션 리턴: ${returnYards}야드 (신기록!)`);
      } else {
        console.log(`   🏃 LB 인터셉션 리턴: ${returnYards}야드`);
      }
    }

    // 강제 펌블 처리 (FUMBLE이 있을 때 tkl 필드에 있는 수비수)
    if (significantPlays.includes('FUMBLE')) {
      lbStats.forcedFumbles++;
      console.log(`   💪 LB 강제 펌블!`);
    }

    // 펌블 리커버리 처리 (RETURN 플레이에서 FUMBLERECDEF && TURNOVER가 있을 때)
    if (playType === 'RETURN' && significantPlays.includes('FUMBLERECDEF') && significantPlays.includes('TURNOVER')) {
      lbStats.fumbleRecoveries++;
      lbStats.fumbleRecoveryYards += Math.abs(clip.gainYard || 0);
      console.log(`   🟢 LB 펌블 리커버리: ${Math.abs(clip.gainYard || 0)}야드`);
    }

    // 패스 디펜드 처리 (NOPASS 플레이에서 tkl 필드에 수비수가 있을 때)
    if (playType === 'NOPASS') {
      lbStats.passesDefended++;
      console.log(`   🛡️ LB 패스 디펜드!`);
    }

    // 수비 터치다운 처리 (RETURN 플레이에서 TURNOVER && TOUCHDOWN이 있을 때)
    if (playType === 'RETURN' && significantPlays.includes('TURNOVER') && significantPlays.includes('TOUCHDOWN')) {
      lbStats.defensiveTouchdowns++;
      console.log(`   🏆 LB 수비 터치다운!`);
    }
  }

  /**
   * 최종 스탯 계산
   */
  private calculateFinalStats(lbStats: LBStats): void {
    // 게임 수는 1로 설정 (하나의 게임 데이터이므로)
    lbStats.gamesPlayed = 1;
    
    // ATT 계산 (SACK + SOLO + COMBO)
    lbStats.att = lbStats.sacks + lbStats.soloTackles + lbStats.comboTackles;
  }

  /**
   * LB 스탯 초기화
   */
  private initializeLBStats(jerseyNumber: number, offensiveTeam: string, gameData: GameData): LBStats {
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
      forcedFumbles: 0,
      fumbleRecoveries: 0,
      fumbleRecoveryYards: 0,
      passesDefended: 0,
      interceptionYards: 0,
      defensiveTouchdowns: 0,
      // 협회 데이터
      soloTackles: 0,
      comboTackles: 0,
      att: 0,
      longestInterception: 0,
    };
  }

  /**
   * LB 키 생성
   */
  private getLBKey(jerseyNumber: number, offensiveTeam: string, gameData: GameData): string {
    const defensiveTeam = offensiveTeam === 'Home' ? gameData.awayTeam : gameData.homeTeam;
    return `${defensiveTeam}_LB_${jerseyNumber}`;
  }
}