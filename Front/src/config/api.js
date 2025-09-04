export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
  TIMEOUT: 10000,
  ENDPOINTS: {
    //Auth
    CHECK_USERNAME: '/auth/check-username',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    PROFILE:'/auth/profile',
    SIGNUP: '/auth/signup',
    VERIFY_TEAM_CODE: '/auth/verify-team-code',
    REFRESH_TOKEN:'/auth/refresh-token',
    VERIFY_TOKEN:'/auth/verify-token',

    UPLOAD_VIDEO: '/video/upload',
    JSON_EX: '/player/analyze-game-data',

  }
};