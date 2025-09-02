import { Injectable } from '@nestjs/common';
import { BaseAnalyzerService, ClipData, GameData } from './base-analyzer.service';

// 키커 스탯 인터페이스
export interface KStats {
  jerseyNumber: number;
  teamName: string;
  gamesPlayed: number;
  // 필드골 스탯
  fieldGoalsAttempted: number;
  fieldGoalsMade: number;
  fieldGoalPercentage: number;
  longestFieldGoal: number;
  totalFieldGoalYard: number;
  averageFieldGoalYard: number;
  // 거리별 필드골 성공
  fieldGoals1To19: number;
  fieldGoals20To29: number;
  fieldGoals30To39: number;
  fieldGoals40To49: number;
  fieldGoals50Plus: number;
  // 거리별 필드골 시도
  fieldGoalsAttempted1To19: number;
  fieldGoalsAttempted20To29: number;
  fieldGoalsAttempted30To39: number;
  fieldGoalsAttempted40To49: number;
  fieldGoalsAttempted50Plus: number;
  // PAT 스탯  
  extraPointsAttempted: number;
  extraPointsMade: number;
}

@Injectable()
export class KAnalyzerService extends BaseAnalyzerService {

  /**
   * 키커 클립 분석 메인 메서드
   */
  async analyzeClips(clips: ClipData[], gameData: GameData): Promise<any> {
    console.log(`\n🦶 키커 분석 시작 - ${clips.length}개 클립`);
    
    if (clips.length === 0) {
      console.log('⚠️ 키커 클립이 없습니다.');
      return { kCount: 0, message: '키커 클립이 없습니다.' };
    }

    // 키커 선수별로 스탯 수집
    const kStatsMap = new Map<string, KStats>();

    for (const clip of clips) {
      this.processClipForK(clip, kStatsMap, gameData);
    }

    // 각 키커의 최종 스탯 계산 및 저장
    let savedCount = 0;
    const results = [];

    for (const [kKey, kStats] of kStatsMap) {
      // 최종 계산
      this.calculateFinalStats(kStats);
      
      console.log(`🦶 키커 ${kStats.jerseyNumber}번 (${kStats.teamName}) 최종 스탯:`);
      console.log(`   필드골: ${kStats.fieldGoalsMade}/${kStats.fieldGoalsAttempted} (${kStats.fieldGoalPercentage}%)`);
      console.log(`   가장 긴 필드골: ${kStats.longestFieldGoal}야드`);
      console.log(`   평균 필드골: ${kStats.averageFieldGoalYard}야드`);
      console.log(`   PAT: ${kStats.extraPointsMade}/${kStats.extraPointsAttempted}`);
      console.log(`   거리별 필드골 (성공-시도):`);
      console.log(`     1-19야드: ${kStats.fieldGoals1To19}-${kStats.fieldGoalsAttempted1To19}`);
      console.log(`     20-29야드: ${kStats.fieldGoals20To29}-${kStats.fieldGoalsAttempted20To29}`);
      console.log(`     30-39야드: ${kStats.fieldGoals30To39}-${kStats.fieldGoalsAttempted30To39}`);
      console.log(`     40-49야드: ${kStats.fieldGoals40To49}-${kStats.fieldGoalsAttempted40To49}`);
      console.log(`     50+야드: ${kStats.fieldGoals50Plus}-${kStats.fieldGoalsAttempted50Plus}`);

      // 데이터베이스에 저장
      try {
        console.log(`💾 키커 ${kStats.jerseyNumber}번 (${kStats.teamName}) 저장 시도 시작...`);
        const saveResult = await this.savePlayerStats(
          kStats.jerseyNumber,
          kStats.teamName,
          'K',
          {
            gamesPlayed: kStats.gamesPlayed,
            // 필드골 스탯
            fieldGoalsAttempted: kStats.fieldGoalsAttempted,
            fieldGoalsMade: kStats.fieldGoalsMade,
            fieldGoalPercentage: kStats.fieldGoalPercentage,
            longestFieldGoal: kStats.longestFieldGoal,
            // PAT 스탯
            extraPointsAttempted: kStats.extraPointsAttempted,
            extraPointsMade: kStats.extraPointsMade,
          }
        );

        if (saveResult.success) {
          savedCount++;
          console.log(`✅ 키커 저장 성공:`, saveResult.message);
        } else {
          console.error(`❌ 키커 저장 실패:`, saveResult.message);
        }
        results.push(saveResult);
      } catch (error) {
        console.error(`💥 키커 저장 중 예외 발생:`, error);
        results.push({
          success: false,
          message: `키커 ${kStats.jerseyNumber}번 저장 중 예외: ${error.message}`,
        });
      }
    }

    console.log(`✅ 키커 분석 완료: ${savedCount}명의 키커 스탯 저장\n`);

    return {
      kCount: savedCount,
      message: `${savedCount}명의 키커 스탯이 분석되었습니다.`,
      results
    };
  }

