// src/api/authAPI.js
import { API_CONFIG } from '../config/api';
import { getToken, getRefreshToken } from '../utils/tokenUtils';

// 커스텀 에러 클래스
class APIError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

// 기본 fetch 래퍼 (개선된 버전)
const request = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  // AbortController로 타임아웃 처리
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT || 10000);

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    signal: controller.signal,
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
    clearTimeout(timeoutId);

    // Content-Type이 JSON이 아닌 경우 처리
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      // 서버에서 제공하는 에러 메시지 우선 사용
      const errorMessage = typeof data === 'object' && data.message 
        ? data.message 
        : `HTTP ${response.status}: ${response.statusText}`;
      
      throw new APIError(errorMessage, response.status, data);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new APIError('요청 시간이 초과되었습니다.', 408);
    }
    
    if (error instanceof APIError) {
      throw error;
    }
    
    // 네트워크 에러 등
    throw new APIError(
      error.message || '네트워크 오류가 발생했습니다.', 
      0, 
      null
    );
  }
};

// 🆕 재시도 로직이 있는 request 래퍼
const requestWithRetry = async (endpoint, options = {}, retries = 1) => {
  for (let i = 0; i <= retries; i++) {
    try {
      return await request(endpoint, options);
    } catch (error) {
      if (i === retries || error.status === 400 || error.status === 401 || error.status === 403) {
        throw error;
      }
      
      // 500번대 에러거나 네트워크 에러인 경우 재시도
      if (error.status >= 500 || error.status === 0) {
        const delay = Math.pow(2, i) * 1000; // 지수 백오프
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw error;
    }
  }
};

// ===== 인증 관련 API 함수들 =====

// 로그인
export const login = async (email, password) => {
  try {
    const response = await request(API_CONFIG.ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      requireAuth: false,
    });

    // 🆕 응답 데이터 검증
    if (!response.jwt_token) {
      throw new APIError('로그인 응답에 토큰이 없습니다.', 500);
    }

    return response;
  } catch (error) {
    // 🆕 로그인 실패 시 구체적인 에러 메시지
    if (error.status === 401) {
      throw new APIError('이메일 또는 비밀번호가 올바르지 않습니다.', 401);
    }
    if (error.status === 429) {
      throw new APIError('너무 많은 로그인 시도입니다. 잠시 후 다시 시도해주세요.', 429);
    }
    throw error;
  }
};

// 회원가입
export const signup = async (userData) => {
  try {
    // 🆕 클라이언트 측 데이터 검증
    const { firstName, lastName, email, password, agreements } = userData;
    
    if (!firstName || !lastName || !email || !password) {
      throw new APIError('필수 정보가 누락되었습니다.', 400);
    }

    if (agreements && (!agreements.termsOfService || !agreements.privacyPolicy)) {
      throw new APIError('필수 약관에 동의해주세요.', 400);
    }

    const response = await request(API_CONFIG.ENDPOINTS.SIGNUP, {
      method: 'POST',
      body: JSON.stringify(userData),
      requireAuth: false,
    });

    return response;
  } catch (error) {
    // 🆕 회원가입 실패 시 구체적인 에러 메시지
    if (error.status === 409) {
      throw new APIError('이미 가입된 이메일입니다.', 409);
    }
    if (error.status === 422) {
      throw new APIError('입력 정보가 올바르지 않습니다.', 422);
    }
    throw error;
  }
};

// 사용자 정보 조회
export const getUserInfo = async () => {
  return requestWithRetry(API_CONFIG.ENDPOINTS.USER_INFO, {
    method: 'GET',
  });
};

// 🆕 사용자 정보 업데이트
export const updateUser = async (updateData) => {
  return request(API_CONFIG.ENDPOINTS.UPDATE_USER || '/auth/user', {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  });
};

