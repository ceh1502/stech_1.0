// api/authAPI.js
import { API_CONFIG } from '../config/api';
import { getToken } from '../utils/tokenUtils';

// 기본 fetch 래퍼
const request = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    timeout: API_CONFIG.TIMEOUT,
    ...options,
  };

  // 토큰이 필요한 요청에 자동으로 Authorization 헤더 추가
  if (options.requireAuth !== false) {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    throw new Error(error.message || '네트워크 오류가 발생했습니다.');
  }
};

// 로그인
export const login = async (email, password) => {
  return request(API_CONFIG.ENDPOINTS.LOGIN, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    requireAuth: false,
  });
};

// 회원가입
export const signup = async (userData) => {
  return request(API_CONFIG.ENDPOINTS.SIGNUP, {
    method: 'POST',
    body: JSON.stringify(userData),
    requireAuth: false,
  });
};

// 사용자 정보 조회
export const getUserInfo = async () => {
  return request(API_CONFIG.ENDPOINTS.USER_INFO, {
    method: 'GET',
  });
};

// 토큰 검증
export const verifyToken = async () => {
  try {
    await request(API_CONFIG.ENDPOINTS.VERIFY_TOKEN, {
      method: 'GET',
    });
    return true;
  } catch (error) {
    return false;
  }
};

// 토큰 갱신
export const refreshToken = async () => {
  const { getRefreshToken } = await import('../utils/tokenUtils');
  const refreshToken = getRefreshToken();
  
  if (!refreshToken) {
    throw new Error('리프레시 토큰이 없습니다.');
  }

  return request(API_CONFIG.ENDPOINTS.REFRESH_TOKEN, {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
    requireAuth: false,
  });
};

// 로그아웃 (서버에 알림)
export const logout = async () => {
  try {
    await request('/auth/logout', {
      method: 'POST',
    });
  } catch (error) {
    // 로그아웃 실패해도 클라이언트에서는 토큰 삭제
    console.error('서버 로그아웃 실패:', error);
  }
};