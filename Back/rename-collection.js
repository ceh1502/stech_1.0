const mongoose = require('mongoose');

async function renameCollection() {
  try {
    await mongoose.connect('mongodb://localhost:27017/stech');
    console.log('✅ MongoDB 연결 성공');
    
    const connection = mongoose.connection;
    
    // teamseasonstats를 team_total_stats로 이름 변경
    await connection.db.renameCollection('teamseasonstats', 'team_total_stats');
    console.log('✅ teamseasonstats → team_total_stats 컬렉션 이름 변경 완료');
    
    // 변경 확인
    const collections = await connection.db.listCollections().toArray();
    console.log('\n📋 현재 컬렉션들:');
    collections.forEach(col => {
      if (col.name.includes('team') || col.name.includes('stats')) {
        console.log('  -', col.name);
      }
    });
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await mongoose.disconnect();
  }
}

renameCollection();