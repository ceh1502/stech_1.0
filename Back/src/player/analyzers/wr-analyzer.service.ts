import { Injectable } from '@nestjs/common';
import { BaseAnalyzerService, ClipData, GameData } from './base-analyzer.service';

// WR 스탯 인터페이스
export interface WRStats {
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
  passingFumbles: number;
  rushingFumbles: number;
  passingFumblesLost: number;
  rushingFumblesLost: number;
  // 스페셜팀 스탯
  kickoffReturn: number;
  kickoffReturnYard: number;
  yardPerKickoffReturn: number;
  puntReturn: number;
  puntReturnYard: number;
  yardPerPuntReturn: number;
  returnTouchdown: number;
  puntReturnTouchdowns: number;
  longestPuntReturn: number;
}

@Injectable()
export class WrAnalyzerService extends BaseAnalyzerService {

  /**
   * WR 클립 분석 메인 메서드
   */
  async analyzeClips(clips: ClipData[], gameData: GameData): Promise<any> {
    console.log(`\n📡 WR 분석 시작 - ${clips.length}개 클립`);
    
    if (clips.length === 0) {
      console.log('⚠️ WR 클립이 없습니다.');
      return { wrCount: 0, message: 'WR 클립이 없습니다.' };
    }

    // WR 선수별로 스탯 수집
    const wrStatsMap = new Map<string, WRStats>();
    const processedClipKeys = new Set<string>();

    for (const clip of clips) {
      this.processClipForWR(clip, wrStatsMap, gameData, processedClipKeys);
    }

    // 각 WR의 최종 스탯 계산 및 저장
    let savedCount = 0;
    const results = [];

    for (const [wrKey, wrStats] of wrStatsMap) {
      // 최종 계산
      this.calculateFinalStats(wrStats);
      
      console.log(`📡 WR ${wrStats.jerseyNumber}번 (${wrStats.teamName}) 최종 스탯:`);
      console.log(`   리시빙 타겟: ${wrStats.receivingTargets}`);
      console.log(`   리셉션: ${wrStats.receptions}`);
      console.log(`   리시빙야드: ${wrStats.receivingYards}`);
      console.log(`   평균야드: ${wrStats.yardsPerReception}`);
      console.log(`   리시빙TD: ${wrStats.receivingTouchdowns}`);
      console.log(`   가장 긴 리셉션: ${wrStats.longestReception}`);
      console.log(`   1다운: ${wrStats.receivingFirstDowns}`);
      console.log(`   러싱 시도: ${wrStats.rushingAttempts}, 야드: ${wrStats.rushingYards}`);
      console.log(`   펌블: 총 ${wrStats.fumbles}개 (패스: ${wrStats.passingFumbles}, 런: ${wrStats.rushingFumbles})`);
      console.log(`   펌블 턴오버: 총 ${wrStats.fumblesLost}개 (패스: ${wrStats.passingFumblesLost}, 런: ${wrStats.rushingFumblesLost})`);
      console.log(`   킥오프 리턴: ${wrStats.kickoffReturn}, 야드: ${wrStats.kickoffReturnYard}`);
      console.log(`   펀트 리턴: ${wrStats.puntReturn}, 야드: ${wrStats.puntReturnYard}`);

      // 데이터베이스에 저장
      const saveResult = await this.savePlayerStats(
        wrStats.jerseyNumber,
        wrStats.teamName,
        'WR',
        {
          gamesPlayed: wrStats.gamesPlayed,
          // 리시빙 스탯
          wrReceivingTargets: wrStats.receivingTargets,
          wrReceptions: wrStats.receptions,
          wrReceivingYards: wrStats.receivingYards,
          wrYardsPerReception: wrStats.yardsPerReception,
          wrReceivingTouchdowns: wrStats.receivingTouchdowns,
          wrLongestReception: wrStats.longestReception,
          wrReceivingFirstDowns: wrStats.receivingFirstDowns,
          // 러싱 스탯
          wrRushingAttempts: wrStats.rushingAttempts,
          wrRushingYards: wrStats.rushingYards,
          wrYardsPerCarry: wrStats.yardsPerCarry,
          wrRushingTouchdowns: wrStats.rushingTouchdowns,
          wrLongestRush: wrStats.longestRush,
          fumbles: wrStats.fumbles,
          fumblesLost: wrStats.fumblesLost,
          passingFumbles: wrStats.passingFumbles,
          rushingFumbles: wrStats.rushingFumbles,
          passingFumblesLost: wrStats.passingFumblesLost,
          rushingFumblesLost: wrStats.rushingFumblesLost,
          // 스페셜팀 스탯
          kickReturns: wrStats.kickoffReturn,
          kickReturnYards: wrStats.kickoffReturnYard,
          yardsPerKickReturn: wrStats.yardPerKickoffReturn,
          puntReturns: wrStats.puntReturn,
          puntReturnYards: wrStats.puntReturnYard,
          yardsPerPuntReturn: wrStats.yardPerPuntReturn,
          returnTouchdowns: wrStats.returnTouchdown,
        }
      );

      if (saveResult.success) {
        savedCount++;
      }
      results.push(saveResult);
    }

    console.log(`✅ WR 분석 완료: ${savedCount}명의 WR 스탯 저장\n`);

    return {
      wrCount: savedCount,
      message: `${savedCount}명의 WR 스탯이 분석되었습니다.`,
      results
    };
  }

