const mongoose = require('mongoose');
const fs = require('fs');

async function exportLocalData() {
  try {
    console.log('🔗 로컬 MongoDB에 연결 중...');
    await mongoose.connect('mongodb://localhost:27017/stech');
    console.log('✅ 로컬 MongoDB 연결 성공');

    const Player = mongoose.model('Player', new mongoose.Schema({}, {strict: false}));
    
    // 모든 선수 데이터 조회
    console.log('📊 선수 데이터 조회 중...');
    const players = await Player.find({}).lean();
    
    console.log(`📋 조회된 선수 수: ${players.length}명`);
    
    // JSON 파일로 저장
    const exportData = {
      totalPlayers: players.length,
      exportDate: new Date().toISOString(),
      players: players
    };
    
    const fileName = 'local-players-export.json';
    fs.writeFileSync(fileName, JSON.stringify(exportData, null, 2));
    
    console.log(`💾 데이터 저장 완료: ${fileName}`);
    console.log(`📦 파일 크기: ${(fs.statSync(fileName).size / 1024 / 1024).toFixed(2)}MB`);
    
    // 팀별 통계
    console.log('\n🏫 팀별 선수 수:');
    const teamCounts = {};
    players.forEach(player => {
      teamCounts[player.teamName] = (teamCounts[player.teamName] || 0) + 1;
    });
    
    Object.entries(teamCounts).forEach(([team, count]) => {
      console.log(`${team}: ${count}명`);
    });
    
    await mongoose.disconnect();
    console.log('🔌 로컬 MongoDB 연결 종료');
    
    return fileName;
    
  } catch (error) {
    console.error('💥 데이터 내보내기 실패:', error.message);
    throw error;
  }
}

if (require.main === module) {
  exportLocalData();
}

module.exports = { exportLocalData };