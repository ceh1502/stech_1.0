// src/utils/tokenUtils.js
// 백엔드 응답 구조에 맞춰 토큰 처리 개선

// 토큰 저장 (백엔드에서 token 또는 jwt_token 필드 사용 가능)
export const setToken = (tokenData) => {
  let token;
  
  if (typeof tokenData === 'string') {
    token = tokenData;
  } else if (typeof tokenData === 'object') {
    // 백엔드 응답에서 token 또는 jwt_token 추출
    token = tokenData.token || tokenData.jwt_token;
  }
  
  if (token) {
    localStorage.setItem('token', token);
    return true;
  }
  
  console.error('Invalid token data:', tokenData);
  return false;
};

// 토큰 조회
export const getToken = () => {
  return localStorage.getItem('token');
};

// 리프레시 토큰 저장
export const setRefreshToken = (refreshToken) => {
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
  }
};

// 리프레시 토큰 조회
export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

// 모든 토큰 삭제
export const clearTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user'); // 사용자 정보도 함께 삭제
};

// 사용자 정보 저장 (백엔드 응답에서 user 데이터 처리)
export const setUserData = (userData) => {
  if (userData && typeof userData === 'object') {
    localStorage.setItem('user', JSON.stringify(userData));
    return true;
  }
  return false;
};

// 사용자 정보 조회
export const getUserData = () => {
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// 토큰 유효성 기본 검사 (만료시간 확인)
export const isTokenExpired = (token = null) => {
  const tokenToCheck = token || getToken();
  
  if (!tokenToCheck) return true;
  
  try {
    // JWT 토큰 디코딩 (Base64)
    const payload = JSON.parse(atob(tokenToCheck.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

// 로그인 상태 확인
export const isAuthenticated = () => {
  const token = getToken();
  return token && !isTokenExpired(token);
};