  /**
   * 개별 클립을 키커 관점에서 처리
   */
  private processClipForK(clip: ClipData, kStatsMap: Map<string, KStats>, gameData: GameData): void {
    // 키커는 car나 car2에서 pos가 'K'인 경우
    const kPlayers = [];
    
    if (clip.car?.pos === 'K') {
      kPlayers.push({ number: clip.car.num, role: 'car' });
    }
    if (clip.car2?.pos === 'K') {
      kPlayers.push({ number: clip.car2.num, role: 'car2' });
    }

    for (const kPlayer of kPlayers) {
      const kKey = this.getKKey(kPlayer.number, clip.offensiveTeam, gameData);
      
      if (!kStatsMap.has(kKey)) {
        kStatsMap.set(kKey, this.initializeKStats(kPlayer.number, clip.offensiveTeam, gameData));
      }

      const kStats = kStatsMap.get(kKey);
      this.processPlay(clip, kStats);
    }
  }

  /**
   * 개별 플레이 처리
   */
  private processPlay(clip: ClipData, kStats: KStats): void {
    const playType = clip.playType?.toUpperCase();
    const gainYard = clip.gainYard || 0;
    const significantPlays = clip.significantPlays || [];

    // FG 플레이 처리
    if (playType === 'FG') {
      kStats.fieldGoalsAttempted++;
      
      // 실제 필드골 거리 = gainYard + 17 (엔드존 10야드 + 홀더 위치 7야드)
      const actualFieldGoalDistance = gainYard + 17;
      
      // 거리별 시도 횟수 증가
      this.categorizeFieldGoalAttempt(actualFieldGoalDistance, kStats);
      
      // 필드골 성공 여부 체크
      if (significantPlays.includes('FIELDGOALGOOD')) {
        kStats.fieldGoalsMade++;
        kStats.totalFieldGoalYard += actualFieldGoalDistance;
        
        // 가장 긴 필드골 업데이트
        if (actualFieldGoalDistance > kStats.longestFieldGoal) {
          kStats.longestFieldGoal = actualFieldGoalDistance;
        }

        // 거리별 필드골 성공 카운트
        this.categorizeFieldGoalMade(actualFieldGoalDistance, kStats);
        
        console.log(`   🎯 필드골 성공: ${actualFieldGoalDistance}야드 (라인: ${gainYard}야드)`);
      } else {
        console.log(`   ❌ 필드골 실패: ${actualFieldGoalDistance}야드 (라인: ${gainYard}야드)`);
      }
    }

    // PAT 플레이 처리
    if (playType === 'PAT') {
      kStats.extraPointsAttempted++;
      
      // PAT 성공 여부 체크
      if (significantPlays.includes('PATGOOD')) {
        kStats.extraPointsMade++;
        console.log(`   ✅ PAT 성공`);
      } else if (significantPlays.includes('PATNOGOOD')) {
        console.log(`   ❌ PAT 실패`);
      }
    }

    // 공통 significantPlays 처리
    this.processSignificantPlays(clip, kStats, playType);
  }

