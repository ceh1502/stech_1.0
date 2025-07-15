// src/pages/Auth/Login/index.js
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
