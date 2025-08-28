const mongoose = require('mongoose');

async function checkDatabaseStatus() {
  try {
    console.log('🔗 MongoDB Atlas 연결 중...');
    await mongoose.connect('mongodb+srv://ceh1502:ceh9412@cluster0.97esexh.mongodb.net/stech?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ MongoDB Atlas 연결 성공\n');

    // 스키마 정의 (간단하게)
    const playerSchema = new mongoose.Schema({}, { strict: false, collection: 'players' });
    const gameStatsSchema = new mongoose.Schema({}, { strict: false, collection: 'gamestats' });
    const seasonStatsSchema = new mongoose.Schema({}, { strict: false, collection: 'seasonstats' });
    const careerStatsSchema = new mongoose.Schema({}, { strict: false, collection: 'careerstats' });

    const Player = mongoose.model('Player', playerSchema);
    const GameStats = mongoose.model('GameStats', gameStatsSchema);
    const SeasonStats = mongoose.model('SeasonStats', seasonStatsSchema);
    const CareerStats = mongoose.model('CareerStats', careerStatsSchema);

    // 컬렉션 목록 조회
    console.log('📋 데이터베이스 컬렉션 목록:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    collections.forEach(col => console.log(`  - ${col.name}`));
    console.log();

    // Player 컬렉션 확인
    const playerCount = await Player.countDocuments();
    console.log(`👥 Player 컬렉션: ${playerCount}개`);
    
    if (playerCount > 0) {
      const samplePlayer = await Player.findOne().lean();
      console.log('   샘플 선수:', {
        name: samplePlayer.name,
        position: samplePlayer.position,
        teamName: samplePlayer.teamName,
        jerseyNumber: samplePlayer.jerseyNumber,
        hasStats: !!samplePlayer.stats,
        statsKeys: samplePlayer.stats ? Object.keys(samplePlayer.stats).slice(0, 5) : []
      });
    }
    console.log();

    // GameStats 컬렉션 확인
    const gameStatsCount = await GameStats.countDocuments();
    console.log(`🏈 GameStats 컬렉션: ${gameStatsCount}개`);
    
    if (gameStatsCount > 0) {
      const sampleGameStats = await GameStats.findOne().lean();
      console.log('   샘플 게임 스탯:', {
        playerNumber: sampleGameStats.playerNumber,
        gameKey: sampleGameStats.gameKey,
        gameDate: sampleGameStats.gameDate,
        position: sampleGameStats.position,
        passingYards: sampleGameStats.passingYards,
        rushingYards: sampleGameStats.rushingYards
      });
    }
    console.log();

    // SeasonStats 컬렉션 확인
    const seasonStatsCount = await SeasonStats.countDocuments();
    console.log(`📅 SeasonStats 컬렉션: ${seasonStatsCount}개`);
    
    if (seasonStatsCount > 0) {
      const sampleSeasonStats = await SeasonStats.findOne().lean();
      console.log('   샘플 시즌 스탯:', {
        playerNumber: sampleSeasonStats.playerNumber,
        season: sampleSeasonStats.season,
        position: sampleSeasonStats.position,
        gamesPlayed: sampleSeasonStats.gamesPlayed,
        totalPassingYards: sampleSeasonStats.totalPassingYards
      });
    }
    console.log();

    // CareerStats 컬렉션 확인
    const careerStatsCount = await CareerStats.countDocuments();
    console.log(`🏆 CareerStats 컬렉션: ${careerStatsCount}개`);
    
    if (careerStatsCount > 0) {
      const sampleCareerStats = await CareerStats.findOne().lean();
      console.log('   샘플 커리어 스탯:', {
        playerNumber: sampleCareerStats.playerNumber,
        position: sampleCareerStats.position,
        totalGamesPlayed: sampleCareerStats.totalGamesPlayed,
        totalSeasons: sampleCareerStats.totalSeasons
      });
    }
    console.log();

    // 포지션별 선수 분포
    console.log('📊 포지션별 선수 분포:');
    const positionStats = await Player.aggregate([
      { $group: { _id: '$position', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    positionStats.forEach(pos => console.log(`   ${pos._id}: ${pos.count}명`));
    console.log();

    // 팀별 선수 분포
    console.log('🏫 팀별 선수 분포:');
    const teamStats = await Player.aggregate([
      { $group: { _id: '$teamName', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    teamStats.forEach(team => console.log(`   ${team._id}: ${team.count}명`));
    console.log();

    console.log('✅ 데이터베이스 상태 확인 완료!');

  } catch (error) {
    console.error('❌ 데이터베이스 확인 실패:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 연결 종료');
  }
}

checkDatabaseStatus();