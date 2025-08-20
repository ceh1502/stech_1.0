import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PasswordFindCode = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        code: '',
    });

    const [errors, setErrors] = useState({});

    const handleChange = (e) => {
        const { id, value } = e.target;
        const numericValue = value.replace(/[^0-9]/g, '').substring(0, 6);
        setFormData((prev) => ({
            ...prev,
            [id]: numericValue,
        }));

        if (errors[id]) {
            setErrors((prev) => ({ ...prev, [id]: null }));
        }
    };

    const handleVerification = () => {
        const newErrors = {};
        const codeRegex = /^\d{6}$/;

        if (!formData.code) {
            newErrors.code = '인증번호를 입력해주세요.';
        } else if (!codeRegex.test(formData.code)) {
            newErrors.code = '유효한 6자리 인증번호를 입력해주세요.';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            console.log('인증번호 확인:', formData.code);
            alert('인증이 완료되었습니다!');
            navigate('../changepassword')
        } else {
            console.log('유효성 검사 오류:', newErrors);
        }
    };

    return (
        <div className="find-page-container">
            <div className="find-page-card">
                <h2 className="find-title">연락처의 문자를 확인해보세요</h2>
                <p className="find-description">연락처에서 받은 인증번호를 입력해주세요</p>

                <div className="find-input-group">
                    <label htmlFor="code">인증번호</label>
                    <input
                        type="text"
                        id="code"
                        value={formData.code}
                        onChange={handleChange}
                        maxLength="6"
                    />
                    <a href="#" className="resend-link">다시 보내기</a>
                    {errors.code && <p className="errorMessage">⚠️ {errors.code}</p>}
                </div>

                <button
                    className="find-code-button"
                    onClick={handleVerification}
                >
                    인증 확인 →
                </button>
            </div>
        </div>
    );
};

export default PasswordFindCode;
