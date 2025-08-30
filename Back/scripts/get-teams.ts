import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Team, TeamDocument } from '../src/schemas/team.schema';
import { Player, PlayerDocument } from '../src/schemas/player.schema';

async function getTeamsInfo() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const teamModel = app.get<Model<TeamDocument>>(getModelToken('Team'));
    const playerModel = app.get<Model<PlayerDocument>>(getModelToken('Player'));
    
    console.log('🏈 팀 정보:');
    const teams = await teamModel.find({}).exec();
    
    for (const team of teams) {
      const playerCount = await playerModel.countDocuments({ teamId: team._id });
      console.log(`\n📍 ${team.teamName} (${team.teamId})`);
      console.log(`   ObjectId: ${team._id}`);
      console.log(`   선수 수: ${playerCount}명`);
      console.log(`   API 호출: curl http://localhost:3000/player/team/${team._id}`);
    }
    
    console.log('\n🎯 개별 선수 조회 예시:');
    const samplePlayers = await playerModel.find({}).limit(3).populate('teamId');
    
    for (const player of samplePlayers) {
      console.log(`\n👤 ${player.name} (#${player.jerseyNumber})`);
      console.log(`   PlayerId: ${player.playerId}`);
      console.log(`   포지션: ${player.positions?.join(', ') || '없음'}`);
      console.log(`   팀: ${(player.teamId as any).teamName}`);
      console.log(`   API 호출: curl http://localhost:3000/player/code/${player.playerId}`);
    }
    
  } catch (error) {
    console.error('❌ 에러 발생:', error);
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  getTeamsInfo()
    .then(() => {
      console.log('\n✅ 조회 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 실행 실패:', error);
      process.exit(1);
    });
}

export { getTeamsInfo };