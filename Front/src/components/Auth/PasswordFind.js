// src/pages/Auth/PasswordFind.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  checkUserExists,   // /auth/check-user-exists
  findEmail,         // /auth/find-email
  sendResetCode,     // /auth/send-reset-code
  handleAuthError,
} from '../../api/authAPI';

const GENERIC_CREDENTIAL_ERROR = '아이디 또는 이메일이 올바르지 않습니다.';

const PasswordFind = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ id: '', email: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors((p) => ({ ...p, [id]: null }));
    if (apiError) setApiError('');
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.id.trim()) {
      newErrors.id = '아이디를 입력해주세요.';
    } else if (!/^[a-zA-Z0-9_.-]+$/.test(formData.id.trim())) {
      newErrors.id = '아이디는 영문/숫자/._- 만 사용할 수 있습니다.';
    }

    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!emailRe.test(formData.email.trim())) {
      newErrors.email = '유효한 이메일 형식이 아닙니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCodeRequest = async () => {
    if (!validateForm()) return;

    const username = formData.id.trim();
    const email = formData.email.trim();

    setSubmitting(true);
    setApiError('');

    // 1) 아이디 존재 확인 (실패 시 어떤 이유든 동일 메시지)
    try {
      await checkUserExists(username);
    } catch {
      setApiError(GENERIC_CREDENTIAL_ERROR);
      setSubmitting(false);
      return;
    }

    // 2) 이메일로 아이디 조회하여 서로 매칭되는지 확인 (실패/불일치 시 동일 메시지)
    try {
      const res = await findEmail(email); // { success, data: { username } }
      const apiUsername = (res?.data?.username || '').toLowerCase();
      if (apiUsername !== username.toLowerCase()) {
        setApiError(GENERIC_CREDENTIAL_ERROR);
        setSubmitting(false);
        return;
      }
    } catch {
      setApiError(GENERIC_CREDENTIAL_ERROR);
      setSubmitting(false);
      return;
    }

    // 3) 전부 통과 시 코드 전송
    try {
      await sendResetCode(email);
      alert('인증코드를 이메일로 전송했습니다. (유효시간 10분)');
      navigate('../findcode', { state: { email } });
    } catch (err) {
      // 이 단계의 실패(네트워크/쿨다운 등)는 원인 그대로 안내
      setApiError(handleAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="find-page-container">
      <div className="find-page-card">
        <h2 className="find-title">비밀번호 찾기</h2>
        <p className="find-description">아이디와 이메일을 확인한 뒤, 인증코드를 전송합니다.</p>

        {apiError && <p className="errorMessage">⚠️ {apiError}</p>}

        <div className="find-input-group">
          <label htmlFor="id">아이디</label>
          <input
            id="id"
            type="text"
            value={formData.id}
            onChange={handleChange}
            disabled={submitting}
          />
          {errors.id && <p className="errorMessage">⚠️ {errors.id}</p>}
        </div>

        <div className="find-input-group">
          <label htmlFor="email">이메일</label>
          <input
            id="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="user@example.com"
            autoComplete="email"
            disabled={submitting}
          />
          {errors.email && <p className="errorMessage">⚠️ {errors.email}</p>}
        </div>

        <button
          className="find-code-button"
          onClick={handleCodeRequest}
          disabled={submitting}
        >
          {submitting ? '요청 중…' : '코드 받기 →'}
        </button>

        <div className="find-links-group">
          <p>이미 계정이 있습니다. <a href="/auth" className="find-link">로그인하기</a></p>
          <p>계정이 없다면? <a href="/auth/signup" className="find-link">회원가입</a></p>
        </div>

        <hr className="find-divider" />
        <div className="find-help-section">
          <p>메일이 오지 않으면 스팸함을 확인하거나, <a href="/contact" className="link">고객 서비스</a>에 문의해 주세요.</p>
        </div>
      </div>
    </div>
  );
};

export default PasswordFind;
