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

// 백엔드 응답 처리 헬퍼 함수
const handleBackendResponse = (response) => {
  // 백엔드 응답 구조: { success: boolean, message?: string, data?: any }
  if (response && typeof response === 'object') {
    if (response.success === true) {
      return response.data || response;
    } else if (response.success === false) {
      throw new APIError(response.message || 'Request failed', 400);
    }
  }
  
  // success 필드가 없는 경우 (기존 응답 구조)
  return response;
};

// 기본 fetch 래퍼 (백엔드 응답 구조에 맞게 수정)
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
      // 백엔드 에러 응답 처리
      if (typeof data === 'object' && data.success === false) {
        throw new APIError(data.message || 'Request failed', response.status, data);
      } else {
        const errorMessage = typeof data === 'object' && data.message 
          ? data.message 
          : `HTTP ${response.status}: ${response.statusText}`;
        
        throw new APIError(errorMessage, response.status, data);
      }
    }

    // 백엔드 응답 구조 처리
    return handleBackendResponse(data);
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new APIError('Request timeout occurred.', 408);
    }
    
    if (error instanceof APIError) {
      throw error;
    }
    
    // 네트워크 에러 등
    throw new APIError(
      error.message || 'Network error occurred.', 
      0, 
      null
    );
  }
};

// 재시도 로직이 있는 request 래퍼
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

// 로그인 (백엔드 응답 구조에 맞게 수정)
export const login = async (email, password) => {
  try {
    const response = await request(API_CONFIG.ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      requireAuth: false,
    });

    // 백엔드 응답 구조 확인: { token, user } 또는 { jwt_token, user }
    if (!response.token && !response.jwt_token) {
      throw new APIError('Login response missing token.', 500);
    }

    // 토큰 키 통일 (백엔드에서 token 또는 jwt_token 사용 가능)
    if (response.jwt_token && !response.token) {
      response.token = response.jwt_token;
    }

    return response;
  } catch (error) {
    // 로그인 실패 시 구체적인 에러 메시지
    if (error.status === 401) {
      throw new APIError('Invalid email or password.', 401);
    }
    if (error.status === 429) {
      throw new APIError('Too many login attempts. Please try again later.', 429);
    }
    throw error;
  }
};

// 회원가입 (백엔드 응답 구조에 맞게 수정)
export const signup = async (userData) => {
  try {
    console.log('🚀 Sending signup request with data:', userData);

    const response = await request(API_CONFIG.ENDPOINTS.SIGNUP, {
      method: 'POST',
      body: JSON.stringify(userData),
      requireAuth: false,
    });

    console.log('✅ Signup API response:', response);
    return response;
  } catch (error) {
    console.error('❌ Signup API error:', error);
    
    // 회원가입 실패 시 구체적인 에러 메시지
    if (error.status === 409) {
      throw new APIError('Email already exists.', 409);
    }
    if (error.status === 422) {
      throw new APIError('Invalid input data.', 422);
    }
    if (error.status === 400) {
      throw new APIError('Bad request. Please check your input.', 400);
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

// 사용자 정보 업데이트
export const updateUser = async (updateData) => {
  return request(API_CONFIG.ENDPOINTS.UPDATE_USER || '/api/auth/user', {
    method: 'PATCH',
    body: JSON.stringify(updateData),
  });
};

// 비밀번호 변경
export const changePassword = async (currentPassword, newPassword) => {
  return request(API_CONFIG.ENDPOINTS.CHANGE_PASSWORD || '/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
};

// 토큰 검증
export const verifyToken = async () => {
  try {
    await request(API_CONFIG.ENDPOINTS.VERIFY_TOKEN || '/api/auth/verify', {
      method: 'GET',
    });
    return true;
  } catch (error) {
    console.warn('Token verification failed:', error.message);
    return false;
  }
};

// 토큰 갱신
export const refreshToken = async () => {
  const refreshTokenValue = getRefreshToken();
  
  if (!refreshTokenValue) {
    throw new APIError('No refresh token available.', 401);
  }

  try {
    const response = await request(API_CONFIG.ENDPOINTS.REFRESH_TOKEN || '/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: refreshTokenValue }),
      requireAuth: false,
    });

    // 응답 검증 (token 또는 jwt_token)
    if (!response.token && !response.jwt_token) {
      throw new APIError('Invalid token refresh response.', 500);
    }

    // 토큰 키 통일
    if (response.jwt_token && !response.token) {
      response.token = response.jwt_token;
    }

    return response;
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      throw new APIError('Authentication expired. Please login again.', 401);
    }
    throw error;
  }
};

// 로그아웃 (서버에 알림)
export const logout = async () => {
  try {
    await request(API_CONFIG.ENDPOINTS.LOGOUT || '/api/auth/logout', {
      method: 'POST',
    });
  } catch (error) {
    // 로그아웃 실패해도 클라이언트에서는 토큰 삭제
    console.warn('Server logout failed:', error.message);
  }
};

// 이메일 인증 요청 (재발송)
export const requestEmailVerification = async (email) => {
  return request(API_CONFIG.ENDPOINTS.RESEND_VERIFICATION || '/api/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
    requireAuth: false,
  });
};

// 이메일 인증 확인 (수정: token과 email 모두 필요)
export const verifyEmail = async (token, email) => {
  if (!token || !email) {
    throw new APIError('Token and email are required for email verification.', 400);
  }

  return request(API_CONFIG.ENDPOINTS.VERIFY_EMAIL || '/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token, email }),
    requireAuth: false,
  });
};

// 비밀번호 재설정 요청
export const requestPasswordReset = async (email) => {
  return request(API_CONFIG.ENDPOINTS.FORGOT_PASSWORD || '/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
    requireAuth: false,
  });
};

// 비밀번호 재설정 확인
export const resetPassword = async (token, newPassword) => {
  return request(API_CONFIG.ENDPOINTS.RESET_PASSWORD || '/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
    requireAuth: false,
  });
};

// 계정 삭제
export const deleteAccount = async (password) => {
  return request(API_CONFIG.ENDPOINTS.DELETE_ACCOUNT || '/api/auth/delete-account', {
    method: 'DELETE',
    body: JSON.stringify({ password }),
  });
};

// API 상태 확인 (헬스체크)
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

// 에러 처리 유틸리티
export const handleAuthError = (error) => {
  if (error instanceof APIError) {
    switch (error.status) {
      case 401:
        return 'Authentication required. Please login again.';
      case 403:
        return 'Access denied.';
      case 404:
        return 'Requested resource not found.';
      case 409:
        return 'Data already exists.';
      case 422:
        return 'Invalid input data.';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error occurred. Please try again later.';
      default:
        return error.message || 'Unknown error occurred.';
    }
  }
  return error.message || 'Network error occurred.';
};

// API 설정 정보 내보내기
export { APIError };

// 개발 환경용 디버그 함수
export const debugAPI = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('API Configuration:', {
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      endpoints: API_CONFIG.ENDPOINTS
    });
    
    console.log('Current Tokens:', {
      accessToken: getToken() ? 'Available' : 'Not available',
      refreshToken: getRefreshToken() ? 'Available' : 'Not available'
    });
  }
};