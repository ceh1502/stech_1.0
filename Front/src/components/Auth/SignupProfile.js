import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ChungAng from '../../pages/Landing/LandingHome/images/ChungAng-Blue-Dragons.png';
import Dongguk from '../../pages/Landing/LandingHome/images/Dongguk-Tuskers.png';
import Hanyang from '../../pages/Landing/LandingHome/images/Hanyang-Lions.png';
import Hongik from '../../pages/Landing/LandingHome/images/Hongik-Cowboys.png';
import HUFS from '../../pages/Landing/LandingHome/images/HUFS-Black-Knights.png';
import Konkuk from '../../pages/Landing/LandingHome/images/Konkuk-Raging-Bulls.png';
import Kookmin from '../../pages/Landing/LandingHome/images/Kookmin-Razorbacks.png';
import Korea from '../../pages/Landing/LandingHome/images/Korea-Univeristy-Tigers.png';
import Kyunghee from '../../pages/Landing/LandingHome/images/Kyunghee-Commanders.png';
import Seoul from '../../pages/Landing/LandingHome/images/Seoul-Vikings.png';
import SNU from '../../pages/Landing/LandingHome/images/SNU-Green-Terrors.png';
import Sogang from '../../pages/Landing/LandingHome/images/Sogang-Albatross.png';
import Soongsil from '../../pages/Landing/LandingHome/images/soongsil-crusaders.png';
import UOS from '../../pages/Landing/LandingHome/images/UOS-City-Hawks.png';
import Yonsei from '../../pages/Landing/LandingHome/images/Yonsei-Eagles.png';

const teamData = {
    'seoul-first': [
        { value: 'hanyang', label: 'HANYANG LIONS', logo: Hanyang },
        { value: 'korea', label: 'KOREA TIGERS', logo:  Korea},
    ],
    'seoul-second': [
        { value: 'soongsil', label: 'CRUSADERS', logo: Soongsil },
    ],
    'central-first': [
    ],
    'central-second': [
    ],
};

