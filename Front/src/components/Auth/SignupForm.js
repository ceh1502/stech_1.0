import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamCodes } from '../../data/teamCodes'; // Adjust the import path as needed

// --- Import your image assets as before ---
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

    // --- Other state variables remain the same ---
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

    // ✨ NEW: State to store validated team information
    const [validatedTeamInfo, setValidatedTeamInfo] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        
        // Reset validation status when user types in the field again
        if (name === 'id') {
            setidStatus(null);
            setidMessage('');
        }
        if (name === 'authCode') {
            setAuthCodeStatus(null);
            setAuthCodeMessage('');
            setValidatedTeamInfo(null); // Clear validated info
        }
        if (error) setError(null);
    };

    const handleidCheck = async () => {
        // ... (This function remains unchanged)
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

    // ✨ MODIFIED: Auth code verification logic
    const handleAuthCodeVerification = async () => {
        if (!formData.authCode) {
            setAuthCodeStatus('idle');
            setAuthCodeMessage('인증코드를 입력해주세요.');
            return;
        }

        setAuthCodeStatus('verifying');
        setAuthCodeMessage('');
        setIsAuthCodeVerifying(true);
        setValidatedTeamInfo(null); // Reset on each attempt

        try {
            await new Promise(resolve => setTimeout(resolve, 500)); // Shorter delay is fine
            
            const teamInfo = teamCodes[formData.authCode]; // Lookup the code

            if (teamInfo) {
                setAuthCodeStatus('valid');
                const roleText = teamInfo.role === 'coach' ? '코치' : '선수';
                setAuthCodeMessage(`인증 완료: ${teamInfo.team} (${roleText})`);
                setValidatedTeamInfo(teamInfo); // Store the retrieved team info
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
        // ... (This function remains unchanged)
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

    // ✨ MODIFIED: Prepare data for the backend
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        setError(null);

        // This is the complete data package to send to your backend
        const submissionData = {
            id: formData.id,
            password: formData.password,
            teamInfo: validatedTeamInfo, // Send the full team info object
        };

        try {
            console.log('회원가입 요청 (백엔드로 보낼 데이터):', submissionData);

            // Replace this mock API call with your actual fetch/axios request
            // For example: await axios.post('/api/signup', submissionData);
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            console.log('Signup Successful!');
            if (onSuccess) {
                onSuccess();
            }
            navigate('../signupprofile');
        } catch (err) {
            console.error('Signup Error:', err);
            setError('예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // ... (The rest of your JSX remains the same)
    const isSubmitButtonDisabled = isSubmitting || idStatus !== 'available' || authCodeStatus !== 'valid' || !agreedToTerms;

    const getStatusClass = (status) => {
        if (status === 'available' || status === 'valid') return 'status-message status-success';
        if (status === 'unavailable' || status === 'invalid') return 'status-message status-error';
        return 'status-message';
    };

    return (
        <form onSubmit={handleSubmit} className={`signupForm ${className}`}>
            {/* --- All your JSX elements from the original code go here --- */}
            {/* --- No changes are needed in the return() part --- */}
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