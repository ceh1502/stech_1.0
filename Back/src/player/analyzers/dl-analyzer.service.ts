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
  // 협회 데이터
  soloTackles: number;
  comboTackles: number;
  att: number;
  longestInterception: number;
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
          // 협회 데이터
          soloTackles: dlStats.soloTackles,
          comboTackles: dlStats.comboTackles,
          att: dlStats.att,
          longestInterception: dlStats.longestInterception,
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

    // 협회 데이터: 태클 타입 처리 (RUN, PASS 플레이에서)
    if (playType === 'RUN' || playType === 'PASS') {
      const hasTkl = clip.tkl?.pos === 'DL';
      const hasTkl2 = clip.tkl2?.pos === 'DL';
      
      if (hasTkl && hasTkl2) {
        // 콤보 태클 (두 명 다 DL)
        dlStats.comboTackles++;
        console.log(`   🤝 DL 콤보 태클!`);
      } else if (hasTkl || hasTkl2) {
        // 솔로 태클 (한 명만 DL)
        dlStats.soloTackles++;
        console.log(`   🎯 DL 솔로 태클!`);
      }
    }

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

    // 색 처리 (significantPlay에 SACK이 있을 때)
    if (significantPlays.includes('SACK')) {
      const hasTkl = clip.tkl?.pos === 'DL';
      const hasTkl2 = clip.tkl2?.pos === 'DL';
      
      if (hasTkl && hasTkl2) {
        // 두 명이 함께 색한 경우 각자 0.5씩
        dlStats.sacks += 0.5;
        console.log(`   💥 DL 색! (0.5 - 공동)`);
      } else {
        // 혼자 색한 경우 1.0
        dlStats.sacks++;
        console.log(`   💥 DL 색!`);
      }
    }

    // 인터셉션 처리 (NOPASS이고 significantPlay에 INTERCEPT가 있을 때)
    if (playType === 'NOPASS' && significantPlays.includes('INTERCEPT')) {
      dlStats.interceptions++;
      console.log(`   🛡️ DL 인터셉션!`);
    }
    
    // 인터셉션 야드 처리 (RETURN 플레이에서 TURNOVER가 있을 때)
    if (playType === 'RETURN' && significantPlays.includes('TURNOVER')) {
      const returnYards = Math.abs(clip.gainYard || 0);
      dlStats.interceptionYards += returnYards;
      
      // 가장 긴 인터셉션 업데이트
      if (returnYards > dlStats.longestInterception) {
        dlStats.longestInterception = returnYards;
        console.log(`   🏃 DL 인터셉션 리턴: ${returnYards}야드 (신기록!)`);
      } else {
        console.log(`   🏃 DL 인터셉션 리턴: ${returnYards}야드`);
      }
    }

    // 강제 펌블 처리 (FUMBLE이 있을 때 tkl 필드에 있는 수비수)
    if (significantPlays.includes('FUMBLE')) {
      dlStats.forcedFumbles++;
      console.log(`   💪 DL 강제 펌블!`);
    }

    // 펌블 리커버리 처리 (RETURN 플레이에서 FUMBLERECDEF && TURNOVER가 있을 때)
    if (playType === 'RETURN' && significantPlays.includes('FUMBLERECDEF') && significantPlays.includes('TURNOVER')) {
      dlStats.fumbleRecoveries++;
      dlStats.fumbleRecoveryYards += Math.abs(clip.gainYard || 0);
      console.log(`   🟢 DL 펌블 리커버리: ${Math.abs(clip.gainYard || 0)}야드`);
    }

    // 패스 디펜드 처리 (NOPASS 플레이에서 tkl 필드에 수비수가 있을 때)  
    if (playType === 'NOPASS') {
      dlStats.passesDefended++;
      console.log(`   🛡️ DL 패스 디펜드!`);
    }

    // 수비 터치다운 처리 (RETURN 플레이에서 TURNOVER && TOUCHDOWN이 있을 때)
    if (playType === 'RETURN' && significantPlays.includes('TURNOVER') && significantPlays.includes('TOUCHDOWN')) {
      dlStats.defensiveTouchdowns++;
      console.log(`   🏆 DL 수비 터치다운!`);
    }
  }

  /**
   * 최종 스탯 계산
   */
  private calculateFinalStats(dlStats: DLStats): void {
    // 게임 수는 1로 설정 (하나의 게임 데이터이므로)
    dlStats.gamesPlayed = 1;
    
    // ATT 계산 (SACK + SOLO + COMBO)
    dlStats.att = dlStats.sacks + dlStats.soloTackles + dlStats.comboTackles;
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
   * DL 키 생성
   */
  private getDLKey(jerseyNumber: number, offensiveTeam: string, gameData: GameData): string {
    const defensiveTeam = offensiveTeam === 'Home' ? gameData.awayTeam : gameData.homeTeam;
    return `${defensiveTeam}_DL_${jerseyNumber}`;
  }
}