import React, { useState, useEffect } from 'react';
import './ProfileMain.css';
import './ProfileModify.css';
import { teamData } from '../../data/teamData'; 
import Eye from '../../assets/images/png/AuthPng/Eye.png';
import EyeActive from '../../assets/images/png/AuthPng/EyeActive.png';

// 백엔드 연결 부분
const fetchProfileDataFromBackend = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
        profileImage: 'https://via.placeholder.com/250x300',
        fullName: '홍길동',
        email: 'test@example.com',
        address1: '서울시 강남구 테헤란로 123',
        address2: '멀티캠퍼스',
        height: '180',
        weight: '75',
        position: 'QB',
        age: '28',
        career: '5',
        region: 'seoul-first',
        team: 'hanyang'
    };
};


const ProfileModify = () => {
    const [profileData, setProfileData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    });

    useEffect(() => {
        const loadProfile = async () => {
            const data = await fetchProfileDataFromBackend();
            setProfileData(data);
            setIsLoading(false);
        };
        loadProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileData(prevData => ({
                    ...prevData,
                    profileImage: reader.result
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageDelete = () => {
        setProfileData(prevData => ({
            ...prevData,
            profileImage: null
        }));
    };

    const handleSave = () => {
        // 유효성 검사 로직
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(profileData.email)) {
            alert('유효한 이메일 주소를 입력해주세요.');
            return;
        }

        if (isNaN(profileData.height) || isNaN(profileData.weight) || isNaN(profileData.age) || isNaN(profileData.career)) {
            alert('키, 몸무게, 나이, 경력은 숫자만 입력 가능합니다.');
            return;
        }

        // 백엔드에 수정된 데이터 전송 로직
        console.log("Saving changes...", profileData);
        alert('변경사항이 저장되었습니다!');
    };

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

    // 비밀번호 입력 핸들러
    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswords(prevPasswords => ({
            ...prevPasswords,
            [name]: value
        }));
    };

    // 비밀번호 변경 버튼 클릭 핸들러
    const handlePasswordSave = () => {
        const { currentPassword, newPassword, confirmNewPassword } = passwords;

        // 현재 비밀번호 확인 (백엔드 로직 필요)
        // 이 부분은 실제 백엔드와 통신하여 현재 비밀번호가 맞는지 확인해야 함!!!!!
        // 현재는 더미로직으로 처리 중이에요
        // if (currentPassword !== 'dummy_password') {
        //     alert('현재 비밀번호가 일치하지 않습니다.');
        //     return;
        // }

        // 새로운 비밀번호와 확인 비밀번호 일치 여부 확인
        if (newPassword !== confirmNewPassword) {
            alert('새로운 비밀번호와 확인 비밀번호가 일치하지 않습니다.');
            return;
        }

        // 새로운 비밀번호 최소 8자 확인
        if (newPassword.length < 8) {
            alert('새로운 비밀번호는 최소 8자 이상이어야 합니다.');
            return;
        }

        // 모든 유효성 검사 통과 시
        console.log("Password change successful!");
        alert('비밀번호가 성공적으로 변경되었습니다!');
    };

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
                <a href="./modify" type="button" className="profile-button active">프로필 수정</a>
                <a href="./clip" type="button" className="profile-button">메모 클립 영상</a>
                <a href="./manage" type="button" className="profile-button">구단 관리</a>
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
                        <div className="profile-image-buttons">
                            <label htmlFor="file-upload" className="profile-image-button">사진 업로드</label>
                            <input id="file-upload" type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                            <button onClick={handleImageDelete} className="profile-image-button delete">삭제</button>
                        </div>
                    </div>

                    <div className="profile-info-section">
                        <div className="profile-info-grid">
                            <div className="profile-form-group">
                                <label >성명</label>
                                <input id="fullName" name="fullName" type="text" value={profileData.fullName} onChange={handleChange} className="profile-input" />
                            </div>
                            <div className="profile-form-group">
                                <label >이메일</label>
                                <input id="email" name="email" type="email" value={profileData.email} onChange={handleChange} className="profile-input" />
                            </div>
                            <div className="profile-form-group full-width">
                                <label >주소</label>
                                <input id="address1" name="address1" type="text" value={profileData.address1} onChange={handleChange} className="profile-input" />
                                <input id="address2" name="address2" type="text" value={profileData.address2} onChange={handleChange} className="profile-input mt-2" />
                            </div>
                        </div>
                        <div className="profile-info-four-column">
                            <div className="profile-form-group">
                                <label >키(cm)</label>
                                <input id="height" name="height" type="text" value={profileData.height} onChange={handleChange} className="profile-input" />
                            </div>
                            <div className="profile-form-group">
                                <label>몸무게(kg)</label>
                                <input id="weight" name="weight" type="text" value={profileData.weight} onChange={handleChange} className="profile-input" />
                            </div>
                            <div className="profile-form-group">
                                <label>나이</label>
                                <input id="age" name="age" type="text" value={profileData.age} onChange={handleChange} className="profile-input" />
                            </div>
                            <div className="profile-form-group">
                                <label>경력(년)</label>
                                <input id="career" name="career" type="text" value={profileData.career} onChange={handleChange} className="profile-input" />
                            </div>
                        </div>
                        <div className="profile-info-three-column">
                            <div className="profile-form-group">
                                <label>포지션</label>
                                <input id="position" name="position" type="text" value={profileData.position} onChange={handleChange} className="profile-input" />
                            </div>
                            <div className="profile-form-group">
                                <label>지역</label>
                                <p className="profile-input">
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
                <div className="profile-save-container">
                    <button onClick={handleSave} className="profile-save-button">변경사항 저장</button>
                </div>
            </div>

            <div className="profile-container">
                <div className="profile-title-container">
                    <h1 className="profile-title">비밀번호 변경</h1>
                </div>
                <div className="password-change-section">
                    <div className="profile-form-group">
                        <label >현재 비밀번호</label>
                        <div className="input-with-icon">
                            <input
                                id="currentPassword"
                                name="currentPassword"
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={passwords.currentPassword}
                                onChange={handlePasswordChange}
                                className="profile-input-password"
                            />
                            <button
                                type="button"
                                className="profilepasswordToggleButton"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                                {showCurrentPassword ? (
                                    <img src={EyeActive} alt="hide Password" />
                                ) : (
                                    <img src={Eye} alt="show Password" />
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="profile-form-group">
                        <label >새로운 비밀번호</label>
                        <div className="input-with-icon">
                            <input
                                id="newPassword"
                                name="newPassword"
                                type={showPassword ? 'text' : 'password'}
                                value={passwords.newPassword}
                                onChange={handlePasswordChange}
                                className="profile-input-password"
                                placeholder="최소 8자"
                            />
                            <button
                                type="button"
                                className="profilepasswordToggleButton"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <img src={EyeActive} alt="hide Password" />
                                ) : (
                                    <img src={Eye} alt="show Password" />
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="profile-form-group">
                        <label >새로운 비밀번호 확인</label>
                        <div className="input-with-icon">
                            <input
                                id="confirmNewPassword"
                                name="confirmNewPassword"
                                type={showPasswordConfirm ? 'text' : 'password'}
                                value={passwords.confirmNewPassword}
                                onChange={handlePasswordChange}
                                className="profile-input-password"
                            />
                            <button
                                type="button"
                                className="profilepasswordToggleButton"
                                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                            >
                                {showPasswordConfirm ? (
                                    <img src={EyeActive} alt="hide Password" />
                                ) : (
                                    <img src={Eye} alt="show Password" />
                                )}
                            </button>
                        </div>
                    </div>
                    <div className="profile-save-container">
                        <button onClick={handlePasswordSave} className="profile-save-button">비밀번호 변경</button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ProfileModify;