import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PasswordFind = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        id: '',
        contact: '',
    });

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

    const handlePhoneFormat = (e) => {
        let value = e.target.value;
        value = value.replace(/[^0-9]/g, '');

        if (value.length > 11) {
            value = value.substring(0, 11);
        }

        let formattedValue = '';
        if (value.length > 3 && value.length <= 7) {
            formattedValue = `${value.substring(0, 3)}-${value.substring(3)}`;
        } else if (value.length > 7) {
            formattedValue = `${value.substring(0, 3)}-${value.substring(3, 7)}-${value.substring(7)}`;
        } else {
            formattedValue = value;
        }

        setFormData((prev) => ({
            ...prev,
            contact: formattedValue,
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        const idRegex = /^[a-zA-Z0-9]+$/;
        const phoneRegex = /^010-\d{4}-\d{4}$/;

        if (!formData.id) {
            newErrors.id = '아이디를 입력해주세요.';
        } else if (!idRegex.test(formData.id)) {
            newErrors.id = '유효한 이메일 형식으로 입력해주세요.';
        }
        
        if (!formData.contact) {
            newErrors.contact = '연락처를 입력해주세요.';
        } else if (!phoneRegex.test(formData.contact)) {
            newErrors.contact = '유효한 연락처 형식(010-1234-5678)을 입력해주세요.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleCodeRequest = () => {
        if (validateForm()) {
            console.log('Valid form submitted:', formData);
            alert('코드를 요청했습니다!');
            navigate('../findcode');
        } else {
            console.log('Form has errors:', errors);
        }
    };

    return (
        <div className="find-page-container">
            <div className="find-page-card">
                <h2 className="find-title">비밀번호 찾기</h2>
                <p className="find-description">Stech 계정과 연결된 아이디와 연락처를 입력하세요.</p>

                <div className="find-input-group">
                    <label htmlFor="id">아이디</label>
                    <input
                        type="text"
                        id="id"
                        value={formData.id}
                        onChange={handleChange}
                        placeholder=""
                    />
                    {errors.id && <p className="errorMessage">⚠️ {errors.id}</p>}
                </div>

                <div className="find-input-group">
                    <label htmlFor="contact">연락처</label>
                    <input
                        type="text"
                        id="contact"
                        value={formData.contact}
                        onChange={handlePhoneFormat}
                        placeholder=""
                    />
                    {errors.contact && <p className="errorMessage">⚠️ {errors.contact}</p>}
                </div>

                <button
                    className="find-code-button"
                    onClick={handleCodeRequest}
                >
                    코드 받기 →
                </button>

                <div className="find-links-group">
                    <p>이미 계정이 있습니다. <a href="/auth" className="find-link">로그인하기</a></p>
                    <p>계정이 없다면? <a href="/auth/signup" className="find-link">회원가입</a></p>
                </div>

                <hr className="find-divider" />

                <div className="find-help-section">
                    <p>정상적으로 코드를 받지 못하였다면, <a href="/contact" className="link">고객 서비스</a>에 문의하여<br />계정 접근 권한을 복구하는 데 도움을 받으세요.</p>
                </div>
            </div>
        </div>
    );
};

export default PasswordFind;