  /**
   * 개별 클립을 WR 관점에서 처리
   */
  private processClipForWR(clip: ClipData, wrStatsMap: Map<string, WRStats>, gameData: GameData, processedClipKeys: Set<string>): void {
    // WR는 car나 car2에서 pos가 'WR'인 경우
    const wrPlayers = [];
    
    if (clip.car?.pos === 'WR') {
      wrPlayers.push({ number: clip.car.num, role: 'car' });
    }
    if (clip.car2?.pos === 'WR') {
      wrPlayers.push({ number: clip.car2.num, role: 'car2' });
    }

    for (const wrPlayer of wrPlayers) {
      const wrKey = this.getWRKey(wrPlayer.number, clip.offensiveTeam, gameData);
      
      if (!wrStatsMap.has(wrKey)) {
        wrStatsMap.set(wrKey, this.initializeWRStats(wrPlayer.number, clip.offensiveTeam, gameData));
      }

      const wrStats = wrStatsMap.get(wrKey);
      this.processPlay(clip, wrStats, processedClipKeys);
    }
  }

  /**
   * 개별 플레이 처리
   */
  private processPlay(clip: ClipData, wrStats: WRStats, processedClipKeys: Set<string>): void {
    const playType = clip.playType?.toUpperCase();
    const gainYard = clip.gainYard || 0;
    const significantPlays = clip.significantPlays || [];

    // PASS 플레이 처리 (리시빙)
    if (playType === 'PASS') {
      // FUMBLERECOFF는 패스 플레이 아님 (리커버리 상황)
      // FUMBLERECDEF + TURNOVER는 패스 플레이 아님 (턴오버 상황)
      const hasFumbleRecOff = significantPlays.includes('FUMBLERECOFF');
      const hasTurnover = significantPlays.includes('FUMBLERECDEF') && significantPlays.includes('TURNOVER');
      
      if (!hasFumbleRecOff && !hasTurnover) {
        wrStats.receivingTargets++;

        // 패스 성공 여부 체크 (INCOMP가 없으면 캐치 성공)
        const isIncomplete = significantPlays.includes('INCOMP');
        
        if (!isIncomplete) {
          // 패스 캐치 성공 (FUMBLE+FUMBLERECDEF도 캐치는 성공)
          wrStats.receptions++;
          wrStats.receivingYards += gainYard;

          // 가장 긴 리셉션 업데이트
          if (gainYard > wrStats.longestReception) {
            wrStats.longestReception = gainYard;
          }

          // 1다운 체크 (gainYard가 toGoYard 이상이면 1다운)
          if (clip.toGoYard && gainYard >= clip.toGoYard) {
            wrStats.receivingFirstDowns++;
          }
        }
      }
    }

    // NOPASS 플레이 처리 (패스 시도했지만 캐치 못함)
    if (playType === 'NOPASS') {
      wrStats.receivingTargets++;
      // NOPASS는 리셉션 카운트 안 함
    }

    // RUN 플레이 처리
    if (playType === 'RUN') {
      // FUMBLERECOFF는 러싱 시도 아님 (리커버리 상황)
      // FUMBLERECDEF + TURNOVER는 러싱 시도 아님 (턴오버 상황)
      const hasFumbleRecOff = significantPlays.includes('FUMBLERECOFF');
      const hasTurnover = significantPlays.includes('FUMBLERECDEF') && significantPlays.includes('TURNOVER');
      
      if (!hasFumbleRecOff && !hasTurnover) {
        wrStats.rushingAttempts++;

        // TFL(Tackle For Loss)나 SAFETY 체크
        const hasTFL = significantPlays.some(play => play === 'TFL');
        const hasSAFETY = significantPlays.some(play => play === 'SAFETY');

        if (hasTFL || hasSAFETY) {
          wrStats.backRushYard += gainYard;
        } else {
          wrStats.frontRushYard += gainYard;
        }

        // 가장 긴 러싱 업데이트
        if (gainYard > wrStats.longestRush) {
          wrStats.longestRush = gainYard;
        }
      }
      
      // 러싱 펌블 처리는 공통 processSignificantPlays에서 처리
    }

    // 스페셜팀 리턴 처리 (playType이 RETURN이고 significantPlays에 KICKOFF/PUNT가 있을 때)
    if (playType === 'RETURN') {
      const hasKickoff = significantPlays.some(play => play === 'KICKOFF');
      const hasPunt = significantPlays.some(play => play === 'PUNT');

      if (hasKickoff) {
        wrStats.kickoffReturn++;
        wrStats.kickoffReturnYard += gainYard;
      }

      if (hasPunt) {
        wrStats.puntReturn++;
        wrStats.puntReturnYard += gainYard;
        
        // 가장 긴 펀트 리턴 업데이트
        if (gainYard > (wrStats.longestPuntReturn || 0)) {
          wrStats.longestPuntReturn = gainYard;
          console.log(`   🟡 WR 펀트 리턴: ${gainYard}야드 (신기록!)`);
        } else {
          console.log(`   🟡 WR 펀트 리턴: ${gainYard}야드`);
        }
        
        // 펀트 리턴 터치다운 처리
        if (significantPlays.includes('TOUCHDOWN')) {
          wrStats.puntReturnTouchdowns = (wrStats.puntReturnTouchdowns || 0) + 1;
          console.log(`   🏆 WR 펀트 리턴 터치다운!`);
        }
      }
    }

    // 공통 변수 정의
    const fumbleKey = `${clip.clipKey}_FUMBLE`;
    const hasFumble = significantPlays.some(play => play?.trim() === 'FUMBLE');
    const hasFumbleRecOff = significantPlays.some(play => play?.trim() === 'FUMBLERECOFF');
    const hasFumbleRecDef = significantPlays.some(play => play?.trim() === 'FUMBLERECDEF');

    // 펌블 직접 처리 (clipKey별로 한 번만 카운트, 패스/런 유형별로 분류)
    if (hasFumble && !hasFumbleRecOff && !processedClipKeys.has(fumbleKey)) {
      processedClipKeys.add(fumbleKey);
      wrStats.fumbles++;
      
      console.log(`   🔥 펌블 카운트: clipKey=${clip.clipKey}, playType=${playType}`);
      
      if (playType === 'PASS') {
        wrStats.passingFumbles++;
        console.log(`   📡 패스 펌블 +1 (총: ${wrStats.passingFumbles})`);
      } else if (playType === 'RUN') {
        wrStats.rushingFumbles++;
        console.log(`   🏃 런 펌블 +1 (총: ${wrStats.rushingFumbles})`);
      }
    }

    // 패싱 펌블 턴오버 별도 처리 (PASS + FUMBLE + FUMBLERECDEF)
    if (playType === 'PASS' && hasFumble && hasFumbleRecDef) {
      wrStats.fumblesLost++;
      wrStats.passingFumblesLost++;
      console.log(`   💔 패스 펌블 턴오버 +1`);
    }

    // 러싱 펌블 턴오버 별도 처리 (RUN + FUMBLE + FUMBLERECDEF)
    if (playType === 'RUN' && hasFumble && hasFumbleRecDef) {
      wrStats.fumblesLost++;
      wrStats.rushingFumblesLost++;
      console.log(`   💔 런 펌블 턴오버 +1`);
    }

    // 터치다운만 공통 처리 (펌블은 위에서 직접 처리했으므로 제외)
    if (significantPlays.includes('TOUCHDOWN')) {
      this.processTouchdown(wrStats, playType);
    }
  }

