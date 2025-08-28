import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';

interface CarData {
  num: number | null;
  pos: string | null;
}

interface ProcessedClip {
  clipKey: string;
  offensiveTeam: string;
  playType: string;
  gainYard: number;
  car: CarData;
  car2: CarData;
  significantPlays: (string | null)[];
  actualOffensiveTeam: string;
  actualDefensiveTeam: string;
}

interface GameData {
  homeTeam: string;
  awayTeam: string;
  Clips: any[];
}

interface QBPlayerInfo {
  jerseyNumber: number;
  teamName: string;
  clips: ProcessedClip[];
}

interface QBStats {
  gamesPlayed: number;
  passingAttempts: number;
  passingCompletions: number;
  completionPercentage: number;
  passingYards: number;
  passingTouchdowns: number;
  passingInterceptions: number;
  longestPass: number;
  sacks: number;
}

@Injectable()
export class QbAnalyzerService {
  constructor(
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
  ) {}

  async analyzeQbStats(gameData: GameData) {
    try {
      console.log('\n🎯 게임 데이터 전처리 시작');

      // 데이터 검증
      if (!this.validateGameData(gameData)) {
        return { success: false, error: '유효하지 않은 게임 데이터' };
      }

      // 1. 게임 데이터 전처리
      const processedData = this.preprocessGameData(gameData);

      // 2. QB 찾기 및 분석
      const qbResults = await this.findAndAnalyzeQBs(processedData);

      // 3. 요약 리포트 생성
      this.generateSummaryReport(qbResults);

      console.log('\n✅ 분석 완료');
      return { success: true, results: qbResults };
    } catch (error) {
      console.error('❌ QB 분석 중 오류 발생:', error);
      return { success: false, error: error.message };
    }
  }

  private validateGameData(gameData: GameData): boolean {
    if (!gameData.homeTeam || !gameData.awayTeam) {
      console.error('❌ 필수 팀 정보가 없습니다');
      return false;
    }
    if (!gameData.Clips || !Array.isArray(gameData.Clips)) {
      console.error('❌ 클립 데이터가 유효하지 않습니다');
      return false;
    }
    console.log('✅ 데이터 검증 완료');
    return true;
  }

  private preprocessGameData(gameData: GameData): {
    homeTeam: string;
    awayTeam: string;
    processedClips: ProcessedClip[];
  } {
    const { homeTeam, awayTeam, Clips } = gameData;

    console.log(`📋 게임 정보: ${homeTeam} vs ${awayTeam}`);
    console.log(`📎 총 클립 수: ${Clips.length}개`);

    const processedClips: ProcessedClip[] = Clips.map((clip: any) => {
      const actualOffensiveTeam =
        clip.offensiveTeam === 'Home' ? homeTeam : awayTeam;
      const actualDefensiveTeam =
        clip.offensiveTeam === 'Home' ? awayTeam : homeTeam;

      return {
        clipKey: clip.clipKey || '',
        offensiveTeam: clip.offensiveTeam || '',
        playType: clip.playType || '',
        gainYard: clip.gainYard || 0,
        car: clip.car || { num: null, pos: null },
        car2: clip.car2 || { num: null, pos: null },
        significantPlays: clip.significantPlays || [],
        actualOffensiveTeam,
        actualDefensiveTeam,
      };
    });

    return { homeTeam, awayTeam, processedClips };
  }

