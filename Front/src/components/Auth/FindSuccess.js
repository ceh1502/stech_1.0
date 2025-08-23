import React, {} from 'react';
import { useNavigate } from 'react-router-dom';

const FindSuccess = () => {
    const navigate = useNavigate();

    const handleLoginClick = () => {
        navigate('../');
    }


    return (
        <div className="find-page-container">
            <div className="find-page-card">
                <h2 className="find-title">정상적으로 비밀번호가<br />
                변경되었습니다.</h2>
                <p className="find-description">다시 로그인 해주세요.</p>

                <button
                    className="find-code-button"
                    onClick={handleLoginClick}
                >
                    로그인 →
                </button>
            </div>
        </div>
    );
};

export default FindSuccess;
