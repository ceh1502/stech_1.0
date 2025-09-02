// src/context/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  login as apiLogin,
  signup as apiSignup,
  verifyTeamCode as apiVerifyTeamCode,
  checkUsername as apiCheckUsername,
  logout as apiLogout,
  // (주의) getUserInfo, verifyEmail 등 다른 엔드포인트는 더 이상 사용하지 않습니다.
} from '../api/authAPI';

import {
  getToken,
  getUserData,
  clearTokens,
  isTokenExpired,
  isAuthenticated as isAuthedByStorage,
  // 이메일 인증/유저정보 재조회 관련 유틸은 더 이상 사용하지 않음
  handleLoginResponse, // 서버 응답 -> 토큰/유저 저장 처리
} from '../utils/tokenUtils';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);      // 로그인한 사용자 (로컬 저장된 값)
  const [loading, setLoading] = useState(true); // 전역 로딩
  const [error, setError] = useState(null);     // 전역 에러 메시지
  const [isInitialized, setIsInitialized] = useState(false);

  // ---- 앱 시작 시: 로컬에 토큰/유저 있으면 복원만 수행 ----
  useEffect(() => {
    const bootstrap = () => {
      try {
        const token = getToken();
        if (!token || isTokenExpired(token)) {
          clearAuthData();
        } else {
          const stored = getUserData();
          if (stored) setUser(stored);
        }
      } catch (e) {
        clearAuthData();
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    };
    bootstrap();
  }, []);

  // ---- 로그인 (username/password) ----
  const login = async (credentials = {}) => {
    try {
      setLoading(true);
      setError(null);

      // 콜러가 email/id로 넘겨도 username으로 정규화
      const username =
        credentials.username || credentials.email || credentials.id;
      const password = credentials.password;

      if (!username || !password) {
        throw new Error('아이디와 비밀번호를 입력해주세요.');
      }

      // 서버 로그인 (200 OK → data 반환)
      const data = await apiLogin(username, password);

      // 서버 응답을 로컬 저장소에 반영 (토큰/유저 저장)
      const result = handleLoginResponse(data);
      if (!result?.success) {
        throw new Error(result?.error || '로그인 처리에 실패했습니다.');
      }

      const saved = getUserData();
      setUser(saved);
      return { success: true, user: saved };
    } catch (e) {
      const msg = parseError(e);
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // ---- 회원가입 (백엔드 스키마 그대로 전달) ----
  // 예: { username, password, authCode, teamName, role, region }
  const signup = async (payload) => {
    try {
      setLoading(true);
      setError(null);

      if (!payload?.username || !payload?.password || !payload?.authCode) {
        throw new Error('필수 항목(아이디/비밀번호/인증코드)을 입력해주세요.');
      }

      const res = await apiSignup(payload);
      // 서버가 단순 성공만 주면 그대로 전달
      return {
        success: true,
        data: res,
        message: '회원가입이 완료되었습니다.',
      };
    } catch (e) {
      const msg = parseError(e);
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  // ---- 로그아웃 (서버 알림은 선택적) ----
  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      // 서버에 알림이 필요 없는 경우라도 호출해도 무방
      try {
        await apiLogout();
      } catch {
        // 서버 로그아웃 실패는 무시 (클라이언트 정리 우선)
      }
    } finally {
      clearAuthData();
      setLoading(false);
    }
  };

  // ---- 아이디 중복 확인 ----
  const checkUsername = async (username) => {
    try {
      if (!username) return { available: false, error: '아이디를 입력하세요.' };
      const r = await apiCheckUsername(username);
      return { available: !!r.available };
    } catch (e) {
      return { available: false, error: parseError(e) };
    }
  };

  // ---- 인증코드 검증 ----
  const verifyTeamCode = async (authCode) => {
    try {
      if (!authCode) return { valid: false, error: '인증코드를 입력하세요.' };
      const r = await apiVerifyTeamCode(authCode);
      return { valid: !!r.valid };
    } catch (e) {
      return { valid: false, error: parseError(e) };
    }
  };

  // ---- 공통 유틸 ----
  const clearAuthData = () => {
    clearTokens();
    setUser(null);
    setError(null);
  };

  const parseError = (err) => {
    if (!err) return '알 수 없는 오류가 발생했습니다.';
    if (typeof err === 'string') return err;
    if (err.message) return err.message;
    return '알 수 없는 오류가 발생했습니다.';
  };

  const value = {
    // 상태
    user,
    loading,
    error,
    isInitialized,
    isAuthenticated: isAuthedByStorage() && !!user,

    // 액션
    login,
    signup,
    logout,

    // 검증 유틸
    checkUsername,
    verifyTeamCode,

    // 기타
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth는 AuthProvider 내부에서만 사용 가능합니다.');
  return ctx;
};
