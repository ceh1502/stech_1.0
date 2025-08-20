import React from 'react';
import './index.css';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { Link } from 'react-router-dom';
import img from './images/headimg.png';
import Header from './Header';
import Footer from './Footer';
import ChungAng from './images/ChungAng-Blue-Dragons.png';
import Dongguk from './images/Dongguk-Tuskers.png';
import Hanyang from './images/Hanyang-Lions.png';
import Hongik from './images/Hongik-Cowboys.png';
import HUFS from './images/HUFS-Black-Knights.png';
import Konkuk from './images/Konkuk-Raging-Bulls.png';
import Kookmin from './images/Kookmin-Razorbacks.png';
import Korea from './images/Korea-Univeristy-Tigers.png';
import Kyunghee from './images/Kyunghee-Commanders.png';
import Seoul from './images/Seoul-Vikings.png';
import SNU from './images/SNU-Green-Terrors.png';
import Sogang from './images/Sogang-Albatross.png';
import Soongsil from './images/soongsil-crusaders.png';
import UOS from './images/UOS-City-Hawks.png';
import Yonsei from './images/Yonsei-Eagles.png';
import Component from './images/Component.png';
import Detail from './images/detail.png';
import Screen from './images/screen.png';
import MobileScreen from './images/mobilescreen.png';
import Gameimage from './images/Gameimage.png';

