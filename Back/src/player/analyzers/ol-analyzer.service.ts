import { Injectable } from '@nestjs/common';
import { BaseAnalyzerService, ClipData, GameData } from './base-analyzer.service';

// OL 스탯 인터페이스
export interface OLStats {
  jerseyNumber: number;
  teamName: string;
  gamesPlayed: number;
  penalties: number;
  sacksAllowed: number;
}

@Injectable()
export class OlAnalyzerService extends BaseAnalyzerService {

  /**
   * OL 클립 분석 메인 메서드
   */
  async analyzeClips(clips: ClipData[], gameData: GameData): Promise<any> {
    console.log(`\n🛡️ OL 분석 시작 - ${clips.length}개 클립`);
    
    if (clips.length === 0) {
      console.log('⚠️ OL 클립이 없습니다.');
      return { olCount: 0, message: 'OL 클립이 없습니다.' };
    }

    // OL 선수별로 스탯 수집
    const olStatsMap = new Map<string, OLStats>();

    for (const clip of clips) {
      this.processClipForOL(clip, olStatsMap, gameData);
    }

    // 각 OL의 최종 스탯 계산 및 저장
    let savedCount = 0;
    const results = [];

    for (const [olKey, olStats] of olStatsMap) {
      // 최종 계산
      this.calculateFinalStats(olStats);
      
      console.log(`🛡️ OL ${olStats.jerseyNumber}번 (${olStats.teamName}) 최종 스탯:`);
      console.log(`   반칙 수: ${olStats.penalties}`);
      console.log(`   색 허용 수: ${olStats.sacksAllowed}`);

      // 데이터베이스에 저장
      const saveResult = await this.savePlayerStats(
        olStats.jerseyNumber,
        olStats.teamName,
        'OL',
        {
          gamesPlayed: olStats.gamesPlayed,
          penalties: olStats.penalties,
          sacksAllowed: olStats.sacksAllowed,
        }
      );

      if (saveResult.success) {
        savedCount++;
      }
      results.push(saveResult);
    }

    console.log(`✅ OL 분석 완료: ${savedCount}명의 OL 스탯 저장\n`);

    return {
      olCount: savedCount,
      message: `${savedCount}명의 OL 스탯이 분석되었습니다.`,
      results
    };
  }

  /**
   * 개별 클립을 OL 관점에서 처리
   */
  private processClipForOL(clip: ClipData, olStatsMap: Map<string, OLStats>, gameData: GameData): void {
    // OL은 car나 car2에서 pos가 'OL'인 경우
    const olPlayers = [];
    
    if (clip.car?.pos === 'OL') {
      olPlayers.push({ number: clip.car.num, role: 'car' });
    }
    if (clip.car2?.pos === 'OL') {
      olPlayers.push({ number: clip.car2.num, role: 'car2' });
    }

    for (const olPlayer of olPlayers) {
      const olKey = this.getOLKey(olPlayer.number, clip.offensiveTeam, gameData);
      
      if (!olStatsMap.has(olKey)) {
        olStatsMap.set(olKey, this.initializeOLStats(olPlayer.number, clip.offensiveTeam, gameData));
      }

      const olStats = olStatsMap.get(olKey);
      this.processPlay(clip, olStats);
    }
  }

  /**
   * 개별 플레이 처리
   */
  private processPlay(clip: ClipData, olStats: OLStats): void {
    const playType = clip.playType?.toUpperCase();
    const significantPlays = clip.significantPlays || [];

    // 반칙 처리 (playType이 NONE이고 significantPlays에 penalty가 있을 때)
    if (playType === 'NONE') {
      const hasPenalty = significantPlays.some(play => 
        play === 'penalty.home' || play === 'penalty.away'
      );
      
      if (hasPenalty) {
        olStats.penalties++;
        console.log(`   🚩 OL 반칙!`);
      }
    }

    // 색 허용 처리 (playType이 SACK이고 significantPlay에 SACK이 있을 때)
    if (playType === 'SACK') {
      const hasSack = significantPlays.includes('SACK');
      
      if (hasSack) {
        olStats.sacksAllowed++;
        console.log(`   🔴 OL 색 허용!`);
      }
    }
  }

  /**
   * 최종 스탯 계산
   */
  private calculateFinalStats(olStats: OLStats): void {
    // 게임 수는 1로 설정 (하나의 게임 데이터이므로)
    olStats.gamesPlayed = 1;
  }

  /**
   * OL 스탯 초기화
   */
  private initializeOLStats(jerseyNumber: number, offensiveTeam: string, gameData: GameData): OLStats {
    const teamName = offensiveTeam === 'Home' ? gameData.homeTeam : gameData.awayTeam;
    
    return {
      jerseyNumber,
      teamName,
      gamesPlayed: 1,
      penalties: 0,
      sacksAllowed: 0,
    };
  }

  /**
   * OL 키 생성
   */
  private getOLKey(jerseyNumber: number, offensiveTeam: string, gameData: GameData): string {
    const teamName = offensiveTeam === 'Home' ? gameData.homeTeam : gameData.awayTeam;
    return `${teamName}_OL_${jerseyNumber}`;
  }
}