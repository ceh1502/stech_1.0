// src/components/Auth/SignupProfileForm.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { updateProfile, handleAuthError } from '../../api/authAPI';
import {useAuth} from '../../context/AuthContext';

const DAUM_POSTCODE_URL =
  'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

const SignupProfileForm = () => {
  const navigate = useNavigate();
  const {token} = useAuth();

  const [profileData, setProfileData] = useState({
    profileImage: null, // 파일은 서버 스펙상 직접 전송 불가(avatar는 URL만)
    realName: '',
    email: '',
    address1: '',
    address2: '',
    height: '',
    weight: '',
    age: '',
    grade: '',
    nationality: '',
    position: '',
    // 필요하면 URL 입력 칸을 따로 두고 avatarUrl 사용
    avatarUrl: '',
  });

  const [emailStatus, setEmailStatus] = useState(null);
  const [emailMessage, setEmailMessage] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const teamDropdownRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setProfileData((prev) => ({ ...prev, profileImage: e.target.files[0] }));
  };

  const handleAddressSearch = () => {
    if (!scriptLoaded) {
      alert('주소 검색 스크립트가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    new window.daum.Postcode({
      oncomplete: function (data) {
        let fullAddress = data.roadAddress;
        let extraAddress = '';
        if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) extraAddress += data.bname;
        if (data.buildingName !== '' && data.apartment === 'Y') {
          extraAddress += (extraAddress !== '' ? ', ' + data.buildingName : data.buildingName);
        }
        if (extraAddress !== '') fullAddress += ' (' + extraAddress + ')';
        setProfileData((prev) => ({ ...prev, address1: fullAddress, address2: '' }));
      },
    }).open();
  };

  const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const checkEmailAvailability = async (email) => {
    if (!isEmailValid(email)) {
      setEmailStatus('unavailable');
      setEmailMessage('유효한 이메일 형식이 아닙니다.');
      return;
    }
    setEmailStatus('available');
    setEmailMessage('사용 가능한 형식입니다.');
  };

  const handleEmailChange = (e) => {
    const email = e.target.value;
    setProfileData((prev) => ({ ...prev, email }));
    if (!email) {
      setEmailStatus(null);
      setEmailMessage('');
      return;
    }
    checkEmailAvailability(email);
  };

  useEffect(() => {
    if (window.daum?.Postcode) {
      setScriptLoaded(true);
      return;
    }
    let s = document.querySelector('script[data-daum-postcode]');
    if (!s) {
      s = document.createElement('script');
      s.src = DAUM_POSTCODE_URL;
      s.async = true;
      s.defer = true;
      s.dataset.daumPostcode = 'true';
      document.head.appendChild(s);
    }
    const onLoad = () => setScriptLoaded(true);
    const onError = () => setScriptLoaded(false);
    s.addEventListener('load', onLoad);
    s.addEventListener('error', onError);
    return () => {
      s.removeEventListener('load', onLoad);
      s.removeEventListener('error', onError);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!profileData.realName.trim()) return alert('성명을 입력해주세요.');
    if (!profileData.email.trim() || !isEmailValid(profileData.email)) {
      return alert('유효한 이메일을 입력해주세요.');
    }
    if (emailStatus && emailStatus !== 'available') {
      return alert(emailMessage || '이메일을 확인해주세요.');
    }

    // 서버 스펙에 맞춰 필드 구성
    const bioParts = [
      profileData.position && `포지션:${profileData.position}`,
      profileData.height && `키:${profileData.height}cm`,
      profileData.weight && `몸무게:${profileData.weight}kg`,
      profileData.age && `나이:${profileData.age}`,
      profileData.grade && `학년:${profileData.grade}`,
      profileData.nationality && `국적:${profileData.nationality}`,
      (profileData.address1 || profileData.address2) &&
        `주소:${profileData.address1} ${profileData.address2 || ''}`,
    ].filter(Boolean);

    const payload = {
      // avatar는 URL만 허용. 파일만 있고 업로드 URL이 없으면 생략.
      ...(profileData.avatarUrl?.trim() ? { avatar: profileData.avatarUrl.trim() } : {}),
      nickname: profileData.realName.trim(), // 서버는 nickname 필드를 요구
      email: profileData.email.trim(),
      bio: bioParts.join(' | ') || '',       // 선택
    };

    try {
      await updateProfile(payload, token);

      alert('프로필이 업데이트되었습니다.');
      navigate('/service');
    } catch (err) {
      console.error(err);
      alert(handleAuthError(err));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="profileForm">
      <div className="profileformtab-container">
        <button type="button" className="profileformTitle">프로필 생성</button>
      </div>

      {/* 프로필 이미지(파일 선택은 미리보기만, 서버 전송 X) */}
      <div className="profileformSection ">
        <div className="profileformimagePlaceholder">
          {profileData.profileImage ? (
            <img
              src={URL.createObjectURL(profileData.profileImage)}
              alt="Profile"
              className="profileformImage"
            />
          ) : (
            <div className="profileplaceholderText"></div>
          )}
        </div>
        <div className="profileimageButtons">
          <label htmlFor="profileformImage" className="profileformuploadButton">사진 업로드</label>
          <input
            type="file"
            id="profileformImage"
            name="profileformImage"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
          <button
            type="button"
            className="profileformremoveButton"
            onClick={() => setProfileData((prev) => ({ ...prev, profileImage: null }))}
          >
            삭제
          </button>
        </div>
        {/* 서버는 URL만 받으므로 URL 입력 칸 제공(선택) */}
        <div className="profileformGroup full-width" style={{ marginTop: 12 }}>
          <input
            type="text"
            name="avatarUrl"
            value={profileData.avatarUrl}
            onChange={handleChange}
            placeholder="프로필 이미지 URL (선택)"
          />
        </div>
      </div>

      <div className="profileformGrid">
        <div className="profileformGroup">
          <label>성명(표시명)</label>
          <input
            type="text"
            name="realName"
            value={profileData.realName}
            onChange={handleChange}
          />
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
            <div className={emailStatus === 'available'
              ? 'status-message status-success'
              : emailStatus === 'unavailable'
              ? 'status-message status-error'
              : 'status-message'}
            >
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
          <input
            type="text"
            name="height"
            value={profileData.height}
            onChange={handleChange}
            placeholder="cm"
          />
        </div>
        <div className="profileformGroup">
          <label>몸무게</label>
          <input
            type="text"
            name="weight"
            value={profileData.weight}
            onChange={handleChange}
            placeholder="kg"
          />
        </div>
        <div className="profileformGroup">
          <label>나이</label>
          <input
            type="text"
            name="age"
            value={profileData.age}
            onChange={handleChange}
          />
        </div>

        <div className="profileformGroup">
          <label>학년</label>
          <input
            type="text"
            name="grade"
            value={profileData.grade}
            onChange={handleChange}
            placeholder="예: 2학년"
          />
        </div>
        <div className="profileformGroup">
          <label>국적</label>
          <input
            type="text"
            name="nationality"
            value={profileData.nationality}
            onChange={handleChange}
            placeholder="예: KOR"
          />
        </div>

        <div className="profileformGroup">
          <label>포지션 (주포지션)</label>
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
      </div>

      <button type="submit" className="profileformsubmitButton">프로필 생성</button>
    </form>
  );
};

export default SignupProfileForm;
