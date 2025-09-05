// src/common/apiFetch.js
import { API_CONFIG } from '../config/api';
import { getToken, setToken, clearToken, isTokenExpired } from '../utils/tokenUtils';
import { refreshToken } from '../api/authAPI';

let refreshingPromise = null;

async function ensureFreshToken() {
  const t = getToken();
  if (!t) return null;
  if (!isTokenExpired(t)) return t;

  if (!refreshingPromise) {
    refreshingPromise = (async () => {
      try {
        const r = await refreshToken(t);
        setToken(r.token);
        return r.token;
      } catch {
        clearToken();
        return null;
      } finally {
        refreshingPromise = null;
      }
    })();
  }
  return refreshingPromise;
}

export async function apiFetch(path, init = {}) {
  // 절대/상대 경로 모두 지원
  const url = path.startsWith('http') ? path : `${API_CONFIG.BASE_URL}${path}`;

  let token = await ensureFreshToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let res = await fetch(url, { ...init, headers });

  // 401이면 한 번 더 갱신/재시도
  if (res.status === 401 && getToken()) {
    token = await ensureFreshToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
      res = await fetch(url, { ...init, headers });
    }
  }

  return res;
}
