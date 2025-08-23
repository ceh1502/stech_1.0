import { useState, useEffect } from 'react';
import StatTeam from '../../../../../components/Stat/StatTeam';
import { mockData } from '../../../../../data/mockData';
import { TEAMS } from '../../../../../data/TEAMS';
/** StatTeam의 data prop — 기본 필터(서울/1부/득점/경기)에 맞춰 한 팀만 */
const MOCK_DATA = [
  {
    id: "hyu-2024",
    team: "한양대학교 라이온스",
    division: "1부",

    /* 득점/경기 탭(기본 표시) */
    points_per_game: 24.5,
    total_points: 196,
    total_touchdowns: 28,
    total_yards: 1680,
    yards_per_game: 420,

    /* run 탭 */
    rushing_attempts: 180,
    rushing_yards: 980,
    yards_per_carry: 5.4,
    rushing_yards_per_game: 245,
    rushing_td: 12,

    /* pass 탭 */
    "pass_completions-attempts": "92-150",
    passing_yards: 700,
    passing_yards_per_passing_attempts: 4.7,
    passing_yards_per_game: 175,
    passing_td: 10,
    interceptions: 3,

    /* 스페셜팀 탭 */
    total_punt_yards: 600,
    average_punt_yards: 38.5,
    touchback_percentage: 12.5, // %로 렌더됨
    "field_goal_completions-attempts": "8-12",
    yards_per_kick_return: 22.3,
    yards_per_punt_return: 9.4,
    total_return_yards: 410,

    /* 기타 탭 */
    "fumble-turnover": "6-2",
    turnover_per_game: 1.0,
    turnover_rate: 4.5,
    "penalty-pen_yards": "20-180",
    pen_yards_per_game: 45,
  },
];

const LeagueTeamPage = () => {
  const [teamStatsData, setTeamStatsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:4000/api/team/season-stats/2024');
        
        if (response.ok) {
          const data = await response.json();
          setTeamStatsData(data.data || []);
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