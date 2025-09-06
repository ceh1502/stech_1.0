import { useState, useEffect } from 'react';
import StatTeam from '../../../../../components/Stat/StatTeam';
import { TEAMS } from '../../../../../data/TEAMS';
import { getToken } from '../../../../../utils/tokenUtils';

const LeagueTeamPage = () => {
  const [teamStatsData, setTeamStatsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeamStats = async () => {
      try {
        setLoading(true);
        const token = getToken();
        
        if (!token) {
          console.error('JWT 토큰이 없습니다. 로그인이 필요합니다.');
          setTeamStatsData([]);
          setLoading(false);
          return;
        }

        const response = await fetch(
          'http://localhost:4000/api/team/total-stats',
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
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

              // 득점/경기 관련 (백엔드는 루트 레벨에 데이터가 있음)
              points_per_game: item.gamesPlayed > 0 
                ? ((item.totalPoints || 0) / item.gamesPlayed).toFixed(1)
                : 0,
              total_points: item.totalPoints || 0,
              total_touchdowns: item.touchdowns || 0,
              total_yards: item.totalYards || 0,
              yards_per_game:
                item.gamesPlayed > 0
                  ? (item.totalYards / item.gamesPlayed).toFixed(1)
                  : 0,

              // 러시 관련 (백엔드에서 계산된 값 사용)
              rushing_attempts: item.rushingAttempts || 0,
              rushing_yards: item.rushingYards || 0,
              yards_per_carry: item.avgRushingYardsPerCarry || '0.0',
              rushing_yards_per_game: item.avgRushingYardsPerGame || 0,
              rushing_td: item.rushingTouchdowns || 0,

              // 패스 관련 (백엔드 루트 레벨 데이터 사용)
              'pass_completions-attempts': item.passCompletionRate || '0-0',
              passing_yards: item.passingYards || 0,
              passing_yards_per_passing_attempts: item.avgPassingYardsPerAttempt || 0,
              passing_yards_per_game: item.avgPassingYardsPerGame || 0,
              passing_td: item.passingTouchdowns || 0,
              interceptions: item.interceptions || 0,

              // 스페셜팀 관련 (백엔드 루트 레벨 데이터 사용)
              total_punt_yards: item.totalPuntYards || 0,
              average_punt_yards: item.avgPuntYards || 0,
              touchback_percentage: item.touchbackPercentage || 0,
              'field_goal_completions-attempts': item.fieldGoalRate || '0-0',
              yards_per_kick_return: item.avgKickReturnYards || 0,
              yards_per_punt_return: item.avgPuntReturnYards || 0,
              total_return_yards: item.totalReturnYards || 0,

              // 기타 (백엔드 루트 레벨 데이터 사용)
              'fumble-turnover': item.fumbleRate || '0-0',
              turnover_per_game: item.avgTurnoversPerGame || 0,
              turnover_rate: item.turnoverDifferential || 0,
              'penalty-pen_yards': item.penaltyRate || '0-0',
              pen_yards_per_game: item.avgPenaltyYardsPerGame || 0,

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
          if (response.status === 401) {
            console.error('JWT 토큰이 없거나 만료되었습니다. 다시 로그인해주세요.');
          }
          setTeamStatsData([]); // 빈 배열로 설정
        }
      } catch (error) {
        console.error('팀 스탯 API 호출 에러:', error);
        setTeamStatsData([]); // 빈 배열로 설정
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
