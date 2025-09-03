// src/components/Auth/SignupForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamCodes } from '../../data/teamCodes';
import { checkUsername, verifyTeamCode, signup, handleAuthError } from '../../api/authAPI';


// --- image assets ---
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
  const [idStatus, setIdStatus] = useState(null); // 'available' | 'unavailable' | 'invalid' | 'checking' | 'idle'
  const [idMessage, setIdMessage] = useState('');

  const [isAuthCodeVerifying, setIsAuthCodeVerifying] = useState(false);
  const [authCodeStatus, setAuthCodeStatus] = useState(null); // 'valid' | 'invalid' | 'verifying' | 'idle'
  const [authCodeMessage, setAuthCodeMessage] = useState('');

  const [validatedTeamInfo, setValidatedTeamInfo] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // 혹시 name="id"로 온 경우를 대비한 안전장치
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

    // 영문/숫자만 허용 (필요하면 길이 제한 추가)
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
      const res = await checkUsername(username); // { available: boolean }
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
      const res = await verifyTeamCode(formData.authCode); // { valid: boolean }
      if (res.valid) {
        // 팀 정보는 로컬 매핑에서 찾아 자동 세팅(없으면 수동입력 필요)
        const info = teamCodes[formData.authCode] || null;
        setValidatedTeamInfo(info);

        if (info) {
          setAuthCodeStatus('valid');
          const roleText = info.role === 'coach' ? 'coach' : 'player';
          setAuthCodeMessage(`인증 완료: ${info.team} (${roleText})`);
        } else {
          setAuthCodeStatus('valid');
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

    // 팀 정보 필수(백엔드 요구사항)
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
      if (onSuccess) onSuccess();
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
    <form onSubmit={handleSubmit} className={`signupForm ${className}`}>
      <div className="tab-container">
        <a href="/auth" className="signupTitle">로그인</a>
        <button type="button" className="signupTitleTosignup">회원가입</button>
      </div>

      {/* 아이디 */}
      <div className="formGroup">
        <label className="SignupformLabel ID" htmlFor="username">아이디</label>
        <div className="input-with-button-group">
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="SignupformInput"
            placeholder=""
            required
            autoComplete="username"
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
        {idMessage && <div className={getStatusClass(idStatus)}>{idMessage}</div>}
      </div>

      {/* 비밀번호 */}
      <div className="formGroup">
        <label className="SignupformLabel PW" htmlFor="password">비밀번호</label>
        <div className="passwordInputContainer">
          <input
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
            disabled={isSubmitting || isIdChecking || isAuthCodeVerifying}
          >
            {showPassword ? <img src={EyeActive} alt="hide Password" /> : <img src={Eye} alt="show Password" />}
          </button>
        </div>
      </div>

      {/* 비밀번호 확인 */}
      <div className="formGroup">
        <label className="SignupformLabel PW" htmlFor="passwordConfirm">비밀번호 확인</label>
        <div className="passwordInputContainer">
          <input
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
            disabled={isSubmitting || isIdChecking || isAuthCodeVerifying}
          >
            {showPasswordConfirm ? <img src={EyeActive} alt="hide Password" /> : <img src={Eye} alt="show Password" />}
          </button>
        </div>
      </div>

      {/* 인증코드 */}
      <div className="formGroup">
        <label className="SignupformLabel ID" htmlFor="authCode">인증코드</label>
        <div className="input-with-button-group">
          <input
            type="text"
            name="authCode"
            value={formData.authCode}
            onChange={handleChange}
            className="SignupformInput"
            placeholder="인증코드 입력"
            required
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
          <div className={getStatusClass(authCodeStatus)}>{authCodeMessage}</div>
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
          <a href="https://calico-mass-cad.notion.site/Stech-Pro-24d7c5431d5d80eab2dfe595b3fac4eb" className="terms-link"> 이용 약관</a> 및
          <a href="https://calico-mass-cad.notion.site/Stech-Pro-24d7c5431d5d8022936be7a2894849f0" className="terms-link"> 개인정보 보호정책</a>
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
        <button type="button" className="socialButton google-button">
          <img src={Google} alt="google" className="socialicon" />
          구글로 회원가입
        </button>
        <button type="button" className="socialButton kakao-button">
          <img src={Kakao} alt="kakao" className="socialicon" />
          카카오로 회원가입
        </button>
      </div>
    </form>
  );
};

export default SignupForm;
