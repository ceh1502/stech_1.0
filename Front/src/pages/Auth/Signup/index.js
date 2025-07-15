// src/pages/Auth/Signup/index.js
import { Link } from 'react-router-dom';
import SignupForm from '../../../components/SignupForm';
import './AuthForm.css';
import './index.css';

const SignupPage = () => {
    return (
        <div className="signupPage">
            <div className="signupPageContainer">
                <div className="formSection">
                    <div className="formContainer">
                        <div className="formHeader">
                            <h2 className="formTitle">Sign Up</h2>
                        </div>
                        <div style={{ padding: '0 0 20px 0' }}>
                            <SignupForm />
                        </div>
                        {/* 로그인 링크 */}
                        <div className="switchForm">
                            <p className="switchText">
                                <div style={{ padding: '0 0 10px 0', textweight: '700', textAlign: 'center', margin: '10px 0 0 0' }}>Already have an account?</div>
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
                        <a href="/privacy" className="footerLink">
                            개인정보처리방침
                        </a>
                        <a href="/terms" className="footerLink">
                            이용약관
                        </a>
                        <a href="/support" className="footerLink">
                            고객지원
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default SignupPage;
