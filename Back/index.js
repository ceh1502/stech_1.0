require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const app  = express();

app.use(cors({
  origin: [
    'http://localhost:3000',        // 로컬 프론트
    'https://www.stechpro.ai'       // 실제 배포
  ],
  credentials: true
}));
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth'); //명세서

const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use('/api/auth', authRoutes); ///api 명세서

mongoose.connect(process.env.MONGODB_URI, {
})
.then(() => {
  console.log('✅ MongoDB 연결 성공');
  app.listen(PORT,'0.0.0.0', () => console.log(`✅ 서버 실행: http://localhost:${PORT}`));
})
.catch(err => console.error('MongoDB 연결 실패', err));
