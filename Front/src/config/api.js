export const API_CONFIG = {
  BASE_URL: 'http://localhost:4000/api',
  TIMEOUT: 10000,
  ENDPOINTS: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    USER_INFO: '/auth/me',
    VERIFY_TOKEN: '/auth/verify',
    REFRESH_TOKEN: '/auth/refresh'
  }
};