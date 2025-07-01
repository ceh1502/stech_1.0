import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import * as authAPI from '../api/authAPI';
import {
  getToken,
  setToken,
  getRefreshToken,
  setRefreshToken,
  clearTokens,
  isTokenExpired,
} from '../utils/tokenUtils';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ 토큰 및 사용자 정보 초기화
  const clearAuthData = useCallback(() => {
    clearTokens();
    setUser(null);
    setError(null);
  }, []);

  // ✅ 리프레시 토큰으로 로그인 연장
  const tryRefreshToken = useCallback(async () => {
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
  }, [clearAuthData]);

  // ✅ 앱 시작 시 자동 로그인 시도
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = getToken();

        if (!token || isTokenExpired(token)) {
          await tryRefreshToken();
          return;
        }

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
  }, [tryRefreshToken, clearAuthData]); // ✅ 여기에 포함됨

  // ✅ 로그인
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);

      const response = await authAPI.login(email, password);

      setToken(response.token);
      if (response.refreshToken) {
        setRefreshToken(response.refreshToken);
      }

      setUser(response.user);

      return { success: true };
    } catch (error) {
      setError(error.message || '로그인 실패');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ 회원가입
  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);

      const response = await authAPI.register(userData);

      if (response.token) {
        setToken(response.token);
        if (response.refreshToken) {
          setRefreshToken(response.refreshToken);
        }
        setUser(response.user);
      }

      return { success: true };
    } catch (error) {
      setError(error.message || '회원가입 실패');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // ✅ 로그아웃
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('로그아웃 API 호출 실패:', error);
    } finally {
      clearAuthData();
    }
  };

  // ✅ context로 노출할 값들
  const value = {
    user,
    login,
    register,
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
