// src/components/Auth/SignupForm.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const SignupForm = ({ 
  onSuccess, 
  showAgreements = true,
  autoLoginAfterSignup = true,
  redirectPath = '/service',
  className = ''
}) => {
  const [formData, setFormData] = useState({
    firstName:'',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [agreements, setAgreements] = useState({
    termsOfService: false,
    privacyPolicy: false,
    allAgreed: false
  });

  const [uiState, setUiState] = useState({
    showPassword: false,
    showConfirmPassword: false,
    isSubmitting: false
  });

  const [passwordValidation, setPasswordValidation] = useState({
    isValid: false,
    rules: {
      length: false,
      number: false,
      specialChar: false,
    }
  });

  const { signup, loading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // 로그인 성공시 리다이렉트
  useEffect(() => {
    if (isAuthenticated && autoLoginAfterSignup) {
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(redirectPath);
      }
    }
  }, [isAuthenticated, navigate, redirectPath, onSuccess, autoLoginAfterSignup]);

  // 비밀번호 유효성 검사
  useEffect(() => {
    const password = formData.password;
    const rules = validatePassword(password);
    const isValid = Object.values(rules).every(Boolean);
    
    setPasswordValidation({ isValid, rules });
  }, [formData.password]);

  // 비밀번호 검증 함수
  const validatePassword = (password) => {
    return {
      length: password.length >= 8 && password.length <= 30,
      number: /[0-9]/.test(password),
      specialChar: /[!@#$%^&*()_+[\]{};':"\\|,.<>/?`~-]/.test(password),
    };
  };

  // 폼 데이터 변경 핸들러
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (error) clearError();
  };

  // UI 상태 변경 핸들러
  const togglePasswordVisibility = (field) => {
    setUiState(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // 약관 동의 핸들러
  const handleAgreementChange = (e) => {
    const { name, checked } = e.target;
    
    if (name === 'allAgreed') {
      setAgreements({
        termsOfService: checked,
        privacyPolicy: checked,
        allAgreed: checked
      });
    } else {
      setAgreements(prev => {
        const newAgreements = { ...prev, [name]: checked };
        newAgreements.allAgreed = 
          newAgreements.termsOfService && 
          newAgreements.privacyPolicy;
        return newAgreements;
      });
    }
  };

  // 폼 유효성 검사
  const validateForm = () => {
    const { firstName, lastName, email, password, confirmPassword } = formData;

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
      alert('Please fill in all required fields.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address.');
      return false;
    }

    if (!passwordValidation.isValid) {
      alert('Please meet all password requirements.');
      return false;
    }

    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return false;
    }

    if (showAgreements && (!agreements.termsOfService || !agreements.privacyPolicy)) {
      alert('Please agree to the required terms and policies.');
      return false;
    }

    return true;
  };

  // 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setUiState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const signupData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password
      };

      if (showAgreements) {
        signupData.agreements = {
          termsOfService: agreements.termsOfService,
          privacyPolicy: agreements.privacyPolicy,
          marketingConsent: agreements.marketingConsent
        };
      }

      const result = await signup(signupData);
      
      if (result.success) {
        console.log('Signup Succesful!');
        
        if (onSuccess) {
          onSuccess(result);
        } else if (!autoLoginAfterSignup || !result.autoLogin) {
          navigate('/auth');
        }
      }
    } catch (err) {
      console.error('Signup Error:', err);
    } finally {
      setUiState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // 비밀번호 검증 규칙 렌더링
  const renderPasswordRules = () => {
    const rulesList = [
      { key: 'length', label: '8 to 30 characters' },
      { key: 'number', label: 'At least one number' },
      { key: 'specialChar', label: 'At least one special character' },
    ];

    return (
      <div className={`passwordRules ${passwordValidation.isValid ? 'allValid' : ''}`}>
        {rulesList.map(({ key, label }) => (
          <div 
            key={key}
            className={`passwordRule ${passwordValidation.rules[key] ? 'valid' : 'invalid'}`}
          >
            <span className="ruleIcon">
              {passwordValidation.rules[key] ? '✅' : '❌'}
            </span>
            <span className="ruleText">{label}</span>
          </div>
        ))}
      </div>
    );
  };

  // 약관 동의 섹션 렌더링
  const renderAgreementSection = () => {
    const agreementItems = [
      { key: 'termsOfService', label: 'Agree to Terms of Service', required: true, url: '/terms-of-service' },
      { key: 'privacyPolicy', label: 'Agree to Privacy Policy', required: true, url: '/privacy-policy' },
    ];

    return (
      <div className="agreementSection">
        <h3 className="agreementTitle">Terms Agreement</h3>
        
        {/* 전체 동의 */}
        <div className="agreementItem allAgreement">
          <label className="agreementLabel">
            <input
              type="checkbox"
              name="allAgreed"
              checked={agreements.allAgreed}
              onChange={handleAgreementChange}
              className="agreementCheckbox"
              disabled={isFormLoading}
            />
            <span className="checkmark"></span>
            <span className="agreementText">Agree to ALL</span>
          </label>
        </div>

        <div className="agreementDivider"></div>

        {/* 개별 약관 */}
        {agreementItems.map(({ key, label, required, url }) => (
          <div key={key} className="agreementItem">
            <label className="agreementLabel">
              <input
                type="checkbox"
                name={key}
                checked={agreements[key]}
                onChange={handleAgreementChange}
                className="agreementCheckbox"
                disabled={isFormLoading}
              />
              <span className="checkmark"></span>
              <span className="agreementText">
                <span className={required ? 'required' : 'optional'}>
                  [{required ? '필수' : '선택'}]
                </span> {label}
              </span>
            </label>
            <button 
              type="button" 
              className="viewTermsButton"
              onClick={() => window.open(url, '_blank')}
              disabled={isFormLoading}
            >
              view
            </button>
          </div>
        ))}
      </div>
    );
  };

  // 계산된 상태값들
  const isFormLoading = loading || uiState.isSubmitting;
  const isRequiredAgreementsValid = showAgreements 
    ? (agreements.termsOfService && agreements.privacyPolicy)
    : true;
  const isPasswordMatch = formData.confirmPassword && 
    formData.password === formData.confirmPassword;
  const isPasswordMismatch = formData.confirmPassword && 
    formData.password !== formData.confirmPassword;

  return (
    <form onSubmit={handleSubmit} className={`signupForm ${className}`}>
      {/* First Name */}
      <div className="formGroup">
        <label className="formLabel">First Name</label>
        <input
          type="text"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          className="formInput"
          placeholder="John"
          required
          disabled={isFormLoading}
        />
      </div>

      {/* 이름 입력 */}
      <div className="formGroup">
        <label className="formLabel">Last Name</label>
        <input
          type="text"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          className="formInput"
          placeholder="Doe"
          required
          disabled={isFormLoading}
        />
      </div>

      {/* 이메일 입력 */}
      <div className="formGroup">
        <label className="formLabel">Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="formInput"
          placeholder="example@email.com"
          required
          autoComplete="email"
          disabled={isFormLoading}
        />
      </div>
      
      {/* 비밀번호 입력 */}
      <div className="formGroup">
        <label className="formLabel">Password</label>
        <div className="passwordInputContainer">
          <input
            type={uiState.showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="formInput"
            placeholder="Password"
            required
            disabled={isFormLoading}
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('showPassword')}
            className="passwordToggleButton"
            tabIndex={-1}
            disabled={isFormLoading}
          >
            {uiState.showPassword ? '🙈' : '👁️'}
          </button>
        </div>
        
        {/* 비밀번호 검증 규칙 */}
        {formData.password && renderPasswordRules()}
      </div>
      
      {/* 비밀번호 확인 입력 */}
      <div className="formGroup">
        <label className="formLabel">Confirm Password</label>
        <div className="passwordInputContainer">
          <input
            type={uiState.showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`formInput ${isPasswordMismatch ? 'error' : ''}`}
            placeholder="Confirm Password"
            required
            disabled={isFormLoading}
          />
          <button
            type="button"
            onClick={() => togglePasswordVisibility('showConfirmPassword')}
            className="passwordToggleButton"
            tabIndex={-1}
            disabled={isFormLoading}
          >
            {uiState.showConfirmPassword ? '🙈' : '👁️'}
          </button>
        </div>
        
        {/* 비밀번호 일치 여부 표시 */}
        {formData.confirmPassword && (
          <div className={`passwordMatch ${isPasswordMatch ? 'match' : 'mismatch'}`}>
            {isPasswordMatch ? '✅ Passwords match' : '❌ Passwords do not match'}
          </div>
        )}
      </div>

      {/* 약관 동의 섹션 */}
      {showAgreements && renderAgreementSection()}
      
      {/* 에러 메시지 */}
      {error && (
        <div className="errorMessage">
          {error}
        </div>
      )}
      
      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isFormLoading || !isRequiredAgreementsValid || !passwordValidation.isValid}
        className={`submitButton signupButton ${isFormLoading ? 'loading' : ''} ${!isRequiredAgreementsValid || !passwordValidation.isValid ? 'disabled' : ''}`}
      >
        {isFormLoading ? 'Signing up...' : 'Sign up'}
      </button>
    </form>
  );
};

export default SignupForm;