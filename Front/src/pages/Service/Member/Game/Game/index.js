// pages/Service/Game/GamePage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./GamePage.css";
import { TEAMS } from "../../../../../data/TEAMS";

const mockGames = [
  {
    gameKey: "2024-09-08-DGT-KMR",
    homeTeam: "한국외국어대학교 블랙나이츠",
    awayTeam: "고려대학교 타이거스",
    homeScore: 12,
    awayScore: 2,
    location: "서울대학교",
    length: "01:15:24",
    date: "2024-09-08",
  },
  {
    gameKey: "2024-10-01-HY-YS",
    homeTeam: "한양대학교 라이온스",
    awayTeam: "연세대학교 이글스",
    homeScore: 12,
    awayScore: 2,
    location: "서울대학교",
    length: "01:15:24",
    date: "2024-10-01",
  },
];

export default function GamePage() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);

  useEffect(() => {
    setGames(mockGames); // TODO: 실제 API로 교체
  }, []);

  const openClips = (game) => {
    // 라우터는 /service/games/:gameKey/clips 로 맞춰주세요 (v6 중첩경로)
    navigate(`/service/game/${game.gameKey}/clip`, { state: { game } });
  };

  return (
    <div className="game-list">
      {games.map((g) => {
        // ✅ TEAMS에서 완전일치로 메타 찾기 (GamePage에서)
        const homeMeta = TEAMS.find((t) => t.name === g.homeTeam);
        const awayMeta = TEAMS.find((t) => t.name === g.awayTeam);

        return (
          <div
            key={g.gameKey}
            className="game-card"
            onClick={() => openClips(g)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && openClips(g)}
          >
            <div className="date">{g.date}</div>

            <div className="game-teams">
              <div className="game-team left">
                {homeMeta?.logo && (
                  <img
                    src={homeMeta.logo}
                    alt={`${homeMeta.name} 로고`}
                    className={`team-logo ${homeMeta.logo.endsWith(".svg") ? "svg" : "png"}`}
                  />
                )}
                <span className="game-team-name">{g.homeTeam}</span>
              </div>

              <div className="game-score">
                {g.homeScore} : {g.awayScore}
              </div>

              <div className="game-team right">
                {awayMeta?.logo && (
                  <img
                    src={awayMeta.logo}
                    alt={`${awayMeta.name} 로고`}
                    className={`team-logo ${awayMeta.logo.endsWith(".svg") ? "svg" : "png"}`}
                  />
                )}
                                <span className="game-team-name">{g.awayTeam}</span>

              </div>
            </div>

            <div className="meta">
              <span>{g.location}</span> · <span>{g.length}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
