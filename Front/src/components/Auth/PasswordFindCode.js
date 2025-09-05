// src/pages/Auth/PasswordFindCode.jsx
import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { sendResetCode, handleAuthError } from '../../api/authAPI';

const PasswordFindCode = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = useMemo(() => state?.email || '', [state?.email]);

  const [code, setCode] = useState('');
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const handleChange = (e) => {
    const numericValue = e.target.value.replace(/[^0-9]/g, '').substring(0, 6);
    setCode(numericValue);
    if (errors.code) setErrors((p) => ({ ...p, code: null }));
    if (apiError) setApiError('');
  };

  const validate = () => {
    const newErr = {};
    if (!email) newErr.email = '이메일 정보가 없습니다. 처음부터 진행해주세요.';
    if (!code) newErr.code = '인증번호를 입력해주세요.';
    else if (!/^\d{6}$/.test(code)) newErr.code = '유효한 6자리 인증번호를 입력해주세요.';
    setErrors(newErr);
    return Object.keys(newErr).length === 0;
  };

  const handleVerification = () => {
    if (!validate()) return;
    // 서버에 별도 "코드 검증" 엔드포인트 없음 → 다음 단계에서 최종 검증/변경
    navigate('../changepassword', { state: { email, resetCode: code } });
  };

  const handleResend = async (e) => {
    e.preventDefault();
    if (!email || resending || cooldown > 0) return;
    setResending(true);
    try {
      await sendResetCode(email);
      setCooldown(60);
      const timer = setInterval(() => {
        setCooldown((t) => {
          if (t <= 1) { clearInterval(timer); return 0; }
          return t - 1;
        });
      }, 1000);
      alert('인증코드를 다시 보냈습니다.');
    } catch (err) {
      setApiError(handleAuthError(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="find-page-container">
      <div className="find-page-card">
        <h2 className="find-title">이메일로 받은 코드를 입력하세요</h2>
        <p className="find-description">{email || '이메일 정보 없음'}</p>

        {errors.email && <p className="errorMessage">⚠️ {errors.email}</p>}
        {apiError && <p className="errorMessage">⚠️ {apiError}</p>}

        <div className="find-input-group">
          <label htmlFor="code">인증번호</label>
          <input id="code" type="text" value={code} onChange={handleChange} maxLength={6} />
          <a href="#" className="resend-link" onClick={handleResend}>
            {cooldown > 0 ? `다시 보내기 (${cooldown}s)` : resending ? '보내는 중…' : '다시 보내기'}
          </a>
          {errors.code && <p className="errorMessage">⚠️ {errors.code}</p>}
        </div>

        <button className="find-code-button" onClick={handleVerification}>
          인증 확인 →
        </button>
      </div>
    </div>
  );
};

export default PasswordFindCode;
