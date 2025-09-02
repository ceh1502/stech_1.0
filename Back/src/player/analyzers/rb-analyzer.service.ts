import { Injectable } from '@nestjs/common';
import { BaseAnalyzerService, ClipData, GameData } from './base-analyzer.service';

// RB 스탯 인터페이스
export interface RBStats {
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
  frontRushYard: number; // TFL/SAFETY 없을 때의 러싱야드
  backRushYard: number;  // TFL/SAFETY 있을 때의 러싱야드
  rushingYards: number;  // frontRushYard - backRushYard
  yardsPerCarry: number;
  rushingTouchdowns: number;
  longestRush: number;
  fumbles: number;
  fumblesLost: number; // FUMBLERECDEF가 있을 때
  rushingFumbles: number; // 러싱 플레이에서의 펌블
  rushingFumblesLost: number; // 러싱 플레이에서의 펌블 로스트
  passingFumbles: number; // 패싱 플레이에서의 펌블
  passingFumblesLost: number; // 패싱 플레이에서의 펌블 로스트
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
    const processedClipKeys = new Set<string>();

    for (const clip of clips) {
      this.processClipForRB(clip, rbStatsMap, gameData, processedClipKeys);
    }

    // 각 RB의 최종 스탯 계산 및 저장
    let savedCount = 0;
    const results = [];

