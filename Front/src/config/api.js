export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
  TIMEOUT: 10000,
  ENDPOINTS: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    USER_INFO: '/auth/me',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    CHECK_EMAIL: '/auth/check-email',
    REFRESH_TOKEN: '/auth/refresh',
    LOGOUT: '/auth/logout',
    VERIFY_TOKEN: '/auth/verify',
    UPDATE_USER: '/auth/user',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    DELETE_ACCOUNT: '/auth/delete-account',
    UPLOAD_VIDEO: '/video/upload' //<-- 건아 임마를 조져
  }
};