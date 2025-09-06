const mongoose = require('mongoose');

async function reprocessTeamStats() {
  try {
    await mongoose.connect('mongodb://localhost:27017/stech');
    console.log('✅ MongoDB 연결 성공');
    
    const connection = mongoose.connection;
    
    // 기존 team_total_stats 컬렉션 삭제 (새로 계산하기 위해)
    await connection.collection('team_total_stats').deleteMany({});
    console.log('🗑️ 기존 team_total_stats 컬렉션 정리 완료');
    
    // 기존 teamgamestats 컬렉션도 정리 (새로 계산하기 위해)
    await connection.collection('teamgamestats').deleteMany({});
    console.log('🗑️ 기존 teamgamestats 컬렉션 정리 완료');
    
    // 게임 데이터를 다시 처리하려면 /api/game/upload-json 엔드포인트를 사용하여 
    // JSON 파일을 다시 업로드해야 합니다.
    
    console.log('💡 다음 단계: 게임 JSON 파일을 /api/game/upload-json 엔드포인트로 다시 업로드하세요.');
    console.log('💡 그러면 새로운 러싱 스탯 로직이 적용됩니다.');
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await mongoose.disconnect();
  }
}

reprocessTeamStats();