import { Injectable } from '@nestjs/common';
import { BaseAnalyzerService, ClipData, GameData } from './base-analyzer.service';

// DB 스탯 인터페이스
export interface DBStats {
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
export class DbAnalyzerService extends BaseAnalyzerService {

  /**
   * DB 클립 분석 메인 메서드
   */
  async analyzeClips(clips: ClipData[], gameData: GameData): Promise<any> {
    console.log(`\n🚨 DB 분석 시작 - ${clips.length}개 클립`);
    
    if (clips.length === 0) {
      console.log('⚠️ DB 클립이 없습니다.');
      return { dbCount: 0, message: 'DB 클립이 없습니다.' };
    }

    // DB 선수별로 스탯 수집
    const dbStatsMap = new Map<string, DBStats>();

    for (const clip of clips) {
      this.processClipForDB(clip, dbStatsMap, gameData);
    }

    // 각 DB의 최종 스탯 계산 및 저장
    let savedCount = 0;
    const results = [];

    for (const [dbKey, dbStats] of dbStatsMap) {
      // 최종 계산
      this.calculateFinalStats(dbStats);
      
      console.log(`🚨 DB ${dbStats.jerseyNumber}번 (${dbStats.teamName}) 최종 스탯:`);
      console.log(`   태클 수: ${dbStats.tackles}`);
      console.log(`   TFL: ${dbStats.tfl}`);
      console.log(`   색: ${dbStats.sacks}`);
      console.log(`   인터셉션: ${dbStats.interceptions}`);

      // 데이터베이스에 저장
      const saveResult = await this.savePlayerStats(
        dbStats.jerseyNumber,
        dbStats.teamName,
        'DB',
        {
          gamesPlayed: dbStats.gamesPlayed,
          tackles: dbStats.tackles,
          tfl: dbStats.tfl,
          sacks: dbStats.sacks,
          interceptions: dbStats.interceptions,
          forcedFumbles: dbStats.forcedFumbles,
          fumbleRecoveries: dbStats.fumbleRecoveries,
          fumbleRecoveryYards: dbStats.fumbleRecoveryYards,
          passesDefended: dbStats.passesDefended,
          interceptionYards: dbStats.interceptionYards,
          defensiveTouchdowns: dbStats.defensiveTouchdowns,
          // 협회 데이터
          soloTackles: dbStats.soloTackles,
          comboTackles: dbStats.comboTackles,
          att: dbStats.att,
          longestInterception: dbStats.longestInterception,
        }
      );

      if (saveResult.success) {
        savedCount++;
      }
      results.push(saveResult);
    }

    console.log(`✅ DB 분석 완료: ${savedCount}명의 DB 스탯 저장\n`);

    return {
      dbCount: savedCount,
      message: `${savedCount}명의 DB 스탯이 분석되었습니다.`,
      results
    };
  }

  /**
   * 개별 클립을 DB 관점에서 처리
   */
  private processClipForDB(clip: ClipData, dbStatsMap: Map<string, DBStats>, gameData: GameData): void {
    // DB는 tkl나 tkl2에서 pos가 'DB'인 경우
    const dbPlayers = [];
    
    if (clip.tkl?.pos === 'DB') {
      dbPlayers.push({ number: clip.tkl.num, role: 'tkl' });
    }
    if (clip.tkl2?.pos === 'DB') {
      dbPlayers.push({ number: clip.tkl2.num, role: 'tkl2' });
    }

    for (const dbPlayer of dbPlayers) {
      const dbKey = this.getDBKey(dbPlayer.number, clip.offensiveTeam, gameData);
      
      if (!dbStatsMap.has(dbKey)) {
        dbStatsMap.set(dbKey, this.initializeDBStats(dbPlayer.number, clip.offensiveTeam, gameData));
      }

      const dbStats = dbStatsMap.get(dbKey);
      this.processPlay(clip, dbStats);
    }
  }

