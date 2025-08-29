// src/components/HeaderBar.jsx
import { useState, useRef, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import defaultLogo from '../../../assets/images/logos/Stechlogo.svg';
import './ServiceHeader.css';
import CalendarDropdown from '../../../components/Calendar.jsx';
import dayjs from 'dayjs';

/* 선택 가능한 팀 목록 (건아 이거 백 연결해둬라)*/
const TEAMS = [
    { name: 'ChungAng Blue Dragons', logo: '/assets/images/svg/teams/ChungAng Blue Dragons.svg' },
    { name: 'Dongguk Tuskers', logo: '/assets/images/svg/teams/Dongguk Tuskers.svg' },
    { name: 'Hanyang Lions', logo: '/assets/images/svg/teams/Hanyang Lions.svg' },
    { name: 'Hongik Cowboys', logo: '/assets/images/svg/teams/Hongik Cowboys.svg' },
    { name: 'HUFS Black Knights', logo: '/assets/images/svg/teams/HUFS Black Knights.svg' },
    { name: 'Konkuk Raging Bulls', logo: '/assets/images/svg/teams/Konkuk Raging Bulls.svg' },
    { name: 'Korea Univeristy Tigers', logo: '/assets/images/svg/teams/Korea Univeristy Tigers.svg' },
    { name: 'Kyunghee Commanders', logo: '/assets/images/svg/teams/Kyunghee Commanders.svg' },
    { name: 'Seoul Vikings', logo: '/assets/images/svg/teams/Seoul Vikings.svg' },
    { name: 'SNU Green Terrors', logo: '/assets/images/svg/teams/SNU Green Terrors.svg' },
    { name: 'Sogang Albatross', logo: '/assets/images/svg/teams/Sogang Albatross.svg' },
    { name: 'Soongsil crusaders', logo: '/assets/images/svg/teams/Soongsil crusaders.svg' },
    { name: 'UOS City Hawks', logo: '/assets/images/svg/teams/UOS City Hawks.svg' },
    { name: 'Yonsei Eagles', logo: '/assets/images/svg/teams/Yonsei Eagles.svg' },
];

const TYPES = ['Scrimmage', 'Friendly match', 'Season'];

const HeaderBar = ({ onNewVideo = () => {}, onReset = () => {} }) => {
    /* 선택된 팀 */
    /* --- 기존 state --- */
    const [team, setTeam] = useState(null);
    const [openTeam, setOpenTeam] = useState(false);

    /* --- Date picker state --- */
    const [showDate, setShowDate] = useState(false);
    const [selectedDate, setSelectedDate] = useState(dayjs()); // 초기: 오늘

    /* --- Type dropdown state --- */
    const [showType, setShowType] = useState(false);
    const [selectedType, setSelectedType] = useState(null);

    /* --- OPPS dropdown state --- */
    const [showOpps, setShowOpps] = useState(false);
    const [selectedOpps, setSelectedOpps] = useState(null);

    /* refs */
    const teamWrapRef = useRef(null);
    const dateWrapRef = useRef(null);
    const typeWrapRef = useRef(null);
    const oppsWrapRef = useRef(null);

    const resetFilters = () => {
        setSelectedDate(dayjs()); // Date 라벨을 "Date" 로 되돌림
        setSelectedType(null); // Type 초기화
        setSelectedOpps(null); // OPPS 초기화
        setShowDate(false);
        setShowType(false);
        setShowOpps(false);

        onReset(); // 필요하면 부모에게도 알림
    };

    /* 바깥 클릭 → Team/Date 드롭다운 모두 닫기 */
    useEffect(() => {
        const out = (e) => {
            const isIn = (ref) => ref.current && ref.current.contains(e.target);
            if (!isIn(teamWrapRef)) setOpenTeam(false);
            if (!isIn(dateWrapRef)) setShowDate(false);
            if (!isIn(typeWrapRef)) setShowType(false);
            if (!isIn(oppsWrapRef)) setShowOpps(false);
        };
        document.addEventListener('mousedown', out);
        return () => document.removeEventListener('mousedown', out);
    }, []);

    /* 선택 결과: 없으면 기본값 */
    const logoSrc = selectedOpps?.logo ?? team?.logo ?? defaultLogo;
    const label = team ? team.name : 'Choose Team';

    return (
        <header className="stechHeader">
            <div className="headerRow topRow">
                <img src={logoSrc} alt={label} className="teamLogo" />

                {/* Team picker */}
                <div className="teamPickerWrap" ref={teamWrapRef}>
                    <button className="teamPicker" onClick={() => setOpenTeam(!openTeam)}>
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
                                            setSelectedOpps(null); /* OPPS 초기화 */
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

            {/* ───── 2줄: 필터 + NewVideo ───── */}
            <div className="headerRow bottomRow">
                <div className="filterGroup">
                    {/* Date */}
                    <div className="datePickerWrap" ref={dateWrapRef}>
                        <button className={`filterButton ${showDate ? 'active' : ''}`} onClick={() => setShowDate(!showDate)}>
                            {' '}
                            {selectedDate.format('YYYY-MM-DD')} <FaChevronDown size={10} />
                        </button>
                        {showDate && (
                            <CalendarDropdown
                                value={selectedDate}
                                onChange={(d) => {
                                    setSelectedDate(d);
                                    setShowDate(false);
                                }}
                            />
                        )}
                    </div>

                    {/* Type */}
                    <div className="typePickerWrap" ref={typeWrapRef}>
                        <button className={`filterButton ${selectedType ? 'active' : ''}`} onClick={() => setShowType(!showType)}>
                            {selectedType ?? 'Type'} <FaChevronDown size={10} />
                        </button>
                        {showType && (
                            <ul className="typeDropdown">
                                {TYPES.map((t) => (
                                    <li key={t}>
                                        <button
                                            className={`typeItem ${selectedType === t ? 'active' : ''}`}
                                            onClick={() => {
                                                setSelectedType(t);
                                                setShowType(false);
                                            }}
                                        >
                                            {t}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* OPPS */}
                    <div className="oppsPickerWrap" ref={oppsWrapRef}>
                        <button className={`filterButton ${selectedOpps ? 'active' : ''}`} onClick={() => setShowOpps(!showOpps)}>
                            {selectedOpps ? selectedOpps.name : 'OPPS'} <FaChevronDown size={10} />
                        </button>
                        {showOpps && (
                            <ul className="oppsDropdown">
                                <li className="oppsHeader">Select Your Opponent</li>
                                {TEAMS.filter((t) => t.name !== team?.name).map((t) => (
                                    <li key={t.name}>
                                        <button
                                            className="oppsItem"
                                            onClick={() => {
                                                setSelectedOpps(t);
                                                setShowOpps(false);
                                            }}
                                        >
                                            <img src={t.logo} alt={t.name} /> {t.name}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Reset */}
                    <button className="resetButton" onClick={resetFilters}>
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
