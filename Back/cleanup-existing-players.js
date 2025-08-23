const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stech';

async function cleanupExistingPlayers() {
  try {
    console.log('🔗 MongoDB에 연결 중...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB 연결 성공');

    const db = mongoose.connection.db;
    const playersCollection = db.collection('players');

    // 현재 플레이어 현황 확인
    const totalPlayers = await playersCollection.countDocuments();
    console.log(`📊 전체 선수 수: ${totalPlayers}명`);

    // teamName 필드가 있는 선수들 확인
    const playersWithTeamName = await playersCollection.countDocuments({ teamName: { $exists: true, $ne: null } });
    const playersWithoutTeamName = await playersCollection.countDocuments({ $or: [{ teamName: { $exists: false } }, { teamName: null }] });
    
    console.log(`✅ teamName 필드가 있는 선수: ${playersWithTeamName}명`);
    console.log(`❌ teamName 필드가 없거나 null인 선수: ${playersWithoutTeamName}명`);

    if (playersWithoutTeamName > 0) {
      console.log('\n🧹 teamName 필드가 없거나 null인 선수들을 삭제합니다...');
      
      const deleteResult = await playersCollection.deleteMany({
        $or: [
          { teamName: { $exists: false } },
          { teamName: null }
        ]
      });
      
      console.log(`✅ 삭제된 선수 수: ${deleteResult.deletedCount}명`);
    }

    // 정리 후 상태 확인
    const remainingPlayers = await playersCollection.countDocuments();
    console.log(`\n📊 정리 후 전체 선수 수: ${remainingPlayers}명`);

    // 팀별 선수 분포 확인
    const teamDistribution = await playersCollection.aggregate([
      { $match: { teamName: { $exists: true, $ne: null } } },
      { $group: { _id: "$teamName", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();

    console.log('\n🏫 팀별 선수 분포:');
    teamDistribution.forEach(team => {
      console.log(`  ${team._id}: ${team.count}명`);
    });

    // 이제 새로운 인덱스 생성 시도
    console.log('\n🔧 새로운 teamName_1_jerseyNumber_1 인덱스 생성 시도...');
    try {
      await playersCollection.createIndex(
        { teamName: 1, jerseyNumber: 1 }, 
        { unique: true, name: 'teamName_1_jerseyNumber_1' }
      );
      console.log('✅ teamName_1_jerseyNumber_1 인덱스 생성 완료');
    } catch (error) {
      if (error.code === 85 || error.message.includes('already exists')) {
        console.log('ℹ️  teamName_1_jerseyNumber_1 인덱스가 이미 존재함');
      } else {
        console.error('❌ 인덱스 생성 실패:', error.message);
      }
    }

    // 최종 인덱스 확인
    console.log('\n📊 최종 인덱스 상태:');
    const indexes = await playersCollection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)} (${index.name})`);
    });

  } catch (error) {
    console.error('💥 데이터 정리 중 오류 발생:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB 연결 종료');
  }
}

cleanupExistingPlayers();