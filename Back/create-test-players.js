const mongoose = require('mongoose');

// MongoDB 연결
async function connectDB() {
  try {
    await mongoose.connect('mongodb://localhost:27017/stech', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB 연결 성공');
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error);
    process.exit(1);
  }
}

// 선수 스키마 정의
const PlayerSchema = new mongoose.Schema({
  playerId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  jerseyNumber: { type: Number, required: true },
  position: { type: String, required: true },
  studentId: String,
  email: String,
  nickname: String,
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  stats: { type: Object, default: {} },
  league: { type: String, enum: ['1부', '2부'], default: '1부' },
  season: { type: String, default: '2024' }
}, { timestamps: true });

// 팀 스키마 정의
const TeamSchema = new mongoose.Schema({
  teamId: { type: String, required: true, unique: true },
  teamName: { type: String, required: true },
  abbreviation: String,
  location: String,
  league: String,
}, { timestamps: true });

const Player = mongoose.model('Player', PlayerSchema);
const Team = mongoose.model('Team', TeamSchema);

// 테스트 팀 생성
async function createTestTeams() {
  const testTeams = [
    {
      teamId: 'DGTU001',
      teamName: 'DGTuskers',
      abbreviation: 'DG',
      location: 'Daegu',
      league: '1부'
    },
    {
      teamId: 'KMRB001', 
      teamName: 'KMRazorbacks',
      abbreviation: 'KM',
      location: 'Keimyung',
      league: '1부'
    }
  ];

  for (const teamData of testTeams) {
    try {
      const existingTeam = await Team.findOne({ teamId: teamData.teamId });
      if (!existingTeam) {
        const team = new Team(teamData);
        await team.save();
        console.log(`✅ 팀 생성: ${teamData.teamName}`);
      } else {
        console.log(`⚠️ 팀 이미 존재: ${teamData.teamName}`);
      }
    } catch (error) {
      console.error(`❌ 팀 생성 실패 ${teamData.teamName}:`, error.message);
    }
  }
}

// 테스트 선수 생성
async function createTestPlayers() {
  // 팀 정보 가져오기
  const dgTeam = await Team.findOne({ teamId: 'DGTU001' });
  const kmTeam = await Team.findOne({ teamId: 'KMRB001' });

  if (!dgTeam || !kmTeam) {
    console.error('❌ 팀을 찾을 수 없습니다.');
    return;
  }

  // 테스트 선수 데이터
  const testPlayers = [
    // Away Team (KMRazorbacks) - 주요 공격 선수들
    { jerseyNumber: 15, name: '김민수', position: 'QB', teamId: kmTeam._id, playerId: 'KM15QB001' },
    { jerseyNumber: 33, name: '박진우', position: 'WR', teamId: kmTeam._id, playerId: 'KM33WR001' },
    { jerseyNumber: 16, name: '이상호', position: 'WR', teamId: kmTeam._id, playerId: 'KM16WR001' },
    { jerseyNumber: 29, name: '최대한', position: 'RB', teamId: kmTeam._id, playerId: 'KM29RB001' },
    { jerseyNumber: 26, name: '정우석', position: 'RB', teamId: kmTeam._id, playerId: 'KM26RB002' },
    { jerseyNumber: 24, name: '김키커', position: 'K', teamId: kmTeam._id, playerId: 'KM24K001' },
    { jerseyNumber: 84, name: '송태영', position: 'WR', teamId: kmTeam._id, playerId: 'KM84WR002' },
    { jerseyNumber: 9, name: '한승우', position: 'WR', teamId: kmTeam._id, playerId: 'KM09WR003' },

    // Home Team (DGTuskers) - 주요 수비/공격 선수들
    { jerseyNumber: 5, name: '홍길동', position: 'QB', teamId: dgTeam._id, playerId: 'DG05QB001' },
    { jerseyNumber: 31, name: '강민호', position: 'DB', teamId: dgTeam._id, playerId: 'DG31DB001' },
    { jerseyNumber: 35, name: '윤정수', position: 'RB', teamId: dgTeam._id, playerId: 'DG35RB001' },
    { jerseyNumber: 44, name: '조현우', position: 'RB', teamId: dgTeam._id, playerId: 'DG44RB002' },
    { jerseyNumber: 89, name: '김라인백', position: 'LB', teamId: dgTeam._id, playerId: 'DG89LB001' },
    { jerseyNumber: 22, name: '박수비', position: 'LB', teamId: dgTeam._id, playerId: 'DG22LB002' },
    { jerseyNumber: 79, name: '이디펜스', position: 'DL', teamId: dgTeam._id, playerId: 'DG79DL001' },
    { jerseyNumber: 67, name: '최펀터', position: 'P', teamId: dgTeam._id, playerId: 'DG67P001' },
    { jerseyNumber: 92, name: '강타이트', position: 'TE', teamId: dgTeam._id, playerId: 'DG92TE001' },
    { jerseyNumber: 25, name: '서와이드', position: 'WR', teamId: dgTeam._id, playerId: 'DG25WR001' },
    
    // 추가 수비 선수들
    { jerseyNumber: 50, name: '김디라인', position: 'DL', teamId: kmTeam._id, playerId: 'KM50DL001' },
    { jerseyNumber: 81, name: '박라백', position: 'LB', teamId: kmTeam._id, playerId: 'KM81LB001' },
    { jerseyNumber: 75, name: '최디라인2', position: 'DL', teamId: dgTeam._id, playerId: 'DG75DL002' },
    { jerseyNumber: 76, name: '홍디라인3', position: 'DL', teamId: kmTeam._id, playerId: 'KM76DL002' },
    { jerseyNumber: 77, name: '윤디라인4', position: 'DL', teamId: dgTeam._id, playerId: 'DG77DL003' },
    { jerseyNumber: 58, name: '장디라인5', position: 'DL', teamId: kmTeam._id, playerId: 'KM58DL003' },
    { jerseyNumber: 59, name: '강디라인6', position: 'DL', teamId: dgTeam._id, playerId: 'DG59DL004' },
    { jerseyNumber: 65, name: '오디라인7', position: 'DL', teamId: dgTeam._id, playerId: 'DG65DL005' },
    { jerseyNumber: 41, name: '서라백2', position: 'LB', teamId: dgTeam._id, playerId: 'DG41LB003' },
    { jerseyNumber: 11, name: '노디비', position: 'DB', teamId: kmTeam._id, playerId: 'KM11DB001' },
    { jerseyNumber: 28, name: '김넘버', position: 'DB', teamId: kmTeam._id, playerId: 'KM28DB002' },
    { jerseyNumber: 40, name: '박넘버2', position: 'DB', teamId: kmTeam._id, playerId: 'KM40DB003' },
  ];

  console.log('🚀 테스트 선수 생성 시작...');

  for (const playerData of testPlayers) {
    try {
      const existingPlayer = await Player.findOne({ 
        jerseyNumber: playerData.jerseyNumber,
        teamId: playerData.teamId 
      });
      
      if (!existingPlayer) {
        const player = new Player({
          ...playerData,
          studentId: `STU${playerData.jerseyNumber.toString().padStart(3, '0')}`,
          email: `player${playerData.jerseyNumber}@test.com`,
          nickname: `${playerData.position}${playerData.jerseyNumber}`,
          stats: {
            gamesPlayed: 0,
            totalYards: 0,
            totalTouchdowns: 0
          }
        });
        
        await player.save();
        console.log(`✅ 선수 생성: ${playerData.name} (#${playerData.jerseyNumber} ${playerData.position})`);
      } else {
        console.log(`⚠️ 선수 이미 존재: ${playerData.name} (#${playerData.jerseyNumber})`);
      }
    } catch (error) {
      console.error(`❌ 선수 생성 실패 ${playerData.name}:`, error.message);
    }
  }
}

// 메인 실행 함수
async function main() {
  await connectDB();
  
  console.log('🏈 테스트 데이터 생성 시작...');
  
  await createTestTeams();
  await createTestPlayers();
  
  console.log('✅ 테스트 데이터 생성 완료!');
  
  // 생성된 선수 수 확인
  const playerCount = await Player.countDocuments();
  const teamCount = await Team.countDocuments();
  
  console.log(`📊 총 팀: ${teamCount}개, 총 선수: ${playerCount}명`);
  
  mongoose.connection.close();
}

main().catch(error => {
  console.error('❌ 실행 중 오류:', error);
  process.exit(1);
});