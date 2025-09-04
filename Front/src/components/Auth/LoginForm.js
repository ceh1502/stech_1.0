import React, { useState } from 'react';
import Kakao from '../../assets/images/png/AuthPng/Kakao.png';
import Google from '../../assets/images/png/AuthPng/Google.png';
import Eye from '../../assets/images/png/AuthPng/Eye.png';
import EyeActive from '../../assets/images/png/AuthPng/EyeActive.png';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginForm = ({ onSuccess, showForgotPassword = true, className = '' }) => {
  // 컨텍스트 메서드/상태는 별칭으로
  const { login: authLogin, logout: authLogout, error: authError, loading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formError) setFormError(null);
  };

  const validateForm = () => {
    const username = formData.username?.trim();
    const password = formData.password;
    if (!username || !password) {
      setFormError('아이디와 비밀번호 모두 입력해주세요.');
      return false;
    }
    const idRegex = /^[a-zA-Z0-9]+$/;
    if (!idRegex.test(username)) {
      setFormError('존재하지 않는 아이디입니다.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormError(null);

    try {
      const ok = await authLogin({ username: formData.username, password: formData.password });
      if (ok) {
        console.log('Login Successful!');
        onSuccess?.();
        navigate('/service');
      }
    } catch (err) {
      // 보통 AuthContext가 에러 메시지를 관리하므로 여기선 최소 처리
      console.error('Login Error:', err);
      setFormError(err?.message || '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormLoading = isSubmitting || !!loading;
  const displayError = formError || authError;

  return (
    <form onSubmit={handleSubmit} className={`loginForm ${className}`}>
      <div className="tab-container">
        <button type="button" className="loginTitle">로그인</button>
        <a href="/auth/signup" className="loginTitleTosignup">회원가입</a>
      </div>

      <div className="formGroup">
        <label className="LoginformLabel ID" htmlFor="username">아이디</label>
        <input
          id="username"
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="LoginformInput"
          required
          autoComplete="username"
          disabled={isFormLoading}
        />
      </div>

      <div className="formGroup">
        <label className="LoginformLabel PW" htmlFor="password">
          비밀번호
          {showForgotPassword && (
            <a href="/auth/find" className="forgotPasswordLink">비밀번호 찾기</a>
          )}
        </label>
        <div className="passwordInputContainer">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="LoginformInput"
            required
            autoComplete="current-password"
            disabled={isFormLoading}
          />
          <button
            type="button"
            className="LoginpasswordToggleButton"
            onClick={() => setShowPassword((v) => !v)}
            disabled={isFormLoading}
            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보이기'}
          >
            {showPassword ? (
              <img src={EyeActive} alt="" className="showPassword" />
            ) : (
              <img src={Eye} alt="" className="showPasswordActive" />
            )}
          </button>
        </div>
      </div>

      {displayError && <div className="errorMessage">⚠️ {displayError}</div>}

      <button
        type="submit"
        disabled={isFormLoading}
        className={`LoginsubmitButton ${isFormLoading ? 'loading' : ''}`}
      >
        {isFormLoading ? 'Loading...' : '로그인'}
      </button>

      <div className="divider-container">
        <div className="divider" />
        <span className="divider-text">or</span>
        <div className="divider" />
      </div>

      <div className="social-buttons-container">
        <button type="button" className="socialButton google-button" disabled={isFormLoading}>
          <img src={Google} alt="google" className="socialicon" />
          구글로 로그인
        </button>
        <button type="button" className="socialButton kakao-button" disabled={isFormLoading}>
          <img src={Kakao} alt="kakao" className="socialicon" />
          카카오로 로그인
        </button>
      </div>
    </form>
  );
};

export default LoginForm;
