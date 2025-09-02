// 테스트 유저 데이터 생성 스크립트
const mongoose = require('mongoose');

// MongoDB 연결 
const mongoUri = 'mongodb+srv://ceh1502:ceh9412@cluster0.97esexh.mongodb.net/stech?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoUri);

// User 스키마를 직접 import하는 대신 간단하게 정의
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  teamName: { type: String, required: true },
  role: { type: String, required: true, enum: ['coach', 'player'] },
  region: { type: String, required: true },
  authCode: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// 테스트 유저 데이터
const testUsers = [
  // 건국대 레이징불스
  { username: 'konkuk_coach', password: 'password123', authCode: '1871' }, // 코치
  { username: 'konkuk_player1', password: 'password123', authCode: '1802' }, // 선수
  { username: 'konkuk_player2', password: 'password123', authCode: '1802' }, // 선수
  
  // 연세대 이글스
  { username: 'yonsei_coach', password: 'password123', authCode: '1211' }, // 코치
  { username: 'yonsei_player1', password: 'password123', authCode: '1672' }, // 선수
  { username: 'yonsei_player2', password: 'password123', authCode: '1672' }, // 선수
  
  // 한양대 라이온스
  { username: 'hanyang_coach', password: 'password123', authCode: '1971' }, // 코치
  { username: 'hanyang_player1', password: 'password123', authCode: '1142' }, // 선수
  
  // 성균관대 로얄스 (경기강원권)
  { username: 'skku_coach', password: 'password123', authCode: '2751' }, // 코치
  { username: 'skku_player1', password: 'password123', authCode: '2912' }, // 선수
  
  // 경북대 오렌지파이터스 (대구경북권)
  { username: 'knu_coach', password: 'password123', authCode: '3761' }, // 코치
  { username: 'knu_player1', password: 'password123', authCode: '3092' }, // 선수
];

// 팀 코드 매핑 (team-codes.ts와 동일)
const TEAM_CODES = {
  '1871': { team: '건국대 레이징불스', region: '서울권', role: 'coach' },
  '1802': { team: '건국대 레이징불스', region: '서울권', role: 'player' },
  '1211': { team: '연세대 이글스', region: '서울권', role: 'coach' },
  '1672': { team: '연세대 이글스', region: '서울권', role: 'player' },
  '1971': { team: '한양대 라이온스', region: '서울권', role: 'coach' },
  '1142': { team: '한양대 라이온스', region: '서울권', role: 'player' },
  '2751': { team: '성균관대 로얄스', region: '경기강원권', role: 'coach' },
  '2912': { team: '성균관대 로얄스', region: '경기강원권', role: 'player' },
  '3761': { team: '경북대 오렌지파이터스', region: '대구경북권', role: 'coach' },
  '3092': { team: '경북대 오렌지파이터스', region: '대구경북권', role: 'player' }
};

async function createTestUsers() {
  try {
    console.log('🗑️  기존 User 컬렉션 초기화...');
    await User.deleteMany({});
    
    console.log('👥 테스트 유저 생성 중...');
    
    for (const userData of testUsers) {
      const teamInfo = TEAM_CODES[userData.authCode];
      
      const user = new User({
        username: userData.username,
        password: userData.password, // 실제 프로덕션에서는 해싱된 비밀번호를 사용해야 함
        teamName: teamInfo.team,
        role: teamInfo.role,
        region: teamInfo.region,
        authCode: userData.authCode,
        isActive: true
      });
      
      await user.save();
      console.log(`✅ ${user.username} (${user.teamName} ${user.role}) 생성 완료`);
    }
    
    console.log('\n🎉 모든 테스트 유저 생성 완료!');
    console.log('\n📊 생성된 유저 통계:');
    
    const stats = await User.aggregate([
      {
        $group: {
          _id: { teamName: '$teamName', role: '$role' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.teamName': 1, '_id.role': 1 }
      }
    ]);
    
    stats.forEach(stat => {
      console.log(`  ${stat._id.teamName} ${stat._id.role}: ${stat.count}명`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ 에러 발생:', error);
    process.exit(1);
  }
}

createTestUsers();