const mongoose = require('mongoose');

async function checkQBStats() {
  try {
    console.log('🔗 MongoDB Atlas 연결 중...');
    await mongoose.connect('mongodb+srv://ceh1502:ceh9412@cluster0.97esexh.mongodb.net/stech?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ MongoDB Atlas 연결 성공\n');

    const gameStatsSchema = new mongoose.Schema({}, { strict: false, collection: 'gamestats' });
    const seasonStatsSchema = new mongoose.Schema({}, { strict: false, collection: 'seasonstats' });
    const careerStatsSchema = new mongoose.Schema({}, { strict: false, collection: 'careerstats' });
    
    const GameStats = mongoose.model('GameStats', gameStatsSchema);
    const SeasonStats = mongoose.model('SeasonStats', seasonStatsSchema);
    const CareerStats = mongoose.model('CareerStats', careerStatsSchema);

    // 최근 DEBUG 게임의 QB 스탯 확인
    console.log('🎯 DEBUG20241228 게임의 QB 스탯 확인:');
    const debugGameStats = await GameStats.find({ 
      gameKey: 'DEBUG20241228',
      position: 'QB'
    }).lean();
    
    if (debugGameStats.length > 0) {
      debugGameStats.forEach(stat => {
        console.log(`📊 QB ${stat.playerNumber}번 (${stat.teamName}):`, {
          passingAttempts: stat.passingAttempts,
          passingCompletions: stat.passingCompletions,
          passingYards: stat.passingYards,
          passingTouchdowns: stat.passingTouchdowns,
          gameKey: stat.gameKey
        });
      });
    } else {
      console.log('❌ DEBUG 게임의 QB 스탯을 찾을 수 없음');
    }

    console.log('\n🏈 HYLions QB 2번 박영희의 모든 스탯:');
    
    // GameStats 확인
    const qb2GameStats = await GameStats.find({ 
      playerNumber: 2,
      position: 'QB',
      teamName: 'HYLions'
    }).sort({ gameDate: -1 }).lean();
    
    console.log(`\n📈 GameStats: ${qb2GameStats.length}개`);
    qb2GameStats.slice(0, 3).forEach(stat => {
      console.log(`   ${stat.gameKey}: Att:${stat.passingAttempts}, Comp:${stat.passingCompletions}, Yds:${stat.passingYards}`);
    });

    // SeasonStats 확인
    const qb2SeasonStats = await SeasonStats.findOne({ 
      playerNumber: 2,
      position: 'QB',
      teamName: 'HYLions'
    }).lean();
    
    console.log(`\n📅 SeasonStats:`, qb2SeasonStats ? {
      gamesPlayed: qb2SeasonStats.gamesPlayed,
      totalPassingAttempts: qb2SeasonStats.totalPassingAttempts,
      totalPassingYards: qb2SeasonStats.totalPassingYards
    } : '없음');

    // CareerStats 확인
    const qb2CareerStats = await CareerStats.findOne({ 
      playerNumber: 2,
      position: 'QB',
      teamName: 'HYLions'
    }).lean();
    
    console.log(`\n🏆 CareerStats:`, qb2CareerStats ? {
      totalGamesPlayed: qb2CareerStats.totalGamesPlayed,
      totalPassingAttempts: qb2CareerStats.totalPassingAttempts,
      totalPassingYards: qb2CareerStats.totalPassingYards
    } : '없음');

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkQBStats();