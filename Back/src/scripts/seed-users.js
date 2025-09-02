// NestJS 애플리케이션을 사용해서 테스트 유저 생성
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../app.module');

async function seedUsers() {
  console.log('🚀 NestJS 앱 초기화 중...');
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const authService = app.get('AuthService');
  
  // 테스트 유저 데이터
  const testUsers = [
    // 건국대 레이징불스
    { username: 'konkuk_coach', password: 'password123', authCode: '1871' },
    { username: 'konkuk_player1', password: 'password123', authCode: '1802' },
    { username: 'konkuk_player2', password: 'password123', authCode: '1802' },
    
    // 연세대 이글스
    { username: 'yonsei_coach', password: 'password123', authCode: '1211' },
    { username: 'yonsei_player1', password: 'password123', authCode: '1672' },
    { username: 'yonsei_player2', password: 'password123', authCode: '1672' },
    
    // 한양대 라이온스
    { username: 'hanyang_coach', password: 'password123', authCode: '1971' },
    { username: 'hanyang_player1', password: 'password123', authCode: '1142' },
    
    // 성균관대 로얄스 (경기강원권)
    { username: 'skku_coach', password: 'password123', authCode: '2751' },
    { username: 'skku_player1', password: 'password123', authCode: '2912' },
    
    // 경북대 오렌지파이터스 (대구경북권)
    { username: 'knu_coach', password: 'password123', authCode: '3761' },
    { username: 'knu_player1', password: 'password123', authCode: '3092' },
  ];
  
  try {
    console.log('👥 테스트 유저 생성 중...');
    
    for (const userData of testUsers) {
      try {
        const result = await authService.signup(userData);
        console.log(`✅ ${userData.username} 생성 완료`);
      } catch (error) {
        if (error.message.includes('이미 존재하는 아이디')) {
          console.log(`⚠️  ${userData.username} 이미 존재함 - 스킵`);
        } else {
          console.error(`❌ ${userData.username} 생성 실패:`, error.message);
        }
      }
    }
    
    console.log('\n🎉 테스트 유저 시딩 완료!');
    
  } catch (error) {
    console.error('❌ 시딩 중 에러:', error);
  } finally {
    await app.close();
  }
}

seedUsers();