  private async findAndAnalyzeQBs(data: {
    homeTeam: string;
    awayTeam: string;
    processedClips: ProcessedClip[];
  }) {
    const qbResults: Array<{
      teamName: string;
      jerseyNumber: number;
      stats: QBStats;
    }> = [];
    const qbPlayers = new Map<string, QBPlayerInfo>(); // QB 선수들 저장

    console.log('\n🔍 QB 선수 찾기');

    // 모든 클립에서 QB 찾기
    for (const clip of data.processedClips) {
      if (clip.car?.pos === 'QB' && clip.car.num !== null) {
        const key = `${clip.actualOffensiveTeam}-${clip.car.num}`;
        if (!qbPlayers.has(key)) {
          qbPlayers.set(key, {
            jerseyNumber: clip.car.num,
            teamName: clip.actualOffensiveTeam,
            clips: [],
          });
          console.log(
            `  발견: ${clip.actualOffensiveTeam} ${clip.car.num}번 QB`,
          );
        }
      }

      if (clip.car2?.pos === 'QB' && clip.car2.num !== null) {
        const key = `${clip.actualOffensiveTeam}-${clip.car2.num}`;
        if (!qbPlayers.has(key)) {
          qbPlayers.set(key, {
            jerseyNumber: clip.car2.num,
            teamName: clip.actualOffensiveTeam,
            clips: [],
          });
          console.log(
            `  발견: ${clip.actualOffensiveTeam} ${clip.car2.num}번 QB`,
          );
        }
      }
    }

    console.log(`\n📊 총 ${qbPlayers.size}명의 QB 발견`);

    // 각 QB별로 분석
    for (const [key, qbInfo] of qbPlayers) {
      console.log(
        `\n=== ${qbInfo.teamName} ${qbInfo.jerseyNumber}번 QB 분석 ===`,
      );

      // 해당 QB의 클립만 필터링
      const playerClips = this.filterQBClips(
        data.processedClips,
        qbInfo.jerseyNumber,
        qbInfo.teamName,
      );
      console.log(`🎬 해당 QB 클립 수: ${playerClips.length}개`);

      // 통계 분석
      const stats = this.analyzeQBStats(playerClips, qbInfo.jerseyNumber);

      qbResults.push({
        teamName: qbInfo.teamName,
        jerseyNumber: qbInfo.jerseyNumber,
        stats: stats,
      });

      // 데이터베이스 업데이트
      await this.updatePlayerStats(qbInfo.jerseyNumber, qbInfo.teamName, stats);
    }

    return qbResults;
  }

  private filterQBClips(
    clips: ProcessedClip[],
    jerseyNumber: number,
    teamName: string,
  ): ProcessedClip[] {
    return clips.filter((clip) => {
      // 해당 팀이 공격팀일 때만
      if (clip.actualOffensiveTeam !== teamName) return false;

      // car 또는 car2에 해당 등번호가 있는지 확인
      const isPlayerInCar = clip.car?.num === jerseyNumber;
      const isPlayerInCar2 = clip.car2?.num === jerseyNumber;

      return isPlayerInCar || isPlayerInCar2;
    });
  }