const SignupProfileForm = () => {
    const navigate = useNavigate();

    const [profileData, setProfileData] = useState({
        profileImage: null,
        fullName: '',
        email: '',
        address1: '',
        address2: '',
        height: '',
        weight: '',
        position: '',
        age: '',
        career: '',
        region: '',
        league: ''
    });

    const [emailStatus, setEmailStatus] = useState(null);
    const [emailMessage, setEmailMessage] = useState('');

    const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
    const teamDropdownRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleRegionChange = (e) => {
        const { value } = e.target;
        setProfileData(prev => ({ ...prev, region: value, team: '' }));
    };

    const handleTeamSelect = (value) => {
        setProfileData(prev => ({ ...prev, team: value }));
        setIsTeamDropdownOpen(false);
    };

    const handleImageChange = (e) => {
        setProfileData(prev => ({ ...prev, profileImage: e.target.files[0] }));
    };

    const handleAddressSearch = () => {
        alert('주소 검색 기능은 아직 구현되지 않았습니다.');
    };

    const isEmailValid = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const checkEmailAvailability = async (email) => {
        setEmailStatus('checking');
        setEmailMessage('확인 중...');

        await new Promise(resolve => setTimeout(resolve, 1000));

        if (email === 'test@test.com') {
            setEmailStatus('unavailable');
            setEmailMessage('중복된 이메일입니다.');
        } else {
            setEmailStatus('available');
            setEmailMessage('사용 가능한 이메일입니다.');
        }
    };

    const handleEmailChange = (e) => {
        const email = e.target.value;
        setProfileData(prev => ({ ...prev, email }));
        
        if (email.length === 0) {
            setEmailStatus(null);
            setEmailMessage('');
            return;
        }

        if (!isEmailValid(email)) {
            setEmailStatus('unavailable');
            setEmailMessage('유효한 이메일 형식이 아닙니다.');
            return;
        }

        checkEmailAvailability(email);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (emailStatus !== 'available') {
            alert(emailMessage);
            return;
        }

        console.log('Profile Data:', profileData);
        alert('프로필이 생성되었습니다.');
        navigate('/main');
    };

    const getStatusClass = (status) => {
        if (status === 'available') return 'status-message status-success';
        if (status === 'unavailable') return 'status-message status-error';
        return 'status-message';
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (teamDropdownRef.current && !teamDropdownRef.current.contains(event.target)) {
                setIsTeamDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [teamDropdownRef]);

    const getSelectedTeam = () => {
        if (!profileData.team) {
            return { label: '팀 선택', logo: null };
        }
        const selectedRegionTeams = teamData[profileData.region] || [];
        return selectedRegionTeams.find(team => team.value === profileData.team) || { label: '팀 선택', logo: null };
    };
    
    const selectedTeam = getSelectedTeam();
    const availableTeams = teamData[profileData.region] || [];

    return (
        <form onSubmit={handleSubmit} className="profileForm">
            <div className="profiletab-container">
                <button type="button" className="profileTitle">프로필 생성</button>
            </div>

            <div className="profileformSection ">
                <div className="profileimagePlaceholder">
                    {profileData.profileImage ? (
                        <img src={URL.createObjectURL(profileData.profileImage)} alt="Profile" className="profileImage" />
                    ) : (
                        <div className="profileplaceholderText"></div>
                    )}
                </div>
                <div className="profileimageButtons">
                    <label htmlFor="profileImage" className="profileuploadButton">사진 업로드</label>
                    <input type="file" id="profileImage" name="profileImage" onChange={handleImageChange} style={{ display: 'none' }} />
                    <button type="button" className="profileremoveButton" onClick={() => setProfileData(prev => ({ ...prev, profileImage: null }))}>삭제</button>
                </div>
            </div>

            <div className="profileformGrid">
                <div className="profileformGroup">
                    <label>성명</label>
                    <input type="text" name="fullName" value={profileData.fullName} onChange={handleChange} />
                </div>
                <div className="profileformGroup">
                    <label>이메일</label>
                    <input 
                        type="email" 
                        name="email" 
                        value={profileData.email} 
                        onChange={handleEmailChange}
                        className={emailStatus === 'checking' ? 'checking' : ''}
                    />
                    {emailMessage && (
                        <div className={getStatusClass(emailStatus)}>
                            {emailMessage}
                        </div>
                    )}
                </div>
                <div className="profileformGroup full-width">
                    <label>주소</label>
                    <div className="input-with-button">
                        <input type="text" name="address1" value={profileData.address1} onChange={handleChange} />
                        <button type="button" onClick={handleAddressSearch}>찾기</button>
                    </div>
                </div>
                <div className="profileformGroup full-width">
                    <input type="text" name="address2" value={profileData.address2} onChange={handleChange}  />
                </div>
                <div className="profileformGroup">
                    <label>키</label>
                    <input type="text" name="height" value={profileData.height} onChange={handleChange} />
                </div>
                <div className="profileformGroup">
                    <label>몸무게</label>
                    <input type="text" name="weight" value={profileData.weight} onChange={handleChange} />
                </div>
                <div className="profileformGroup">
                    <label>포지션</label>
                    <select name="position" value={profileData.position} onChange={handleChange}>
                        <option value="">포지션 선택</option>
                        <option value="QB">QB</option>
                        <option value="RB">RB</option>
                        <option value="WR">WR</option>
                    </select>
                </div>
                <div className="profileformGroup">
                    <label>나이</label>
                    <input type="text" name="age" value={profileData.age} onChange={handleChange} />
                </div>
                <div className="profileformGroup">
                    <label>경력</label>
                    <input type="text" name="career" value={profileData.career} onChange={handleChange} />
                </div>
                <div className="profileformGroup">
                    <label>지역</label>
                    <select name="region" value={profileData.region} onChange={handleRegionChange}>
                        <option value="">지역 선택</option>
                        <option value="seoul-first">서울 1부 리그</option>
                        <option value="seoul-second">서울 2부 리그</option>
                        <option value="central-first">중부 1부 리그</option>
                        <option value="central-second">중부 2부 리그</option>
                    </select>
                </div>
                <div className="profileformGroup full-width">
                    <label>팀</label>
                    <div className="profile-team" ref={teamDropdownRef}>
                        <div 
                            className={`profile-team-select ${!profileData.team ? 'placeholder' : ''}`}
                            onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
                        >
                            {selectedTeam.logo && (
                                <img src={selectedTeam.logo} alt={selectedTeam.label} className="profile-team-icon" />
                            )}
                            {selectedTeam.label}
                        </div>
                        {isTeamDropdownOpen && (
                            <div className="profile-team-options">
                                {availableTeams.length > 0 ? (
                                    availableTeams.map((team, index) => (
                                        <div 
                                            key={index}
                                            className="profile-team-option"
                                            onClick={() => handleTeamSelect(team.value)}
                                        >
                                            <img src={team.logo} alt={team.label} className="profile-team-icon" />
                                            {team.label}
                                        </div>
                                    ))
                                ) : (
                                    <div className="profile-team-no-options">지역을 먼저 선택해주세요.</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <button type="submit" className="profilesubmitButton">프로필 생성</button>
        </form>
    );
};

export default SignupProfileForm;