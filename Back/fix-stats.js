const mongoose = require('mongoose');

async function fixPlayerStats() {
  try {
    console.log('🔗 MongoDB Atlas 연결 중...');
    await mongoose.connect('mongodb+srv://ceh1502:ceh9412@cluster0.97esexh.mongodb.net/stech?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ MongoDB Atlas 연결 성공\n');

    const playerSchema = new mongoose.Schema({}, { strict: false, collection: 'players' });
    const Player = mongoose.model('Player', playerSchema);

    // HYLions QB 2번 선수를 찾아서 stats 필드 추가
    console.log('🎯 HYLions QB 2번 선수 찾기...');
    const qb2 = await Player.findOne({ 
      jerseyNumber: 2, 
      teamName: 'HYLions',
      position: 'QB'
    });

    if (qb2) {
      console.log(`✅ 찾음: ${qb2.name} (${qb2.jerseyNumber}번)`);
      console.log('기존 stats:', qb2.stats);

      // stats 필드가 없으면 기본 값으로 초기화
      if (!qb2.stats) {
        qb2.stats = {};
      }

      // QB 기본 스탯 추가
      qb2.stats = {
        ...qb2.stats,
        passingYards: qb2.stats.passingYards || 0,
        passingTouchdowns: qb2.stats.passingTouchdowns || 0,
        passingCompletions: qb2.stats.passingCompletions || 0,
        passingAttempts: qb2.stats.passingAttempts || 0,
        passingInterceptions: qb2.stats.passingInterceptions || 0,
        gamesPlayed: qb2.stats.gamesPlayed || 0
      };

      await qb2.save();
      console.log('✅ QB 2번 스탯 필드 초기화 완료');
      console.log('새로운 stats:', qb2.stats);
    } else {
      console.log('❌ HYLions QB 2번 선수를 찾을 수 없음');
    }

    // 모든 HYLions QB들 확인
    console.log('\n🏈 모든 HYLions QB 확인:');
    const allQBs = await Player.find({ 
      teamName: 'HYLions', 
      position: 'QB' 
    });

    for (const qb of allQBs) {
      console.log(`${qb.jerseyNumber}번 ${qb.name}: stats 존재 = ${!!qb.stats}`);
      if (!qb.stats) {
        qb.stats = {
          passingYards: 0,
          passingTouchdowns: 0,
          passingCompletions: 0,
          passingAttempts: 0,
          passingInterceptions: 0,
          gamesPlayed: 0
        };
        await qb.save();
        console.log(`  → ${qb.jerseyNumber}번 ${qb.name} stats 필드 추가됨`);
      }
    }

    console.log('\n✅ 스탯 필드 수정 완료!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

fixPlayerStats();