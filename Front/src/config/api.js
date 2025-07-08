export const API_CONFIG = {
  // BASE_URL: process.env.REACT_APP_API_URL,
    BASE_URL: 'http://localhost:4000/api',  // 목업 서버 주소
  TIMEOUT: 10000,
  ENDPOINTS: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    USER_INFO: '/auth/me',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/api/auth/resend-verification',
    REFRESH_TOKEN: '/api/auth/refresh',
    LOGOUT: '/api/auth/logout',
    VERIFY_TOKEN: '/api/auth/verify',
    UPDATE_USER: '/api/auth/user',
    CHANGE_PASSWORD: '/api/auth/change-password',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    DELETE_ACCOUNT: '/api/auth/delete-account'
  }
};