import { Injectable } from '@nestjs/common';
import { BaseAnalyzerService, ClipData, GameData } from './base-analyzer.service';

// QB 전용 스탯 인터페이스
export interface QBStats {
  jerseyNumber: number;
  teamName: string;
  gamesPlayed: number;
  
  // === 패싱 스탯 ===
  passingAttempts: number;        // 패스 시도 수
  passingCompletions: number;     // 패스 성공 수  
  completionPercentage: number;   // 패스 성공률 (%)
  passingYards: number;           // 패싱 야드
  passingTouchdowns: number;      // 패싱 터치다운
  passingInterceptions: number;   // 인터셉트
  longestPass: number;            // 가장 긴 패스
  
  // === 러싱 스탯 ===
  rushingAttempts: number;        // 러싱 시도 수
  rushingYards: number;           // 러싱 야드
  yardsPerCarry: number;          // 볼 캐리 당 러싱 야드
  rushingTouchdowns: number;      // 러싱 터치다운
  longestRush: number;            // 가장 긴 러싱

  // === 기타 스탯 ===
  sacks: number;                  // 색 허용 수
  fumbles: number;                // 펌블 수
}

@Injectable()
export class QbAnalyzerService extends BaseAnalyzerService {
  /**
   * QB 클립들 분석
   */
  async analyzeClips(clips: ClipData[], gameData: GameData): Promise<any> {
    console.log(`\n🏈 QB 분석 시작 - 총 클립 수: ${clips.length}`);
    
    // QB별 스탯 누적을 위한 Map
    const qbStatsMap = new Map<string, QBStats>();

    // 클립 하나씩 분석
    for (const clip of clips) {
      await this.analyzeClip(clip, gameData, qbStatsMap);
    }

    // 최종 스탯 계산 및 저장
    const results = [];
    for (const [qbKey, qbStats] of qbStatsMap) {
      // 계산된 스탯 완성
      this.calculateFinalStats(qbStats);

      // 데이터베이스에 저장
      const saveResult = await this.savePlayerStats(
        qbStats.jerseyNumber,
        qbStats.teamName,
        'QB',
        qbStats,
      );
      results.push(saveResult);

      console.log(
        `\n🏈 QB ${qbStats.jerseyNumber}번 (${qbStats.teamName}) 최종 스탯:`,
      );
      console.log(
        `   패싱: ${qbStats.passingAttempts}시도/${qbStats.passingCompletions}성공 (${qbStats.completionPercentage}%)`,
      );
      console.log(
        `   패싱야드: ${qbStats.passingYards}, TD: ${qbStats.passingTouchdowns}, INT: ${qbStats.passingInterceptions}`,
      );
      console.log(
        `   최장패스: ${qbStats.longestPass}야드`,
      );
      console.log(
        `   러싱: ${qbStats.rushingAttempts}시도, ${qbStats.rushingYards}야드, TD: ${qbStats.rushingTouchdowns}`,
      );
      console.log(
        `   최장러싱: ${qbStats.longestRush}야드`,
      );
      console.log(`   색: ${qbStats.sacks}, 펌블: ${qbStats.fumbles}`);
    }

    console.log(`\n✅ QB 분석 완료 - ${qbStatsMap.size}명의 QB 처리됨`);
    return {
      success: true,
      message: `${qbStatsMap.size}명의 QB 스탯이 업데이트되었습니다.`,
      qbCount: qbStatsMap.size,
      results,
    };
  }

  /**
   * 개별 클립에서 QB 찾기 및 분석
   */
  private async analyzeClip(
    clip: ClipData,
    gameData: GameData,
    qbStatsMap: Map<string, QBStats>,
  ): Promise<void> {
    // 공격팀 결정
    const offensiveTeam =
      clip.offensiveTeam === 'Home' ? gameData.homeTeam : gameData.awayTeam;

    // QB 찾기: car 또는 car2에서 pos가 'QB'인 선수
    let qb: { num: number; pos: string } | null = null;
    if (clip.car?.pos === 'QB') {
      qb = clip.car;
    } else if (clip.car2?.pos === 'QB') {
      qb = { num: clip.car2.num!, pos: clip.car2.pos! };
    }

    if (!qb) return; // QB가 없으면 스킵

    // QB 스탯 객체 가져오기 또는 생성
    const qbKey = `${offensiveTeam}-${qb.num}`;
    if (!qbStatsMap.has(qbKey)) {
      qbStatsMap.set(qbKey, this.createEmptyQBStats(qb.num, offensiveTeam));
    }

    const qbStats = qbStatsMap.get(qbKey)!;

    // 플레이 타입별 스탯 처리
    this.processPlay(clip, qbStats);

    console.log(
      `📡 QB ${qb.num}번 (${offensiveTeam}): ${clip.playType}, ${clip.gainYard}야드`,
    );
  }

