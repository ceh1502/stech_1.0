import React, { useState } from 'react';
import './ProfileMain.css';
import './ProfileTeamPlayer.css';
import { mockData } from '../../data/teamplayermock';

const ProfileTeamPlayer = () => {
    const [selectedFilter, setSelectedFilter] = useState('전체');
    const [selectedPosition, setSelectedPosition] = useState('QB');

    const currentData = mockData[selectedPosition];

    return (
        <div className="profile-main">
            <div className="profile-buttons-top">
                <a href="./teamplayer" type="button" className="profile-button active">팀 선수 스탯</a>
                <a href="./modify" type="button" className="profile-button">프로필 수정</a>
                <a href="./clip" type="button" className="profile-button">메모 클립 영상</a>
                <a href="./manage" type="button" className="profile-button">구단 관리</a>
            </div>

            <div className="profile-container">
                <div className="profile-title-container">
                    <h1 className="profile-title">선수 스탯</h1>
                </div>

                <div className="dropdowns-container">
                    <select
                        className="dropdown"
                        value={selectedFilter}
                        onChange={(e) => setSelectedFilter(e.target.value)}
                    >
                        <option value="전체">전체</option>
                        <option value="시즌">시즌</option>
                        <option value="경기">경기</option>
                    </select>

                    <select
                        className="dropdown"
                        value={selectedPosition}
                        onChange={(e) => setSelectedPosition(e.target.value)}
                    >
                        {Object.keys(mockData).map((pos, index) => (
                            <option key={index} value={pos}>{pos}</option>
                        ))}
                    </select>
                </div>

                <div className="stats-table-container">
                    <h2 className="stats-title">{currentData.title}</h2>
                    <table className="stats-table">
                        <thead>
                            <tr>
                                {currentData.columns.map((col, index) => (
                                    <th key={index}>{col}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {currentData.data.map((player, index) => (
                                <tr key={index}>
                                    <td>{player.rank}위</td>
                                    <td>{player.name}</td>
                                    {player.stats.map((stat, statIndex) => (
                                        <td key={statIndex}>{stat}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProfileTeamPlayer;

