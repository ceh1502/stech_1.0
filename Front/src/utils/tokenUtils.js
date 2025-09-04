// src/utils/tokenUtils.js
const ACCESS_KEY = 'token';
const USER_KEY = 'user';

export const setToken = (t) => localStorage.setItem(ACCESS_KEY, t);
export const getToken = () => localStorage.getItem(ACCESS_KEY);
export const clearToken = () => localStorage.removeItem(ACCESS_KEY);

export const setUserData = (u) => localStorage.setItem(USER_KEY, JSON.stringify(u));
export const getUserData = () => {
  try {
    const s = localStorage.getItem(USER_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
};
export const clearUserData = () => localStorage.removeItem(USER_KEY);

export const clearTokens = () => {
  clearToken();
  clearUserData();
};

const decode = (t) => {
  try {
    const [, payload] = t.split('.');
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch { return {}; }
};

export const isTokenExpired = (t = getToken()) => {
  if (!t) return true;
  const { exp } = decode(t);
  if (!exp) return true;
  return Date.now() >= exp * 1000;
};

// 로그인 응답 처리: { token, user } 가정
export const handleLoginResponse = (data) => {
  if (!data?.token) return { success: false, error: 'Token missing' };
  setToken(data.token);
  if (data.user) setUserData(data.user);
  return { success: true };
};

// 로그인 상태: 토큰 && 미만료 && user 있으면 true
export const isAuthenticated = () => {
  const t = getToken();
  return !!t && !isTokenExpired(t) && !!getUserData();
};