  /**
   * 플레이별 스탯 처리
   */
  private processPlay(clip: ClipData, qbStats: QBStats): void {
    const playType = clip.playType;
    const gainYard = clip.gainYard;

    // === 패싱 플레이 처리 ===
    if (playType === 'PASS') {
      // 패스 시도 및 성공 카운트
      qbStats.passingAttempts++;
      qbStats.passingCompletions++;
      
      // 패싱 야드 누적
      qbStats.passingYards += gainYard;

      // 최장 패스 업데이트
      console.log(`🔍 패스 거리 비교: 현재 ${gainYard}야드 vs 기존 최장 ${qbStats.longestPass}야드`);
      if (gainYard > qbStats.longestPass) {
        console.log(`✅ 최장 패스 업데이트: ${qbStats.longestPass} → ${gainYard}`);
        qbStats.longestPass = gainYard;
      }
    } 
    // === 패스 실패 처리 ===
    else if (playType === 'NOPASS') {
      // 패스 시도했지만 실패 (완주되지 않음)
      qbStats.passingAttempts++;
    } 
    // === 색 처리 ===
    else if (playType === 'SACK') {
      // QB가 색당함
      qbStats.sacks++;
    } 
    // === 러싱 플레이 처리 ===
    else if (playType === 'RUN') {
      // QB 러시: QB가 직접 공을 들고 뛰는 플레이
      qbStats.rushingAttempts++;
      qbStats.rushingYards += gainYard;

      // 최장 러시 업데이트
      console.log(`🏃 러시 거리 비교: 현재 ${gainYard}야드 vs 기존 최장 ${qbStats.longestRush}야드`);
      if (gainYard > qbStats.longestRush) {
        console.log(`✅ 최장 러시 업데이트: ${qbStats.longestRush} → ${gainYard}`);
        qbStats.longestRush = gainYard;
      }
    }

    // significantPlays 처리 (터치다운, 인터셉션 등)
    this.processSignificantPlays(clip, qbStats, playType);
  }

  /**
   * QB 터치다운 처리 (BaseAnalyzer 오버라이드)
   */
  protected processTouchdown(stats: QBStats, playType: string): void {
    if (playType === 'PASS') {
      // 패싱 터치다운
      stats.passingTouchdowns++;
    } else if (playType === 'RUN') {
      // 러싱 터치다운 (QB 스크램블)
      stats.rushingTouchdowns++;
    }
  }

  /**
   * 최종 계산된 스탯 완성
   */
  private calculateFinalStats(qbStats: QBStats): void {
    // 패스 성공률 계산: (성공/시도) * 100
    qbStats.completionPercentage =
      qbStats.passingAttempts > 0
        ? Math.round(
            (qbStats.passingCompletions / qbStats.passingAttempts) * 100,
          )
        : 0;

    // 러시 평균 계산: 총야드/시도
    qbStats.yardsPerCarry =
      qbStats.rushingAttempts > 0
        ? Math.round((qbStats.rushingYards / qbStats.rushingAttempts) * 10) / 10
        : 0;

    // 게임 수 (현재는 1게임으로 고정)
    qbStats.gamesPlayed = 1;
  }

  /**
   * 빈 QB 스탯 객체 생성
   */
  private createEmptyQBStats(jerseyNumber: number, teamName: string): QBStats {
    return {
      jerseyNumber,
      teamName,
      gamesPlayed: 0,
      
      // 패싱 스탯 초기화
      passingAttempts: 0,
      passingCompletions: 0,
      completionPercentage: 0,
      passingYards: 0,
      passingTouchdowns: 0,
      passingInterceptions: 0,
      longestPass: 0,
      
      // 러싱 스탯 초기화
      rushingAttempts: 0,
      rushingYards: 0,
      yardsPerCarry: 0,
      rushingTouchdowns: 0,
      longestRush: 0,
      
      // 기타 스탯 초기화
      sacks: 0,
      fumbles: 0,
    };
  }
}