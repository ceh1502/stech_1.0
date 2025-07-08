// src/components/Auth/SignupForm.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import TermsModal from './Auth/TermsModal';
import { PiEye, PiEyeClosed } from 'react-icons/pi';

const SignupForm = ({ 
  onSuccess, 
  showAgreements = true,
  autoLoginAfterSignup = true,
  redirectPath = '/service',
  className = ''
}) => {
  // 폼 데이터
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // 약관 동의 상태
  const [agreements, setAgreements] = useState({
    termsOfService: false,
    privacyPolicy: false,
    allAgreed: false
  });

  // UI 상태
  const [uiState, setUiState] = useState({
    showPassword: false,
    showConfirmPassword: false,
    isSubmitting: false
  });

  // 모달 상태
  const [modal, setModal] = useState({
    isOpen: false,
    termType: null
  });

  // 비밀번호 검증 상태
  const [passwordValidation, setPasswordValidation] = useState({
    isValid: false,
    rules: {
      length: false,
      number: false,
      specialChar: false
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
    if (!password) {
      return {
        length: false,
        number: false,
        specialChar: false
      };
    }
    
    return {
      length: password.length >= 8 && password.length <= 30,
      number: /[0-9]/.test(password),
      specialChar: /[!@#$%^&*()_+[\]{};':"\\|,.<>/?`~-]/.test(password)
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

  // 모달 관련 함수들
  const openModal = (termType) => {
    console.log('Opening modal for:', termType);
    setModal({
      isOpen: true,
      termType: termType
    });
  };

  const closeModal = () => {
    console.log('Closing modal');
    setModal({
      isOpen: false,
      termType: null
    });
  };

  const handleModalAgree = (termType) => {
    console.log('Modal agree for:', termType);
    setAgreements(prev => {
      const newAgreements = { ...prev, [termType]: true };
      newAgreements.allAgreed = 
        newAgreements.termsOfService && 
        newAgreements.privacyPolicy;
      return newAgreements;
    });
  };

  // 폼 유효성 검사
  const validateForm = () => {
    const { firstName, lastName, email, password, confirmPassword } = formData;

    console.log('=== Form Validation ===');
    console.log('Form Data:', {
      firstName: firstName ? 'OK' : 'MISSING',
      lastName: lastName ? 'OK' : 'MISSING',
      email: email ? 'OK' : 'MISSING',
      password: password ? 'OK' : 'MISSING',
      confirmPassword: confirmPassword ? 'OK' : 'MISSING'
    });

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
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
    console.log('Form submitted!');
    
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
          privacyPolicy: agreements.privacyPolicy
        };
      }

      console.log('Sending signup data:', signupData);

      const result = await signup(signupData);
      
      if (result.success) {
        console.log('Signup successful!');
        
        if (onSuccess) {
          onSuccess(result);
        } else if (!autoLoginAfterSignup || !result.autoLogin) {
          navigate('/auth');
        }
      }
    } catch (err) {
      console.error('Signup error:', err);
    } finally {
      setUiState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  // 계산된 상태들
  const isFormLoading = loading || uiState.isSubmitting;
  const isRequiredAgreementsValid = showAgreements 
    ? (agreements.termsOfService && agreements.privacyPolicy)
    : true;
  const isPasswordMatch = formData.confirmPassword && 
    formData.password === formData.confirmPassword;
  const isPasswordMismatch = formData.confirmPassword && 
    formData.password !== formData.confirmPassword;

  return (
    <>
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

        {/* Last Name */}
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

        {/* Email */}
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
        
        {/* Password */}
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
              {uiState.showPassword ? <PiEye className='eye'/> : <PiEyeClosed className='eye' />}
            </button>
          </div>
          
          {/* Password Rules */}
          {formData.password && (
            <div className={`passwordRules ${passwordValidation.isValid ? 'allValid' : ''}`}>
              <div className={`passwordRule ${passwordValidation.rules.length ? 'valid' : 'invalid'}`}>
                <span className="ruleIcon">{passwordValidation.rules.length ? '✅' : '❌'}</span>
                <span className="ruleText">8 to 30 characters</span>
              </div>
              <div className={`passwordRule ${passwordValidation.rules.number ? 'valid' : 'invalid'}`}>
                <span className="ruleIcon">{passwordValidation.rules.number ? '✅' : '❌'}</span>
                <span className="ruleText">At least one number</span>
              </div>
              <div className={`passwordRule ${passwordValidation.rules.specialChar ? 'valid' : 'invalid'}`}>
                <span className="ruleIcon">{passwordValidation.rules.specialChar ? '✅' : '❌'}</span>
                <span className="ruleText">At least one special character</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Confirm Password */}
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
            </button>
          </div>
          
          {/* Password Match Status */}
          {formData.confirmPassword && (
            <div className={`passwordMatch ${isPasswordMatch ? 'match' : 'mismatch'}`}>
              {isPasswordMatch ? '✅ Passwords match' : '❌ Passwords do not match'}
            </div>
          )}
        </div>

        {/* Terms Agreement */}
        {showAgreements && (
          <div className="agreementSection">
            <h3 className="agreementTitle">Terms Agreement</h3>
            
            {/* All Agreement */}
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

            {/* Terms of Service */}
            <div className="agreementItem">
              <label className="agreementLabel">
                <input
                  type="checkbox"
                  name="termsOfService"
                  checked={agreements.termsOfService}
                  onChange={handleAgreementChange}
                  className="agreementCheckbox"
                  disabled={isFormLoading}
                />
                <span className="checkmark"></span>
                <span className="agreementText">
                  <span className="required">[Required]</span> Agree to Terms of Service
                </span>
              </label>
              <button 
                type="button" 
                className="viewTermsButton"
                onClick={() => openModal('termsOfService')}
                disabled={isFormLoading}
              >
                view
              </button>
            </div>

            {/* Privacy Policy */}
            <div className="agreementItem">
              <label className="agreementLabel">
                <input
                  type="checkbox"
                  name="privacyPolicy"
                  checked={agreements.privacyPolicy}
                  onChange={handleAgreementChange}
                  className="agreementCheckbox"
                  disabled={isFormLoading}
                />
                <span className="checkmark"></span>
                <span className="agreementText">
                  <span className="required">[Required]</span> Agree to Privacy Policy
                </span>
              </label>
              <button 
                type="button" 
                className="viewTermsButton"
                onClick={() => openModal('privacyPolicy')}
                disabled={isFormLoading}
              >
                view
              </button>
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="errorMessage">
            {error}
          </div>
        )}
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isFormLoading || !isRequiredAgreementsValid || !passwordValidation.isValid || !isPasswordMatch}
          className={`submitButton signupButton ${isFormLoading ? 'loading' : ''}`}
        >
          {isFormLoading ? 'Signing up...' : 'Sign up'}
        </button>
      </form>

      {/* Terms Modal */}
      <TermsModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onAgree={handleModalAgree}
        termType={modal.termType}
        currentAgreement={modal.termType ? agreements[modal.termType] : false}
      />
    </>
  );
};

export default SignupForm;