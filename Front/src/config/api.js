export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
  TIMEOUT: 10000,
  ENDPOINTS: {
    //Auth
    CHECK_USERNAME: '/auth/check-username',
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    VERIFY_TEAM_CODE: '/auth/verify-team-code',


    UPLOAD_VIDEO: '/video/upload', //<-- 건아 임마를 조져
    JSON_EX: '/player/analyze-game-data',

  }
};