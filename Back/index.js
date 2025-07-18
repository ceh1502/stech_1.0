require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const app  = express();
const authRoutes = require('./routes/authRoutes'); //명세서
const teamRoutes = require('./routes/teamRoutes'); // 팀 라우트 추가
const videoRoutes = require('./routes/videoRoutes');

// Swagger 추가 ← 여기에 추가!
const { swaggerUi, specs } = require('./swagger');

app.use(cors({
  origin: [
    'http://localhost:3000',        // 로컬 프론트
    'https://www.stechpro.ai'       // 실제 배포
  ],
  credentials: true
}));
const mongoose = require('mongoose');


const PORT = process.env.PORT || 4000;

app.use(express.json());

// Swagger UI 라우트 추가 ← 여기에 추가!
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// 기본 라우트 추가 ← 여기에 추가!
app.get('/', (req, res) => {
    res.json({
        message: 'STechPro 백엔드 서버가 실행 중입니다!',
        apiDocs: '/api-docs',
        endpoints: [
            'POST /api/auth/signup',
            'POST /api/auth/login',
            'POST /api/auth/verify-email',
            'GET /api/auth/me',
            'POST /api/team',           
            'GET /api/team/my',       
            'GET /api/team/:teamId',    
            'PUT /api/team/:teamId',    
            'DELETE /api/team/:teamId',
            'POST /api/video/upload',
            'GET /api/video/:videoId',
            'DELETE /api/video/:videoId',
            'GET /api/video/game/:gameId'

        ]
    });
});

app.use('/api/auth', authRoutes); ///api 명세서
app.use('/api/team', teamRoutes); // 팀 라우트 등록
app.use('/api/video', videoRoutes); //라우트 등록

mongoose.connect(process.env.MONGODB_URI, {
})
.then(() => {
  console.log('✅ MongoDB 연결 성공');
  app.listen(PORT,'0.0.0.0', () => console.log(`✅ 서버 실행: http://localhost:${PORT}`));
})
.catch(err => console.error('MongoDB 연결 실패', err));