  /**
   * 개별 플레이 처리
   */
  private processPlay(clip: ClipData, dbStats: DBStats): void {
    const playType = clip.playType?.toUpperCase();
    const significantPlays = clip.significantPlays || [];

    // 협회 데이터: 태클 타입 처리 (RUN, PASS 플레이에서)
    if (playType === 'RUN' || playType === 'PASS') {
      const hasTkl = clip.tkl?.pos === 'DB';
      const hasTkl2 = clip.tkl2?.pos === 'DB';
      
      if (hasTkl && hasTkl2) {
        // 콤보 태클 (두 명 다 DB)
        dbStats.comboTackles++;
        console.log(`   🤝 DB 콤보 태클!`);
      } else if (hasTkl || hasTkl2) {
        // 솔로 태클 (한 명만 DB)
        dbStats.soloTackles++;
        console.log(`   🎯 DB 솔로 태클!`);
      }
    }

    // 태클 수 처리 (PASS, RUN, SACK 플레이에서)
    if (playType === 'PASS' || playType === 'RUN' || playType === 'SACK') {
      dbStats.tackles++;
      console.log(`   🏈 DB 태클! (${playType})`);
    }

    // TFL 처리 (PASS, RUN 플레이에서 TFL significantPlay가 있을 때)
    if ((playType === 'PASS' || playType === 'RUN') && significantPlays.includes('TFL')) {
      dbStats.tfl++;
      console.log(`   ⚡ DB TFL!`);
    }

    // 색 처리 (significantPlay에 SACK이 있을 때)
    if (significantPlays.includes('SACK')) {
      const hasTkl = clip.tkl?.pos === 'DB';
      const hasTkl2 = clip.tkl2?.pos === 'DB';
      
      if (hasTkl && hasTkl2) {
        // 두 명이 함께 색한 경우 각자 0.5씩
        dbStats.sacks += 0.5;
        console.log(`   💥 DB 색! (0.5 - 공동)`);
      } else {
        // 혼자 색한 경우 1.0
        dbStats.sacks++;
        console.log(`   💥 DB 색!`);
      }
    }

    // 인터셉션 처리 (NOPASS이고 significantPlay에 INTERCEPT가 있을 때)
    if (playType === 'NOPASS' && significantPlays.includes('INTERCEPT')) {
      dbStats.interceptions++;
      console.log(`   🛡️ DB 인터셉션!`);
    }
    
    // 인터셉션 야드 처리 (RETURN 플레이에서 TURNOVER가 있을 때)
    if (playType === 'RETURN' && significantPlays.includes('TURNOVER')) {
      const returnYards = Math.abs(clip.gainYard || 0);
      dbStats.interceptionYards += returnYards;
      
      // 가장 긴 인터셉션 업데이트
      if (returnYards > dbStats.longestInterception) {
        dbStats.longestInterception = returnYards;
        console.log(`   🏃 DB 인터셉션 리턴: ${returnYards}야드 (신기록!)`);
      } else {
        console.log(`   🏃 DB 인터셉션 리턴: ${returnYards}야드`);
      }
    }

    // 강제 펌블 처리 (FUMBLE이 있을 때 tkl 필드에 있는 수비수)
    if (significantPlays.includes('FUMBLE')) {
      dbStats.forcedFumbles++;
      console.log(`   💪 DB 강제 펌블!`);
    }

    // 펌블 리커버리 처리 (RETURN 플레이에서 FUMBLERECDEF && TURNOVER가 있을 때)
    if (playType === 'RETURN' && significantPlays.includes('FUMBLERECDEF') && significantPlays.includes('TURNOVER')) {
      dbStats.fumbleRecoveries++;
      dbStats.fumbleRecoveryYards += Math.abs(clip.gainYard || 0);
      console.log(`   🟢 DB 펌블 리커버리: ${Math.abs(clip.gainYard || 0)}야드`);
    }

    // 패스 디펜드 처리 (NOPASS 플레이에서 tkl 필드에 수비수가 있을 때)
    if (playType === 'NOPASS') {
      dbStats.passesDefended++;
      console.log(`   🛡️ DB 패스 디펜드!`);
    }

    // 수비 터치다운 처리 (RETURN 플레이에서 TURNOVER && TOUCHDOWN이 있을 때)
    if (playType === 'RETURN' && significantPlays.includes('TURNOVER') && significantPlays.includes('TOUCHDOWN')) {
      dbStats.defensiveTouchdowns++;
      console.log(`   🏆 DB 수비 터치다운!`);
    }
  }

  /**
   * 최종 스탯 계산
   */
  private calculateFinalStats(dbStats: DBStats): void {
    // 게임 수는 1로 설정 (하나의 게임 데이터이므로)
    dbStats.gamesPlayed = 1;
    
    // ATT 계산 (SACK + SOLO + COMBO)
    dbStats.att = dbStats.sacks + dbStats.soloTackles + dbStats.comboTackles;
  }

  /**
   * DB 스탯 초기화
   */
  private initializeDBStats(jerseyNumber: number, offensiveTeam: string, gameData: GameData): DBStats {
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
   * DB 키 생성
   */
  private getDBKey(jerseyNumber: number, offensiveTeam: string, gameData: GameData): string {
    const defensiveTeam = offensiveTeam === 'Home' ? gameData.awayTeam : gameData.homeTeam;
    return `${defensiveTeam}_DB_${jerseyNumber}`;
  }
}