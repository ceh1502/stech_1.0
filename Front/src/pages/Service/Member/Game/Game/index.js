// pages/Service/Game/GamePage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 예시: 실제로는 API로 경기 목록을 가져오세요
const mockGames = [
  {
    gameKey: '2024-09-08-DGT-KMR',
    homeTeam: '한국외국어대학교 블객나이츠',
    awayTeam: '고려대학교 타이거스',
    date: '2024-09-08',
  },
  {
    gameKey: '2024-10-01-HY-YS',
    homeTeam: '한양대학교 라이온스',
    awayTeam: '연세대학교 이글스',
    date: '2024-10-01',
  },
];

export default function GamePage() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);

  useEffect(() => {
    setGames(mockGames); // TODO: API로 대체
  }, []);

  const openClips = (game) => {
    navigate(`/service/game/${game.gameKey}/clip`, { state: { game } });
  };

  return (
    <div>
      <h1>Game Page</h1>
      <div className="game-list">
        {games.map((g) => (
          <div key={g.gameKey} className="game-card" onClick={() => openClips(g)}>
            <div>{g.date}</div>
            <div>{g.homeTeam} vs {g.awayTeam}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
