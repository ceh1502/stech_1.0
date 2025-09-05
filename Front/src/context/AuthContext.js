// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  login as apiLogin,
  signup as apiSignup,
  verifyTeamCode as apiVerifyTeamCode,
  checkUsername as apiCheckUsername,
  logout as apiLogout,
  verifyToken as apiVerifyToken,
} from '../api/authAPI';

import {
  getToken,
  getUserData,
  clearTokens,
  isTokenExpired,
  handleLoginResponse,
  setUserData,
} from '../utils/tokenUtils';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // 앱 시작 시 복원 + 토큰 검증으로 user 보강
  useEffect(() => {
    (async () => {
      try {
        const token = getToken();
        if (!token || isTokenExpired(token)) {
          clearAuthData();
        } else {
          // 로컬 user 있으면 우선 반영
          const stored = getUserData();
          if (stored) setUser(stored);
          // 서버로 user 최신화
          try {
            const v = await apiVerifyToken(token); // { user }
            if (v?.user) {
              setUser(v.user);
              setUserData(v.user);
            }
          } catch {
            // 검증 실패하면 세션 정리
            clearAuthData();
          }
        }
      } catch {
        clearAuthData();
      } finally {
        setLoading(false);
        setIsInitialized(true);
      }
    })();
  }, []);

  const login = async (credentials = {}) => {
    try {
      setLoading(true);
      setError(null);

      const username = credentials.username || credentials.email || credentials.id;
      const password = credentials.password;
      if (!username || !password) throw new Error('아이디와 비밀번호를 입력해주세요.');

      const data = await apiLogin(username, password);     // { token, user? }
      const result = handleLoginResponse(data);            // token 저장 + user 저장(있다면)
      if (!result?.success) throw new Error(result?.error || '로그인 처리 실패');

      // user가 응답에 없으면 verify로 받아오기
      let u = data.user || null;
      if (!u) {
        try {
          const v = await apiVerifyToken(getToken());
          u = v?.user ?? null;
          if (u) setUserData(u);
        } catch {}
      }
      setUser(u);

      // ✨ 1. 프로필 완성 여부 판단: user 객체에 nickname이 있는지 확인합니다.
      //    (SignupProfileForm에서 '성명(표시명)'을 nickname으로 저장하기 때문)
     const isProfileComplete = !!u?.profile?.realName;

      return { success: true, user: u, profileComplete: isProfileComplete };

    } catch (e) {
      const msg = parseError(e);
      setError(msg);
      return { success: false, error: msg, profileComplete: false };
    } finally {
      setLoading(false);
    }
  };


  const signup = async (payload) => {
    try {
      setLoading(true);
      setError(null);
      if (!payload?.username || !payload?.password || !payload?.authCode) {
        throw new Error('필수 항목(아이디/비밀번호/인증코드)을 입력해주세요.');
      }
      const res = await apiSignup(payload);
      return { success: true, data: res, message: '회원가입이 완료되었습니다.' };
    } catch (e) {
      const msg = parseError(e);
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      try { await apiLogout(); } catch { /* 서버 실패 무시 */ }
    } finally {
      clearAuthData();
      setLoading(false);
    }
  };

  const checkUsername = async (username) => {
    try {
      if (!username) return { available: false, error: '아이디를 입력하세요.' };
      const r = await apiCheckUsername(username);
      return { available: !!r.available };
    } catch (e) {
      return { available: false, error: parseError(e) };
    }
  };

  const verifyTeamCode = async (authCode) => {
    try {
      if (!authCode) return { valid: false, error: '인증코드를 입력하세요.' };
      const r = await apiVerifyTeamCode(authCode);
      return { valid: !!r.valid };
    } catch (e) {
      return { valid: false, error: parseError(e) };
    }
  };

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
    user,
    loading,
    error,
    isInitialized,
    isAuthenticated: !!user,

    login,
    signup,
    logout,

    checkUsername,
    verifyTeamCode,

    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth는 AuthProvider 내부에서만 사용 가능합니다.');
  return ctx;
};