  /**
   * 터치다운 처리 (BaseAnalyzer에서 오버라이드)
   */
  protected processTouchdown(stats: WRStats, playType: string): void {
    if (playType === 'PASS') {
      stats.receivingTouchdowns++;
      console.log(`   🏈 리시빙 터치다운!`);
    } else if (playType === 'RUN') {
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
  private calculateFinalStats(wrStats: WRStats): void {
    // 총 러싱야드 = FrontRushYard - BackRushYard
    wrStats.rushingYards = wrStats.frontRushYard - wrStats.backRushYard;

    // 평균 야드 계산
    wrStats.yardsPerCarry = wrStats.rushingAttempts > 0 
      ? Math.round((wrStats.rushingYards / wrStats.rushingAttempts) * 10) / 10 
      : 0;

    wrStats.yardsPerReception = wrStats.receptions > 0 
      ? Math.round((wrStats.receivingYards / wrStats.receptions) * 10) / 10 
      : 0;

    // 스페셜팀 평균 야드 계산
    wrStats.yardPerKickoffReturn = wrStats.kickoffReturn > 0 
      ? Math.round((wrStats.kickoffReturnYard / wrStats.kickoffReturn) * 10) / 10 
      : 0;

    wrStats.yardPerPuntReturn = wrStats.puntReturn > 0 
      ? Math.round((wrStats.puntReturnYard / wrStats.puntReturn) * 10) / 10 
      : 0;

    // 게임 수는 1로 설정 (하나의 게임 데이터이므로)
    wrStats.gamesPlayed = 1;
  }

  /**
   * WR 스탯 초기화
   */
  private initializeWRStats(jerseyNumber: number, offensiveTeam: string, gameData: GameData): WRStats {
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
      passingFumbles: 0,
      rushingFumbles: 0,
      passingFumblesLost: 0,
      rushingFumblesLost: 0,
      // 스페셜팀 스탯
      kickoffReturn: 0,
      kickoffReturnYard: 0,
      yardPerKickoffReturn: 0,
      puntReturn: 0,
      puntReturnYard: 0,
      yardPerPuntReturn: 0,
      returnTouchdown: 0,
      puntReturnTouchdowns: 0,
      longestPuntReturn: 0,
    };
  }

  /**
   * WR 키 생성
   */
  private getWRKey(jerseyNumber: number, offensiveTeam: string, gameData: GameData): string {
    const teamName = offensiveTeam === 'Home' ? gameData.homeTeam : gameData.awayTeam;
    return `${teamName}_WR_${jerseyNumber}`;
  }
}