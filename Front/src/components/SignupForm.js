// components/RegisterForm.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const SignupForm = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const { signup, loading, error, clearError } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 입력시 에러 메시지 클리어
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    const result = await signup({
      name: formData.name,
      email: formData.email,
      password: formData.password
    });
    
    if (result.success) {
      console.log('회원가입 성공!');
      // onSwitchToLogin(); // 회원가입 후 로그인 페이지로 이동하거나
      // 자동 로그인 되었으면 여기서 추가 로직
    }
  };

  return (
    <div className="register-container">
      <h2 className="register-title">회원가입</h2>
      
      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <label className="form-label">
            이름
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">
            이메일
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">
            비밀번호
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">
            비밀번호 확인
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="form-input"
            required
          />
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className={`submit-button register-button ${loading ? 'loading' : ''}`}
        >
          {loading ? '회원가입 중...' : '회원가입'}
        </button>
      </form>
      
      <div className="switch-form">
        <button
          onClick={onSwitchToLogin}
          className="switch-button"
        >
          이미 계정이 있으신가요? 로그인
        </button>
      </div>
    </div>
  );
};

export default SignupForm;