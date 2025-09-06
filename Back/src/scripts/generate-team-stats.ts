import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TeamStatsAnalyzerService } from '../team/team-stats-analyzer.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

async function generateTeamStats() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const teamStatsService = app.get(TeamStatsAnalyzerService);
  
  // Mongoose connection을 통해 직접 쿼리
  const mongoose = app.get('DatabaseConnection');
  
  try {
    console.log('🏈 팀 통계 생성 시작...');
    
    // 모든 게임 클립 데이터 조회
    const allGames = await mongoose.connection.collection('game_clips').find({}).toArray();
    
    console.log(`📊 총 ${allGames.length}개의 게임 발견`);
    
    for (const gameData of allGames) {
      console.log(`\n🎮 게임 처리 중: ${gameData.gameKey}`);
      console.log(`  홈팀: ${gameData.homeTeam} vs 어웨이팀: ${gameData.awayTeam}`);
      
      try {
        // 팀 통계 분석
        const teamStatsResult = await teamStatsService.analyzeTeamStats(gameData);
        
        // 팀 통계 저장
        await teamStatsService.saveTeamStats(
          gameData.gameKey,
          teamStatsResult,
          gameData
        );
        
        console.log('  ✅ 팀 통계 저장 완료');
      } catch (error) {
        console.error(`  ❌ 에러 발생:`, error.message);
      }
    }
    
    console.log('\n✅ 모든 게임의 팀 통계 생성 완료!');
    
    // 생성된 팀 통계 확인
    const allTeamStats = await teamStatsService.getAllTeamTotalStats();
    console.log(`\n📊 총 ${allTeamStats.length}개 팀의 누적 통계 생성됨:`);
    
    allTeamStats.forEach((team, index) => {
      console.log(`${index + 1}. ${team.teamName}: 총 ${team.totalYards}야드 (${team.gamesPlayed}경기)`);
    });
    
  } catch (error) {
    console.error('❌ 팀 통계 생성 중 오류:', error);
  } finally {
    await app.close();
  }
}

// 스크립트 실행
generateTeamStats();