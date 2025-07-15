// src/components/HeaderBar.jsx
import { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import defaultLogo from '../../../assets/images/logos/Stechlogo.svg';
import './ServiceHeader.css';
import CalendarDropdown from '../../../components/Calendar.jsx';
import dayjs from 'dayjs';

/* 선택 가능한 팀 목록 (건아 이거 백 연결해둬라)*/
const TEAMS = [
    { name: 'Hanyang Lions', logo: '/assets/images/logos/Hanyang%20Lions.svg' },
    { name: 'SK Wyverns', logo: '/assets/images/logos/Stechlogo.svg' },
    { name: 'LG Twins', logo: '/assets/images/logos/Stechlogo.svg' },
    { name: '이건, 손현빈, 이건', logo: '/assets/images/logos/Stechlogo.svg' },
];

const today = () => new Date().toISOString().split('T')[0]; // 'YYYY‑MM‑DD'

const HeaderBar = ({ onNewVideo = () => {}, onReset = () => {} }) => {
    /* 선택된 팀 */
    const [team, setTeam] = useState(null); // null → Choose Team
    const [openTeam, setOpenTeam] = useState(false); // 드롭다운 열림 여부
    const [showDate, setShowDate] = useState(false);
    const [selectedDate, setSelectedDate] = useState(dayjs());
    const teamWrapRef = useRef(null);
    const dateWrapRef = useRef(null);

    /* 바깥 클릭 → Team/Date 드롭다운 모두 닫기 */
    useEffect(() => {
        const onClickOut = (e) => {
            if (openTeam && teamWrapRef.current && !teamWrapRef.current.contains(e.target)) {
                setOpenTeam(false);
            }
            if (showDate && dateWrapRef.current && !dateWrapRef.current.contains(e.target)) {
                setShowDate(false);
            }
        };
        document.addEventListener('mousedown', onClickOut);
        return () => document.removeEventListener('mousedown', onClickOut);
    }, [openTeam, showDate]);

    /* 선택 결과: 없으면 기본값 */
    const logoSrc = team ? team.logo : defaultLogo;
    const label = team ? team.name : 'Choose Team';

    return (
        <header className="stechHeader">
            {/* ───── 1줄: 로고 + 팀 픽커 ───── */}
            <div className="headerRow topRow">
                <img src={logoSrc} alt={label} className="teamLogo" />

                <div className="teamPickerWrap" ref={teamWrapRef}>
                    <button className="teamPicker" onClick={() => setOpenTeam((v) => !v)}>
                        {label} <FaChevronDown size={12} />
                    </button>

                    {openTeam && (
                        <ul className="teamDropdown">
                            {TEAMS.map((t) => (
                                <li key={t.name}>
                                    <button
                                        className="teamItem"
                                        onClick={() => {
                                            setTeam(t);
                                            setOpenTeam(false);
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
            {/* ───── 2줄: 필터 + New Video ───── */}
            <div className="headerRow bottomRow">
                <div className="filterGroup">
                    {/* Date 필터 */}
                    <div className="datePickerWrap" ref={dateWrapRef}>
                        <button className="filterButton" onClick={() => setShowDate((v) => !v)}>
                            {selectedDate.format('YYYY-MM-DD')} <FaChevronDown size={10} />
                        </button>

                        {showDate && (
                            <CalendarDropdown
                                value={selectedDate}
                                onChange={(d) => {
                                    setSelectedDate(d);
                                    setShowDate(false); // 날짜 고르면 자동 닫힘
                                }}
                            />
                        )}
                    </div>

                    {/* 나머지 필터 */}
                    {['Type', 'OPPS', 'Game'].map((l) => (
                        <button key={l} className="filterButton">
                            {l} <FaChevronDown size={10} />
                        </button>
                    ))}

                    <button className="resetButton" onClick={onReset}>
                        Reset
                    </button>
                </div>

                <button className="newVideoButton" onClick={onNewVideo}>
                    New Video
                </button>
            </div>
        </header>
    );
};

export default HeaderBar;
