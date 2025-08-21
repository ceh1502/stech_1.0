import React from 'react';
import Header from '../LandingHome/Header';
import Footer from '../LandingHome/Footer';
import TeamLogo from '../../../assets/images/png/TeamPng/teamLogo.png';
import T1 from '../../../assets/images/png/TeamPng/T1.png';
import T2 from '../../../assets/images/png/TeamPng/T2.png';
import T3 from '../../../assets/images/png/TeamPng/T3.png';
import T4 from '../../../assets/images/png/TeamPng/T4.png';
import T5 from '../../../assets/images/png/TeamPng/T5.png';
import T6 from '../../../assets/images/png/TeamPng/T6.png';
import T7 from '../../../assets/images/png/TeamPng/T7.png';
import TP1 from '../../../assets/images/png/TeamPng/TP1.png';
import TP2 from '../../../assets/images/png/TeamPng/TP2.png';
import TP3 from '../../../assets/images/png/TeamPng/TP3.png';
import TP4 from '../../../assets/images/png/TeamPng/TP4.png';
import './team.css';

const Team = () => {
    return (
        <div>
            <div className="mainContainer">
                <Header style={{ zIndex: '2' }} />
                <div className="toparea"></div>
                <div className="overviewContainer">
                    <div className="overview">
                        <div className="teamOverview">
                            <div className="team1">
                                <div>TEAM</div>
                                <div>
                                    <img src={TeamLogo} alt="teamLogo" />
                                </div>
                            </div>
                            <div className="team2">
                                <span>미식축구 선수들이 구성한 팀</span>
                            </div>
                        </div>
                        <div className="teamIntro">
                            <div className="intro1">
                                Stech은 경기장에서 누구보다 가까이에서 뛰며 미식축구를 경험한
                                <br />
                                한국 대학 선수들에 의해 설립되었습니다.
                            </div>
                            <div className="intro2">
                                저희는 필드에서 얻은 생생한 경험과 AI 객체 인식 기술을 결합해 경기 분석을 
자동화하고 전략에 바로 활용할 수 있는 인사이트를 제공합니다. 스포츠에 
대한 깊은 이해와 기술적 전문성, 그리고 혁신에 대한 끊임없는 도전을 통해, 선수와 코치를 진정으로 위한 도구를 만들어가고 있습니다. 
그 이유는, 우리 자신이 바로 그 선수들이기 때문입니다.
                            </div>
                        </div>
                    </div>
                </div>
                <div className="historyContainer">
                    <div className="firstColumn">
                        <img src={TP1} alt="tp1" />
                        <img src={TP2} alt="tp2" />
                        <img src={TP3} alt="tp3" />
                        <img src={TP4} alt="tp4" />
                    </div>
                    <div className="secondColumn">
                        <tt>25.08</tt>
                            <td>
                                • 2025 Next Challenge 로컬 청년 IR & Networking Camp 수료
                            </td>
                        <tt>25.07</tt>
                            <td>
                                • 2025 한양대학교 글로벌 챌린저 인 실리콘밸리 프로그램 수료
                            </td>
                        <tt>25.06</tt>
                            <td>
                                • NVIDIA Inception Program 참여<br />
                                • Google for Startups 프로그램 참여
                            </td>
                        <tt>25.05</tt>
                            <td>
                                • 중소벤처기업부, 한양대학교 창업지원단 주최 창업중심대학 생애최초 전형 선정
                            </td>
                        <tt>25.03</tt>
                            <td>
                                • 서울미식축구협회 서포터즈 운영
                            </td>
                        <tt>25.02</tt>
                            <td>
                                • Stech 팀 결성
                                • 2025 SKT 에이닷 AI 서포터즈 수료
                            </td>
                    </div>
                </div>

                <div className="memberContainer">
                    <div className="firstRow">
                        <div className="T1">
                            <img src={T1} alt="t1" />
                            <div className="crewName" onClick={() => window.open('https://www.linkedin.com/in/josh-lee-5b5769164/', '_blank')}>
                                Josh Lee
                            </div>
                            <div className="crewPosition">Founder & CEO</div>
                        </div>
                        <div className="T2">
                            <img src={T2} alt="t2" />
                            <div className="crewName" onClick={() => window.open('https://www.linkedin.com/in/eugenekim512', '_blank')}>
                                Eugene Kim
                            </div>
                            <div className="crewPosition">Founder & CBO</div>
                        </div>
                        <div className="T3">
                            <img src={T3} alt="t3" />
                            <div className="crewName" onClick={() => window.open('http://www.linkedin.com/in/brianbluefootball', '_blank')}>
                                Brian Lee
                            </div>
                            <div className="crewPosition">Lead PM & Data Analyst</div>
                        </div>
                        <div className="T4">
                            <img src={T4} alt="t4" />
                            <div className="crewName" onClick={() => window.open('https://www.linkedin.com/in/%EC%97%AC%EC%96%B8%EB%A1%A0-990935367', '_blank')}>
                                Allan Lu
                            </div>
                            <div className="crewPosition">PM</div>
                        </div>
                    </div>
                    <div className="secondRow">
                        <div className="T5">
                            <img src={T5} alt="t5" />
                            <div className="crewName" onClick={() => window.open('https://www.linkedin.com/in/%EA%B1%B4-%EC%9D%B4-352aa1211/', '_blank')}>
                                Ken Lee
                            </div>
                            <div className="crewPosition">Lead Dev & Back-end</div>
                        </div>
                        <div className="T6">
                            <img src={T6} alt="t6" />
                            <div className="crewName" onClick={() => window.open('https://www.linkedin.com/in/jenicoon/', '_blank')}>
                                Jenicoon Lee
                            </div>
                            <div className="crewPosition">AI Dev</div>
                        </div>
                        <div className="T7">
                            <img src={T7} alt="t7" />
                            <div className="crewName" onClick={() => window.open('https://www.linkedin.com/in/pppbin/', '_blank')}>
                                Yves Son
                            </div>
                            <div className="crewPosition">Front-end</div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer/>
        </div>
    );
};

export default Team;
