// src/components/Auth/LoginForm.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';


const LoginForm = ({ 
  onSuccess, 
  showRememberMe = true, 
  showForgotPassword = true,
  redirectPath = '/service',
  className = '' 
}) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, loading, error, clearError, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // 로그인 성공시 리다이렉트 또는 콜백 실행
  useEffect(() => {
    if (isAuthenticated) {
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(redirectPath);
      }
    }
  }, [isAuthenticated, navigate, redirectPath, onSuccess]);

  // 저장된 이메일 불러오기 (Remember Me 기능)
  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 입력시 에러 메시지 클리어
    if (error) clearError();
  };

  const handleRememberMeChange = (e) => {
    setRememberMe(e.target.checked);
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      alert('Please enter both your email and password.');
      return false;
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const result = await login({
        email: formData.email,
        password: formData.password,
        rememberMe: rememberMe
      });

      if (result.success) {
        // Remember Me 기능
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        console.log('Login Succesful!', result.user);
        
        // 성공 콜백이 있으면 실행
        if (onSuccess) {
          onSuccess(result);
        }
      }
    } catch (err) {
      console.error('Login Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    navigate('/auth/find');
  };

  const isFormLoading = loading || isSubmitting;

  return (
    <form onSubmit={handleSubmit} className={`loginForm ${className}`}>
      <div className="formGroup">
        <label className="formLabel">
          Email
        </label>
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
      
      <div className="formGroup">
        <label className="formLabel">
          Password
        </label>
        <div className="passwordInputContainer">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="formInput"
            placeholder="Password"
            required
            autoComplete="current-password"
            disabled={isFormLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="passwordToggleButton"
            tabIndex={-1}
            disabled={isFormLoading}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      {/* Remember Me & Forgot Password */}
      {(showRememberMe || showForgotPassword) && (
        <div className="formOptions">
          {showRememberMe && (
            <label className="rememberMeLabel">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={handleRememberMeChange}
                className="rememberCheckbox"
                disabled={isFormLoading}
              />
              <span className="rememberText">Remember me</span>
            </label>
          )}
          
          {showForgotPassword && (
            <button
              type="button"
              onClick={handleForgotPassword}
              className="forgotPasswordButton"
              disabled={isFormLoading}
            >
              Forgot Password
            </button>
          )}
        </div>
      )}
      
      {error && (
        <div className="errorMessage">
          {error}
        </div>
      )}
      
      <button
        type="submit"
        disabled={isFormLoading}
        className={`submitButton loginButton ${isFormLoading ? 'loading' : ''}`}
      >
        {isFormLoading ? '로그인 중...' : '로그인'}
      </button>
    </form>
  );
};

export default LoginForm;