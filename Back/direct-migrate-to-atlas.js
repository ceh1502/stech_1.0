const mongoose = require('mongoose');

async function directMigrateToAtlas() {
  const localUri = 'mongodb://localhost:27017/stech';
  const atlasUri = 'mongodb+srv://ceh1502:ceh9412@cluster0.97esexh.mongodb.net/stech?retryWrites=true&w=majority&appName=Cluster0';
  
  let localConnection, atlasConnection;
  
  try {
    // 로컬 연결
    console.log('🔗 로컬 MongoDB 연결 중...');
    localConnection = await mongoose.createConnection(localUri);
    console.log('✅ 로컬 MongoDB 연결 성공');
    
    // Atlas 연결
    console.log('🔗 Atlas MongoDB 연결 중...');
    atlasConnection = await mongoose.createConnection(atlasUri);
    console.log('✅ Atlas MongoDB 연결 성공');
    
    // 스키마 정의
    const playerSchema = new mongoose.Schema({}, { strict: false });
    
    const LocalPlayer = localConnection.model('Player', playerSchema);
    const AtlasPlayer = atlasConnection.model('Player', playerSchema);
    
    // 로컬에서 모든 선수 데이터 조회
    console.log('📊 로컬 데이터 조회 중...');
    const localPlayers = await LocalPlayer.find({}).lean();
    console.log(`📋 조회된 선수 수: ${localPlayers.length}명`);
    
    // Atlas의 기존 데이터 확인
    const existingCount = await AtlasPlayer.countDocuments();
    console.log(`📈 Atlas 기존 선수 수: ${existingCount}명`);
    
    if (existingCount > 0) {
      console.log('🧹 기존 Atlas 데이터 삭제 중...');
      const deleteResult = await AtlasPlayer.deleteMany({});
      console.log(`✅ 삭제된 선수 수: ${deleteResult.deletedCount}명`);
    }
    
    // 배치 삽입 (100명씩)
    const batchSize = 100;
    let insertedCount = 0;
    
    console.log('📤 Atlas로 데이터 마이그레이션 시작...');
    
    for (let i = 0; i < localPlayers.length; i += batchSize) {
      const batch = localPlayers.slice(i, i + batchSize);
      
      try {
        await AtlasPlayer.insertMany(batch, { ordered: false });
        insertedCount += batch.length;
        console.log(`✅ 배치 ${Math.ceil((i + 1) / batchSize)} 완료: ${batch.length}명 (총 ${insertedCount}/${localPlayers.length})`);
      } catch (error) {
        console.error(`❌ 배치 ${Math.ceil((i + 1) / batchSize)} 실패:`, error.message);
        
        // 개별 삽입 시도
        for (const player of batch) {
          try {
            await AtlasPlayer.create(player);
            insertedCount++;
          } catch (singleError) {
            console.error(`❌ 선수 ${player.playerId} 실패:`, singleError.message);
          }
        }
      }
    }
    
    // 최종 확인
    const finalCount = await AtlasPlayer.countDocuments();
    console.log(`\n📊 마이그레이션 결과:`);
    console.log(`✅ 성공적으로 삽입된 선수: ${insertedCount}명`);
    console.log(`🎯 최종 Atlas 선수 수: ${finalCount}명`);
    
    // 팀별 통계
    console.log('\n🏫 Atlas 팀별 선수 수:');
    const teams = [
      'KKRagingBulls', 'KHCommanders', 'SNGreenTerrors', 'USCityhawks', 'DGTuskers',
      'KMRazorbacks', 'YSEagles', 'KUTigers', 'HICowboys', 'SSCrusaders', 'HYLions'
    ];
    
    for (const teamName of teams) {
      const count = await AtlasPlayer.countDocuments({ teamName });
      console.log(`${teamName}: ${count}명`);
    }
    
    console.log('\n🚀 MongoDB Atlas 마이그레이션 완료!');
    
  } catch (error) {
    console.error('💥 마이그레이션 실패:', error);
  } finally {
    if (localConnection) await localConnection.close();
    if (atlasConnection) await atlasConnection.close();
    console.log('🔌 모든 연결 종료');
  }
}

if (require.main === module) {
  directMigrateToAtlas();
}

module.exports = { directMigrateToAtlas };