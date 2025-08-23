import React, { useEffect, useState } from 'react';
import './ProfileMain.css';
import './ProfileClip.css';
import { teamData } from '../../data/teamData';

const ProfileClip = () => {
  // 예시 데이터
  const [clips, setClips] = useState([
    {
      date: "2024-10-13(수) 오전 10:00",
      league: "SAFA 2024 Fall Bowl",
      region: "서울1",
      home: "연세",
      away: "한양",
      score: "14-12",
      round: "1라운드",
      stadium: "서울대경기장",
      reportUrl: "#",
      clipTime: "01:15:24",
      videoUrl: "https://www.youtube.com/watch?v=bXQdsjw5qUU" 
    }
  ]);


  // 백엔드에서 경기/클립 데이터 가져오기 
  const fetchClips = async () => {
    try {
      const res = await fetch("/api/clips");
      const data = await res.json();
      setClips(data);
    } catch (err) {
      console.error("클립 불러오기 실패", err);
    }
  };

  useEffect(() => {
    fetchClips();
  }, []);

  const getTeamInfo = (region, teamValue) => {
    const teamList = teamData[region] || [];
    return teamList.find(team => team.value === teamValue) || {};
  };

  return (
    <div className="profile-main">
      <div className="profile-buttons-top">
        <a href="./teamplayer" type="button" className="profile-button">팀 선수 스탯</a>
        <a href="./modify" type="button" className="profile-button">프로필 수정</a>
        <a href="./clip" type="button" className="profile-button active">메모 클립 영상</a>
        <a href="./manage" type="button" className="profile-button">구단 관리</a>
      </div>

      {/* 메모 클립 영상 섹션 */}
      <div className="profile-container">
        <div className="profile-title-container">
          <h1 className="profile-title">메모 클립 영상</h1>
        </div>

        <div className="clip-list">
          {clips.map((clip, index) => {
            console.log('클립 데이터:', clip); 
            const homeTeam = getTeamInfo(clip.region, clip.home);
            console.log('함수가 반환한 홈 팀 정보:', homeTeam); 
            const awayTeam = getTeamInfo(clip.region, clip.away);

            return (
              <div className="clip-card" key={index}>
                <span className="clip-date">{clip.date}</span>
                <div className="clip-team">
                  <img src={homeTeam.logo} alt={homeTeam.label} className="clip-logo" />
                  <span className="clip-team-name">{homeTeam.label}</span>
                </div>
                <div className="clip-score">{clip.score}</div>
                <div className="clip-team">
                  <img src={awayTeam.logo} alt={awayTeam.label} className="clip-logo" />
                  <span className="clip-team-name">{awayTeam.label}</span>
                </div>
                <span className="clip-league">{clip.league}</span>
                <span className="clip-round">{clip.round}</span>
                <span className="clip-stadium">{clip.stadium}</span>
                <a href={clip.reportUrl} className="clip-report">Report Created</a>
                <span className="clip-report-icon">📄</span>
                <a href={clip.videoUrl} target="_blank" rel="noopener noreferrer" className="clip-video-link">
                  <span className="clip-play-icon">▶️</span>
                </a>
                <span className="clip-time">{clip.clipTime}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfileClip;