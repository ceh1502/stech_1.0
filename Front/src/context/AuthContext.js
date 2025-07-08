// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authAPI from '../api/authAPI';
import { getToken, setToken, getRefreshToken, setRefreshToken, clearTokens, isTokenExpired } from '../utils/tokenUtils';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false); // 🆕 초기화 완료 여부

  // 앱 시작시 인증 상태 복원
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = getToken();
        
        if (!token || isTokenExpired(token)) {
          // 토큰이 없거나 만료된 경우 리프레시 시도
          await tryRefreshToken();
          return;
        }

        // 토큰이 유효한 경우 사용자 정보 조회
        const userInfo = await authAPI.getUserInfo();
        setUser(userInfo);
      } catch (error) {
        console.error('인증 초기화 실패:', error);
        clearAuthData();
      } finally {
        setLoading(false);
        setIsInitialized(true); // 🆕 초기화 완료 표시
      }
    };

    initializeAuth();
  }, []);

  const tryRefreshToken = async () => {
    try {
      const refreshTokenValue = getRefreshToken();
      if (!refreshTokenValue) {
        throw new Error('리프레시 토큰 없음');
      }

      const response = await authAPI.refreshToken();
      setToken(response.token);
      
      if (response.refreshToken) {
        setRefreshToken(response.refreshToken);
      }

      const userInfo = await authAPI.getUserInfo();
      setUser(userInfo);
    } catch (error) {
      clearAuthData();
    }
  };

  // 🆕 개선된 로그인 함수
  const login = async (credentials) => {
    try {
      setError(null);
      setLoading(true);
      
      const { email, password, rememberMe } = credentials; // 🆕 rememberMe 추가
      const response = await authAPI.login(email, password);

      // 백엔드 응답 구조에 맞춰 수정
      setToken(response.jwt_token, rememberMe); // 🆕 rememberMe 옵션 전달
      
      if (response.refreshToken) { // 🆕 리프레시 토큰 처리
        setRefreshToken(response.refreshToken);
      }

      // 사용자 정보 구조 확인 (백엔드 응답에 따라 조정)
      const userData = {
        id: response.id || response.userId,
        email: response.email,
        nickname: response.nickname,
        name: response.name, // 🆕 이름 추가
        avatar: response.avatar, // 🆕 프로필 이미지
        role: response.role || 'user', // 🆕 사용자 권한
        createdAt: response.createdAt,
        lastLoginAt: new Date().toISOString() // 🆕 마지막 로그인 시간
      };
      
      setUser(userData);

      // 🆕 로그인 성공 이벤트 추적
      if (window.gtag) {
        window.gtag('event', 'login', {
          method: 'email'
        });
      }

      return { success: true, user: userData };
    } catch (error) {
      const errorMessage = getErrorMessage(error); // 🆕 에러 메시지 파싱
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // 🆕 개선된 회원가입 함수
  const signup = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authAPI.signup({
        ...userData,
        source: 'web', // 🆕 가입 경로 추가
        userAgent: navigator.userAgent // 🆕 사용자 환경 정보
      });

      // 회원가입 성공 후 자동 로그인 처리
      if (response.jwt_token) {
        setToken(response.jwt_token);
        
        if (response.refreshToken) {
          setRefreshToken(response.refreshToken);
        }
        
        const newUser = {
          id: response.id || response.userId,
          email: response.email,
          nickname: response.nickname,
          name: response.name,
          avatar: response.avatar,
          role: response.role || 'user',
          createdAt: response.createdAt,
          isEmailVerified: response.isEmailVerified || false // 🆕 이메일 인증 상태
        };
        
        setUser(newUser);

        // 🆕 회원가입 성공 이벤트 추적
        if (window.gtag) {
          window.gtag('event', 'sign_up', {
            method: 'email'
          });
        }

        return { 
          success: true, 
          user: newUser,
          needsEmailVerification: !response.isEmailVerified // 🆕 이메일 인증 필요 여부
        };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };



  const logout = async () => {
    try {
      setLoading(true);
      await authAPI.logout();
      
      // 🆕 로그아웃 이벤트 추적
      if (window.gtag) {
        window.gtag('event', 'logout');
      }
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
    } finally {
      clearAuthData();
      setLoading(false);
    }
  };

  // 🆕 사용자 정보 업데이트 함수
  const updateUser = async (updateData) => {
    try {
      setError(null);
      const response = await authAPI.updateUser(updateData);
      
      setUser(prevUser => ({
        ...prevUser,
        ...response
      }));

      return { success: true, user: response };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // 🆕 비밀번호 변경 함수
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      setLoading(true);
      
      await authAPI.changePassword(currentPassword, newPassword);
      return { success: true };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // 🆕 이메일 인증 요청 함수
  const requestEmailVerification = async () => {
    try {
      await authAPI.requestEmailVerification();
      return { success: true };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // 🆕 비밀번호 재설정 요청 함수
  const requestPasswordReset = async (email) => {
    try {
      setError(null);
      await authAPI.requestPasswordReset(email);
      return { success: true };
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // 🆕 인증된 API 요청 래퍼
  const authenticatedFetch = async (url, options = {}) => {
    try {
      let token = getToken();
      
      // 토큰 만료 확인 및 갱신
      if (!token || isTokenExpired(token)) {
        await tryRefreshToken();
        token = getToken();
      }

      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // 401 에러시 토큰 갱신 후 재시도
      if (response.status === 401) {
        await tryRefreshToken();
        const newToken = getToken();
        
        if (newToken) {
          return fetch(url, {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${newToken}`,
              'Content-Type': 'application/json',
            },
          });
        } else {
          clearAuthData();
          throw new Error('인증이 필요합니다.');
        }
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  const clearAuthData = () => {
    clearTokens();
    setUser(null);
    setError(null);
  };

  // 🆕 에러 메시지 파싱 함수
  const getErrorMessage = (error) => {
    if (typeof error === 'string') return error;
    if (error.response?.data?.message) return error.response.data.message;
    if (error.message) return error.message;
    return '알 수 없는 오류가 발생했습니다.';
  };

  // 🆕 사용자 권한 확인 함수
  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions?.includes(permission) || false;
  };

  const value = {
    // 상태
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isInitialized, // 🆕
    
    // 기본 인증 함수
    login,
    signup,
    logout,
    
    // 🆕 추가 기능들
    updateUser,
    changePassword,
    requestEmailVerification,
    requestPasswordReset,
    authenticatedFetch,
    hasPermission,
    
    // 유틸리티
    clearError: () => setError(null),
    refreshAuth: tryRefreshToken // 🆕 수동 토큰 갱신
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