// 🆕 비밀번호 변경
export const changePassword = async (currentPassword, newPassword) => {
  return request(API_CONFIG.ENDPOINTS.CHANGE_PASSWORD || '/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
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
    console.warn('토큰 검증 실패:', error.message);
    return false;
  }
};

// 토큰 갱신
export const refreshToken = async () => {
  const refreshTokenValue = getRefreshToken();
  
  if (!refreshTokenValue) {
    throw new APIError('리프레시 토큰이 없습니다.', 401);
  }

  try {
    const response = await request(API_CONFIG.ENDPOINTS.REFRESH_TOKEN, {
      method: 'POST',
      body: JSON.stringify({ refreshToken: refreshTokenValue }),
      requireAuth: false,
    });

    // 🆕 응답 검증
    if (!response.token) {
      throw new APIError('토큰 갱신 응답이 올바르지 않습니다.', 500);
    }

    return response;
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      throw new APIError('인증이 만료되었습니다. 다시 로그인해주세요.', 401);
    }
    throw error;
  }
};

// 로그아웃 (서버에 알림)
export const logout = async () => {
  try {
    await request(API_CONFIG.ENDPOINTS.LOGOUT || '/auth/logout', {
      method: 'POST',
    });
  } catch (error) {
    // 로그아웃 실패해도 클라이언트에서는 토큰 삭제
    console.warn('서버 로그아웃 실패:', error.message);
  }
};

// 🆕 이메일 인증 요청
export const requestEmailVerification = async () => {
  return request(API_CONFIG.ENDPOINTS.EMAIL_VERIFICATION || '/auth/verify-email', {
    method: 'POST',
  });
};

// 🆕 이메일 인증 확인
export const verifyEmail = async (token) => {
  return request(API_CONFIG.ENDPOINTS.VERIFY_EMAIL || '/auth/verify-email/confirm', {
    method: 'POST',
    body: JSON.stringify({ token }),
    requireAuth: false,
  });
};

// 🆕 비밀번호 재설정 요청
export const requestPasswordReset = async (email) => {
  return request(API_CONFIG.ENDPOINTS.PASSWORD_RESET || '/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
    requireAuth: false,
  });
};

// 🆕 비밀번호 재설정 확인
export const resetPassword = async (token, newPassword) => {
  return request(API_CONFIG.ENDPOINTS.RESET_PASSWORD || '/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
    requireAuth: false,
  });
};

// 🆕 계정 삭제
export const deleteAccount = async (password) => {
  return request(API_CONFIG.ENDPOINTS.DELETE_ACCOUNT || '/auth/delete-account', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  });
};

// 🆕 API 상태 확인 (헬스체크)
export const healthCheck = async () => {
  try {
    const response = await request('/health', {
      method: 'GET',
      requireAuth: false,
    });
    return { status: 'ok', ...response };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
};

// 🆕 에러 처리 유틸리티
export const handleAuthError = (error) => {
  if (error instanceof APIError) {
    switch (error.status) {
      case 401:
        return '인증이 필요합니다. 다시 로그인해주세요.';
      case 403:
        return '접근 권한이 없습니다.';
      case 404:
        return '요청한 리소스를 찾을 수 없습니다.';
      case 409:
        return '이미 존재하는 데이터입니다.';
      case 422:
        return '입력 정보가 올바르지 않습니다.';
      case 429:
        return '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.';
      case 500:
        return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      default:
        return error.message || '알 수 없는 오류가 발생했습니다.';
    }
  }
  return error.message || '네트워크 오류가 발생했습니다.';
};

// 🆕 API 설정 정보 내보내기
export { APIError };

// 🆕 개발 환경용 디버그 함수
export const debugAPI = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('API 설정:', {
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      endpoints: API_CONFIG.ENDPOINTS
    });
    
    console.log('현재 토큰:', {
      accessToken: getToken() ? '존재함' : '없음',
      refreshToken: getRefreshToken() ? '존재함' : '없음'
    });
  }
};