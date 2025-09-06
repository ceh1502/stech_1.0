import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { TeamStatsAnalyzerService } from '../team/team-stats-analyzer.service';

async function migrateTeamStats() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const teamStatsService = app.get(TeamStatsAnalyzerService);
  
  try {
    console.log('🔄 기존 팀 스탯 데이터 마이그레이션 시작...');
    
    // MongoDB 연결 가져오기
    const mongoose = require('mongoose');
    const connection = mongoose.connection;
    
    // 기존 teamstats 컬렉션에서 데이터 가져오기
    const oldTeamStats = await connection.collection('teamstats').find({}).toArray();
    console.log(`📊 기존 팀 스탯 ${oldTeamStats.length}개 발견`);
    
    // 팀별로 그룹화
    const teamGroups = {};
    oldTeamStats.forEach(stat => {
      if (!teamGroups[stat.teamName]) {
        teamGroups[stat.teamName] = [];
      }
      teamGroups[stat.teamName].push(stat);
    });
    
    console.log(`📋 총 ${Object.keys(teamGroups).length}개 팀 발견`);
    
    // 각 팀별로 누적 스탯 계산
    for (const [teamName, teamStats] of Object.entries(teamGroups)) {
      console.log(`\n🏈 ${teamName} 팀 누적 스탯 계산 중...`);
      
      const stats = teamStats as any[];
      const totalStats = {
        totalYards: stats.reduce((sum, s) => sum + (s.totalYards || 0), 0),
        passingYards: stats.reduce((sum, s) => sum + (s.passingYards || 0), 0),
        rushingYards: stats.reduce((sum, s) => sum + (s.rushingYards || 0), 0),
        interceptionReturnYards: stats.reduce((sum, s) => sum + (s.interceptionReturnYards || 0), 0),
        puntReturnYards: stats.reduce((sum, s) => sum + (s.puntReturnYards || 0), 0),
        kickoffReturnYards: stats.reduce((sum, s) => sum + (s.kickoffReturnYards || 0), 0),
        turnovers: stats.reduce((sum, s) => sum + (s.turnovers || 0), 0),
        penaltyYards: stats.reduce((sum, s) => sum + (s.penaltyYards || 0), 0),
        sackYards: stats.reduce((sum, s) => sum + (s.sackYards || 0), 0),
        passingAttempts: 0,
        passingCompletions: 0,
        rushingAttempts: 0,
        touchdowns: 0,
        fieldGoals: 0,
        patGood: 0,
        twoPtGood: 0,
        safeties: 0,
        totalPoints: 0,
        interceptions: 0,
        sacks: 0,
        kickReturns: 0,
        puntReturns: 0,
        totalReturnYards: 0,
        penalties: 0,
        touchbacks: 0,
        fieldGoalAttempts: 0,
        puntAttempts: 0,
        puntYards: 0,
        fumbles: 0,
        fumblesLost: 0,
      };
      
      // 새로운 team_total_stats 컬렉션에 저장
      const newTeamStats = {
        teamName,
        stats: totalStats,
        gamesPlayed: stats.length,
        wins: 0,
        losses: 0,
        ties: 0,
        gameKeys: stats.map(s => s.gameKey),
        lastUpdated: new Date(),
      };
      
      await connection.collection('team_total_stats').updateOne(
        { teamName },
        { $set: newTeamStats },
        { upsert: true }
      );
      
      console.log(`  ✅ ${teamName}: ${stats.length}경기, 총야드 ${totalStats.totalYards}`);
    }
    
    console.log('\n✅ 팀 스탯 마이그레이션 완료!');
    
    // 결과 확인
    const allTeamStats = await teamStatsService.getAllTeamTotalStats();
    console.log(`\n📊 마이그레이션된 팀 통계:`);
    
    allTeamStats.forEach((team, index) => {
      console.log(`${index + 1}. ${team.teamName}: 총 ${team.totalYards}야드 (${team.gamesPlayed}경기)`);
    });
    
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류:', error);
  } finally {
    await app.close();
  }
}

migrateTeamStats();