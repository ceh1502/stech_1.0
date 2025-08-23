const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB 연결 설정 (NestJS 앱과 같은 설정)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stech';

// Player Schema 정의 (기존 스키마와 일치)
const playerSchema = new mongoose.Schema({
  playerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  jerseyNumber: { type: Number, required: true },
  position: { type: String, required: true },
  teamName: { type: String, required: true }, // PlayerService에서 teamName으로 조회하므로 추가
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }, // 임시로 required 제거
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

const Player = mongoose.model('Player', playerSchema);

async function insertPlayersToDatabase() {
  try {
    console.log('🔗 MongoDB에 연결 중...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB 연결 성공');

    // JSON 파일 읽기
    const jsonFilePath = path.join(__dirname, 'all-teams-players-complete.json');
    if (!fs.existsSync(jsonFilePath)) {
      throw new Error('all-teams-players-complete.json 파일을 찾을 수 없습니다.');
    }

    const data = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8'));
    const players = data.players;

    console.log(`📊 삽입할 선수 수: ${players.length}명`);
    console.log(`🏫 팀 수: ${data.teams}개`);

    // 기존 선수 데이터 확인
    const existingPlayersCount = await Player.countDocuments();
    console.log(`📈 기존 DB의 선수 수: ${existingPlayersCount}명`);

    // 중복 체크를 위해 기존 playerId 목록 가져오기
    const existingPlayerIds = await Player.find({}, 'playerId').lean();
    const existingIds = new Set(existingPlayerIds.map(p => p.playerId));

    // 새로운 선수들만 필터링
    const newPlayers = players.filter(player => !existingIds.has(player.playerId));
    
    console.log(`🆕 새로 삽입할 선수 수: ${newPlayers.length}명`);
    console.log(`⚠️ 중복으로 스킵할 선수 수: ${players.length - newPlayers.length}명`);

    if (newPlayers.length === 0) {
      console.log('🎯 모든 선수가 이미 데이터베이스에 존재합니다.');
      return;
    }

    // 배치 삽입 (1000개씩)
    const batchSize = 100;
    let insertedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < newPlayers.length; i += batchSize) {
      const batch = newPlayers.slice(i, i + batchSize);
      
      try {
        await Player.insertMany(batch, { ordered: false });
        insertedCount += batch.length;
        console.log(`✅ 배치 ${Math.ceil((i + 1) / batchSize)} 완료: ${batch.length}명 삽입`);
      } catch (error) {
        console.error(`❌ 배치 ${Math.ceil((i + 1) / batchSize)} 실패:`, error.message);
        
        // 개별 삽입 시도
        for (const player of batch) {
          try {
            await Player.create(player);
            insertedCount++;
          } catch (singleError) {
            failedCount++;
            console.error(`❌ 선수 ${player.playerId} (${player.name}) 삽입 실패:`, singleError.message);
          }
        }
      }
    }

    // 최종 결과 출력
    console.log('\n📊 삽입 결과:');
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
    console.log(`\n🎯 최종 DB 선수 수: ${totalPlayersAfter}명`);

  } catch (error) {
    console.error('💥 데이터베이스 삽입 중 오류 발생:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB 연결 종료');
  }
}

// 스크립트 실행
if (require.main === module) {
  insertPlayersToDatabase();
}

module.exports = { insertPlayersToDatabase };