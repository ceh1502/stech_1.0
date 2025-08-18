const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// 회원가입
exports.signup = async (req, res) => {
  try {
    const { email, password, name, nickname } = req.body;
    
    // name 또는 nickname 중 하나 사용 (name 우선)
    const fullName = name || nickname;

    // 이메일 중복 확인
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: "이미 존재하는 이메일입니다." 
      });
    }

    // 비밀번호 해싱
    const hashedPw = await bcrypt.hash(password, 10);
    console.log('회원가입 - 원본 비밀번호:', password);
    console.log('회원가입 - 해싱된 비밀번호:', hashedPw);

    // 이메일 인증 토큰 생성
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 1000 * 60 * 60 * 24; // 24시간

    // 새 유저 저장
    const newUser = new User({
      email,
      password: hashedPw,
      name: fullName,
      emailVerificationToken: token,
      emailVerificationExpires: expires,
      isEmailVerified: false,
    });

    await newUser.save();

    // 이메일 전송 (Nodemailer)
    const { sendVerificationEmail } = require('../utils/emailService');
    await sendVerificationEmail(email, token);

    res.status(201).json({
      success: true,
      message: "회원가입 성공! 인증 메일을 확인하세요.",
      data: {
        user: {
          id: newUser._id,
          email: newUser.email,
          name: newUser.name
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      message: "서버 오류가 발생했습니다." 
    });
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
      return res.status(400).json({ 
        success: false, 
        message: '존재하지 않는 이메일입니다.' 
      });
    }

    console.log('DB 저장된 이메일:', user.email);
    console.log('DB 저장된 해시:', user.password);

    // 비밀번호 확인
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('비밀번호 비교 결과:', isMatch);

    if (!isMatch) {
      console.log('❌ 비밀번호 불일치');
      return res.status(401).json({ 
        success: false, 
        message: '비밀번호가 틀렸습니다.' 
      });
    }

    if (!user.isEmailVerified) {
      return res.status(401).json({ 
        success: false, 
        message: '이메일 인증이 필요합니다.' 
      });
    }

    console.log('JWT_SECRET 확인:', process.env.JWT_SECRET ? '있음' : '없음');

    // JWT 발급
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    console.log('✅ 로그인 성공');

    res.status(200).json({
      success: true,
      message: '로그인 성공',
      data: {
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          isEmailVerified: user.isEmailVerified
        }
      }
    });
  } catch (err) {
    console.error('로그인 에러:', err);
    res.status(500).json({ 
      success: false, 
      message: '서버 에러' 
    });
  }
};

// 이메일 인증
exports.verifyEmail = async (req, res) => {
  const { token, email } = req.body;

  console.log('=== 이메일 인증 시도 ===');
  console.log('받은 이메일:', email);
  console.log('받은 토큰:', token);

  if (!token || !email) {
    return res.status(400).json({ 
      success: false, 
      message: '토큰과 이메일이 필요합니다.' 
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ 이메일에 해당하는 유저 없음');
      return res.status(404).json({ 
        success: false, 
        message: '해당 이메일의 사용자를 찾을 수 없습니다.' 
      });
    }

    if (user.isEmailVerified) {
      console.log('❗ 이미 인증된 계정');
      return res.status(400).json({ 
        success: false, 
        message: '이미 인증된 계정입니다.' 
      });
    }

    if (
      user.emailVerificationToken !== token ||
      user.emailVerificationExpires < Date.now()
    ) {
      console.log('❌ 토큰 불일치 또는 만료');
      return res.status(400).json({ 
        success: false, 
        message: '유효하지 않거나 만료된 토큰입니다.' 
      });
    }

    // 인증 성공 처리
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // 인증 후 JWT 발급
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    console.log('✅ 이메일 인증 성공');

    res.status(200).json({
      success: true,
      message: '이메일 인증 완료',
      data: {
        token: jwtToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          isEmailVerified: true,
        }
      }
    });
  } catch (err) {
    console.error('이메일 인증 에러:', err);
    res.status(500).json({ 
      success: false, 
      message: '서버 오류가 발생했습니다.' 
    });
  }
};