    for (const [rbKey, rbStats] of rbStatsMap) {
      // 최종 계산
      this.calculateFinalStats(rbStats);
      
      console.log(`🏈 RB ${rbStats.jerseyNumber}번 (${rbStats.teamName}) 최종 스탯:`);
      console.log(`   === 패스 유형 ===`);
      console.log(`   리시빙 타겟: ${rbStats.receivingTargets}`);
      console.log(`   리셉션: ${rbStats.receptions}`);
      console.log(`   리시빙야드: ${rbStats.receivingYards}`);
      console.log(`   평균야드: ${rbStats.yardsPerReception}`);
      console.log(`   리시빙TD: ${rbStats.receivingTouchdowns}`);
      console.log(`   가장 긴 리셉션: ${rbStats.longestReception}`);
      console.log(`   1다운: ${rbStats.receivingFirstDowns}`);
      console.log(`   패스 펌블: ${rbStats.passingFumbles}`);
      console.log(`   패스 펌블 턴오버: ${rbStats.passingFumblesLost}`);
      console.log(`   === 런 유형 ===`);
      console.log(`   러싱 시도: ${rbStats.rushingAttempts}, 야드: ${rbStats.rushingYards}`);
      console.log(`   런 펌블: ${rbStats.rushingFumbles}`);
      console.log(`   런 펌블 턴오버: ${rbStats.rushingFumblesLost}`);
      console.log(`   === 스페셜팀 ===`);
      console.log(`   킥오프 리턴: ${rbStats.kickoffReturn}, 야드: ${rbStats.kickoffReturnYard}`);
      console.log(`   펀트 리턴: ${rbStats.puntReturn}, 야드: ${rbStats.puntReturnYard}`);

      // 데이터베이스에 저장
      const saveResult = await this.savePlayerStats(
        rbStats.jerseyNumber,
        rbStats.teamName,
        'RB',
        {
          gamesPlayed: rbStats.gamesPlayed,
          // 리시빙 스탯
          rbReceivingTargets: rbStats.receivingTargets,
          rbReceptions: rbStats.receptions,
          rbReceivingYards: rbStats.receivingYards,
          rbYardsPerReception: rbStats.yardsPerReception,
          rbReceivingTouchdowns: rbStats.receivingTouchdowns,
          rbLongestReception: rbStats.longestReception,
          rbReceivingFirstDowns: rbStats.receivingFirstDowns,
          // 러싱 스탯
          rbRushingAttempts: rbStats.rushingAttempts,
          rbRushingYards: rbStats.rushingYards,
          rbYardsPerCarry: rbStats.yardsPerCarry,
          rbRushingTouchdowns: rbStats.rushingTouchdowns,
          rbLongestRush: rbStats.longestRush,
          fumbles: rbStats.fumbles,
          fumblesLost: rbStats.fumblesLost,
          passingFumbles: rbStats.passingFumbles,
          rushingFumbles: rbStats.rushingFumbles,
          passingFumblesLost: rbStats.passingFumblesLost,
          rushingFumblesLost: rbStats.rushingFumblesLost,
          // 스페셜팀 스탯
          kickReturns: rbStats.kickoffReturn,
          kickReturnYards: rbStats.kickoffReturnYard,
          yardsPerKickReturn: rbStats.yardPerKickoffReturn,
          puntReturns: rbStats.puntReturn,
          puntReturnYards: rbStats.puntReturnYard,
          yardsPerPuntReturn: rbStats.yardPerPuntReturn,
          returnTouchdowns: rbStats.returnTouchdown,
          puntReturnTouchdowns: rbStats.puntReturnTouchdowns,
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
  private processClipForRB(clip: ClipData, rbStatsMap: Map<string, RBStats>, gameData: GameData, processedClipKeys: Set<string>): void {
    // RB는 car나 car2에서 pos가 'RB'인 경우
    const rbPlayers = [];
    
    if (clip.car?.pos === 'RB') {
      rbPlayers.push({ number: clip.car.num, role: 'car' });
    }
    if (clip.car2?.pos === 'RB') {
      rbPlayers.push({ number: clip.car2.num, role: 'car2' });
    }

    console.log(`🔍 RB 클립 분석: playType=${clip.playType}, RB선수=${rbPlayers.length}명, significantPlays=${clip.significantPlays?.join(',')}`);

    for (const rbPlayer of rbPlayers) {
      const rbKey = this.getRBKey(rbPlayer.number, clip.offensiveTeam, gameData);
      
      if (!rbStatsMap.has(rbKey)) {
        rbStatsMap.set(rbKey, this.initializeRBStats(rbPlayer.number, clip.offensiveTeam, gameData));
      }

      const rbStats = rbStatsMap.get(rbKey);
      console.log(`📈 RB ${rbPlayer.number}번 처리 중...`);
      this.processPlay(clip, rbStats, processedClipKeys);
    }
  }

  /**
   * 개별 플레이 처리
   */
  private processPlay(clip: ClipData, rbStats: RBStats, processedClipKeys: Set<string>): void {
    const playType = clip.playType?.toUpperCase();
    const gainYard = clip.gainYard || 0;
    const significantPlays = clip.significantPlays || [];

    // PASS 플레이 처리 (RB가 패스를 받는 경우)
    if (playType === 'PASS') {
      // FUMBLERECOFF는 패스 플레이 아님 (리커버리 상황)
      // FUMBLERECDEF + TURNOVER는 패스 플레이 아님 (턴오버 상황)
      const hasFumbleRecOff = significantPlays.includes('FUMBLERECOFF');
      const hasTurnover = significantPlays.includes('FUMBLERECDEF') && significantPlays.includes('TURNOVER');
      
      if (!hasFumbleRecOff && !hasTurnover) {
        rbStats.receivingTargets++;
        console.log(`   📊 RB 패스 타겟 +1 (총: ${rbStats.receivingTargets})`);

        // 패스 성공 여부 체크 (INCOMP가 없으면 캐치 성공)
        const isIncomplete = significantPlays.includes('INCOMP');
        
        if (!isIncomplete) {
          // 패스 캐치 성공 (FUMBLE+FUMBLERECDEF도 캐치는 성공)
          rbStats.receptions++;
          rbStats.receivingYards += gainYard;

          // 가장 긴 리셉션 업데이트
          if (gainYard > rbStats.longestReception) {
            rbStats.longestReception = gainYard;
          }

          // 1다운 체크 (gainYard가 toGoYard 이상이면 1다운)
          if (clip.toGoYard && gainYard >= clip.toGoYard) {
            rbStats.receivingFirstDowns++;
          }
          
          console.log(`   📡 RB 패스 캐치 +1: ${gainYard}야드 (리셉션: ${rbStats.receptions}, 총야드: ${rbStats.receivingYards})`);
        } else {
          console.log(`   ❌ RB 패스 인컴플리트`);
        }
      }
    }

    // NOPASS 플레이 처리 (패스 시도했지만 캐치 못함)
    if (playType === 'NOPASS') {
      rbStats.receivingTargets++;
      console.log(`   📊 RB NOPASS 타겟 +1 (총: ${rbStats.receivingTargets})`);
      // NOPASS는 리셉션 카운트 안 함
    }

    // RUN 플레이 처리
    if (playType === 'RUN') {
      // FUMBLERECOFF는 러싱 시도 아님 (리커버리 상황)
      // FUMBLERECDEF + TURNOVER는 러싱 시도 아님 (턴오버 상황)
      const hasFumbleRecOff = significantPlays.includes('FUMBLERECOFF');
      const hasTurnover = significantPlays.includes('FUMBLERECDEF') && significantPlays.includes('TURNOVER');
      
      if (!hasFumbleRecOff && !hasTurnover) {
        rbStats.rushingAttempts++;

        // TFL(Tackle For Loss)나 SAFETY 체크
        const hasTFL = significantPlays.some(play => play === 'TFL');
        const hasSAFETY = significantPlays.some(play => play === 'SAFETY');

        if (hasTFL || hasSAFETY) {
          rbStats.backRushYard += gainYard;
        } else {
          rbStats.frontRushYard += gainYard;
        }

        // 가장 긴 러싱 업데이트
        if (gainYard > rbStats.longestRush) {
          rbStats.longestRush = gainYard;
        }
      }
      
      // 러싱 펌블 처리는 공통 processSignificantPlays에서 처리
    }

    // 스페셜팀 리턴 처리 (playType이 RETURN이고 significantPlays에 KICKOFF/PUNT가 있을 때)
    if (playType === 'RETURN') {
      const hasKickoff = significantPlays.some(play => play === 'KICKOFF');
      const hasPunt = significantPlays.some(play => play === 'PUNT');

      if (hasKickoff) {
        rbStats.kickoffReturn++;
        rbStats.kickoffReturnYard += gainYard;
      }

      if (hasPunt) {
        rbStats.puntReturn++;
        rbStats.puntReturnYard += gainYard;
        
        // 가장 긴 펀트 리턴 업데이트
        if (gainYard > (rbStats.longestPuntReturn || 0)) {
          rbStats.longestPuntReturn = gainYard;
          console.log(`   🟡 RB 펀트 리턴: ${gainYard}야드 (신기록!)`);
        } else {
          console.log(`   🟡 RB 펀트 리턴: ${gainYard}야드`);
        }
        
        // 펀트 리턴 터치다운 처리
        if (significantPlays.includes('TOUCHDOWN')) {
          rbStats.puntReturnTouchdowns = (rbStats.puntReturnTouchdowns || 0) + 1;
          console.log(`   🏆 RB 펀트 리턴 터치다운!`);
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
      
      console.log(`   🔥 펌블 카운트: clipKey=${clip.clipKey}, playType=${playType}`);
      
      if (playType === 'PASS') {
        rbStats.passingFumbles++;
        console.log(`   📡 패스 펌블 +1 (총: ${rbStats.passingFumbles})`);
      } else if (playType === 'RUN') {
        rbStats.rushingFumbles++;
        console.log(`   🏃 런 펌블 +1 (총: ${rbStats.rushingFumbles})`);
      }
    }

    // 패싱 펌블 턴오버 별도 처리 (PASS + FUMBLE + FUMBLERECDEF)
    if (playType === 'PASS' && hasFumble && hasFumbleRecDef) {
      rbStats.passingFumblesLost++;
      console.log(`   💔 패스 펌블 턴오버 +1`);
    }

    // 러싱 펌블 턴오버 별도 처리 (RUN + FUMBLE + FUMBLERECDEF)
    if (playType === 'RUN' && hasFumble && hasFumbleRecDef) {
      rbStats.rushingFumblesLost++;
      console.log(`   💔 런 펌블 턴오버 +1`);
    }

    // 터치다운만 공통 처리 (펌블은 위에서 직접 처리했으므로 제외)
    if (significantPlays.includes('TOUCHDOWN')) {
      this.processTouchdown(rbStats, playType);
    }
  }

  /**
   * 터치다운 처리 (BaseAnalyzer에서 오버라이드)
   */
  protected processTouchdown(stats: RBStats, playType: string): void {
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
  private calculateFinalStats(rbStats: RBStats): void {
    // 총 러싱야드 = FrontRushYard - BackRushYard
    rbStats.rushingYards = rbStats.frontRushYard - rbStats.backRushYard;

    // 총 펌블 계산
    rbStats.fumbles = rbStats.passingFumbles + rbStats.rushingFumbles;
    rbStats.fumblesLost = rbStats.passingFumblesLost + rbStats.rushingFumblesLost;

    // 평균 야드 계산
    rbStats.yardsPerCarry = rbStats.rushingAttempts > 0 
      ? Math.round((rbStats.rushingYards / rbStats.rushingAttempts) * 10) / 10 
      : 0;

    rbStats.yardsPerReception = rbStats.receptions > 0 
      ? Math.round((rbStats.receivingYards / rbStats.receptions) * 10) / 10 
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
      // 스페셜팀 스탯 초기화
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
   * 수비수의 강제 펌블 처리 (RB 클립에서 tkl 필드의 수비수)
   */
  private processDefensiveFumbleForces(clip: ClipData, gameData: GameData): void {
    // FUMBLE이 있고 tkl 필드에 수비수가 있으면 강제 펌블로 기록
    if (!clip.significantPlays?.includes('FUMBLE')) return;

    const defensiveTeam = clip.offensiveTeam === 'Home' ? 'Away' : 'Home';
    
    // tkl 필드의 수비수들 처리
    const tacklers = [clip.tkl, clip.tkl2].filter(t => t?.num && t?.pos);
    
    for (const tackler of tacklers) {
      if (tackler.pos && ['DL', 'LB', 'DB'].includes(tackler.pos)) {
        console.log(`   💪 ${tackler.pos} ${tackler.num}번이 펌블 강제 유도`);
        // 수비수 강제 펌블 스탯은 해당 수비수 분석기에서 처리됨
      }
    }
  }

  /**
   * RB 키 생성
   */
  private getRBKey(jerseyNumber: number, offensiveTeam: string, gameData: GameData): string {
    const teamName = offensiveTeam === 'Home' ? gameData.homeTeam : gameData.awayTeam;
    return `${teamName}_RB_${jerseyNumber}`;
  }
}