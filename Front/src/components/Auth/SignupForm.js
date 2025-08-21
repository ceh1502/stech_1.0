import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Kakao from '../../assets/images/png/AuthPng/Kakao.png';
import Google from '../../assets/images/png/AuthPng/Google.png';
import Eye from '../../assets/images/png/AuthPng/Eye.png';
import EyeActive from '../../assets/images/png/AuthPng/EyeActive.png';


const SignupForm = ({ onSuccess, className = '' }) => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        id: '',
        password: '',
        passwordConfirm: '',
        authCode: '',
    });
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [isidChecking, setIsidChecking] = useState(false);
    const [isAuthCodeVerifying, setIsAuthCodeVerifying] = useState(false);

    const [idStatus, setidStatus] = useState(null);
    const [idMessage, setidMessage] = useState('');
    const [authCodeStatus, setAuthCodeStatus] = useState(null);
    const [authCodeMessage, setAuthCodeMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        if (error) setError(null);
    };

    const handleidCheck = async () => {
        if (!formData.id) {
            setidStatus('idle');
            setidMessage('아이디를 입력해주세요.');
            return;
        }

        const idRegex = /^[a-zA-Z0-9]+$/;
        if (!idRegex.test(formData.id)) {
            setidStatus('unavailable');
            setidMessage('영어 및 숫자 조합만 입력해주세요.');
            return;
        }        

        setidStatus('checking');
        setidMessage('');
        setIsidChecking(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (formData.id === 'test') {
                setidStatus('unavailable');
                setidMessage('중복된 아이디입니다.');
            } else {
                setidStatus('available');
                setidMessage('사용 가능한 아이디입니다.');
            }
        } catch (err) {
            setidStatus('invalid');
            setidMessage('아이디 확인 중 오류가 발생했습니다.');
        } finally {
            setIsidChecking(false);
        }
    };

    const handleAuthCodeVerification = async () => {
        if (!formData.authCode) {
            setAuthCodeStatus('idle');
            setAuthCodeMessage('인증코드를 입력해주세요.');
            return;
        }

        setAuthCodeStatus('verifying');
        setAuthCodeMessage('');
        setIsAuthCodeVerifying(true);

        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            if (formData.authCode === '123123') {
                setAuthCodeStatus('valid');
                setAuthCodeMessage('유효한 인증코드입니다.');
            } else {
                setAuthCodeStatus('invalid');
                setAuthCodeMessage('유효하지 않은 인증코드입니다.');
            }
        } catch (err) {
            setAuthCodeStatus('invalid');
            setAuthCodeMessage('인증코드 확인 중 오류가 발생했습니다.');
        } finally {
            setIsAuthCodeVerifying(false);
        }
    };

    const validateForm = () => {
        if (!formData.id || !formData.password || !formData.passwordConfirm || !formData.authCode) {
            setError('모든 필수 항목을 입력해주세요.');
            return false;
        }
        if (formData.password.length < 8) {
            setError('비밀번호를 8글자 이상 입력해주세요.');
            return false;
        }
        if (formData.password !== formData.passwordConfirm) {
            setError('비밀번호가 일치하지 않습니다.');
            return false;
        }
        if (!agreedToTerms) {
            setError('이용 약관 및 개인정보 보호정책에 동의해야 합니다.');
            return false;
        }
        if (idStatus !== 'available') {
            setError('아이디 중복 확인이 필요합니다.');
            return false;
        }
        if (authCodeStatus !== 'valid') {
            setError('인증코드 확인이 필요합니다.');
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
            console.log('회원가입 시도:', formData);
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            console.log('Signup Successful!');
            if (onSuccess) {
                onSuccess();
            }
            navigate('../signupprofile')
        } catch (err) {
            console.error('Signup Error:', err);
            setError('예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isSubmitButtonDisabled = isSubmitting || idStatus !== 'available' || authCodeStatus !== 'valid' || !agreedToTerms;

    const getStatusClass = (status) => {
        if (status === 'available' || status === 'valid') return 'status-message status-success';
        if (status === 'unavailable' || status === 'invalid') return 'status-message status-error';
        return 'status-message';
    };

    return (
        <form onSubmit={handleSubmit} className={`signupForm ${className}`}>
            <div className="tab-container">
                <a href="/auth" className="signupTitle">로그인</a>
                <button type="button" className="signupTitleTosignup">회원가입</button>
            </div>

            <div className="formGroup">
                <label className="SignupformLabel ID" htmlFor="id">아이디</label>
                <div className="input-with-button-group">
                    <input
                        type="text"
                        name="id"
                        value={formData.id}
                        onChange={handleChange}
                        className="SignupformInput"
                        placeholder=""
                        required
                        autoComplete="id"
                        disabled={isSubmitting || isidChecking || isAuthCodeVerifying}
                    />
                    <button
                        type="button"
                        onClick={handleidCheck}
                        disabled={isSubmitting || isidChecking || !formData.id}
                        className={`valid-checking ${isidChecking ? 'loading' : ''}`}
                    >
                        {isidChecking ? '확인 중...' : '중복 확인'}
                    </button>
                </div>
                {idMessage && (
                    <div className={getStatusClass(idStatus)}>
                        {idMessage}
                    </div>
                )}
            </div>

            <div className="formGroup">
                <label className="SignupformLabel PW" htmlFor="password">
                    비밀번호
                </label>
                <div className="passwordInputContainer">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="SignupformInput"
                        placeholder="최소 8자"
                        required
                        autoComplete="new-password"
                        disabled={isSubmitting || isidChecking || isAuthCodeVerifying}
                    />
                    <button
                        type="button"
                        className="SignuppasswordToggleButton"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isSubmitting || isidChecking || isAuthCodeVerifying}
                    >
                        {showPassword ? (
                            <img src={EyeActive} alt="hide Password" />
                        ) : (
                            <img src={Eye} alt="show Password" />
                        )}
                    </button>
                </div>
            </div>

            <div className="formGroup">
                <label className="SignupformLabel PW" htmlFor="passwordConfirm">
                    비밀번호 확인
                </label>
                <div className="passwordInputContainer">
                    <input
                        type={showPasswordConfirm ? 'text' : 'password'}
                        name="passwordConfirm"
                        value={formData.passwordConfirm}
                        onChange={handleChange}
                        className="SignupformInput"
                        placeholder="비밀번호 다시 입력"
                        required
                        autoComplete="new-password"
                        disabled={isSubmitting || isidChecking || isAuthCodeVerifying}
                    />
                    <button
                        type="button"
                        className="SignuppasswordToggleButton"
                        onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                        disabled={isSubmitting || isidChecking || isAuthCodeVerifying}
                    >
                        {showPasswordConfirm ? (
                            <img src={EyeActive} alt="hide Password" />
                        ) : (
                            <img src={Eye} alt="show Password" />
                        )}
                    </button>
                </div>
            </div>

            <div className="formGroup">
                <label className="SignupformLabel ID" htmlFor="authCode">인증코드</label>
                <div className="input-with-button-group">
                    <input
                        type="text"
                        name="authCode"
                        value={formData.authCode}
                        onChange={handleChange}
                        className="SignupformInput"
                        placeholder="인증코드 입력"
                        required
                        disabled={isSubmitting || isidChecking || isAuthCodeVerifying}
                    />
                    <button
                        type="button"
                        onClick={handleAuthCodeVerification}
                        disabled={isSubmitting || isAuthCodeVerifying || !formData.authCode}
                        className={`valid-checking ${isAuthCodeVerifying ? 'loading' : ''}`}
                    >
                        {isAuthCodeVerifying ? '확인 중...' : '인증'}
                    </button>
                </div>
                {authCodeMessage && (
                    <div className={getStatusClass(authCodeStatus)}>
                        {authCodeMessage}
                    </div>
                )}
            </div>

            <div className="formGroup">
                <input
                    type="checkbox"
                    id="agreedToTerms"
                    checked={agreedToTerms}
                    onChange={() => setAgreedToTerms(!agreedToTerms)}
                    disabled={isSubmitting || isidChecking || isAuthCodeVerifying}
                    className="agreewithtermsCheckbox"
                />
                <label htmlFor="agreedToTerms" className="agreewithterms">
                    Stech
                    <a href="https://calico-mass-cad.notion.site/Stech-Pro-24d7c5431d5d80eab2dfe595b3fac4eb" className="terms-link"> 이용 약관</a> 및 <a href="https://calico-mass-cad.notion.site/Stech-Pro-24d7c5431d5d8022936be7a2894849f0" className="terms-link">개인정보 보호정책</a>에 동의합니다.
                </label>
            </div>

            {error && <div className="errorMessage">⚠️ {error}</div>}

            <button
                type="submit"
                disabled={isSubmitButtonDisabled}
                className={`SignupsubmitButton ${isSubmitting ? 'loading' : ''}`}
            >
                {isSubmitting ? '회원가입 중...' : '회원가입'}
            </button>

            <div className="divider-container">
                <div className="divider"></div>
                <span className="divider-text">or</span>
                <div className="divider"></div>
            </div>

            <div className="social-buttons-container">
                <button type="button" className="socialButton google-button">
                    <img src={Google} alt="google" className="socialicon" />
                    구글로 회원가입
                </button>
                <button type="button" className="socialButton kakao-button">
                    <img src={Kakao} alt="kakao" className="socialicon" />
                    카카오로 회원가입
                </button>
            </div>
        </form>
    );
};

export default SignupForm;
