import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const [scriptLoaded, setScriptLoaded] = useState(false);

    const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false);
    const teamDropdownRef = useRef(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddressSearch = () => {
        if (!scriptLoaded) {
            alert('주소 검색 스크립트가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        new window.daum.Postcode({
            oncomplete: function(data) {
                let fullAddress = '';
                let extraAddress = '';

                if (data.userSelectedType === 'R') {
                    fullAddress = data.roadAddress;
                } else {
                    fullAddress = data.roadAddress;
                }

                if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
                    extraAddress += data.bname;
                }
                if (data.buildingName !== '' && data.apartment === 'Y') {
                    extraAddress += (extraAddress !== '' ? ', ' + data.buildingName : data.buildingName);
                }
                if (extraAddress !== '') {
                    fullAddress += ' (' + extraAddress + ')';
                }

                setProfileData(prev => ({ 
                    ...prev, 
                    address1: fullAddress, 
                    address2: ''
                }));
            }
        }).open();
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
        const script = document.createElement('script');
        script.src = '//t1.daumcdn.net/map_js_init/postcode.v2.js';
        script.async = true;
        script.onload = () => {
            setScriptLoaded(true);
        };

        document.body.appendChild(script);

        const handleClickOutside = (event) => {
            if (teamDropdownRef.current && !teamDropdownRef.current.contains(event.target)) {
                setIsTeamDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.body.removeChild(script);
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
            <div className="profileformtab-container">
                <button type="button" className="profileformTitle">프로필 생성</button>
            </div>

            <div className="profileformSection ">
                <div className="profileformimagePlaceholder">
                    {profileData.profileImage ? (
                        <img src={URL.createObjectURL(profileData.profileImage)} alt="Profile" className="profileformImage" />
                    ) : (
                        <div className="profileplaceholderText"></div>
                    )}
                </div>
                <div className="profileimageButtons">
                    <label htmlFor="profileformImage" className="profileformuploadButton">사진 업로드</label>
                    <input type="file" id="profileformImage" name="profileformImage" onChange={handleImageChange} style={{ display: 'none' }} />
                    <button type="button" className="profileformremoveButton" onClick={() => setProfileData(prev => ({ ...prev, profileImage: null }))}>삭제</button>
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
                        <input 
                            type="text" 
                            name="address1" 
                            value={profileData.address1} 
                            onChange={handleChange} 
                            readOnly
                        />
                        <button type="button" onClick={handleAddressSearch}>찾기</button>
                    </div>
                </div>
                <div className="profileformGroup full-width">
                    <input 
                        type="text" 
                        name="address2" 
                        value={profileData.address2} 
                        onChange={handleChange} 
                        placeholder="상세 주소"
                    />
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
                        <option value="TE">TE</option>
                        <option value="OL">OL</option>
                        <option value="DL">DL</option>
                        <option value="LB">LB</option>
                        <option value="DB">DB</option>
                        <option value="K">K</option>
                        <option value="P">P</option>
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
                        <option value="adult">사회인 리그</option>
                    </select>
                </div>
                <div className="profileformGroup full-width">
                    <label>팀</label>
                    <div className="profileform-team" ref={teamDropdownRef}>
                        <div 
                            className={`profileform-team-select ${!profileData.team ? 'placeholder' : ''}`}
                            onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
                        >
                            {selectedTeam.logo && (
                                <img src={selectedTeam.logo} alt={selectedTeam.label} className="profileform-team-icon" />
                            )}
                            {selectedTeam.label}
                        </div>
                        {isTeamDropdownOpen && (
                            <div className="profileform-team-options">
                                {availableTeams.length > 0 ? (
                                    availableTeams.map((team, index) => (
                                        <div 
                                            key={index}
                                            className="profileform-team-option"
                                            onClick={() => handleTeamSelect(team.value)}
                                        >
                                            <img src={team.logo} alt={team.label} className="profileform-team-icon" />
                                            {team.label}
                                        </div>
                                    ))
                                ) : (
                                    <div className="profileform-team-no-options">지역을 먼저 선택해주세요.</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <button type="submit" className="profileformsubmitButton">프로필 생성</button>
        </form>
    );
};

export default SignupProfileForm;