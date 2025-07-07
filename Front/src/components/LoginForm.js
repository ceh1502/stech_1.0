// components/LoginForm.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginForm = ({ onSwitchToRegister }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const { login, loading, error, clearError } = useAuth();

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
    
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      console.log('로그인 성공!');
      // 성공 후 추가 로직 (라우팅 등)
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">로그인</h2>
      
      <form onSubmit={handleSubmit} className="login-form">
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
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className={`submit-button ${loading ? 'loading' : ''}`}
        >
          {loading ? '로그인 중...' : '로그인'}
        </button>
      </form>
      
      <div className="switch-form">
        <button
          onClick={onSwitchToRegister}
          className="switch-button"
        >
          계정이 없으신가요? 회원가입
        </button>
      </div>
    </div>
  );
};

export default LoginForm;