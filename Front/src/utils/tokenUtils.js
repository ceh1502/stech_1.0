// src/utils/tokenUtils.js
// 백엔드 응답 구조에 정확히 맞춘 토큰 관리

// 로그인 응답 처리 (백엔드: {success: true, data: {token, user}})
export const handleLoginResponse = (loginData) => {
  try {
    // loginData는 이미 response.data (즉, {token, user})
    if (!loginData || !loginData.token) {
      console.error('❌ Login data missing token:', loginData);
      return { success: false, error: 'Token not found in login response' };
    }
    
    // 토큰 저장
    localStorage.setItem('token', loginData.token);
    console.log('✅ Token saved successfully');
    
    // 사용자 정보 저장
    if (loginData.user) {
      localStorage.setItem('user', JSON.stringify(loginData.user));
      console.log('✅ User data saved successfully');
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error handling login response:', error);
    return { success: false, error: error.message };
  }
};

// 이메일 인증 후 응답 처리 (백엔드: {success: true, data: {token, user}})
export const handleVerificationResponse = (verificationData) => {
  try {
    // verificationData는 이미 response.data (즉, {token, user})
    if (!verificationData || !verificationData.token) {
      console.error('❌ Verification data missing token:', verificationData);
      return { success: false, error: 'Token not found in verification response' };
    }
    
    // 토큰 저장
    localStorage.setItem('token', verificationData.token);
    console.log('✅ Token saved after email verification');
    
    // 사용자 정보 저장
    if (verificationData.user) {
      localStorage.setItem('user', JSON.stringify(verificationData.user));
      console.log('✅ User data saved after email verification');
    }
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error handling verification response:', error);
    return { success: false, error: error.message };
  }
};

// 사용자 정보 응답 처리 (백엔드: {success: true, data: {user}})
export const handleUserInfoResponse = (userInfoData) => {
  try {
    // userInfoData는 이미 response.data (즉, {user})
    if (!userInfoData || !userInfoData.user) {
      console.error('❌ User info data missing user:', userInfoData);
      return { success: false, error: 'User not found in response' };
    }
    
    // 사용자 정보 저장
    localStorage.setItem('user', JSON.stringify(userInfoData.user));
    console.log('✅ User info updated successfully');
    
    return { success: true };
  } catch (error) {
    console.error('❌ Error handling user info response:', error);
    return { success: false, error: error.message };
  }
};

// 토큰 조회
export const getToken = () => {
  return localStorage.getItem('token');
};

// 리프레시 토큰 저장 (현재 백엔드에서 미지원)
export const setRefreshToken = (refreshToken) => {
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken);
    return true;
  }
  return false;
};

// 리프레시 토큰 조회
export const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

// 모든 토큰 및 사용자 정보 삭제
export const clearTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  console.log('🗑️ All tokens and user data cleared');
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

// 토큰 유효성 검사 (JWT 디코딩)
export const isTokenExpired = (token = null) => {
  const tokenToCheck = token || getToken();
  
  if (!tokenToCheck) return true;
  
  try {
    const parts = tokenToCheck.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT token format');
      return true;
    }
    
    const payload = JSON.parse(atob(parts[1]));
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
  const userData = getUserData();
  
  // 토큰과 사용자 정보가 모두 있고, 토큰이 만료되지 않았으며, 이메일 인증이 완료된 경우
  return token && 
         !isTokenExpired(token) && 
         userData && 
         userData.isEmailVerified === true;
};

// 이메일 인증이 필요한지 확인
export const isEmailVerificationRequired = () => {
  const userData = getUserData();
  return userData && userData.isEmailVerified === false;
};

// 토큰에서 사용자 ID 추출
export const getUserIdFromToken = () => {
  const token = getToken();
  
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload.id || null;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// 개발 환경용 디버그 함수
export const debugTokens = () => {
  if (process.env.NODE_ENV === 'development') {
    const userData = getUserData();
    console.log('🔍 Token Debug Info:', {
      hasToken: !!getToken(),
      hasRefreshToken: !!getRefreshToken(),
      hasUserData: !!userData,
      isAuthenticated: isAuthenticated(),
      isEmailVerified: userData?.isEmailVerified,
      tokenExpired: isTokenExpired(),
      userId: getUserIdFromToken(),
      userData: userData
    });
  }
};