  private analyzeQBStats(
    clips: ProcessedClip[],
    jerseyNumber: number,
  ): QBStats {
    let passingAttempts = 0;
    let passingCompletions = 0;
    let passingYards = 0;
    let passingTouchdowns = 0;
    let passingInterceptions = 0;
    let longestPass = 0;
    let sacks = 0;

    console.log(`\n📈 통계 계산 시작 (${clips.length}개 클립)`);

    for (const clip of clips) {
      const isPlayerInCar = clip.car?.num === jerseyNumber;
      const isPlayerInCar2 = clip.car2?.num === jerseyNumber;

      if (!isPlayerInCar && !isPlayerInCar2) continue;

      // 패스 시도 수 계산
      if (clip.playType === 'PASS' || clip.playType === 'NOPASS') {
        passingAttempts++;
        console.log(
          `  ✅ 패스 시도: ${clip.playType} (총 ${passingAttempts}회)`,
        );
      }

      // 패스 성공 수 계산
      if (clip.playType === 'PASS') {
        passingCompletions++;
        console.log(
          `  ✅ 패스 성공: ${clip.gainYard}야드 (총 ${passingCompletions}회)`,
        );
      }

      // 패싱 야드 계산
      if (clip.playType === 'PASS') {
        passingYards += clip.gainYard;
        // 가장 긴 패스 업데이트
        if (clip.gainYard > longestPass) {
          longestPass = clip.gainYard;
          console.log(`  🏈 새로운 최장 패스: ${longestPass}야드`);
        }
        console.log(
          `  ✅ 패싱 야드: +${clip.gainYard} (총 ${passingYards}야드)`,
        );
      }

      // 색(sack) 계산
      if (clip.playType === 'SACK') {
        sacks++;
        console.log(`  💥 색(playType): 총 ${sacks}회`);
      }

      // significantPlays 확인
      const hasSignificantPlay =
        clip.significantPlays &&
        Array.isArray(clip.significantPlays) &&
        clip.significantPlays.some((play) => play !== null);

      if (hasSignificantPlay) {
        const plays = clip.significantPlays.filter((play) => play !== null);

        for (const play of plays) {
          // 패싱 터치다운 계산
          if (play === 'TOUCHDOWN' && clip.playType === 'PASS') {
            passingTouchdowns++;
            console.log(`  🎯 패싱 터치다운: 총 ${passingTouchdowns}회`);
          }
          // 인터셉션 계산
          else if (play === 'INTERCEPT' || play === 'INTERCEPTION') {
            passingInterceptions++;
            console.log(`  ❌ 인터셉션: 총 ${passingInterceptions}회`);
          }
          // 색 계산
          else if (play === 'SACK') {
            sacks++;
            console.log(`  💥 색(significantPlay): 총 ${sacks}회`);
          }
        }
      }
    }

    // 패스 성공률 계산
    const completionPercentage =
      passingAttempts > 0
        ? Math.round((passingCompletions / passingAttempts) * 100)
        : 0;

    const finalStats = {
      gamesPlayed: 1,
      passingAttempts,
      passingCompletions,
      completionPercentage,
      passingYards,
      passingTouchdowns,
      passingInterceptions,
      longestPass,
      sacks,
    };

    console.log('\n📊 최종 통계 결과:');
    console.log(`  🎯 패스 시도: ${passingAttempts}회`);
    console.log(`  ✅ 패스 성공: ${passingCompletions}회`);
    console.log(`  📈 패스 성공률: ${completionPercentage}%`);
    console.log(`  🏈 패싱 야드: ${passingYards}야드`);
    console.log(`  🎯 패싱 터치다운: ${passingTouchdowns}회`);
    console.log(`  ❌ 인터셉션: ${passingInterceptions}회`);
    console.log(`  🏈 최장 패스: ${longestPass}야드`);
    console.log(`  💥 색: ${sacks}회`);

    return finalStats;
  }

  private async updatePlayerStats(
    jerseyNumber: number,
    teamName: string,
    stats: QBStats,
  ): Promise<void> {
    try {
      const player = await this.playerModel.findOneAndUpdate(
        { jerseyNumber: jerseyNumber, teamName: teamName },
        {
          $set: {
            'stats.gamesPlayed': stats.gamesPlayed,
            'stats.passingAttempts': stats.passingAttempts,
            'stats.passingCompletions': stats.passingCompletions,
            'stats.completionPercentage': stats.completionPercentage,
            'stats.passingYards': stats.passingYards,
            'stats.passingTouchdowns': stats.passingTouchdowns,
            'stats.passingInterceptions': stats.passingInterceptions,
            'stats.longestPass': stats.longestPass,
            'stats.sacks': stats.sacks,
          },
        },
        { new: true },
      );

      if (player) {
        console.log(
          `💾 데이터베이스 업데이트 완료: ${teamName} ${jerseyNumber}번`,
        );
      } else {
        console.log(`❌ 선수를 찾을 수 없음: ${teamName} ${jerseyNumber}번`);
      }
    } catch (error) {
      console.error(`❌ 데이터베이스 업데이트 실패:`, error);
    }
  }

  private generateSummaryReport(
    qbResults: Array<{
      teamName: string;
      jerseyNumber: number;
      stats: QBStats;
    }>,
  ): void {
    console.log('\n📋 ===== QB 분석 완료 요약 =====');
    console.log(`🏈 총 분석된 QB: ${qbResults.length}명`);

    qbResults.forEach((qb) => {
      console.log(`\n👤 ${qb.teamName} ${qb.jerseyNumber}번`);
      console.log(`   패스 성공률: ${qb.stats.completionPercentage}%`);
      console.log(`   총 패싱 야드: ${qb.stats.passingYards}야드`);
      console.log(`   터치다운: ${qb.stats.passingTouchdowns}회`);
      console.log(`   인터셉션: ${qb.stats.passingInterceptions}회`);
    });

    console.log('\n================================');
  }
}
