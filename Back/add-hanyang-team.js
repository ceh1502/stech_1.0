const mongoose = require('mongoose');

// MongoDB 연결 설정
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stech';

// Player Schema 정의
const playerSchema = new mongoose.Schema({}, {strict: false});
const Player = mongoose.model('Player', playerSchema);

// 한양대학교 팀 선수 데이터 생성
function generateHanyangPlayers() {
  const positions = {
    'QB': 3,
    'RB': 8, 
    'WR': 23,
    'TE': 9,
    'K': 2,
    'P': 2,
    'OL': 18,
    'DL': 17,
    'LB': 16,
    'DB': 2
  };

  const names = [
    '김민수', '이철수', '박영희', '정다한', '최웅진', '한상민', '조현우', '윤태현',
    '장승우', '권도현', '서민준', '류정호', '오승민', '전우진', '황시우', '강건우',
    '임주원', '신예준', '조태현', '정현우', '한지훈', '박서준', '김도윤', '이준서',
    '최하준', '장우진', '권시우', '서예준', '류도현', '오현우', '전민준', '황준서',
    '강태현', '임건우', '신도현', '조우진', '정시우', '한예준', '박준서', '김현우',
    '이태현', '최민준', '장시우', '권예준', '서도현', '류우진', '오민준', '전준서',
    '황현우', '강태현', '임시우', '신예준', '조도현', '정우진', '한민준', '박준서',
    '김태현', '이현우', '최시우', '장예준', '권도현', '서우진', '류민준', '오준서',
    '전현우', '황태현', '강시우', '임예준', '신도현', '조우진', '정민준', '한준서',
    '박현우', '김시우', '이예준', '최도현', '장우진', '권민준', '서준서', '류현우',
    '오태현', '전시우', '황예준', '강도현', '임우진', '신민준', '조준서', '정현우',
    '한태현', '박시우', '김예준', '이도현', '최우진', '장민준', '권준서', '서현우',
    '류태현', '오시우', '전예준', '황도현'
  ];

  const players = [];
  let playerIndex = 0;
  let jerseyNumber = 0;

  for (const [position, count] of Object.entries(positions)) {
    for (let i = 0; i < count; i++) {
      const player = {
        playerId: `HY${jerseyNumber.toString().padStart(2, '0')}`,
        name: names[playerIndex % names.length],
        jerseyNumber: jerseyNumber,
        position: position,
        teamName: 'HYLions', // JSON에서 사용하는 팀명
        league: '1부',
        season: '2024',
        height: `${Math.floor(Math.random() * 20) + 170}cm`,
        weight: `${Math.floor(Math.random() * 30) + 65}kg`,
        grade: `${Math.floor(Math.random() * 4) + 1}학년`,
        stats: {
          gamesPlayed: 0,
          // 다른 스탯들은 더미 생성기에서 추가될 예정
        },
        processedGames: []
      };
      
      players.push(player);
      playerIndex++;
      jerseyNumber++;
    }
  }

  return players;
}

async function addHanyangTeam() {
  try {
    console.log('🔗 MongoDB에 연결 중...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB 연결 성공');

    // 기존 한양대 선수가 있는지 확인
    const existingHanyangPlayers = await Player.countDocuments({ teamName: 'HYLions' });
    console.log(`📊 기존 한양대 선수 수: ${existingHanyangPlayers}명`);

    if (existingHanyangPlayers > 0) {
      console.log('⚠️ 한양대 선수가 이미 존재합니다. 기존 데이터를 삭제하고 새로 생성하시겠습니까?');
      console.log('🧹 기존 한양대 선수 데이터를 삭제합니다...');
      
      const deleteResult = await Player.deleteMany({ teamName: 'HYLions' });
      console.log(`✅ 삭제된 선수: ${deleteResult.deletedCount}명`);
    }

    // 한양대 선수 데이터 생성
    const hanyangPlayers = generateHanyangPlayers();
    console.log(`📝 생성할 한양대 선수: ${hanyangPlayers.length}명`);

    // 선수 데이터 삽입
    await Player.insertMany(hanyangPlayers);
    console.log('✅ 한양대 선수 데이터 삽입 완료');

    console.log('📊 한양대 선수들에게 더미 스탯 생성은 별도 스크립트로 실행예정...');

    // 최종 확인
    const finalCount = await Player.countDocuments({ teamName: 'HYLions' });
    console.log(`🎯 최종 한양대 선수 수: ${finalCount}명`);

    // 포지션별 분포 확인
    console.log('\n🏈 한양대 포지션별 선수 수:');
    const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'P', 'OL', 'DL', 'LB', 'DB'];
    for (const position of positions) {
      const count = await Player.countDocuments({ teamName: 'HYLions', position });
      console.log(`${position}: ${count}명`);
    }

    console.log('\n🚀 한양대학교 라이온스 팀 데이터 추가 완료!');

  } catch (error) {
    console.error('💥 한양대 팀 추가 중 오류 발생:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB 연결 종료');
  }
}

// 스크립트 실행
if (require.main === module) {
  addHanyangTeam();
}

module.exports = { addHanyangTeam };