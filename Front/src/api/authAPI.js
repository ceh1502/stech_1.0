// src/api/authAPI.js
import { API_CONFIG } from '../config/api';

export class APIError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

const jsonOrText = async (res) => {
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    try { return await res.json(); } catch { return {}; }
  }
  try { return await res.text(); } catch { return ''; }
};

// 아이디 중복 확인: 200=사용 가능, 409=중복
export async function checkUsername(username) {
  const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CHECK_USERNAME}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });

  if (res.status === 200) return { available: true };
  if (res.status === 409) return { available: false };

  const data = await jsonOrText(res);
  throw new APIError(typeof data === 'object' ? (data.message || '아이디 확인 실패') : '아이디 확인 실패', res.status, data);
}

// 인증코드 검증: 200=유효, 400=무효
export async function verifyTeamCode(authCode) {
  const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VERIFY_TEAM_CODE}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ authCode }),
  });

  if (res.status === 200) return { valid: true };
  if (res.status === 400) return { valid: false };

  const data = await jsonOrText(res);
  throw new APIError(typeof data === 'object' ? (data.message || '인증코드 확인 실패') : '인증코드 확인 실패', res.status, data);
}

// 회원가입: 201/200 성공
export async function signup(payload) {
  const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SIGNUP}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await jsonOrText(res);
  if (res.ok || res.status === 201) return data;
  throw new APIError(typeof data === 'object' ? (data.message || '회원가입 실패') : '회원가입 실패', res.status, data);
}

// 로그인 (username/password)
export async function login(username, password) {
  const res = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await jsonOrText(res);
  if (res.ok) return data;
  const msg = typeof data === 'object' ? (data.message || (res.status === 401 ? '비밀번호가 틀렸습니다.' : '로그인 실패')) : '로그인 실패';
  throw new APIError(msg, res.status, data);
}

export async function logout() {
  // 나중에 서버 로그아웃 엔드포인트가 생기면 여기서 호출하도록 확장하면 됩니다.
  // 예: await fetch(`${API_CONFIG.BASE_URL}/auth/logout`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }});
  return { success: true };
}

export function handleAuthError(error) {
  if (error instanceof APIError) {
    if (error.message) return error.message;
    switch (error.status) {
      case 400: return '잘못된 요청입니다.';
      case 401: return '인증이 필요합니다.';
      case 403: return '접근 권한이 없습니다.';
      case 404: return '요청한 리소스를 찾을 수 없습니다.';
      case 409: return '중복된 요청입니다.';
      case 500: return '서버 오류가 발생했습니다.';
      default:  return '알 수 없는 오류가 발생했습니다.';
    }
  }
  return error?.message || '네트워크 오류가 발생했습니다.';
}
