// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authAPI from '../api/authAPI';
import { 
  getToken, 
  getUserData, 
  clearTokens, 
  isTokenExpired, 
  isAuthenticated,
  isEmailVerificationRequired,
  handleLoginResponse,
  handleVerificationResponse,
  handleUserInfoResponse
} from '../utils/tokenUtils';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 앱 시작시 인증 상태 복원
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // 로컬스토리지에서 사용자 정보 복원
        const storedUser = getUserData();
        const token = getToken();
        
        if (!token || isTokenExpired(token)) {
          // 토큰이 없거나 만료된 경우
          clearAuthData();
          return;
        }

        if (storedUser) {
          setUser(storedUser);
          
          // 서버에서 최신 사용자 정보 조회 (선택적)
          try {
            const userInfo = await authAPI.getUserInfo();
            const result = handleUserInfoResponse(userInfo);
            if (result.success) {
              setUser(getUserData()); // 업데이트된 사용자 정보 설정
            }
          } catch (error) {
            console.warn('사용자 정보 업데이트 실패:', error);
            // 기존 저장된 정보 유지
          }
        }
      } catch (error) {
        console.error('인증 초기화 실패:', error);
        clearAuthData();
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // 로그인 함수 (백엔드 응답 구조에 맞춤)
  const login = async (credentials) => {
    try {
      setError(null);
      setLoading(true);
      
      const { email, password } = credentials;
      
      // 백엔드 응답: {token, user}
      const loginData = await authAPI.login(email, password);
      console.log('Login response:', loginData);

      // 토큰과 사용자 정보 저장
      const result = handleLoginResponse(loginData);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // 저장된 사용자 정보 설정
      const userData = getUserData();
      setUser(userData);

      // 로그인 성공 이벤트 추적 (옵션)
      if (window.gtag) {
        window.gtag('event', 'login', {
          method: 'email'
        });
      }

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      
      // 이메일 인증 필요한 경우 특별 처리
      if (error.data && error.data.emailVerificationRequired) {
        return { 
          success: false, 
          error: errorMessage,
          needsEmailVerification: true,
          email: credentials.email
        };
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // 회원가입 함수 (백엔드 응답 구조에 맞춤)
  const signup = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      // 백엔드 응답: {email, name, emailVerificationRequired}
      const signupResult = await authAPI.signup(userData);
      console.log('Signup response:', signupResult);

      // 회원가입 성공 이벤트 추적 (옵션)
      if (window.gtag) {
        window.gtag('event', 'sign_up', {
          method: 'email'
        });
      }

      return { 
        success: true,
        needsEmailVerification: signupResult.emailVerificationRequired || true,
        email: signupResult.email,
        message: '회원가입이 완료되었습니다. 이메일을 확인해주세요.'
      };
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // 이메일 인증 함수
  const verifyEmail = async (token, email) => {
    try {
      setError(null);
      setLoading(true);
      
      // 백엔드 응답: {token, user}
      const verificationData = await authAPI.verifyEmail(token, email);
      console.log('Email verification response:', verificationData);

      // 토큰과 사용자 정보 저장
      const result = handleVerificationResponse(verificationData);
      
      if (!result.success) {
        throw new Error(result.error);
      }

      // 저장된 사용자 정보 설정
      const userData = getUserData();
      setUser(userData);

      return { success: true, user: userData };
    } catch (error) {
      console.error('Email verification error:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // 이메일 재발송 함수
  const resendVerification = async (email) => {
    try {
      setError(null);
      await authAPI.resendVerification(email);
      return { success: true, message: '인증 이메일이 재발송되었습니다.' };
    } catch (error) {
      console.error('Resend verification error:', error);
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // 로그아웃 함수
  const logout = async () => {
    try {
      setLoading(true);
      
      // 서버에 로그아웃 알림 (백엔드에 로그아웃 API가 없으므로 스킵)
      try {
        await authAPI.logout();
      } catch (error) {
        console.warn('Server logout failed:', error);
      }
      
      // 로그아웃 이벤트 추적 (옵션)
      if (window.gtag) {
        window.gtag('event', 'logout');
      }
    } catch (error) {
      console.error('로그아웃 처리 실패:', error);
    } finally {
      clearAuthData();
      setLoading(false);
    }
  };

  // 사용자 정보 새로고침
  const refreshUserInfo = async () => {
    try {
      if (!isAuthenticated()) {
        throw new Error('로그인이 필요합니다.');
      }

      const userInfo = await authAPI.getUserInfo();
      const result = handleUserInfoResponse(userInfo);
      
      if (result.success) {
        const userData = getUserData();
        setUser(userData);
        return { success: true, user: userData };
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('User info refresh error:', error);
      
      // 401 에러인 경우 로그아웃 처리
      if (error.status === 401) {
        clearAuthData();
      }
      
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // 인증된 API 요청 래퍼
  const authenticatedFetch = async (url, options = {}) => {
    try {
      const token = getToken();
      
      if (!token || isTokenExpired(token)) {
        clearAuthData();
        throw new Error('인증이 필요합니다.');
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // 401 에러시 로그아웃 처리
      if (response.status === 401) {
        clearAuthData();
        throw new Error('인증이 만료되었습니다.');
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  // 인증 데이터 정리
  const clearAuthData = () => {
    clearTokens();
    setUser(null);
    setError(null);
  };

  // 에러 메시지 파싱
  const getErrorMessage = (error) => {
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    return '알 수 없는 오류가 발생했습니다.';
  };

  // 사용자 권한 확인 (필요시 확장)
  const hasPermission = (permission) => {
    if (!user) return false;
    // 백엔드에서 권한 시스템을 추가하면 여기서 처리
    return true;
  };

  const value = {
    // 상태
    user,
    loading,
    error,
    isAuthenticated: isAuthenticated() && !!user,
    isInitialized,
    isEmailVerificationRequired: isEmailVerificationRequired(),
    
    // 인증 함수
    login,
    signup,
    logout,
    verifyEmail,
    resendVerification,
    
    // 사용자 정보
    refreshUserInfo,
    
    // 유틸리티
    authenticatedFetch,
    hasPermission,
    clearError: () => setError(null),
    
    // 디버그 정보 (개발환경에서만)
    ...(process.env.NODE_ENV === 'development' && {
      debug: {
        token: getToken(),
        userData: getUserData(),
        isTokenExpired: isTokenExpired(),
        isAuthenticated: isAuthenticated()
      }
    })
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth는 AuthProvider 내에서 사용해야 합니다.');
  }
  return context;
};