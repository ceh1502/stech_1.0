// src/components/HeaderBar.jsx
import { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import defaultLogo from '../../../assets/images/logos/Stechlogo.svg';
import './ServiceHeader.css';

/* 선택 가능한 팀 목록 (건아 이거 백 연결해둬라)*/
const TEAMS = [
    { name: 'Hanyang Lions', logo: '/assets/images/logos/Hanyang%20Lions.svg' },
    { name: 'SK Wyverns', logo: '/assets/images/logos/Stechlogo.svg' },
    { name: 'LG Twins', logo: '/assets/images/logos/Stechlogo.svg' },
    { name: '이건, 손현빈, 이건', logo: '/assets/images/logos/Stechlogo.svg' },
];

const HeaderBar = ({ onNewVideo = () => {}, onReset = () => {} }) => {
    /* 선택된 팀 */
    const [team, setTeam] = useState(null); // null → Choose Team
    const [open, setOpen] = useState(false); // 드롭다운 열림 여부
    const wrapRef = useRef(null);

    /* 바깥 클릭 시 드롭다운 닫기 */
    useEffect(() => {
        const onClickOut = (e) => open && wrapRef.current && !wrapRef.current.contains(e.target) && setOpen(false);
        document.addEventListener('mousedown', onClickOut);
        return () => document.removeEventListener('mousedown', onClickOut);
    }, [open]);

    /* 선택 결과: 없으면 기본값 */
    const logoSrc = team ? team.logo : defaultLogo;
    const label = team ? team.name : 'Choose Team';

    return (
        <header className="stechHeader">
            {/* ───────── 1줄: 로고 + 팀 선택 ───────── */}
            <div className="headerRow topRow">
                <img src={logoSrc} alt={label} className="teamLogo" />

                <div className="teamPickerWrap" ref={wrapRef}>
                    <button className="teamPicker" onClick={() => setOpen((v) => !v)}>
                        {label} <FaChevronDown size={12} />
                    </button>

                    {/* 드롭다운: 헤더를 덮어쓰되, 높이를 밀지 않음 */}
                    {open && (
                        <ul className="teamDropdown">
                            {TEAMS.map((t) => (
                                <li key={t.name}>
                                    <button
                                        className="teamItem"
                                        onClick={() => {
                                            setTeam(t);
                                            setOpen(false);
                                        }}
                                    >
                                        <img src={t.logo} alt={t.name} /> {t.name}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* ───────── 2줄: 필터 ‖ New Video ───────── */}
            <div className="headerRow bottomRow">
                <div className="filterGroup">
                    {['Date', 'Type', 'OPPS', 'Game'].map((l) => (
                        <button key={l} className="filterButton">
                            {l} <FaChevronDown size={10} />
                        </button>
                    ))}
                    <button className="resetButton" onClick={onReset}>
                        Reset
                    </button>
                </div>

                <button className="newVideoButton" onClick={onNewVideo}>
                    New Video
                </button>
            </div>
        </header>
    );
};

export default HeaderBar;
