import { Injectable } from '@nestjs/common';
import { BaseAnalyzerService, ClipData, GameData } from './base-analyzer.service';

// P 스탯 인터페이스
export interface PStats {
  jerseyNumber: number;
  teamName: string;
  gamesPlayed: number;
  puntCount: number;
  puntYards: number;
  averagePuntYard: number;
  longestPunt: number;
  touchbacks: number;
  touchbackPercentage: number;
  inside20: number;
  inside20Percentage: number;
}

@Injectable()
export class PAnalyzerService extends BaseAnalyzerService {

  /**
   * P 클립 분석 메인 메서드
   */
  async analyzeClips(clips: ClipData[], gameData: GameData): Promise<any> {
    console.log(`\n🦶 P 분석 시작 - ${clips.length}개 클립`);
    
    if (clips.length === 0) {
      console.log('⚠️ P 클립이 없습니다.');
      return { pCount: 0, message: 'P 클립이 없습니다.' };
    }

    // P 선수별로 스탯 수집
    const pStatsMap = new Map<string, PStats>();

    for (const clip of clips) {
      this.processClipForP(clip, pStatsMap, gameData);
    }

    // 각 P의 최종 스탯 계산 및 저장
    let savedCount = 0;
    const results = [];

    for (const [pKey, pStats] of pStatsMap) {
      // 최종 계산
      this.calculateFinalStats(pStats);
      
      console.log(`🦶 P ${pStats.jerseyNumber}번 (${pStats.teamName}) 최종 스탯:`);
      console.log(`   펀트 수: ${pStats.puntCount}`);
      console.log(`   펀트 야드: ${pStats.puntYards}`);
      console.log(`   평균 펀트 거리: ${pStats.averagePuntYard}`);
      console.log(`   가장 긴 펀트: ${pStats.longestPunt}`);
      console.log(`   터치백: ${pStats.touchbacks} (${pStats.touchbackPercentage}%)`);
      console.log(`   Inside20: ${pStats.inside20} (${pStats.inside20Percentage}%)`);

      // 데이터베이스에 저장
      const saveResult = await this.savePlayerStats(
        pStats.jerseyNumber,
        pStats.teamName,
        'P',
        {
          gamesPlayed: pStats.gamesPlayed,
          puntCount: pStats.puntCount,
          puntYards: pStats.puntYards,
          averagePuntYard: pStats.averagePuntYard,
          longestPunt: pStats.longestPunt,
          touchbacks: pStats.touchbacks,
          touchbackPercentage: pStats.touchbackPercentage,
          inside20: pStats.inside20,
          inside20Percentage: pStats.inside20Percentage,
        }
      );

      if (saveResult.success) {
        savedCount++;
      }
      results.push(saveResult);
    }

    console.log(`✅ P 분석 완료: ${savedCount}명의 P 스탯 저장\n`);

    return {
      pCount: savedCount,
      message: `${savedCount}명의 P 스탯이 분석되었습니다.`,
      results
    };
  }

  /**
   * 개별 클립을 P 관점에서 처리
   */
  private processClipForP(clip: ClipData, pStatsMap: Map<string, PStats>, gameData: GameData): void {
    // PUNT 플레이만 처리
    if (clip.playType?.toUpperCase() !== 'PUNT') {
      return;
    }

    // P는 car나 car2에서 pos가 'P'인 경우
    const pPlayers = [];
    
    if (clip.car?.pos === 'P') {
      pPlayers.push({ number: clip.car.num, role: 'car' });
    }
    if (clip.car2?.pos === 'P') {
      pPlayers.push({ number: clip.car2.num, role: 'car2' });
    }

    for (const pPlayer of pPlayers) {
      const pKey = this.getPKey(pPlayer.number, clip.offensiveTeam, gameData);
      
      if (!pStatsMap.has(pKey)) {
        pStatsMap.set(pKey, this.initializePStats(pPlayer.number, clip.offensiveTeam, gameData));
      }

      const pStats = pStatsMap.get(pKey);
      this.processPlay(clip, pStats);
    }
  }

  /**
   * 개별 플레이 처리
   */
  private processPlay(clip: ClipData, pStats: PStats): void {
    const playType = clip.playType?.toUpperCase();
    const gainYard = clip.gainYard || 0;

    // PUNT 플레이 처리
    if (playType === 'PUNT') {
      pStats.puntCount++;
      pStats.puntYards += gainYard;

      // 가장 긴 펀트 업데이트
      if (gainYard > pStats.longestPunt) {
        pStats.longestPunt = gainYard;
      }

      // 터치백 체크 (EndYard가 0이면)
      if (clip.end.yard === 0) {
        pStats.touchbacks++;
        console.log(`   🏈 터치백!`);
      }

      // Inside20 체크 (EndYardLocation이 "OPP"이고 EndYard가 1~20일 때)
      if (clip.end.side === "OPP" && clip.end.yard >= 1 && clip.end.yard <= 20) {
        pStats.inside20++;
        console.log(`   🎯 Inside20! (${clip.end.yard}야드)`);
      }

      console.log(`   🦶 펀트: ${gainYard}야드 (end: ${clip.end.side} ${clip.end.yard})`);
    }
  }

  /**
   * 최종 스탯 계산
   */
  private calculateFinalStats(pStats: PStats): void {
    // 평균 펀트 거리 계산
    pStats.averagePuntYard = pStats.puntCount > 0 
      ? Math.round((pStats.puntYards / pStats.puntCount) * 10) / 10 
      : 0;

    // 터치백 퍼센트 계산
    pStats.touchbackPercentage = pStats.puntCount > 0 
      ? Math.round((pStats.touchbacks / pStats.puntCount) * 100 * 10) / 10 
      : 0;

    // Inside20 퍼센트 계산
    pStats.inside20Percentage = pStats.puntCount > 0 
      ? Math.round((pStats.inside20 / pStats.puntCount) * 100 * 10) / 10 
      : 0;

    // 게임 수는 1로 설정 (하나의 게임 데이터이므로)
    pStats.gamesPlayed = 1;
  }

  /**
   * P 스탯 초기화
   */
  private initializePStats(jerseyNumber: number, offensiveTeam: string, gameData: GameData): PStats {
    const teamName = offensiveTeam === 'Home' ? gameData.homeTeam : gameData.awayTeam;
    
    return {
      jerseyNumber,
      teamName,
      gamesPlayed: 1,
      puntCount: 0,
      puntYards: 0,
      averagePuntYard: 0,
      longestPunt: 0,
      touchbacks: 0,
      touchbackPercentage: 0,
      inside20: 0,
      inside20Percentage: 0,
    };
  }

  /**
   * P 키 생성
   */
  private getPKey(jerseyNumber: number, offensiveTeam: string, gameData: GameData): string {
    const teamName = offensiveTeam === 'Home' ? gameData.homeTeam : gameData.awayTeam;
    return `${teamName}_P_${jerseyNumber}`;
  }
}