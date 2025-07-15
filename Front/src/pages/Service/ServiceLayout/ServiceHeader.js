// src/components/HeaderBar.jsx
import React from 'react';
import { FaChevronDown } from 'react-icons/fa';
import './ServiceHeader.css';

const HeaderBar = ({
    teamName = 'Hanyang Lions',
    teamLogo = '/images/hanyang-lions.png', // 필요하면 경로 교체
    onNewVideo = () => {},
    onReset = () => {},
}) => {
    return (
        <header className="stechHeader">
            {/* ── 팀 선택 + 필터 ───────────────────────── */}
            <div className="headerLeft">
                {/* 팀 로고 */}
                <img src={teamLogo} alt={teamName} className="teamLogo" />

                {/* 팀 드롭다운(실제 드롭 기능은 나중에 연결) */}
                <button className="teamPicker">
                    {teamName} <FaChevronDown size={12} />
                </button>

                {/* 필터 버튼 그룹 */}
                <div className="filterGroup">
                    {['Date', 'Type', 'OPPS', 'Game'].map((label) => (
                        <button key={label} className="filterButton">
                            {label} <FaChevronDown size={10} />
                        </button>
                    ))}
                    <button className="resetButton" onClick={onReset}>
                        Reset
                    </button>
                </div>
            </div>

            {/* ── New Video 버튼 ──────────────────────── */}
            <button className="newVideoButton" onClick={onNewVideo}>
                New Video
            </button>
        </header>
    );
};

export default HeaderBar;
