
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

// 백엔드 응답 처리 헬퍼 (백엔드 구조와 정확히 일치)
const handleResponse = (response) => {
  // 백엔드 응답: { success: boolean, message?: string, data?: any }
  if (response.success === true) {
    return response.data || response;
  } else if (response.success === false) {
    throw new APIError(response.message || 'Request failed', 400);
  }
  
  // success 필드가 없는 경우 (예외적 상황)
  return response;
};

// 기본 fetch 래퍼
const request = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
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

  // 인증이 필요한 요청에 토큰 추가
  if (options.requireAuth !== false) {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // HTTP 상태 코드가 에러인 경우
    if (!response.ok) {
      if (typeof data === 'object' && data.success === false) {
        throw new APIError(data.message || 'Request failed', response.status, data);
      } else {
        const errorMessage = typeof data === 'object' && data.message 
          ? data.message 
          : `HTTP ${response.status}: ${response.statusText}`;
        
        throw new APIError(errorMessage, response.status, data);
      }
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new APIError('Request timeout occurred.', 408);
    }
    
    if (error instanceof APIError) {
      throw error;
    }
    
    throw new APIError(
      error.message || 'Network error occurred.', 
      0, 
      null
    );
  }
};

// ===== 인증 관련 API 함수들 (백엔드 엔드포인트와 정확히 일치) =====

// 회원가입 
export const signup = async (userData) => {
  try {
    console.log('🚀 Sending signup request:', userData);

    const response = await request(API_CONFIG.ENDPOINTS.SIGNUP, {
      method: 'POST',
      body: JSON.stringify(userData),
      requireAuth: false,
    });

    console.log('✅ Signup response:', response);
    
    // 백엔드 응답 처리
    return handleResponse(response);
  } catch (error) {
    console.error('❌ Signup error:', error);
    throw error;
  }
};

// 로그인
export const login = async (email, password) => {
  try {
    const response = await request(API_CONFIG.ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      requireAuth: false,
    });

    // 백엔드 응답 구조 확인
    if (response.success && response.data && response.data.token) {
      return response.data; // { token, user }
    } else {
      throw new APIError('로그인 응답에 토큰이 없습니다.', 500);
    }
  } catch (error) {
    // 백엔드 에러 메시지 그대로 사용
    throw error;
  }
};

// 이메일 인증 확인 (백엔드와 정확히 일치)
export const verifyEmail = async (token, email) => {
  if (!token || !email) {
    throw new APIError('토큰과 이메일이 필요합니다.', 400);
  }

  try {
    const response = await request(API_CONFIG.ENDPOINTS.VERIFY_EMAIL, {
      method: 'POST',
      body: JSON.stringify({ token, email }),
      requireAuth: false,
    });
    
    return handleResponse(response);
  } catch (error) {
    throw error;
  }
};

// 이메일 인증 재발송
export const resendVerification = async (email) => {
  if (!email) {
    throw new APIError('이메일을 입력해주세요.', 400);
  }

  try {
    const response = await request(API_CONFIG.ENDPOINTS.RESEND_VERIFICATION, {
      method: 'POST',
      body: JSON.stringify({ email }),
      requireAuth: false,
    });
    
    return handleResponse(response);
  } catch (error) {
    throw error;
  }
};

// 사용자 정보 조회
export const getUserInfo = async () => {
  try {
    const response = await request(API_CONFIG.ENDPOINTS.USER_INFO, {
      method: 'GET',
    });
    
    return handleResponse(response);
  } catch (error) {
    throw error;
  }
};

// 로그아웃 (서버에 알림) - 백엔드에 없지만 프론트엔드에서 토큰 삭제
export const logout = async () => {
  // 백엔드에 로그아웃 API가 없으므로 클라이언트에서만 처리
  console.log('🚪 Logging out (client-side only)');
};

// 토큰 검증 (필요시 구현)
export const verifyToken = async () => {
  try {
    // /me 엔드포인트로 토큰 유효성 확인
    await getUserInfo();
    return true;
  } catch (error) {
    console.warn('Token verification failed:', error.message);
    return false;
  }
};

// 에러 처리 유틸리티 (백엔드 에러 메시지 기반)
export const handleAuthError = (error) => {
  if (error instanceof APIError) {
    // 백엔드에서 보내는 한국어 메시지 우선 사용
    if (error.message) {
      return error.message;
    }
    
    // 상태 코드별 기본 메시지
    switch (error.status) {
      case 400:
        return '잘못된 요청입니다.';
      case 401:
        return '인증이 필요합니다.';
      case 403:
        return '접근 권한이 없습니다.';
      case 404:
        return '요청한 리소스를 찾을 수 없습니다.';
      case 500:
        return '서버 오류가 발생했습니다.';
      default:
        return '알 수 없는 오류가 발생했습니다.';
    }
  }
  
  return error.message || '네트워크 오류가 발생했습니다.';
};

// API 설정 정보 내보내기
export { APIError };

// 개발 환경용 디버그 함수
export const debugAPI = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 API Configuration:', {
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      endpoints: API_CONFIG.ENDPOINTS
    });
    
    console.log('🔑 Current Tokens:', {
      accessToken: getToken() ? '✅ Available' : '❌ Not available',
      refreshToken: getRefreshToken() ? '✅ Available' : '❌ Not available'
    });
  }
};