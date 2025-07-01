const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// 토큰 가져오기
export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('토큰 조회 실패:', error);
    return null;
  }
};

//setToken
export const setToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('토큰 저장 실패:', error);
  }
};

// 리프레시 토큰 가져오기
export const getRefreshToken = () => {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('리프레시 토큰 조회 실패:', error);
    return null;
  }
};

// 리프레시 토큰 저장
export const setRefreshToken = (refreshToken) => {
  try {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch (error) {
    console.error('리프레시 토큰 저장 실패:', error);
  }
};

// 모든 토큰 삭제
export const clearTokens = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('토큰 삭제 실패:', error);
  }
};

// JWT 토큰 디코딩
export const decodeToken = (token) => {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch (error) {
    console.error('토큰 디코딩 실패:', error);
    return null;
  }
};

// 토큰 만료 확인
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

// 토큰에서 사용자 정보 추출
export const getUserFromToken = (token) => {
  const decoded = decodeToken(token);
  return decoded ? {
    id: decoded.userId || decoded.sub,
    email: decoded.email,
    name: decoded.name
  } : null;
};