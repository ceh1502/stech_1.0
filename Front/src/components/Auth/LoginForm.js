import React, { useState } from 'react';
import Kakao from '../../assets/images/png/AuthPng/Kakao.png';
import Google from '../../assets/images/png/AuthPng/Google.png';
import Eye from '../../assets/images/png/AuthPng/Eye.png';
import EyeActive from '../../assets/images/png/AuthPng/EyeActive.png';


const LoginForm = ({ onSuccess, showForgotPassword = true, className = '' }) => {
    const [formData, setFormData] = useState({
        id: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (error) setError(null);
    };

    const validateForm = () => {
        if (!formData.id || !formData.password) {
            setError('아이디와 비밀번호 모두 입력해주세요.');
            return false;
        }
        const idRegex = /^[a-zA-Z0-9]+$/;
        if (!idRegex.test(formData.id)) {
            setError('존재하지 않는 아이디입니다.');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;
        setIsSubmitting(true);
        setError(null);

        try {
            console.log('로그인 시도:', formData);
            const success = true;
            if (success) {
                console.log('Login Successful!');
                if (onSuccess) {
                    onSuccess();
                }
            } else {
                setError('Login failed. Please check your credentials.');
            }
        } catch (err) {
            console.error('Login Error:', err);
            setError('An unexpected error occurred. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormLoading = isSubmitting;

    return (
        <form onSubmit={handleSubmit} className={`loginForm ${className}`}>
            <div className="tab-container">
                <button type="button" className="loginTitle">로그인</button>
                <a href="/auth/signup" type="button" className="loginTitleTosignup">회원가입</a>
            </div>

            <div className="formGroup">
                <label className="LoginformLabel ID" htmlFor="id">아이디</label>
                <input
                    type="text"
                    name="id"
                    value={formData.id}
                    onChange={handleChange}
                    className="LoginformInput"
                    required
                    autoComplete="id"
                    disabled={isFormLoading}
                />
            </div>

            <div className="formGroup">
                <label className="LoginformLabel PW" htmlFor="password">
                    비밀번호
                    {showForgotPassword && (
                        <a href="auth/find" onClick={() => console.log('Forgot password clicked')} className="forgotPasswordLink">비밀번호 찾기</a>
                    )}
                </label>
                <div className="passwordInputContainer">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="LoginformInput"
                        required
                        autoComplete="current-password"
                        disabled={isFormLoading}
                    />
                    <button
                        type="button"
                        className="LoginpasswordToggleButton"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isFormLoading}
                    >
                        {showPassword ? (
                            <img src={EyeActive} alt="showPassword" className="showPassword" />
                        ) : (
                            <img src={Eye} alt="showPassword" className="showPasswordActive" />
                        )}
                    </button>
                </div>
            </div>


            {error && <div className="errorMessage">⚠️ {error}</div>}

            <button
                type="submit"
                disabled={isFormLoading}
                className={`LoginsubmitButton ${isFormLoading ? 'loading' : ''}`}
            >
                {isFormLoading ? 'Loading...' : '로그인'}
            </button>

            <div className="divider-container">
                <div className="divider"></div>
                <span className="divider-text">or</span>
                <div className="divider"></div>
            </div>

            <div className="social-buttons-container">
                <button type="button" className="socialButton google-button">
                    <img src={Google} alt="google" className="socialicon" />
                    구글로 로그인
                </button>
                <button type="button" className="socialButton kakao-button">
                    <img src={Kakao} alt="kakao" className="socialicon" />
                    카카오로 로그인
                </button>
            </div>
        </form>
    );
};

export default LoginForm;
