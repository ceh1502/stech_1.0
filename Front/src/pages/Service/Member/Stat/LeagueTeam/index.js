import { useState, useEffect } from 'react';
import StatTeam from '../../../../../components/Stat/StatTeam';
import { TEAMS } from '../../../../../data/TEAMS';

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
          // API 실패 시 목업 데이터 사용 (선택사항)
        }
      } catch (error) {
        console.error('팀 스탯 API 호출 에러:', error);
        // API 오류 시 목업 데이터 사용 (선택사항)
      } finally {
        setLoading(false);
      }
    };

    fetchTeamStats();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px' 
      }}>
        팀 스탯 로딩 중...
      </div>
    );
  }

  // 데이터가 없는 경우 처리
  if (!teamStatsData || teamStatsData.length === 0) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px' 
      }}>
        팀 스탯 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div>
      <StatTeam 
        data={teamStatsData}  // teamStatsData를 전달
        teams={TEAMS}
      />
    </div>
  );
};

export default LeagueTeamPage;