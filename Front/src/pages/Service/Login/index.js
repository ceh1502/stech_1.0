// pages/Service/Login/index.js
import React, { useState } from 'react';
import { useAuth, AuthProvider } from '../../../context/AuthContext';
import LoginForm from '../../../components/LoginForm';
import RegisterForm from '../../../components/RegisterForm';

const LoginPageContent = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated, loading } = useAuth();

  // 로딩 중일 때
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="spinner"></div>
          <p className="loading-text">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 이미 로그인된 경우 메인 페이지로 리다이렉트
  if (isAuthenticated) {
    // React Router 사용시: navigate('/dashboard')
    window.location.href = '/dashboard';
    return null;
  }

  return (
    <div className="login-page">
      <div className="login-page-container">
        {isLogin ? (
          <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
        )}
      </div>
    </div>
  );
};

// AuthProvider로 감싸서 export
const LoginPage = () => {
  return (
    <AuthProvider>
      <LoginPageContent />
    </AuthProvider>
  );
};

export default LoginPage;