import { useState, useEffect } from 'react';
import StatTeam from '../../../../../components/Stat/StatTeam';
import { TEAMS } from '../../../../../data/TEAMS';
import {MOCKSTATTEAM} from '../../../../../data/mockStatTeam';

const LeagueTeamPage = () => {
  const [teamStatsData, setTeamStatsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:4000/api/team/season-stats/2024');
        
        if (response.ok) {
          const result = await response.json();
          console.log('🏆 팀 스탯 API 응답:', result);
          
          if (result.success && result.data) {
            // 백엔드 팀명을 프론트엔드 팀명으로 매핑
            const BACKEND_TO_FRONTEND_TEAM = {
              KKRagingBulls: "건국대 레이징불스",
              KHCommanders: "경희대 커맨더스", 
              SNGreenTerrors: "서울대 그린테러스",
              USCityhawks: "서울시립대 시티혹스",
              DGTuskers: "동국대 터스커스",
              KMRazorbacks: "국민대 레이저백스",
              YSEagles: "연세대 이글스",
              KUTigers: "고려대 타이거스",
              HICowboys: "홍익대 카우보이스",
              SSCrusaders: "숭실대 크루세이더스",
              HYLions: "한양대 라이온스",
              HFBlackKnights: "한국외국어대 블랙나이츠"
            };

            // 백엔드 데이터를 프론트엔드 형식으로 변환
            const transformedData = result.data.map(item => ({
              id: item.teamName,
              team: BACKEND_TO_FRONTEND_TEAM[item.teamName] || item.teamName,
              division: "1부",
              
              // 득점/경기 관련
              points_per_game: item.gamesPlayed > 0 ? (item.totalPoints / item.gamesPlayed).toFixed(1) : 0,
              total_points: item.totalPoints || 0,
              total_touchdowns: item.totalTouchdowns || 0,
              total_yards: item.totalYards || 0,
              yards_per_game: item.gamesPlayed > 0 ? (item.totalYards / item.gamesPlayed).toFixed(1) : 0,
              
              // 러시 관련
              rushing_attempts: item.rushingAttempts || 0,
              rushing_yards: item.rushingYards || 0,
              yards_per_carry: item.rushingAttempts > 0 ? (item.rushingYards / item.rushingAttempts).toFixed(1) : 0,
              rushing_yards_per_game: item.gamesPlayed > 0 ? (item.rushingYards / item.gamesPlayed).toFixed(1) : 0,
              rushing_td: item.rushingTouchdowns || 0,
              
              // 패스 관련
              "pass_completions-attempts": `${item.passCompletions || 0}-${item.passAttempts || 0}`,
              passing_yards: item.passingYards || 0,
              passing_yards_per_passing_attempts: item.passAttempts > 0 ? (item.passingYards / item.passAttempts).toFixed(1) : 0,
              passing_yards_per_game: item.gamesPlayed > 0 ? (item.passingYards / item.gamesPlayed).toFixed(1) : 0,
              passing_td: item.passingTouchdowns || 0,
              interceptions: item.interceptions || 0,
              
              // 스페셜팀 관련
              total_punt_yards: item.totalPuntYards || 0,
              average_punt_yards: item.totalPunts > 0 ? (item.totalPuntYards / item.totalPunts).toFixed(1) : 0,
              touchback_percentage: item.totalPunts > 0 ? ((item.puntTouchbacks / item.totalPunts) * 100).toFixed(1) : 0,
              "field_goal_completions-attempts": `${item.fieldGoalMakes || 0}-${item.fieldGoalAttempts || 0}`,
              yards_per_kick_return: item.kickReturns > 0 ? (item.kickReturnYards / item.kickReturns).toFixed(1) : 0,
              yards_per_punt_return: item.puntReturns > 0 ? (item.puntReturnYards / item.puntReturns).toFixed(1) : 0,
              total_return_yards: (item.kickReturnYards || 0) + (item.puntReturnYards || 0),
              
              // 기타
              "fumble-turnover": `${item.fumbles || 0}-${item.fumblesLost || 0}`,
              turnover_per_game: item.gamesPlayed > 0 ? (item.totalTurnovers / item.gamesPlayed).toFixed(1) : 0,
              turnover_rate: ((item.opponentTurnovers || 0) - (item.totalTurnovers || 0)),
              "penalty-pen_yards": `${item.penalties || 0}-${item.penaltyYards || 0}`,
              pen_yards_per_game: item.gamesPlayed > 0 ? (item.penaltyYards / item.gamesPlayed).toFixed(1) : 0,
              
              // 원본 데이터 유지
              season: item.season,
              gamesPlayed: item.gamesPlayed || 0
            }));
            
            console.log('🏆 변환된 팀 스탯 데이터:', transformedData);
            setTeamStatsData(transformedData);
          } else {
            console.error('팀 스탯 데이터 구조 오류:', result);
            setTeamStatsData([]);
          }
        } else {
          console.error('팀 스탯 데이터 조회 실패:', response.status);
          setTeamStatsData([]);
        }
      } catch (error) {
        console.error('팀 스탯 API 호출 에러:', error);
        setTeamStatsData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamStats();
  }, []);

  if (loading) {
    return <div>팀 스탯 로딩 중...</div>;
  }

  return (
    <div>
      <StatTeam data={teamStatsData} teams={TEAMS}/>
    </div>
  );
}
export default LeagueTeamPage;  