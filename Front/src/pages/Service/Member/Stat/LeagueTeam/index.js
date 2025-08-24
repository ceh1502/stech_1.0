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
      <StatTeam data={MOCKSTATTEAM} teams={TEAMS}/>
    </div>
  );
}
export default LeagueTeamPage;  