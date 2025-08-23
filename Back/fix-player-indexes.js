const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stech';

async function fixPlayerIndexes() {
  try {
    console.log('🔗 MongoDB에 연결 중...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB 연결 성공');

    const db = mongoose.connection.db;
    const playersCollection = db.collection('players');

    // 기존 인덱스 확인
    console.log('📊 현재 players 컬렉션의 인덱스:');
    const indexes = await playersCollection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)} (${index.name})`);
    });

    // 문제가 되는 teamId_1_jerseyNumber_1 인덱스 삭제
    try {
      await playersCollection.dropIndex('teamId_1_jerseyNumber_1');
      console.log('✅ 기존 teamId_1_jerseyNumber_1 인덱스 삭제 완료');
    } catch (error) {
      if (error.code === 27 || error.message.includes('index not found')) {
        console.log('ℹ️  teamId_1_jerseyNumber_1 인덱스가 이미 존재하지 않음');
      } else {
        throw error;
      }
    }

    // 새로운 teamName_1_jerseyNumber_1 인덱스 생성
    try {
      await playersCollection.createIndex(
        { teamName: 1, jerseyNumber: 1 }, 
        { unique: true, name: 'teamName_1_jerseyNumber_1' }
      );
      console.log('✅ 새로운 teamName_1_jerseyNumber_1 인덱스 생성 완료');
    } catch (error) {
      if (error.code === 85 || error.message.includes('already exists')) {
        console.log('ℹ️  teamName_1_jerseyNumber_1 인덱스가 이미 존재함');
      } else {
        throw error;
      }
    }

    // 인덱스 재확인
    console.log('\n📊 업데이트된 players 컬렉션의 인덱스:');
    const updatedIndexes = await playersCollection.indexes();
    updatedIndexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)} (${index.name})`);
    });

  } catch (error) {
    console.error('💥 인덱스 수정 중 오류 발생:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB 연결 종료');
  }
}

fixPlayerIndexes();