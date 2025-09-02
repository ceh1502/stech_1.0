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
  // 스페셜팀 스탯
  kickoffReturn: number;
  kickoffReturnYard: number;
  yardPerKickoffReturn: number;
  puntReturn: number;
  puntReturnYard: number;
  yardPerPuntReturn: number;
  kickoffReturnTouchdowns: number;
  puntReturnTouchdowns: number;
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
      console.log(`   킥오프 리턴: ${dbStats.kickoffReturn}회, ${dbStats.kickoffReturnYard}야드, TD: ${dbStats.kickoffReturnTouchdowns}`);
      console.log(`   펀트 리턴: ${dbStats.puntReturn}회, ${dbStats.puntReturnYard}야드, TD: ${dbStats.puntReturnTouchdowns}`);

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
          // 스페셜팀 스탯
          kickReturns: dbStats.kickoffReturn,
          kickReturnYards: dbStats.kickoffReturnYard,
          yardsPerKickReturn: dbStats.yardPerKickoffReturn,
          puntReturns: dbStats.puntReturn,
          puntReturnYards: dbStats.puntReturnYard,
          yardsPerPuntReturn: dbStats.yardPerPuntReturn,
          returnTouchdowns: dbStats.kickoffReturnTouchdowns + dbStats.puntReturnTouchdowns,
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
    // DB는 tkl나 tkl2에서 pos가 'DB'인 경우 또는 car/car2에서 pos가 'DB'인 경우 (스페셜팀)
    const dbPlayers = [];
    
    console.log(`   🔍 클립 ${clip.clipKey}: playType=${clip.playType}, car=${clip.car?.num}(${clip.car?.pos}), tkl=${clip.tkl?.num}(${clip.tkl?.pos})`);
    
    // 수비 스탯용 DB 선수
    if (clip.tkl?.pos === 'DB') {
      dbPlayers.push({ number: clip.tkl.num, role: 'tkl' });
      console.log(`   → 수비 DB 발견: ${clip.tkl.num}번`);
    }
    if (clip.tkl2?.pos === 'DB') {
      dbPlayers.push({ number: clip.tkl2.num, role: 'tkl2' });
      console.log(`   → 수비 DB2 발견: ${clip.tkl2.num}번`);
    }
    
    // 스페셜팀 스탯용 DB 선수
    if (clip.car?.pos === 'DB') {
      dbPlayers.push({ number: clip.car.num, role: 'car' });
      console.log(`   → 스페셜팀 DB 발견: ${clip.car.num}번`);
    }
    if (clip.car2?.pos === 'DB') {
      dbPlayers.push({ number: clip.car2.num, role: 'car2' });
      console.log(`   → 스페셜팀 DB2 발견: ${clip.car2.num}번`);
    }

    for (const dbPlayer of dbPlayers) {
      const dbKey = this.getDBKey(dbPlayer.number, clip.offensiveTeam, gameData, dbPlayer.role);
      
      console.log(`   → 생성된 DB Key: ${dbKey} (role: ${dbPlayer.role})`);
      
      if (!dbStatsMap.has(dbKey)) {
        let teamName;
        
        if (dbPlayer.role === 'car' || dbPlayer.role === 'car2') {
          // 스페셜팀(리턴)일 때: 공격팀 소속
          teamName = clip.offensiveTeam === 'Home' ? gameData.homeTeam : gameData.awayTeam;
        } else {
          // 수비일 때: 수비팀 소속
          teamName = clip.offensiveTeam === 'Home' ? gameData.awayTeam : gameData.homeTeam;
        }
        
        dbStatsMap.set(dbKey, this.initializeDBStats(dbPlayer.number, teamName));
        console.log(`   → 새 DB 선수 초기화: ${dbKey} (팀: ${teamName})`);
      }

      const dbStats = dbStatsMap.get(dbKey);
      this.processPlay(clip, dbStats, dbPlayer.role);
    }
  }

  /**
   * 개별 플레이 처리
   */
  private processPlay(clip: ClipData, dbStats: DBStats, playerRole: string): void {
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

    // 수비 역할일 때 수비 스탯 처리
    if (playerRole === 'tkl' || playerRole === 'tkl2') {
      // 태클 수 처리
      // 1. PASS, RUN, SACK 플레이에서 태클
      // 2. FUMBLE이 있으면 무조건 태클 (펀블 유도 = 태클)
      if (playType === 'PASS' || playType === 'RUN' || playType === 'SACK') {
        dbStats.tackles++;
        console.log(`   🏈 DB 태클! (${playType})`);
      } else if (significantPlays.includes('FUMBLE')) {
        // FUMBLE이 있으면 playType에 관계없이 태클 추가
        dbStats.tackles++;
        console.log(`   🏈 DB 태클! (FUMBLE 유도)`);
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
        
        // SACK일 때 자동으로 TFL 추가
        dbStats.tfl++;
        console.log(`   ⚡ DB SACK-TFL 자동 추가!`);
        
        // SACK일 때도 태클 수 추가
        dbStats.tackles++;
        console.log(`   🏈 DB 태클! (SACK)`);
      }

      // 인터셉션 처리 (NOPASS이고 significantPlay에 INTERCEPT가 있을 때)
      if (playType === 'NOPASS' && significantPlays.includes('INTERCEPT')) {
        dbStats.interceptions++;
        console.log(`   🛡️ DB 인터셉션!`);
      }
      
      // 인터셉션 야드 처리 (RETURN 플레이에서 TURNOVER가 있고 FUMBLERECDEF가 없을 때)
      if (playType === 'RETURN' && significantPlays.includes('TURNOVER') && !significantPlays.includes('FUMBLERECDEF')) {
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

      // 패스 디펜드 처리 (NOPASS 플레이에서 INTERCEPT가 아닐 때만)
      if (playType === 'NOPASS' && !significantPlays.includes('INTERCEPT')) {
        dbStats.passesDefended++;
        console.log(`   🛡️ DB 패스 디펜드!`);
      }

      // 수비 터치다운 처리 (RETURN 플레이에서 TURNOVER && TOUCHDOWN이 있을 때)
      if (playType === 'RETURN' && significantPlays.includes('TURNOVER') && significantPlays.includes('TOUCHDOWN')) {
        dbStats.defensiveTouchdowns++;
        console.log(`   🏆 DB 수비 터치다운!`);
      }
    }

    // 스페셜팀 역할일 때 스페셜팀 스탯 처리
    else if (playerRole === 'car' || playerRole === 'car2') {
      // 스페셜팀 리턴 처리 (playType이 RETURN이고 significantPlays에 KICKOFF/PUNT가 있을 때)
      if (playType === 'RETURN') {
        const hasKickoff = significantPlays.some(play => play === 'KICKOFF');
        const hasPunt = significantPlays.some(play => play === 'PUNT');
        const gainYard = clip.gainYard || 0;

        if (hasKickoff) {
          dbStats.kickoffReturn++;
          dbStats.kickoffReturnYard += gainYard;
          console.log(`   🔄 DB 킥오프 리턴: ${gainYard}야드`);
          
          // 킥오프 리턴 터치다운 처리
          if (significantPlays.includes('TOUCHDOWN')) {
            dbStats.kickoffReturnTouchdowns++;
            console.log(`   🏆 DB 킥오프 리턴 터치다운!`);
          }
        }

        if (hasPunt) {
          dbStats.puntReturn++;
          dbStats.puntReturnYard += gainYard;
          console.log(`   🔄 DB 펀트 리턴: ${gainYard}야드`);
          
          // 펀트 리턴 터치다운 처리
          if (significantPlays.includes('TOUCHDOWN')) {
            dbStats.puntReturnTouchdowns++;
            console.log(`   🏆 DB 펀트 리턴 터치다운!`);
          }
        }
      }
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
    
    // 스페셜팀 평균 야드 계산
    dbStats.yardPerKickoffReturn = dbStats.kickoffReturn > 0 
      ? Math.round((dbStats.kickoffReturnYard / dbStats.kickoffReturn) * 10) / 10 
      : 0;
      
    dbStats.yardPerPuntReturn = dbStats.puntReturn > 0 
      ? Math.round((dbStats.puntReturnYard / dbStats.puntReturn) * 10) / 10 
      : 0;
  }

  /**
   * DB 스탯 초기화
   */
  private initializeDBStats(jerseyNumber: number, teamName: string): DBStats {
    return {
      jerseyNumber,
      teamName,
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
      // 스페셜팀 스탯
      kickoffReturn: 0,
      kickoffReturnYard: 0,
      yardPerKickoffReturn: 0,
      puntReturn: 0,
      puntReturnYard: 0,
      yardPerPuntReturn: 0,
      kickoffReturnTouchdowns: 0,
      puntReturnTouchdowns: 0,
    };
  }

  /**
   * DB 키 생성
   */
  private getDBKey(jerseyNumber: number, offensiveTeam: string, gameData: GameData, role?: string): string {
    let teamName;
    
    if (role === 'car' || role === 'car2') {
      // 스페셜팀(리턴)일 때: 공격팀 소속
      teamName = offensiveTeam === 'Home' ? gameData.homeTeam : gameData.awayTeam;
    } else {
      // 수비일 때: 수비팀 소속
      teamName = offensiveTeam === 'Home' ? gameData.awayTeam : gameData.homeTeam;
    }
    
    return `${teamName}_DB_${jerseyNumber}`;
  }
}