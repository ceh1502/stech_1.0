const mongoose = require('mongoose');

async function checkQBFinalStats() {
  try {
    console.log('🔗 MongoDB Atlas 연결 중...');
    await mongoose.connect('mongodb+srv://ceh1502:ceh9412@cluster0.97esexh.mongodb.net/stech?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ MongoDB Atlas 연결 성공\n');

    const playerSchema = new mongoose.Schema({}, { strict: false, collection: 'players' });
    const Player = mongoose.model('Player', playerSchema);

    console.log('🏈 QB 9번, 15번 최신 스탯 확인:\n');

    // QB 9번 확인
    const qb9 = await Player.findOne({ jerseyNumber: 9 }).lean();
    if (qb9) {
      console.log(`🎯 ${qb9.name} (${qb9.jerseyNumber}번, ${qb9.teamName}):`);
      console.log(`   패싱: ${qb9.stats?.passingAttempts || 0}시도/${qb9.stats?.passingCompletions || 0}성공 (${qb9.stats?.completionPercentage || 0}%)`);
      console.log(`   패싱야드: ${qb9.stats?.passingYards || 0}, TD: ${qb9.stats?.passingTouchdowns || 0}, INT: ${qb9.stats?.passingInterceptions || 0}`);
      console.log(`   러싱: ${qb9.stats?.rushingAttempts || 0}시도, ${qb9.stats?.rushingYards || 0}야드`);
      console.log(`   게임수: ${qb9.stats?.gamesPlayed || 0}\n`);
    } else {
      console.log('❌ 9번 선수를 찾을 수 없음\n');
    }

    // QB 15번 확인  
    const qb15 = await Player.findOne({ jerseyNumber: 15 }).lean();
    if (qb15) {
      console.log(`🎯 ${qb15.name} (${qb15.jerseyNumber}번, ${qb15.teamName}):`);
      console.log(`   패싱: ${qb15.stats?.passingAttempts || 0}시도/${qb15.stats?.passingCompletions || 0}성공 (${qb15.stats?.completionPercentage || 0}%)`);
      console.log(`   패싱야드: ${qb15.stats?.passingYards || 0}, TD: ${qb15.stats?.passingTouchdowns || 0}, INT: ${qb15.stats?.passingInterceptions || 0}`);
      console.log(`   러싱: ${qb15.stats?.rushingAttempts || 0}시도, ${qb15.stats?.rushingYards || 0}야드`);
      console.log(`   게임수: ${qb15.stats?.gamesPlayed || 0}\n`);
    } else {
      console.log('❌ 15번 선수를 찾을 수 없음\n');
    }

    // 최근 업데이트된 QB들 (상위 5명)
    console.log('📈 패싱야드 상위 5명 QB:');
    const topQBs = await Player.find({ 
      'stats.passingYards': { $gt: 0 } 
    }).sort({ 'stats.passingYards': -1 }).limit(5).lean();

    topQBs.forEach((player, index) => {
      console.log(`${index + 1}. ${player.name} (${player.jerseyNumber}번, ${player.teamName}): ${player.stats.passingYards}야드, ${player.stats.passingAttempts}시도`);
    });

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkQBFinalStats();