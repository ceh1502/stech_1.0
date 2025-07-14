// src/pages/Service/ServiceLayout/index.js
import React from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';

import ServiceSidebar from './ServiceSidebar';
import SupportModal from '../../../components/SupportModal'; // SupportModal.jsx 만든 위치 기준
import Home from '../Home'; // 원래 /service 메인 페이지 컴포넌트
import Clip from '../Clip'; // /service/clip 페이지
// 필요한 다른 페이지도 여기에 import

const ServiceLayout = () => {
    /* ---------- 1. 지금 주소와 “모달 열기 직전 주소” ---------- */
    const location = useLocation();
    const navigate = useNavigate();
    const background = location.state?.background; // Customer Support 눌렀을 때 넣어 둔 값

    /* ---------- 2. 화면 ---------- */
    return (
        <>
            {/* 왼쪽: 사이드바 / 오른쪽: 본문 */}
            <div className="serviceLayoutContainer">
                <ServiceSidebar />

                {/* 본문 영역 */}
                <main className="flex-1">
                    {/* 
            background 값이 있으면 그걸, 없으면 현재 주소(location) 그대로 사용
            → 모달을 띄워도 이전 화면이 유지됨
          */}
                    <Routes location={background || location}>
                        <Route path="/" element={<Home />} />
                        <Route path="clip" element={<Clip />} />
                        {/* 나머지 /service/* 페이지들도 여기 추가 */}
                    </Routes>
                </main>
            </div>

            {/* ---------- 3. 모달 ---------- */}
            {location.pathname.startsWith('/service/support') && (
                <SupportModal
                    onClose={() =>
                        // ESC·닫기 버튼 등에서 이전 주소로 돌아가기
                        navigate(background?.pathname || '/service', { replace: true })
                    }
                />
            )}
        </>
    );
};

export default ServiceLayout;
