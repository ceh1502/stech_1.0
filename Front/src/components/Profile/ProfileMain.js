import React, { useState, useEffect } from 'react';
import './ProfileTeamPlayer.css';
import { teamData } from '../../data/teamData';
import { mockData } from '../../data/teamplayermock';

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
        region: '서울1',
        team: '한양'
    };
};


const ProfileMain = () => {
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [careerPosition, setCareerPosition] = useState('전체');
    const [seasonPosition, setSeasonPosition] = useState('전체');
    const [gamePosition, setGamePosition] = useState('전체');

    useEffect(() => {
        const loadProfile = async () => {
            const data = await fetchProfileDataFromBackend();
            setProfileData(data);
            setCareerPosition(data.position);
            setSeasonPosition(data.position);
            setGamePosition(data.position);
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

    const getPositionsWithUserData = (data) => {
        const userPositions = new Set();
        Object.keys(data).forEach(position => {
            if (position === '전체') return;
            const hasUser = data[position].data.some(player => player.name === profileData.fullName);
            if (hasUser) {
                userPositions.add(position);
            }
        });
        return Array.from(userPositions);
    };

    const userPositions = profileData ? getPositionsWithUserData(mockData) : ['전체'];

    const renderStatsTable = (position, filterType) => {
        const currentPositionData = mockData[position];
        const currentData = currentPositionData?.data?.filter(player => player.name === profileData.fullName) || [];
        
        if (!currentPositionData) {
            return <div className="no-data">선택된 포지션에 대한 데이터가 없습니다.</div>;
        }

        let currentColumns = currentPositionData.columns;

        if (position !== '전체') {
             currentColumns = currentColumns.filter(col => col !== '순위' && col !== '선수 이름');
        }

        if (currentData.length === 0) {
            return <div className="no-data">이 포지션에 대한 스탯이 없습니다.</div>;
        }

        return (
            <div className="stats-table-container">
                <table className="stats-table">
                    <thead>
                        <tr>
                            {currentColumns.map((col, index) => (
                                <th key={index}>{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {currentData.map((player, index) => (
                            <tr key={index}>
                                {currentColumns.map((col, statIndex) => {                                    if (position === '전체') {
                                        if (col === '순위') return <td key={statIndex}>{player.rank}위</td>;
                                        if (col === '선수 이름') return <td key={statIndex}>{player.name}</td>;
                                        if (col === '포지션') return <td key={statIndex}>{player.position}</td>;
                                        return <td key={statIndex}>{player.stats[statIndex - 3]}</td>;
                                    } else {
                                        return <td key={statIndex}>{player.stats[statIndex]}</td>;
                                    }
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };


    if (isLoading) {
        return <div className="loading-message">프로필 정보를 불러오는 중입니다...</div>;
    }

    if (!profileData) {
        return <div className="error-message">프로필 정보를 찾을 수 없습니다.</div>;
    }

    const selectedTeam = getSelectedTeam();

    return (
        <div className="profile-main">
            <div className="profile-buttons-top">
                <a href="./profile/teamplayer" type="button" className="profile-button">팀 선수 스탯</a>
                <a href="./profile/modify" type="button" className="profile-button">프로필 수정</a>
                <a href="./profile/clip" type="button" className="profile-button">메모 클립 영상</a>
                <a href="./profile/manage" type="button" className="profile-button">구단 관리</a>
            </div>

            <div className="profile-container">
                <div className="profile-title-container">
                    <h1 className="profile-title">선수 프로필</h1>
                </div>

                <div className="profile-content">
                    <div className="profile-image-modify">
                        <div className="profile-image-section">
                            {profileData.profileImage ? (
                                <img src={profileData.profileImage} alt="Profile" className="profile-image" />
                            ) : (
                                <div className="profile-placeholder-text"></div>
                            )}
                        </div>
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
                                <label>키(cm)</label>
                                <p className="profile-info-text">{profileData.height}</p>
                            </div>
                            <div className="profile-form-group">
                                <label>몸무게(kg)</label>
                                <p className="profile-info-text">{profileData.weight}</p>
                            </div>
                            <div className="profile-form-group">
                                <label>나이</label>
                                <p className="profile-info-text">{profileData.age}</p>
                            </div>
                            <div className="profile-form-group">
                                <label>경력(년)</label>
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
                                    {profileData.region === '서울1' ? '서울 1부 리그' :
                                        profileData.region === '서울2' ? '서울 2부 리그' :
                                            profileData.region === '사회인' ? '사회인 리그' : 'N/A'}
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

            {/* 통산 커리어 스탯 */}
            <div className="profile-container">
                <div className="profile-title-container">
                    <h1 className="profile-title">통산 커리어 스탯</h1>
                </div>
                <div className="dropdowns-container">
                    <select
                        className="dropdown"
                        value={careerPosition}
                        onChange={(e) => setCareerPosition(e.target.value)}
                    >
                        {userPositions.map((pos, index) => (
                            <option key={index} value={pos}>{pos}</option>
                        ))}
                    </select>
                </div>
                {renderStatsTable(careerPosition)}
            </div>

            {/* 올해 시즌 나의 스탯 */}
            <div className="profile-container">
                <div className="profile-title-container">
                    <h1 className="profile-title">올해 시즌 나의 스탯</h1>
                </div>
                <div className="dropdowns-container">
                    <select
                        className="dropdown"
                        value={seasonPosition}
                        onChange={(e) => setSeasonPosition(e.target.value)}
                    >
                        {userPositions.map((pos, index) => (
                            <option key={index} value={pos}>{pos}</option>
                        ))}
                    </select>
                </div>
                {renderStatsTable(seasonPosition)}
            </div>

            {/* 경기별 스탯 */}
            <div className="profile-container">
                <div className="profile-title-container">
                    <h1 className="profile-title">경기별 스탯</h1>
                </div>
            </div>
        </div>
    );
};

export default ProfileMain;
