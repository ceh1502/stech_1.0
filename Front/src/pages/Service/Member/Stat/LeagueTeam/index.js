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
        const response = await fetch(
          'http://localhost:4000/api/team/total-stats',
        );

        if (response.ok) {
          const result = await response.json();
          console.log('🏆 팀 스탯 API 응답:', result);

          if (result.success && result.data) {
            // 백엔드 팀명을 프론트엔드 팀명으로 매핑
            const BACKEND_TO_FRONTEND_TEAM = {
              KKRagingBulls: '건국대 레이징불스',
              KHCommanders: '경희대 커맨더스',
              SNGreenTerrors: '서울대 그린테러스',
              USCityhawks: '서울시립대 시티혹스',
              DGTuskers: '동국대 터스커스',
              KMRazorbacks: '국민대 레이저백스',
              YSEagles: '연세대 이글스',
              KUTigers: '고려대 타이거스',
              HICowboys: '홍익대 카우보이스',
              SSCrusaders: '숭실대 크루세이더스',
              HYLions: '한양대 라이온스',
              HFBlackKnights: '한국외대 블랙나이츠',
              GSDragons: '경성대 드래곤스',
              DSBlueDolphons: '동서대 블루돌핀스',
            };

            // 백엔드 데이터를 프론트엔드 형식으로 변환
            const transformedData = result.data.map((item) => ({
              id: item.teamName,
              team: BACKEND_TO_FRONTEND_TEAM[item.teamName] || item.teamName,
              division: '1부',

              // 득점/경기 관련 (DB 구조에 맞게 수정)
              points_per_game: item.gamesPlayed > 0 
                ? (((item.stats?.touchdowns || 0) * 6 + (item.stats?.fieldGoals || 0) * 3) / item.gamesPlayed).toFixed(1)
                : 0,
              total_points: (item.stats?.touchdowns || 0) * 6 + (item.stats?.fieldGoals || 0) * 3,
              total_touchdowns: item.stats?.touchdowns || 0,
              total_yards: item.stats?.totalYards || 0,
              yards_per_game:
                item.gamesPlayed > 0
                  ? (item.stats?.totalYards / item.gamesPlayed).toFixed(1)
                  : 0,

              // 러시 관련 (DB 구조에 맞게 수정)
              rushing_attempts: item.stats?.rushingAttempts || 0,
              rushing_yards: item.stats?.rushingYards || 0,
              yards_per_carry:
                item.stats?.rushingAttempts > 0
                  ? (item.stats?.rushingYards / item.stats?.rushingAttempts).toFixed(1)
                  : 0,
              rushing_yards_per_game:
                item.gamesPlayed > 0
                  ? (item.stats?.rushingYards / item.gamesPlayed).toFixed(1)
                  : 0,
              rushing_td: item.stats?.touchdowns || 0, // 전체 TD (러싱+패싱)

              // 패스 관련 (DB 구조에 맞게 수정)
              'pass_completions-attempts': `${item.stats?.passingCompletions || 0}-${item.stats?.passingAttempts || 0}`,
              passing_yards: item.stats?.passingYards || 0,
              passing_yards_per_passing_attempts: 
                item.stats?.passingAttempts > 0
                  ? (item.stats?.passingYards / item.stats?.passingAttempts).toFixed(1)
                  : 0,
              passing_yards_per_game:
                item.gamesPlayed > 0
                  ? (item.stats?.passingYards / item.gamesPlayed).toFixed(1)
                  : 0,
              passing_td: item.stats?.touchdowns || 0, // 전체 TD
              interceptions: item.stats?.interceptions || 0,

              // 스페셜팀 관련 (DB 구조에 맞게 수정)
              total_punt_yards: item.stats?.puntYards || 0,
              average_punt_yards: item.stats?.avgPuntYards || 0,
              touchback_percentage: item.stats?.puntAttempts > 0 
                ? ((item.stats?.touchbacks || 0) / item.stats.puntAttempts * 100).toFixed(1) 
                : 0,
              'field_goal_completions-attempts': `${item.stats?.fieldGoals || 0}-${item.stats?.fieldGoalAttempts || 0}`,
              yards_per_kick_return: item.stats?.kickReturns > 0 
                ? (item.stats?.kickoffReturnYards / item.stats.kickReturns).toFixed(1) 
                : 0,
              yards_per_punt_return: item.stats?.puntReturns > 0 
                ? (item.stats?.puntReturnYards / item.stats.puntReturns).toFixed(1) 
                : 0,
              total_return_yards: item.stats?.returnYards || 0,

              // 기타 (DB 구조에 맞게 수정)
              'fumble-turnover': `${item.stats?.fumbles || 0}-${item.stats?.fumblesLost || 0}`,
              turnover_per_game: item.gamesPlayed > 0 ? (item.stats?.turnovers / item.gamesPlayed).toFixed(1) : 0,
              turnover_rate: (item.stats?.passingAttempts + item.stats?.rushingAttempts) > 0 
                ? ((item.stats?.turnovers || 0) / (item.stats.passingAttempts + item.stats.rushingAttempts) * 100).toFixed(1) 
                : 0,
              'penalty-pen_yards': `${item.stats?.penalties || 0}-${item.stats?.penaltyYards || 0}`,
              pen_yards_per_game: item.gamesPlayed > 0 ? ((item.stats?.penaltyYards || 0) / item.gamesPlayed).toFixed(1) : 0,

              // 원본 데이터 유지
              season: item.season,
              gamesPlayed: item.gamesPlayed || 0,
            }));

            console.log('🏆 변환된 팀 스탯 데이터:', transformedData);
            setTeamStatsData(transformedData);
          } else {
            console.error('팀 스탯 데이터 구조 오류:', result);
            setTeamStatsData([]);
          }
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '200px',
        }}
      >
        팀 스탯 로딩 중...
      </div>
    );
  }

  if (!teamStatsData || teamStatsData.length === 0) {
    return (
      <div>
       <StatTeam data={[]} teams={TEAMS} />
      </div>
    );
  }

  return (
    <div>
      <StatTeam data={teamStatsData} teams={TEAMS} />
    </div>
  );
};

export default LeagueTeamPage;
