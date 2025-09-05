// src/pages/Auth/ChangePassword.jsx
import React, { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Eye from '../../assets/images/png/AuthPng/Eye.png';
import EyeActive from '../../assets/images/png/AuthPng/EyeActive.png';
import { resetPassword, handleAuthError } from '../../api/authAPI';

const ChangePassword = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { email: emailFromState, resetCode: codeFromState } = state || {};

  const [formData, setFormData] = useState({ password: '', passwordConfirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const email = useMemo(() => emailFromState || '', [emailFromState]);
  const resetCode = useMemo(() => codeFromState || '', [codeFromState]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (errors[id]) setErrors((p) => ({ ...p, [id]: null }));
    if (apiError) setApiError('');
  };

  const validateForm = () => {
    const newErrors = {};
    const { password, passwordConfirm } = formData;

    if (!email || !resetCode) newErrors.token = '인증 단계가 유효하지 않습니다. 처음부터 진행해주세요.';
    if (!password) newErrors.password = '비밀번호를 입력해주세요.';
    else if (password.length < 8) newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다.';
    if (!passwordConfirm) newErrors.passwordConfirm = '비밀번호 확인을 입력해주세요.';
    else if (password !== passwordConfirm) newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      await resetPassword(email, resetCode, formData.password);
      alert('비밀번호가 성공적으로 변경되었습니다!');
      navigate('../findsuccess');
    } catch (err) {
      setApiError(handleAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="find-page-container">
      <div className="find-page-card">
        <h2 className="find-title">비밀번호 재설정</h2>
        <p className="find-description">새로운 비밀번호를 입력해주세요.</p>

        {errors.token && <p className="errorMessage">⚠️ {errors.token}</p>}
        {apiError && <p className="errorMessage">⚠️ {apiError}</p>}

        <div className="find-input-group">
          <label htmlFor="password">비밀번호</label>
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="최소 8자"
            autoComplete="new-password"
            disabled={submitting}
          />
          {errors.password && <p className="errorMessage">⚠️ {errors.password}</p>}
          <button
            type="button"
            className="password-toggle-button"
            onClick={() => setShowPassword((v) => !v)}
            aria-pressed={showPassword}
            disabled={submitting}
          >
            {showPassword ? <img src={EyeActive} alt="" className="showPassword" /> : <img src={Eye} alt="" className="showPasswordActive" />}
          </button>
        </div>

        <div className="find-input-group">
          <label htmlFor="passwordConfirm">비밀번호 확인</label>
          <input
            type={showPasswordConfirm ? 'text' : 'password'}
            id="passwordConfirm"
            value={formData.passwordConfirm}
            onChange={handleChange}
            placeholder="비밀번호 다시 입력"
            autoComplete="new-password"
            disabled={submitting}
          />
          {errors.passwordConfirm && <p className="errorMessage">⚠️ {errors.passwordConfirm}</p>}
          <button
            type="button"
            className="password-toggle-button"
            onClick={() => setShowPasswordConfirm((v) => !v)}
            aria-pressed={showPasswordConfirm}
            disabled={submitting}
          >
            {showPasswordConfirm ? <img src={EyeActive} alt="" className="showPassword" /> : <img src={Eye} alt="" className="showPasswordActive" />}
          </button>
        </div>

        <button className="find-code-button" onClick={handleSubmit} disabled={submitting}>
          {submitting ? '변경 중…' : '비밀번호 변경 →'}
        </button>
      </div>
    </div>
  );
};

export default ChangePassword;
