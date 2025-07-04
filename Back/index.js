require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/authRoutes');

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser:    true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB 연결 성공');
  app.listen(PORT, () => console.log(`✅ 서버 실행: http://localhost:${PORT}`));
})
.catch(err => console.error('MongoDB 연결 실패', err));