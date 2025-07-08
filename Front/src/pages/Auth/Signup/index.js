// src/pages/Auth/Signup/index.js
import {  Link } from 'react-router-dom';
import SignupForm from '../../../components/SignupForm';
import './AuthForm.css';

const SignupPage = () => {
  return (
    <div className="signupPage">
      <div className="signupPageContainer">
        <div className="formSection">
          <div className="formContainer">
            <div className="formHeader">
              <h2 className="formTitle">Sign Up</h2>
            </div>

            <SignupForm />

            {/* 로그인 링크 */}
            <div className="switchForm">
              <p className="switchText">
                이미 계정이 있으신가요?{' '}
                <Link to="/auth" className="switchLink">
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 푸터 */}
      <footer className="signupPageFooter">
        <div className="footerContent">
          <p>&copy; 2025 STECH. All rights reserved.</p>
          <div className="footerLinks">
            <a href="/privacy" className="footerLink">개인정보처리방침</a>
            <a href="/terms" className="footerLink">이용약관</a>
            <a href="/support" className="footerLink">고객지원</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SignupPage;