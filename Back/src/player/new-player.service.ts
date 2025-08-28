import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NewPlayer, NewPlayerDocument } from '../schemas/new-player.schema';
import { NewGameDataProcessorService } from './new-game-data-processor.service';
import { NewQbStatsAnalyzerService } from './new-qb-stats-analyzer.service';

@Injectable()
export class NewPlayerService {
  constructor(
    @InjectModel(NewPlayer.name) private playerModel: Model<NewPlayerDocument>,
    private gameDataProcessor: NewGameDataProcessorService,
    private qbAnalyzer: NewQbStatsAnalyzerService,
  ) {}

  async analyzeGameData(gameData: any) {
    // 1. 게임 데이터 전처리
    const processedData = this.gameDataProcessor.processGameData(gameData);

    // 2. QB 찾기
    const qbPlayers = this.gameDataProcessor.findAllQBs(processedData.processedClips);

    if (qbPlayers.size === 0) {
      throw new Error('QB 선수를 찾을 수 없습니다.');
    }

    // 3. 각 QB별로 분석 실행
    const results = [];
    
    for (const [key, qbInfo] of qbPlayers) {
      try {
        // 해당 QB의 클립 필터링
        const playerClips = this.gameDataProcessor.filterClipsForPlayer(
          processedData.processedClips,
          qbInfo.jerseyNumber,
          qbInfo.teamName
        );

        if (playerClips.length === 0) {
          console.log(`${qbInfo.teamName} ${qbInfo.jerseyNumber}번 QB: 분석할 클립이 없습니다.`);
          continue;
        }

        // QB 통계 분석
        const stats = await this.qbAnalyzer.analyzeQBFromClips(
          playerClips,
          qbInfo.jerseyNumber,
          qbInfo.teamName
        );

        results.push({
          teamName: qbInfo.teamName,
          jerseyNumber: qbInfo.jerseyNumber,
          stats: stats,
          clipsAnalyzed: playerClips.length
        });

      } catch (error) {
        console.error(`${qbInfo.teamName} ${qbInfo.jerseyNumber}번 QB 분석 실패:`, error.message);
        
        results.push({
          teamName: qbInfo.teamName,
          jerseyNumber: qbInfo.jerseyNumber,
          error: error.message,
          clipsAnalyzed: 0
        });
      }
    }

    return {
      gameKey: processedData.gameKey,
      homeTeam: processedData.homeTeam,
      awayTeam: processedData.awayTeam,
      totalClips: processedData.processedClips.length,
      qbsAnalyzed: results.length,
      results: results
    };
  }

  async testQBAnalysis(gameData: any) {
    console.log('QB 분석 테스트용 메서드 실행');
    
    // 게임 데이터 전처리
    const processedData = this.gameDataProcessor.processGameData(gameData);
    
    // QB 찾기
    const qbPlayers = this.gameDataProcessor.findAllQBs(processedData.processedClips);
    
    const testResults = [];
    
    for (const [key, qbInfo] of qbPlayers) {
      // QB 클립 필터링
      const qbClips = this.gameDataProcessor.filterClipsForPlayer(
        processedData.processedClips,
        qbInfo.jerseyNumber,
        qbInfo.teamName
      );
      
      console.log(`\n--- ${qbInfo.teamName} ${qbInfo.jerseyNumber}번 QB 테스트 ---`);
      console.log(`관련 클립 수: ${qbClips.length}개`);
      
      // 클립별 상세 정보 출력
      qbClips.forEach((clip, index) => {
        console.log(`클립 ${index + 1}: ${clip.playType}, 야드: ${clip.gainYard}, 특수플레이: ${JSON.stringify(clip.significantPlays)}`);
      });
      
      try {
        const stats = await this.qbAnalyzer.analyzeQBFromClips(
          qbClips,
          qbInfo.jerseyNumber,
          qbInfo.teamName
        );
        
        console.log('최종 통계:');
        console.log(`  패스 시도: ${stats.qbPassingAttempts}회`);
        console.log(`  패스 성공: ${stats.qbPassingCompletions}회`);
        console.log(`  패스 성공률: ${stats.qbCompletionPercentage}%`);
        console.log(`  패싱 야드: ${stats.qbPassingYards}야드`);
        console.log(`  패싱 TD: ${stats.qbPassingTouchdowns}회`);
        console.log(`  인터셉션: ${stats.qbPassingInterceptions}회`);
        console.log(`  최장 패스: ${stats.qbLongestPass}야드`);
        console.log(`  색: ${stats.qbSacks}회`);
        
        testResults.push({
          ...qbInfo,
          stats,
          clipsAnalyzed: qbClips.length,
          success: true
        });
        
      } catch (error) {
        console.log(`분석 실패: ${error.message}`);
        
        testResults.push({
          ...qbInfo,
          error: error.message,
          clipsAnalyzed: qbClips.length,
          success: false
        });
      }
    }
    
    return testResults;
  }

  async createDummyPlayers(teamName: string, count: number = 100) {
    const players = [];
    
    for (let i = 0; i < count; i++) {
      const player = new this.playerModel({
        playerId: `${teamName}_${i}`,
        name: `선수${i}`,
        jerseyNumber: i,
        teamName: teamName,
        stats: {}
      });
      
      players.push(player);
    }
    
    await this.playerModel.insertMany(players);
    console.log(`${teamName} 팀 더미 선수 ${count}명 생성 완료`);
  }
}