  /**
   * 거리별 필드골 시도 분류
   */
  private categorizeFieldGoalAttempt(distance: number, kStats: KStats): void {
    if (distance >= 1 && distance <= 19) {
      kStats.fieldGoalsAttempted1To19++;
    } else if (distance >= 20 && distance <= 29) {
      kStats.fieldGoalsAttempted20To29++;
    } else if (distance >= 30 && distance <= 39) {
      kStats.fieldGoalsAttempted30To39++;
    } else if (distance >= 40 && distance <= 49) {
      kStats.fieldGoalsAttempted40To49++;
    } else if (distance >= 50) {
      kStats.fieldGoalsAttempted50Plus++;
    }
  }

  /**
   * 거리별 필드골 성공 분류
   */
  private categorizeFieldGoalMade(distance: number, kStats: KStats): void {
    if (distance >= 1 && distance <= 19) {
      kStats.fieldGoals1To19++;
    } else if (distance >= 20 && distance <= 29) {
      kStats.fieldGoals20To29++;
    } else if (distance >= 30 && distance <= 39) {
      kStats.fieldGoals30To39++;
    } else if (distance >= 40 && distance <= 49) {
      kStats.fieldGoals40To49++;
    } else if (distance >= 50) {
      kStats.fieldGoals50Plus++;
    }
  }

  /**
   * 터치다운 처리 (키커는 해당 없음)
   */
  protected processTouchdown(stats: KStats, playType: string): void {
    // 키커는 터치다운이 없음
  }

  /**
   * 최종 스탯 계산
   */
  private calculateFinalStats(kStats: KStats): void {
    // 필드골 성공률 계산
    kStats.fieldGoalPercentage = kStats.fieldGoalsAttempted > 0 
      ? Math.round((kStats.fieldGoalsMade / kStats.fieldGoalsAttempted) * 100) 
      : 0;

    // 평균 필드골 거리 계산
    kStats.averageFieldGoalYard = kStats.fieldGoalsMade > 0 
      ? Math.round((kStats.totalFieldGoalYard / kStats.fieldGoalsMade) * 10) / 10 
      : 0;

    // 게임 수는 1로 설정 (하나의 게임 데이터이므로)
    kStats.gamesPlayed = 1;
  }

  /**
   * 키커 스탯 초기화
   */
  private initializeKStats(jerseyNumber: number, offensiveTeam: string, gameData: GameData): KStats {
    const teamName = offensiveTeam === 'Home' ? gameData.homeTeam : gameData.awayTeam;
    
    return {
      jerseyNumber,
      teamName,
      gamesPlayed: 1,
      // 필드골 스탯
      fieldGoalsAttempted: 0,
      fieldGoalsMade: 0,
      fieldGoalPercentage: 0,
      longestFieldGoal: 0,
      totalFieldGoalYard: 0,
      averageFieldGoalYard: 0,
      // 거리별 필드골 성공
      fieldGoals1To19: 0,
      fieldGoals20To29: 0,
      fieldGoals30To39: 0,
      fieldGoals40To49: 0,
      fieldGoals50Plus: 0,
      // 거리별 필드골 시도
      fieldGoalsAttempted1To19: 0,
      fieldGoalsAttempted20To29: 0,
      fieldGoalsAttempted30To39: 0,
      fieldGoalsAttempted40To49: 0,
      fieldGoalsAttempted50Plus: 0,
      // PAT 스탯
      extraPointsAttempted: 0,
      extraPointsMade: 0,
    };
  }

  /**
   * 키커 키 생성
   */
  private getKKey(jerseyNumber: number, offensiveTeam: string, gameData: GameData): string {
    const teamName = offensiveTeam === 'Home' ? gameData.homeTeam : gameData.awayTeam;
    return `${teamName}_K_${jerseyNumber}`;
  }
}