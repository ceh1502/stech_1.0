// src/components/Auth/LoginForm.jsx

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
// ... 기존 import ...
import Kakao from '../../assets/images/png/AuthPng/Kakao.png';
import Google from '../../assets/images/png/AuthPng/Google.png';
import Eye from '../../assets/images/png/AuthPng/Eye.png';
import EyeActive from '../../assets/images/png/AuthPng/EyeActive.png';


const LoginForm = ({ onSuccess, showForgotPassword = true, className = '' }) => {
  const { login: authLogin, error: authError, loading } = useAuth();
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
    // ... 기존 유효성 검사 로직은 동일 ...
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
      // ✨ 수정된 부분: authLogin의 반환 값을 객체로 받음
      const result = await authLogin({ username: formData.username, password: formData.password });

      // ✨ 수정된 부분: 반환된 객체를 기반으로 분기 처리
      if (result.success) {
        onSuccess?.();
        if (result.profileComplete) {
          // 프로필이 완성된 경우 -> 서비스 페이지로 이동
          navigate('/service');
        } else {
          // 프로필이 미완성된 경우 -> 프로필 생성 페이지로 이동
          navigate('/auth/signupprofile');
        }
      }
      // 로그인 실패 시에는 authError가 자동으로 설정되므로 별도 처리가 필요 없습니다.
    } catch (err) {
      setFormError(err?.message || '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormLoading = isSubmitting || !!loading;
  const displayError = formError || authError;

  return (
    // ... 나머지 JSX는 동일 ...
    <form onSubmit={handleSubmit} className={`loginForm ${className}`} autoComplete="on">
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
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          disabled={isFormLoading}
          inputMode="text"
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
            onMouseDown={(e) => e.preventDefault()}
            tabIndex={-1}
            aria-hidden="true"
            disabled={isFormLoading}
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