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

  try {
    // 이메일로 유저 찾기
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: '존재하지 않는 이메일입니다.' });
    }

    // 비밀번호 확인
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: '비밀번호가 틀렸습니다.' });
    }

    // JWT 발급
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

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
    console.error(err);
    res.status(500).json({ error: '서버 에러' });
  }
};