const mongoose = require('mongoose');

async function checkDBData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/stech');
    console.log('✅ MongoDB 연결 성공');
    
    const connection = mongoose.connection;
    
    // 1. 모든 컬렉션 확인
    const collections = await connection.db.listCollections().toArray();
    console.log('\n📋 사용 가능한 컬렉션들:');
    collections.forEach(col => console.log('  -', col.name));
    
    // 2. teamstats 컬렉션 확인
    console.log('\n🏈 teamstats 컬렉션 데이터:');
    const teamStats = await connection.collection('teamstats').find({}).limit(3).toArray();
    console.log('총 개수:', await connection.collection('teamstats').countDocuments());
    if (teamStats.length > 0) {
      console.log('샘플 데이터:', JSON.stringify(teamStats[0], null, 2));
    }
    
    // 3. teamseasonstats 컬렉션 확인
    console.log('\n🏆 teamseasonstats 컬렉션 데이터:');
    const teamSeasonStats = await connection.collection('teamseasonstats').find({}).limit(3).toArray();
    console.log('총 개수:', await connection.collection('teamseasonstats').countDocuments());
    if (teamSeasonStats.length > 0) {
      console.log('샘플 데이터:', JSON.stringify(teamSeasonStats[0], null, 2));
    }
    
    // 4. team_total_stats 컬렉션 확인
    console.log('\n📊 team_total_stats 컬렉션 데이터:');
    const teamTotalStats = await connection.collection('team_total_stats').find({}).limit(3).toArray();
    console.log('총 개수:', await connection.collection('team_total_stats').countDocuments());
    if (teamTotalStats.length > 0) {
      console.log('샘플 데이터:', JSON.stringify(teamTotalStats[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkDBData();