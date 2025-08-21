import React, { useState, useEffect } from 'react';
import './ProfileClip.css';
import ChungAng from '../../assets/images/png/TeamLogosPng/ChungAng-Blue-Dragons.png';
import Dongguk from '../../assets/images/png/TeamLogosPng/Dongguk-Tuskers.png';
import Hanyang from '../../assets/images/png/TeamLogosPng/Hanyang-Lions.png';
import Hongik from '../../assets/images/png/TeamLogosPng/Hongik-Cowboys.png';
import HUFS from '../../assets/images/png/TeamLogosPng/HUFS-Black-Knights.png';
import Konkuk from '../../assets/images/png/TeamLogosPng/Konkuk-Raging-Bulls.png';
import Kookmin from '../../assets/images/png/TeamLogosPng/Kookmin-Razorbacks.png';
import Korea from '../../assets/images/png/TeamLogosPng/Korea-Univeristy-Tigers.png';
import Kyunghee from '../../assets/images/png/TeamLogosPng/Kyunghee-Commanders.png';
import Seoul from '../../assets/images/png/TeamLogosPng/Seoul-Vikings.png';
import SNU from '../../assets/images/png/TeamLogosPng/SNU-Green-Terrors.png';
import Sogang from '../../assets/images/png/TeamLogosPng/Sogang-Albatross.png';
import Soongsil from '../../assets/images/png/TeamLogosPng/soongsil-crusaders.png';
import UOS from '../../assets/images/png/TeamLogosPng/UOS-City-Hawks.png';
import Yonsei from '../../assets/images/png/TeamLogosPng/Yonsei-Eagles.png';

// 백엔드 연결 부분
const fetchProfileDataFromBackend = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
        profileImage: 'https://via.placeholder.com/250x300',
        fullName: '홍길동',
        email: 'test@example.com',
        address1: '서울시 강남구 테헤란로 123',
        address2: '멀티캠퍼스',
        height: '180cm',
        weight: '75kg',
        position: 'QB',
        age: '28세',
        career: '5년',
        region: 'seoul-first',
        team: 'hanyang'
    };
};

// 팀 데이터 (예시)
const teamData = {
    'seoul-first': [
        { value: 'yonsei', label: 'YONSEI EAGLES', logo: Yonsei },
        { value: 'seoul-national', label: 'SNU GREEN TERRORS', logo:  SNU },
        { value: 'hanyang', label: 'HANYANG LIONS', logo: Hanyang },
        { value: 'kookmin', label: 'KOOKMIN RAZORBACKS', logo:  Kookmin },
        { value: 'hufs', label: 'HUFS BLACK KNIGHTS', logo: HUFS },
        { value: 'uos', label: 'UOS CITY HAWKS', logo:  UOS },
        { value: 'konkuk', label: 'KONKUK RAGING BULLS', logo: Konkuk },
        { value: 'hongik', label: 'HONGIK COWBOYS', logo:  Hongik },
    ],
    'seoul-second': [
        { value: 'korea', label: 'KOREA TIGERS', logo:  Korea },
        { value: 'dongguk', label: 'DONGGUK TESKERS', logo: Dongguk },
        { value: 'soongsil', label: 'SOONGSIL CRUSADERS', logo:  Soongsil },
        { value: 'chungang', label: 'CHUNGANG BLUE DRAGONS', logo: ChungAng },
        { value: 'kyunghee', label: 'KYUNGHEE COMMANDERS', logo:  Kyunghee },
        { value: 'sogang', label: 'SOGANG ALBATROSS', logo:  Sogang },
    ],
    'adult': [
        { value: 'seoul-vikings', label: 'SEOUL VIKINGS', logo:  Seoul },
    ],
};

const ProfileMain = () => {
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadProfile = async () => {
            const data = await fetchProfileDataFromBackend();
            setProfileData(data);
            setIsLoading(false);
        };
        loadProfile();
    }, []);

    const getSelectedTeam = () => {
        if (!profileData || !profileData.team) {
            return { label: 'N/A', logo: null };
        }
        const selectedRegionTeams = teamData[profileData.region] || [];
        return selectedRegionTeams.find(team => team.value === profileData.team) || { label: 'N/A', logo: null };
    };

    if (isLoading) {
        return <div className="loading-message">프로필 정보를 불러오는 중입니다...</div>;
    }

    if (!profileData) {
        return <div className="error-message">프로필 정보를 찾을 수 없습니다.</div>;
    }

    const selectedTeam = getSelectedTeam();

    return (
        <div className="profile-main>">
            <div className="profile-buttons-top">
                <a href="./teamplayer" type="button" className="profile-button">팀 선수 스탯</a>
                <a href="./modify" type="button" className="profile-button">프로필 수정</a>
                <a href="./clip" type="button" className="profile-button active">메모 클립 영상</a>
                <a href="./manage" type="button" className="profile-button">구단 관리</a>
            </div>

            <div className="profile-container">
                <div className="profile-title-container">
                    <h1 className="profile-title">선수 프로필</h1>
                </div>

                <div className="profile-content">
                    <div className="profile-image-section">
                        {profileData.profileImage ? (
                            <img src={profileData.profileImage} alt="Profile" className="profile-image" />
                        ) : (
                            <div className="profile-placeholder-text"></div>
                        )}
                    </div>

                    <div className="profile-info-section">
                        <div className="profile-info-grid">
                            <div className="profile-form-group">
                                <label>성명</label>
                                <p className="profile-info-text">{profileData.fullName}</p>
                            </div>
                            <div className="profile-form-group">
                                <label>이메일</label>
                                <p className="profile-info-text">{profileData.email}</p>
                            </div>
                            <div className="profile-form-group full-width">
                                <label>주소</label>
                                <p className="profile-info-text">{profileData.address1}</p>
                                <p className="profile-info-text">{profileData.address2}</p>
                            </div>
                        </div>
                        <div className="profile-info-four-column">
                            <div className="profile-form-group">
                                <label>키</label>
                                <p className="profile-info-text">{profileData.height}</p>
                            </div>
                            <div className="profile-form-group">
                                <label>몸무게</label>
                                <p className="profile-info-text">{profileData.weight}</p>
                            </div>
                            <div className="profile-form-group">
                                <label>나이</label>
                                <p className="profile-info-text">{profileData.age}</p>
                            </div>
                            <div className="profile-form-group">
                                <label>경력</label>
                                <p className="profile-info-text">{profileData.career}</p>
                            </div>
                        </div>
                        <div className="profile-info-three-column">
                            <div className="profile-form-group">
                                <label>포지션</label>
                                <p className="profile-info-text">{profileData.position}</p>
                            </div>
                            <div className="profile-form-group">
                                <label>지역</label>
                                <p className="profile-info-text">
                                    {profileData.region === 'seoul-first' ? '서울 1부 리그' :
                                        profileData.region === 'seoul-second' ? '서울 2부 리그' :
                                        profileData.region === 'adult' ? '사회인 리그' : 'N/A'}
                                </p>
                            </div>
                            <div className="profile-form-group">
                                <label>팀</label>
                                <div className="profile-team-display">
                                    {selectedTeam.logo && (
                                        <img src={selectedTeam.logo} alt={selectedTeam.label} className="profile-team-icon" />
                                    )}
                                    <p>{selectedTeam.label}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="profile-container">
                <div className="profile-title-container">
                    <h1 className="profile-title">통산 커리어 스탯</h1>
                </div>
            </div>

            <div className="profile-container">
                <div className="profile-title-container">
                    <h1 className="profile-title">올해 시즌 나의 스탯</h1>
                </div>
            </div>

            <div className="profile-container">
                <div className="profile-title-container">
                    <h1 className="profile-title">경기별 스탯</h1>
                </div>
            </div> 

        </div>
    );
};

export default ProfileMain;