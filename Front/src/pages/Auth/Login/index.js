// src/pages/Auth/Login/index.js
import { Link } from 'react-router-dom';
import LoginForm from '../../../components/LoginForm';
import './AuthForm.css';
import './index.css';

const LoginPage = () => {
  return (
    <div className="loginPage">
      <div className="loginPageContainer">
        <div className="formSection">
          <div className="formContainer">
            <div className="formHeader">
              <h2 className="formTitle">Login</h2>
            </div>

            <LoginForm />

            {/* 회원가입 링크 */}
            <div className="switchForm">
              <p className="switchText">
                Not a member yet?{' '}
                <Link to="/auth/signup" className="switchLink">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <footer className="loginPageFooter">
        <div className="footerContent">
          <p>&copy; 2025 STECH. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;