const LandingPage = () => {
    usePageTitle('Stech');
    return (
        <div className="landing-page-container" style={{ width: '100%' }}>
            {/* Section 1: Hero */}
            <section className="section hero-section">
                <Header style={{ zIndex: '2' }} />
                <div className="hero-container">
                    <div className="hero-content">
                        <div className="hero-text">
                            <div className="h1-header">데이터와 경기가</div>
                            <div className="h1-header2">하나가 되는 순간</div>
                        </div>
                        <p>
                            코치와 분석가들은 더 이상 수작업에 의존하지 않아도 됩니다.<br />
                            Stech은 경기 영상을 업로드하는 것만으로 선수의 움직임과 전술 흐름을 인식하고,<br />
                            효율적이고 정확한 분석 결과를 제공합니다. 데이터 기반의 의사결정을 가능하게 <br />
                            하는 Stech. 스포츠 현장에서 전략과 퍼포먼스의 차이를 만드세요.<br />
                        </p>
                        <div className="link">
                            <button className="toServiceButton">
                                {/* Link 컴포넌트에 직접 스타일 적용 */}
                                <Link to="/service" className="serviceButton" style={{ color: '#ffffff', textDecoration: 'none' }}>
                                    STECH PRO 서비스 이용하기
                                </Link>
                            </button>
                        </div>
                    </div>
                    <div className="hero-wrap">
                        <div className="hero-bg" style={{ backgroundImage: `url(${img})` }}></div>
                        <img src={img} alt="Hero-Image" />
                    </div>
                </div>
                <div className="slider-container">
                    <div className="slider-track">
                        <img src={ChungAng} alt="ChungAng Blue Dragons" />
                        <img src={Dongguk} alt="Dongguk Tuskers" />
                        <img src={Hanyang} alt="Hanyang Lions" />
                        <img src={Hongik} alt="Hongik Cowboys" />
                        <img src={HUFS} alt="HUFS Black Knights" />
                        <img src={Konkuk} alt="Konkuk Raging Bulls" />
                        <img src={Kookmin} alt="Kookmin Razorbacks" />
                        <img src={Korea} alt="Korea University Tigers" />
                        <img src={Kyunghee} alt="Kyunghee Commanders" />
                        <img src={Seoul} alt="Seoul Vikings" />
                        <img src={SNU} alt="SNU Green Terrors" />
                        <img src={Sogang} alt="Sogang Albatross" />
                        <img src={Soongsil} alt="soongsil crusaders" />
                        <img src={UOS} alt="UOS City Hawks" />
                        <img src={Yonsei} alt="Yonsei Eagles" />
                        <img src={ChungAng} alt="ChungAng Blue Dragons<copy>" />
                        <img src={Dongguk} alt="Dongguk Tuskers<copy>" />
                        <img src={Hanyang} alt="Hanyang Lions<copy>" />
                        <img src={Hongik} alt="Hongik Cowboys<copy>" />
                        <img src={HUFS} alt="HUFS Black Knights<copy>" />
                    </div>
                </div>
            </section>

            {/* Section 2: Analyze Game Footage */}
            <section className="section analyze-section">
                <div style={{ margin: '80px auto 40px auto', textAlign: 'center' }}>
                    <span className="gradient-text-default">AI 기반의 정밀한 분석으로</span>
                    <br />
                    <span className="gradient-text-default">경기 영상을</span>
                    <span className="gradient-text-precision">&nbsp;파헤치다</span> {/* Precision만 다른 그라데이션 */}
                </div>
                <div className="gradient-text">
                    Stech과 함께라면 모든 경기가 데이터가 되고, <br />
                    모든 플레이가 성장의 기회가 됩니다.
                </div>
                <div className="dashboard-image">
                    <img src={Component} alt="Component" style={{ margin: '0 auto' }} />
                </div>
            </section>

            {/* Section 3: Delivering Value */}
            <section className="section value-section">
                <span className="gradient-text-default">
                    분석의 모든 단계에서
                    <br /> 가치를 전달하다
                </span>
                <div className="value-content-container">
                    <div className="value-image">
                        <img src={Detail} alt="Component" style={{ margin: '0 auto' }} />
                    </div>
                    <div className="value-content">
                        <h2>분석의 과정</h2>
                        <p>
                            특수 카메라도, 복잡한 설치도 필요 없습니다. 스마트폰, 캠코더, 중계 영상 등<br />
                            어떤 사이드라인 영상이든 Stech에 업로드하세요. SAMURAI 2.0으로<br />
                            구동되는 Stech의 AI가 자동으로 영상을 분석해 선수 한 명 한 명을<br />
                            추적하고, 움직임을 기록하며, 스냅부터 휘슬까지 핵심 플레이를 식별합니다.<br />
                            수 시간 걸리던 필름 분석을 단 몇 분으로 줄이고, 이제 코칭에 더 많은 시간을<br />
                            집중하세요.
                        </p>
                    </div>
                </div>
            </section>

            {/* Section 4: Key Features */}
            <section className="section key-features-section">
                <span className="gradient-text-default">핵심 기능</span>
                <div className="key-features-description">
                    지역 라이벌전이든, 플레이오프 진출이든 ― Stech은 첫 스냅 전에 이미<br />
                    당신이 이기고, 대응하고, 이끌 수 있도록 전략적 인사이트를 제공합니다.
                </div>
                <div className="features-content">
                    <div className="features-main-image">
                        <img src={Screen} alt="Component" style={{ margin: '0 auto' }} />
                    </div>
                    <div className="features-list">
                        <div className="feature-item">자동 태깅 및 북마크 기능</div>
                        <div className="feature-item">주요 이벤트의 즉각 타임스탬프 생성</div>
                        <div className="feature-item">선수 개별 데이터 관리</div>
                    </div>
                </div>
                <div className="features-mobile-image">
                    <img src={MobileScreen} alt="Component" style={{ margin: '0 auto' }} />
                </div>
            </section>

            {/* Section 5: AI-Powered Reports */}
            <section className="section ai-reports-section">
                <span className="gradient-text-default">
                    경기 전 전략 준비를 위한<br />
                    AI 기반 게임 리포트
                </span>
                <div className="ai-reports-description">
                    첫 휘슬이 울리기 전,<br />
                    당신의 팀에 전략적 우위를 제공하는 리포트
                </div>
                <div className="report-content">
                    <div className="feature-item" style={{ width: '440px', height: '120px' }}>
                        선수 및 포지션 유닛을 위한<br />
                        실행 가능한 인사이트 제공
                    </div>
                    <div className="report-main-image">
                        <img src={Gameimage} alt="Component" style={{ margin: '0 auto', width: '500px' }} />
                    </div>
                    <div className="report-features">
                        <div className="feature-item" style={{ width: '440px', height: '120px' }}>
                            분석된 영상을 기반으로 한<br />
                            종합 리포트 제공
                        </div>
                        <div className="feature-item" style={{ width: '440px', height: '120px' }}>
                            상대팀 프로파일링 및<br />
                            상황별 전략 인텔리전스 제공
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default LandingPage;
