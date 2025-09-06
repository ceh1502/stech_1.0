// src/components/Auth/SignupForm.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { teamCodes } from '../../data/teamCodes';
import {
  checkUsername,
  verifyTeamCode,
  signup,
  handleAuthError,
} from '../../api/authAPI';

import Kakao from '../../assets/images/png/AuthPng/Kakao.png';
import Google from '../../assets/images/png/AuthPng/Google.png';
import Eye from '../../assets/images/png/AuthPng/Eye.png';
import EyeActive from '../../assets/images/png/AuthPng/EyeActive.png';

const SignupForm = ({ onSuccess, className = '' }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    passwordConfirm: '',
    authCode: '',
    teamName: '',
    role: '',
    region: '',
  });

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [isIdChecking, setIsIdChecking] = useState(false);
  const [idStatus, setIdStatus] = useState(null);
  const [idMessage, setIdMessage] = useState('');

  const [isAuthCodeVerifying, setIsAuthCodeVerifying] = useState(false);
  const [authCodeStatus, setAuthCodeStatus] = useState(null);
  const [authCodeMessage, setAuthCodeMessage] = useState('');

  const [validatedTeamInfo, setValidatedTeamInfo] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const key = name === 'id' ? 'username' : name;

    setFormData((prev) => ({ ...prev, [key]: value }));

    if (key === 'username') {
      setIdStatus(null);
      setIdMessage('');
    }
    if (key === 'authCode') {
      setAuthCodeStatus(null);
      setAuthCodeMessage('');
      setValidatedTeamInfo(null);
    }
    if (error) setError(null);
  };

  const handleIdCheck = async () => {
    const { username } = formData;

    if (!username) {
      setIdStatus('idle');
      setIdMessage('아이디를 입력해주세요.');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!usernameRegex.test(username)) {
      setIdStatus('invalid');
      setIdMessage('영어 및 숫자 조합만 입력해주세요.');
      return;
    }

    setIsIdChecking(true);
    setIdStatus('checking');
    setIdMessage('');

    try {
      const res = await checkUsername(username);
      if (res.available) {
        setIdStatus('available');
        setIdMessage('사용 가능한 아이디입니다.');
      } else {
        setIdStatus('unavailable');
        setIdMessage('중복된 아이디입니다.');
      }
    } catch (err) {
      setIdStatus('invalid');
      setIdMessage(handleAuthError(err));
    } finally {
      setIsIdChecking(false);
    }
  };

  const handleAuthCodeVerification = async () => {
    if (!formData.authCode) {
      setAuthCodeStatus('idle');
      setAuthCodeMessage('인증코드를 입력해주세요.');
      return;
    }

    setIsAuthCodeVerifying(true);
    setAuthCodeStatus('verifying');
    setAuthCodeMessage('');
    setValidatedTeamInfo(null);

    try {
      const res = await verifyTeamCode(formData.authCode);
      if (res.valid) {
        const info = teamCodes[formData.authCode] || null;
        setValidatedTeamInfo(info);

        setAuthCodeStatus('valid');
        if (info) {
          const roleText = info.role === 'coach' ? 'coach' : 'player';
          setAuthCodeMessage(`인증 완료: ${info.team} (${roleText})`);
        } else {
          setAuthCodeMessage('인증코드 확인 완료');
        }
      } else {
        setAuthCodeStatus('invalid');
        setAuthCodeMessage('유효하지 않은 인증코드입니다.');
      }
    } catch (err) {
      setAuthCodeStatus('invalid');
      setAuthCodeMessage(handleAuthError(err));
    } finally {
      setIsAuthCodeVerifying(false);
    }
  };

  const validateForm = () => {
    if (!formData.username || !formData.password || !formData.authCode) {
      setError('모든 필수 항목을 입력해주세요.');
      return false;
    }
    if (formData.password.length < 8) {
      setError('비밀번호를 8글자 이상 입력해주세요.');
      return false;
    }
    if (formData.password !== formData.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return false;
    }
    if (!agreedToTerms) {
      setError('이용 약관 및 개인정보 보호정책에 동의해야 합니다.');
      return false;
    }
    if (idStatus !== 'available') {
      setError('아이디 중복 확인이 필요합니다.');
      return false;
    }
    if (authCodeStatus !== 'valid') {
      setError('인증코드 확인이 필요합니다.');
      return false;
    }

    const teamName = validatedTeamInfo?.team || formData.teamName;
    const role = validatedTeamInfo?.role || formData.role;
    const region = validatedTeamInfo?.region || formData.region;
    if (!teamName || !role || !region) {
      setError('팀 정보(팀명/역할/지역)를 확인해주세요.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    const payload = {
      username: formData.username,
      password: formData.password,
      authCode: formData.authCode,
      teamName: validatedTeamInfo?.team || formData.teamName,
      role: validatedTeamInfo?.role || formData.role,
      region: validatedTeamInfo?.region || formData.region,
    };

    try {
      await signup(payload);
      onSuccess?.();
      navigate('../signupprofile');
    } catch (err) {
      setError(handleAuthError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSubmitButtonDisabled =
    isSubmitting ||
    idStatus !== 'available' ||
    authCodeStatus !== 'valid' ||
    !agreedToTerms;

  const getStatusClass = (status) => {
    if (status === 'available' || status === 'valid')
      return 'status-message status-success';
    if (status === 'unavailable' || status === 'invalid')
      return 'status-message status-error';
    return 'status-message';
  };

  return (
    // 자동완성/자동저장 활성화
    <form
      onSubmit={handleSubmit}
      className={`signupForm ${className}`}
      autoComplete="on"
    >
      <div className="tab-container">
        {/* a대신 Link 권장 (페이지 리로드 방지) */}
        <Link to="/auth" className="signupTitle">
          로그인
        </Link>
        <button type="button" className="signupTitleTosignup">
          회원가입
        </button>
      </div>

      {/* 아이디 */}
      <div className="formGroup">
        <label className="SignupformLabel ID" htmlFor="username">
          아이디
        </label>
        <div className="input-with-button-group">
          <input
            id="username"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="SignupformInput"
            placeholder=""
            required
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            disabled={isSubmitting || isIdChecking || isAuthCodeVerifying}
          />
          <button
            type="button"
            onClick={handleIdCheck}
            disabled={isSubmitting || isIdChecking || !formData.username}
            className={`valid-checking ${isIdChecking ? 'loading' : ''}`}
          >
            {isIdChecking ? '확인 중...' : '중복 확인'}
          </button>
        </div>
        {idMessage && (
          <div className={getStatusClass(idStatus)}>{idMessage}</div>
        )}
      </div>

      {/* 비밀번호 */}
      <div className="formGroup">
        <label className="SignupformLabel PW" htmlFor="password">
          비밀번호
        </label>
        <div className="passwordInputContainer">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="SignupformInput"
            placeholder="최소 8자"
            required
            autoComplete="new-password"
            disabled={isSubmitting || isIdChecking || isAuthCodeVerifying}
          />
          <button
            type="button"
            className="SignuppasswordToggleButton"
            onClick={() => setShowPassword(!showPassword)}
            onMouseDown={(e) => e.preventDefault()}
            tabIndex={-1}
            aria-hidden="true"
            disabled={isSubmitting || isIdChecking || isAuthCodeVerifying}
          >
            {showPassword ? (
              <img src={EyeActive} alt="hide Password" />
            ) : (
              <img src={Eye} alt="show Password" />
            )}
          </button>
        </div>
      </div>

      {/* 비밀번호 확인 */}
      <div className="formGroup">
        <label className="SignupformLabel PW" htmlFor="passwordConfirm">
          비밀번호 확인
        </label>
        <div className="passwordInputContainer">
          <input
            id="passwordConfirm"
            type={showPasswordConfirm ? 'text' : 'password'}
            name="passwordConfirm"
            value={formData.passwordConfirm}
            onChange={handleChange}
            className="SignupformInput"
            placeholder="비밀번호 다시 입력"
            required
            autoComplete="new-password"
            disabled={isSubmitting || isIdChecking || isAuthCodeVerifying}
          />
          <button
            type="button"
            className="SignuppasswordToggleButton"
            onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
            onMouseDown={(e) => e.preventDefault()}
            tabIndex={-1}
            aria-hidden="true"
            disabled={isSubmitting || isIdChecking || isAuthCodeVerifying}
          >
            {showPasswordConfirm ? (
              <img src={EyeActive} alt="hide Password" />
            ) : (
              <img src={Eye} alt="show Password" />
            )}
          </button>
        </div>
      </div>

      {/* 인증코드 */}
      <div className="formGroup">
        <label className="SignupformLabel ID" htmlFor="authCode">
          인증코드
        </label>
        <div className="input-with-button-group">
          <input
            id="authCode"
            type="text"
            name="authCode"
            value={formData.authCode}
            onChange={handleChange}
            className="SignupformInput"
            placeholder="인증코드 입력"
            required
            autoComplete="one-time-code"
            inputMode="text"
            disabled={isSubmitting || isIdChecking || isAuthCodeVerifying}
          />
          <button
            type="button"
            onClick={handleAuthCodeVerification}
            disabled={isSubmitting || isAuthCodeVerifying || !formData.authCode}
            className={`valid-checking ${isAuthCodeVerifying ? 'loading' : ''}`}
          >
            {isAuthCodeVerifying ? '확인 중...' : '인증'}
          </button>
        </div>
        {authCodeMessage && (
          <div className={getStatusClass(authCodeStatus)}>
            {authCodeMessage}
          </div>
        )}
      </div>

      {/* 약관 동의 */}
      <div className="formGroup">
        <input
          type="checkbox"
          id="agreedToTerms"
          checked={agreedToTerms}
          onChange={() => setAgreedToTerms(!agreedToTerms)}
          disabled={isSubmitting || isIdChecking || isAuthCodeVerifying}
          className="agreewithtermsCheckbox"
        />
        <label htmlFor="agreedToTerms" className="agreewithterms">
          Stech
          <a
            href="https://calico-mass-cad.notion.site/Stech-Pro-24d7c5431d5d80eab2dfe595b3fac4eb"
            className="terms-link"
            target="_blank"
          >
            {' '}
            이용 약관
          </a>{' '}
          및
          <a
            href="https://calico-mass-cad.notion.site/Stech-Pro-24d7c5431d5d8022936be7a2894849f0"
            className="terms-link"
            target="_blank"
          >
            {' '}
            개인정보 보호정책
          </a>
          에 동의합니다.
        </label>
      </div>

      {error && <div className="errorMessage">⚠️ {error}</div>}

      <button
        type="submit"
        disabled={isSubmitButtonDisabled}
        className={`SignupsubmitButton ${isSubmitting ? 'loading' : ''}`}
      >
        {isSubmitting ? '회원가입 중...' : '회원가입'}
      </button>

      <div className="divider-container">
        <div className="divider" />
        <span className="divider-text">or</span>
        <div className="divider" />
      </div>

      <div className="social-buttons-container">
        <button
          type="button"
          className="socialButton google-button"
          disabled={isSubmitting}
        >
          <img src={Google} alt="google" className="socialicon" />
          구글로 회원가입
        </button>
        <button
          type="button"
          className="socialButton kakao-button"
          disabled={isSubmitting}
        >
          <img src={Kakao} alt="kakao" className="socialicon" />
          카카오로 회원가입
        </button>
      </div>
    </form>
  );
};

export default SignupForm;
