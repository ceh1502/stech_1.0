// src/components/Auth/SignupProfileForm.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// (선택) 로그인 유저 정보 필요하면 사용
// import { useAuth } from '../../context/AuthContext';

const DAUM_POSTCODE_URL =
  'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';

const SignupProfileForm = () => {
  const navigate = useNavigate();
  // const { user } = useAuth(); // 필요 시 사용 (teamName, region 등 표시만 하고 편집은 안 함)

  const [profileData, setProfileData] = useState({
    profileImage: null,

    // ✅ 백엔드 스키마 매핑 대상
    realName: '',
    email: '',

    address1: '',
    address2: '',

    height: '',
    weight: '',
    age: '',
    grade: '',        // 학년(선택)
    nationality: '',  // 국적(선택)

    position: '',     // UI에서는 단일 포지션 선택 → PS1에 매핑
  });

  const [emailStatus, setEmailStatus] = useState(null);
  const [emailMessage, setEmailMessage] = useState('');
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const teamDropdownRef = useRef(null); // (남겨두었지만 현재 미사용)

  /* ---------- change handlers ---------- */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setProfileData((prev) => ({ ...prev, profileImage: e.target.files[0] }));
  };

  /* ---------- 주소 검색 ---------- */
  const handleAddressSearch = () => {
    if (!scriptLoaded) {
      alert('주소 검색 스크립트가 아직 로드되지 않았습니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    new window.daum.Postcode({
      oncomplete: function (data) {
        let fullAddress = '';
        let extraAddress = '';

        // (도로명/지번 상관없이 도로명 사용)
        fullAddress = data.roadAddress;

        if (data.bname !== '' && /[동|로|가]$/g.test(data.bname)) {
          extraAddress += data.bname;
        }
        if (data.buildingName !== '' && data.apartment === 'Y') {
          extraAddress += (extraAddress !== '' ? ', ' + data.buildingName : data.buildingName);
        }
        if (extraAddress !== '') {
          fullAddress += ' (' + extraAddress + ')';
        }

        setProfileData((prev) => ({
          ...prev,
          address1: fullAddress,
          address2: '',
        }));
      },
    }).open();
  };

  /* ---------- 이메일 유효성/중복 체크(샘플) ---------- */
  const isEmailValid = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const checkEmailAvailability = async (email) => {
    setEmailStatus('checking');
    setEmailMessage('확인 중...');

    // TODO: 실제 API로 교체
    await new Promise((resolve) => setTimeout(resolve, 700));

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
    setProfileData((prev) => ({ ...prev, email }));

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

  const getStatusClass = (status) => {
    if (status === 'available') return 'status-message status-success';
    if (status === 'unavailable') return 'status-message status-error';
    return 'status-message';
  };

  /* ---------- 다음 우편번호 스크립트 로드 ---------- */
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

  /* ---------- 제출 ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (emailStatus && emailStatus !== 'available') {
      alert(emailMessage || '이메일을 확인해주세요.');
      return;
    }

    // 숫자 필드 파싱
    const toNumOrNull = (v) => {
      if (v === '' || v === null || v === undefined) return null;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    };

    // ✅ 백엔드 스키마에 맞춘 payload
    const payload = {
      // 상위 유저 필드는 이미 생성되어 있으므로 보통 profile만 보냄
      profile: {
        playerKey: null,
        realName: profileData.realName || null,
        status: null,
        positions: {
          PS1: profileData.position || null,
          PS2: null,
          PS3: null,
          PS4: null,
          PS5: null,
          PS6: null,
          PS7: null,
          PS8: null,
          PS9: null,
          PS10: null,
        },
        physicalInfo: {
          height: toNumOrNull(profileData.height),
          weight: toNumOrNull(profileData.weight),
          age: toNumOrNull(profileData.age),
          grade: profileData.grade || null,
          nationality: profileData.nationality || null,
        },
        contactInfo: {
          email: profileData.email || null,
          address1: profileData.address1 || null,
          address2: profileData.address2 || null,
        },
      },
    };

    try {
      // TODO: 실제 API 호출로 교체 (예: PATCH /auth/profile 또는 /users/me/profile)
      // const res = await fetch('/api/profile', { method: 'PATCH', headers: {...}, body: JSON.stringify(payload) });
      console.log('➡️ Submit payload:', payload);

      alert('프로필이 생성되었습니다.');
      navigate('/service');
    } catch (err) {
      console.error(err);
      alert('프로필 생성에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  /* ---------- 렌더 ---------- */
  return (
    <form onSubmit={handleSubmit} className="profileForm">
      <div className="profileformtab-container">
        <button type="button" className="profileformTitle">프로필 생성</button>
      </div>

      {/* 프로필 이미지 */}
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
      </div>

      <div className="profileformGrid">
        {/* 성명 → realName */}
        <div className="profileformGroup">
          <label>성명</label>
          <input
            type="text"
            name="realName"
            value={profileData.realName}
            onChange={handleChange}
          />
        </div>

        {/* 이메일 */}
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
            <div className={getStatusClass(emailStatus)}>{emailMessage}</div>
          )}
        </div>

        {/* 주소 */}
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

        {/* 신체 정보 */}
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

        {/* 선택 필드: 학년/국적 */}
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

        {/* 포지션 → positions.PS1 */}
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
