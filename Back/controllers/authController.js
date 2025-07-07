const User = require('../models/Users');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 회원가입
exports.signup = async (req, res) => {
  try {
    const { email, password, nickname } = req.body;

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "이미 존재하는 이메일입니다." });
    }

    // 비밀번호 해싱
    const hashedPw = await bcrypt.hash(password, 10);
    console.log('회원가입 - 원본 비밀번호:', password);
    console.log('회원가입 - 해싱된 비밀번호:', hashedPw);

    // 새 유저 저장
    const newUser = new User({
      email,
      password: hashedPw,
      nickname
    });

    await newUser.save();

    res.status(201).json({
      message: "회원가입 성공",
      user: {
        id: newUser._id,
        email: newUser.email,
        nickname: newUser.nickname
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 로그인
exports.login = async (req, res) => {
  const { email, password } = req.body;
  
  console.log('=== 로그인 시도 ===');
  console.log('받은 이메일:', email);
  console.log('받은 비밀번호:', password);

  try {
    // 이메일로 유저 찾기
    const user = await User.findOne({ email });
    console.log('DB에서 찾은 유저:', user ? '찾음' : '못찾음');
    
    if (!user) {
      console.log('❌ 이메일 불일치');
      return res.status(400).json({ error: '존재하지 않는 이메일입니다.' });
    }

    console.log('DB 저장된 이메일:', user.email);
    console.log('DB 저장된 해시:', user.password);

    // 비밀번호 확인
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('비밀번호 비교 결과:', isMatch);

    // 임시 테스트 추가
    console.log('=== 해싱 테스트 ===');
    const testHash = await bcrypt.hash(password, 10);
    console.log('입력된 비밀번호로 새로 해싱:', testHash);

    const testMatch = await bcrypt.compare(password, testHash);
    console.log('새로 해싱한 것과 비교:', testMatch);

    // 직접 해시 비교 테스트
    console.log('입력 비밀번호:', password);
    console.log('DB 해시:', user.password);
    console.log('해시 길이:', user.password.length);
    
    if (!isMatch) {
      console.log('❌ 비밀번호 불일치');
      return res.status(401).json({ error: '비밀번호가 틀렸습니다.' });
    }

    console.log('JWT_SECRET 확인:', process.env.JWT_SECRET ? '있음' : '없음');

    // JWT 발급
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    console.log('✅ 로그인 성공');

    res.status(200).json({
      message: '로그인 성공',
      token,
      user: {
        id: user._id,
        email: user.email,
        nickname: user.nickname,
      },
    });
  } catch (err) {
    console.error('로그인 에러:', err);
    res.status(500).json({ error: '서버 에러' });
  }
};