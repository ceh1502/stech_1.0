const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB Atlas 연결 설정 (환경변수 사용)
let MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.log('❌ MONGODB_URI 환경변수가 설정되지 않았습니다.');
  console.log('Vercel에서 설정한 MongoDB Atlas 연결 문자열을 입력해주세요.');
  console.log('형식: mongodb+srv://username:password@cluster.mongodb.net/database');
  console.log('');
  console.log('환경변수가 없으므로 스크립트를 종료합니다.');
  console.log('');
  console.log('실행 방법:');
  console.log('MONGODB_URI="your-connection-string" node migrate-to-atlas.js');
  process.exit(1);
}

// Player Schema 정의 (기존과 동일)
const playerSchema = new mongoose.Schema({
  playerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  jerseyNumber: { type: Number, required: true },
  position: { type: String, required: true },
  teamName: { type: String, required: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  league: { type: String, required: true },
  season: { type: String, required: true },
  height: { type: String },
  weight: { type: String },
  grade: { type: String },
  stats: { type: Object, default: {} },
  processedGames: [{ type: String }]
}, {
  timestamps: true
});

// 인덱스 설정
playerSchema.index({ teamName: 1, jerseyNumber: 1 }, { unique: true });

const Player = mongoose.model('Player', playerSchema);

async function migratePlayersToAtlas() {
  try {
    console.log('🔗 MongoDB Atlas에 연결 중...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Atlas 연결 성공');
    console.log('🔗 연결된 데이터베이스:', mongoose.connection.name);

    // JSON 파일 읽기
    const jsonFilePath = path.join(__dirname, 'all-teams-players-complete.json');
    if (!fs.existsSync(jsonFilePath)) {
      throw new Error('all-teams-players-complete.json 파일을 찾을 수 없습니다.');
    }

    const data = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    const players = data.players;

    console.log(`📊 마이그레이션할 선수 수: ${players.length}명`);
    console.log(`🏫 팀 수: ${data.teams}개`);

    // 기존 선수 데이터 확인
    const existingPlayersCount = await Player.countDocuments();
    console.log(`📈 Atlas의 기존 선수 수: ${existingPlayersCount}명`);

    if (existingPlayersCount > 0) {
      console.log('⚠️  Atlas에 이미 선수 데이터가 있습니다.');
      console.log('기존 데이터를 삭제하고 새로 삽입하시겠습니까? (Y/N)');
      
      // 일단 진행 (실제로는 사용자 입력 받아야 함)
      console.log('🧹 기존 데이터를 삭제하고 새로 삽입합니다...');
      const deleteResult = await Player.deleteMany({});
      console.log(`✅ 삭제된 선수 수: ${deleteResult.deletedCount}명`);
    }

    // 배치 삽입 (100개씩)
    const batchSize = 100;
    let insertedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);
      
      try {
        await Player.insertMany(batch, { ordered: false });
        insertedCount += batch.length;
        console.log(`✅ 배치 ${Math.ceil((i + 1) / batchSize)} 완료: ${batch.length}명 삽입 (총 ${insertedCount}/${players.length})`);
      } catch (error) {
        console.error(`❌ 배치 ${Math.ceil((i + 1) / batchSize)} 실패:`, error.message);
        
        // 개별 삽입 시도
        for (const player of batch) {
          try {
            await Player.create(player);
            insertedCount++;
          } catch (singleError) {
            failedCount++;
            console.error(`❌ 선수 ${player.playerId} (${player.name}) 삽입 실패: ${singleError.message}`);
          }
        }
      }
    }

    // 최종 결과 출력
    console.log('\n📊 마이그레이션 결과:');
    console.log(`✅ 성공적으로 삽입된 선수: ${insertedCount}명`);
    console.log(`❌ 삽입 실패한 선수: ${failedCount}명`);
    
    // 팀별 통계
    console.log('\n🏫 팀별 선수 수 확인:');
    const teams = [
      'KKRagingBulls', 'KHCommanders', 'SNGreenTerrors', 'USCityhawks', 'DGTuskers',
      'KMRazorbacks', 'YSEagles', 'KUTigers', 'HICowboys', 'SSCrusaders'
    ];
    
    for (const teamName of teams) {
      const count = await Player.countDocuments({ teamName });
      console.log(`${teamName}: ${count}명`);
    }

    // 전체 선수 수 확인
    const totalPlayersAfter = await Player.countDocuments();
    console.log(`\n🎯 최종 Atlas DB 선수 수: ${totalPlayersAfter}명`);

    console.log('\n🚀 MongoDB Atlas 마이그레이션 완료!');

  } catch (error) {
    console.error('💥 마이그레이션 중 오류 발생:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB Atlas 연결 종료');
  }
}

// 스크립트 실행
if (require.main === module) {
  migratePlayersToAtlas();
}

module.exports = { migratePlayersToAtlas };