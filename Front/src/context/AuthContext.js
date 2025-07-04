// context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authAPI from '../api/authAPI';
import { getToken, setToken, getRefreshToken, setRefreshToken, clearTokens, isTokenExpired } from '../utils/tokenUtils';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authAPI.login(email, password);
      
      // 토큰 저장
      setToken(response.token);
      if (response.refreshToken) {
        setRefreshToken(response.refreshToken);
      }
      
      setUser(response.user);
      
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await authAPI.signup(userData);
      
      // 회원가입 후 자동 로그인 여부 결정
      if (response.token) {
        setToken(response.token);
        if (response.refreshToken) {
          setRefreshToken(response.refreshToken);
        }
        setUser(response.user);
      }
      
      return { success: true };
    } catch (error) {
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
    } finally {
      clearAuthData();
    }
  };

  const clearAuthData = () => {
    clearTokens();
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading,
    error,
    isAuthenticated: !!user,
    clearError: () => setError(null),
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