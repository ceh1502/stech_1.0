// mock-server.js - 백엔드 대신 사용할 임시 서버
const express = require('express');
const cors = require('cors');
const app = express();

// CORS 설정
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json());

// 임시 사용자 데이터 저장소
let users = [];
let emailTokens = {}; // 이메일 인증 토큰 저장

// 회원가입 API
app.post('/api/auth/signup', (req, res) => {
  const { email, password, name } = req.body;
  
  console.log('📝 회원가입 요청:', { email, name });
  
  // 이메일 중복 확인
  const existingUser = users.find(user => user.email === email);
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: '이미 등록된 이메일입니다.'
    });
  }
  
  // 인증 토큰 생성
  const verificationToken = Math.random().toString(36).substring(2, 15);
  
  // 사용자 생성
  const newUser = {
    id: Date.now().toString(),
    email,
    password, // 실제로는 해시해야 함
    name,
    isEmailVerified: false,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  emailTokens[verificationToken] = { email, expires: Date.now() + 24 * 60 * 60 * 1000 };
  
  console.log('✅ 회원가입 성공, 인증 토큰:', verificationToken);
  console.log('🔗 인증 링크:', `http://localhost:3000/verify-email?token=${verificationToken}&email=${email}`);
  
  res.status(201).json({
    success: true,
    message: '회원가입이 완료되었습니다. 이메일을 확인해주세요.',
    data: {
      email: newUser.email,
      name: newUser.name,
      emailVerificationRequired: true
    }
  });
});

// 이메일 인증 API
app.post('/api/auth/verify-email', (req, res) => {
  const { token, email } = req.body;
  
  console.log('📧 이메일 인증 요청:', { token, email });
  
  if (!token || !email) {
    return res.status(400).json({
      success: false,
      message: '토큰과 이메일이 필요합니다.'
    });
  }
  
  // 토큰 검증
  const tokenData = emailTokens[token];
  if (!tokenData || tokenData.email !== email || tokenData.expires < Date.now()) {
    return res.status(400).json({
      success: false,
      message: '유효하지 않거나 만료된 인증 토큰입니다.'
    });
  }
  
  // 사용자 찾기 및 인증 완료
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(400).json({
      success: false,
      message: '사용자를 찾을 수 없습니다.'
    });
  }
  
  user.isEmailVerified = true;
  delete emailTokens[token]; // 토큰 삭제
  
  // JWT 토큰 생성 (실제로는 jwt 라이브러리 사용)
  const jwtToken = `mock_jwt_${user.id}_${Date.now()}`;
  
  console.log('✅ 이메일 인증 완료, JWT 토큰:', jwtToken);
  
  res.json({
    success: true,
    message: '이메일 인증이 완료되었습니다.',
    data: {
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified
      }
    }
  });
});

// 로그인 API
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  console.log('🔐 로그인 요청:', { email });
  
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: '이메일과 비밀번호를 입력해주세요.'
    });
  }
  
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(400).json({
      success: false,
      message: '등록되지 않은 이메일입니다.'
    });
  }
  
  if (user.password !== password) { // 실제로는 해시 비교
    return res.status(400).json({
      success: false,
      message: '비밀번호가 올바르지 않습니다.'
    });
  }
  
  // 이메일 인증 확인
  if (!user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      message: '이메일 인증이 필요합니다. 인증 이메일을 확인해주세요.',
      emailVerificationRequired: true
    });
  }
  
  // JWT 토큰 생성
  const jwtToken = `mock_jwt_${user.id}_${Date.now()}`;
  
  console.log('✅ 로그인 성공, JWT 토큰:', jwtToken);
  
  res.json({
    success: true,
    message: '로그인 성공',
    data: {
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified
      }
    }
  });
});

// 사용자 정보 조회 API
app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '인증 토큰이 필요합니다.'
    });
  }
  
  const token = authHeader.split(' ')[1];
  console.log('👤 사용자 정보 조회:', { token });
  
  // 토큰에서 사용자 ID 추출 (실제로는 JWT 검증)
  const userId = token.split('_')[2];
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(401).json({
      success: false,
      message: '유효하지 않은 토큰입니다.'
    });
  }
  
  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt
      }
    }
  });
});

// 이메일 재발송 API
app.post('/api/auth/resend-verification', (req, res) => {
  const { email } = req.body;
  
  console.log('📮 이메일 재발송 요청:', { email });
  
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(400).json({
      success: false,
      message: '등록되지 않은 이메일입니다.'
    });
  }
  
  if (user.isEmailVerified) {
    return res.status(400).json({
      success: false,
      message: '이미 인증된 이메일입니다.'
    });
  }
  
  // 새 토큰 생성
  const verificationToken = Math.random().toString(36).substring(2, 15);
  emailTokens[verificationToken] = { email, expires: Date.now() + 24 * 60 * 60 * 1000 };
  
  console.log('✅ 이메일 재발송 완료, 새 토큰:', verificationToken);
  console.log('🔗 새 인증 링크:', `http://localhost:3000/verify-email?token=${verificationToken}&email=${email}`);
  
  res.json({
    success: true,
    message: '인증 이메일이 재발송되었습니다.'
  });
});

// 헬스체크
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Mock server is running!' });
});

// 현재 상태 확인 (디버그용)
app.get('/debug', (req, res) => {
  res.json({
    users: users.length,
    tokens: Object.keys(emailTokens).length,
    userList: users.map(u => ({ id: u.id, email: u.email, verified: u.isEmailVerified }))
  });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log('🚀 목업 서버가 실행되었습니다!');
  console.log(`📡 주소: http://localhost:${PORT}`);
  console.log('💡 이 서버는 실제 백엔드와 동일한 API를 제공합니다.');
  console.log('📊 상태 확인: http://localhost:4000/debug');
});

module.exports = app;