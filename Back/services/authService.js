const User = require('../models/User');
const bcrypt = require('bcrypt');

async function signup({ email, password, nickname }) {
  // 1) 필수 값 체크
  if (!email || !password || !nickname) {
    return { success: false, message: '모든 필드를 입력해주세요.' };
  }

  // 2) 중복 이메일 확인
  const exists = await User.findOne({ email });
  if (exists) {
    return { success: false, message: '이미 존재하는 이메일입니다.' };
  }

  // 3) 비밀번호 해싱
  const hashed = await bcrypt.hash(password, 10);

  // 4) 사용자 저장
  const user = new User({ email, password: hashed, nickname });
  await user.save();

  return { success: true, user: { email: user.email, nickname: user.nickname } };
}

module.exports = { signup };