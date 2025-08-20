import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Eye from '../../assets/images/png/AuthPng/Eye.png';
import EyeActive from '../../assets/images/png/AuthPng/EyeActive.png';

const ChangePassword = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        password: '',
        passwordConfirm: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }));

        if (errors[id]) {
            setErrors((prev) => ({ ...prev, [id]: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.password) {
            newErrors.password = '비밀번호를 입력해주세요.';
        } else if (formData.password.length < 8) {
            newErrors.password = '비밀번호는 최소 8자 이상이어야 합니다.';
        }

        if (!formData.passwordConfirm) {
            newErrors.passwordConfirm = '비밀번호 확인을 입력해주세요.';
        } else if (formData.password !== formData.passwordConfirm) {
            newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (validateForm()) {
            console.log('Form is valid. Submitting data:', formData);
            alert('비밀번호가 성공적으로 변경되었습니다!');
            navigate('../findsuccess')
        } else {
            console.log('Form has errors.');
        }
    };

    return (
        <div className="find-page-container">
            <div className="find-page-card">
                <h2 className="find-title">비밀번호 재설정</h2>
                <p className="find-description">새로운 비밀번호를 입력해주세요.</p>

                <div className="find-input-group">
                    <label htmlFor="password">비밀번호</label>
                    <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="최소 8자"
                    />
                    {errors.password && <p className="errorMessage">⚠️ {errors.password}</p>}

                    <button
                        type="button"
                        className="password-toggle-button"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? (
                            <img src={EyeActive} alt="showPassword" className="showPassword" />
                        ) : (
                            <img src={Eye} alt="showPassword" className="showPasswordActive" />
                        )}
                    </button> 
                </div>

                <div className="find-input-group">
                    <label htmlFor="passwordConfirm">비밀번호 확인</label>
                    <input
                        type={showPasswordConfirm ? "text" : "password"}
                        id="passwordConfirm"
                        value={formData.passwordConfirm}
                        onChange={handleChange}
                        placeholder="비밀번호 다시 입력"
                    />
                    {errors.passwordConfirm && <p className="errorMessage">⚠️ {errors.passwordConfirm}</p>}

                    <button
                        type="button"
                        className="password-toggle-button"
                        onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    >
                        {showPasswordConfirm ? (
                            <img src={EyeActive} alt="showPassword" className="showPassword" />
                        ) : (
                            <img src={Eye} alt="showPassword" className="showPasswordActive" />
                        )}
                    </button>
                </div>

                <button
                    className="find-code-button"
                    onClick={handleSubmit}
                >
                    비밀번호 변경 →
                </button>
            </div>
        </div>
    );
};

export default ChangePassword;
