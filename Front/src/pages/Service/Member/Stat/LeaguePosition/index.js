import StatPosition from '../../../../../components/Stat/StatPosition';
import { TEAMS } from '../../../../../data/TEAMS';
import { useState, useEffect } from 'react';
import { API_CONFIG } from '../../../../../config/api';

const LeaguePositionPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_CONFIG.BASE_URL}/player/rankings`);
        const result = await response.json();

        console.log('🐛 선수 데이터 API 응답:', result);

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
          };

          // 새로운 멀티포지션 구조: 백엔드에서 이미 각 포지션별로 분리된 데이터 처리
          const transformedData = [];

          result.data.forEach((player, index) => {
            // 팀명 매핑
            const backendTeamName = player.teamName || 'Unknown Team';
            const frontendTeamName =
              BACKEND_TO_FRONTEND_TEAM[backendTeamName] || backendTeamName;

            // 백엔드에서 이미 포지션별로 분리된 선수 데이터 처리
            const playerData = {
              id: player._id,
              rank: index + 1,
              name: player.name,
              team: frontendTeamName,
              position: player.position, // 현재 표시할 포지션
              positions: player.positions, // 전체 포지션 목록
              primaryPosition: player.primaryPosition,
              division: '1부',

              // 게임 스탯
              games: player.stats?.gamesPlayed || 0,

              // QB 패스 스탯
              passing_attempts: player.stats?.passingAttempts || 0,
              pass_completions: player.stats?.passingCompletions || 0,
              completion_percentage: player.stats?.completionPercentage || 0,
              passing_yards: player.stats?.passingYards || 0,
              passing_td: player.stats?.passingTouchdowns || 0,
              interceptions:
                player.stats?.passingInterceptions ||
                player.stats?.interceptions ||
                0,
              longest_pass: player.stats?.longestPass || 0,
              sacks: player.stats?.sacks || 0,

              // 러싱 스탯 (포지션별 구분)
              rushing_attempts:
                player.stats?.rbRushingAttempts ||
                player.stats?.wrRushingAttempts ||
                player.stats?.teRushingAttempts ||
                player.stats?.rushingAttempts ||
                0,
              rushing_yards:
                player.stats?.rbRushingYards ||
                player.stats?.wrRushingYards ||
                player.stats?.teRushingYards ||
                player.stats?.rushingYards ||
                0,
              yards_per_carry:
                player.stats?.rbYardsPerCarry ||
                player.stats?.wrYardsPerCarry ||
                player.stats?.teYardsPerCarry ||
                player.stats?.yardsPerCarry ||
                0,
              rushing_td:
                player.stats?.rbRushingTouchdowns ||
                player.stats?.wrRushingTouchdowns ||
                player.stats?.teRushingTouchdowns ||
                player.stats?.rushingTouchdowns ||
                0,
              longest_rushing:
                player.stats?.rbLongestRush ||
                player.stats?.wrLongestRush ||
                player.stats?.teLongestRush ||
                player.stats?.longestRush ||
                0,

              // 리시빙 스탯 (포지션별 구분)
              targets:
                player.stats?.rbReceivingTargets ||
                player.stats?.wrReceivingTargets ||
                player.stats?.teReceivingTargets ||
                player.stats?.receivingTargets ||
                0,
              receptions:
                player.stats?.rbReceptions ||
                player.stats?.wrReceptions ||
                player.stats?.teReceptions ||
                player.stats?.receptions ||
                0,
              receiving_yards:
                player.stats?.rbReceivingYards ||
                player.stats?.wrReceivingYards ||
                player.stats?.teReceivingYards ||
                player.stats?.receivingYards ||
                0,
              yards_per_catch:
                player.stats?.rbYardsPerReception ||
                player.stats?.wrYardsPerReception ||
                player.stats?.teYardsPerReception ||
                player.stats?.yardsPerReception ||
                0,
              receiving_td:
                player.stats?.rbReceivingTouchdowns ||
                player.stats?.wrReceivingTouchdowns ||
                player.stats?.teReceivingTouchdowns ||
                player.stats?.receivingTouchdowns ||
                0,
              longest_reception:
                player.stats?.rbLongestReception ||
                player.stats?.wrLongestReception ||
                player.stats?.teLongestReception ||
                player.stats?.longestReception ||
                0,
              receiving_first_downs:
                player.stats?.rbReceivingFirstDowns ||
                player.stats?.wrReceivingFirstDowns ||
                player.stats?.teReceivingFirstDowns ||
                player.stats?.receivingFirstDowns ||
                0,

              // 수비 스탯 (tackles와 sacks는 QB용과 수비용 통합)
              tackles: player.stats?.tackles || 0,
              fumbles: player.stats?.fumbles || 0,
              fumbles_lost: player.stats?.fumblesLost || 0,

              // 패스/런별 펌블 스탯 (포지션별 구분)
              passingFumbles: player.stats?.passingFumbles || 0,
              rushingFumbles: player.stats?.rushingFumbles || 0,
              passingFumblesLost: player.stats?.passingFumblesLost || 0,
              rushingFumblesLost: player.stats?.rushingFumblesLost || 0,

              // 스페셜 팀 스탯
              kick_returns: player.stats?.kickReturns || 0,
              kick_return_yards: player.stats?.kickReturnYards || 0,
              yards_per_kick_return: player.stats?.yardsPerKickReturn || 0,
              punt_returns: player.stats?.puntReturns || 0,
              punt_return_yards: player.stats?.puntReturnYards || 0,
              yards_per_punt_return: player.stats?.yardsPerPuntReturn || 0,
              return_td: player.stats?.returnTouchdowns || 0,

              // 키커 스탯
              extra_points_attempted: player.stats?.extraPointsAttempted || 0,
              extra_points_made: player.stats?.extraPointsMade || 0,
              field_goal: `${player.stats?.fieldGoalsMade || 0}-${
                player.stats?.fieldGoalsAttempted || 0
              }`,
              field_goal_percentage: player.stats?.fieldGoalPercentage || 0,

              longest_field_goal: player.stats?.longestFieldGoal || 0,

              // 펀터 스탯
              punt_count: player.stats?.puntCount || 0,
              punt_yards: player.stats?.puntYards || 0,
              average_punt_yard: player.stats?.averagePuntYard || 0,
              longest_punt: player.stats?.longestPunt || 0,
              touchbacks: player.stats?.touchbacks || 0,
              touchback_percentage: player.stats?.touchbackPercentage || 0,
              inside20: player.stats?.inside20 || 0,
              inside20_percentage: player.stats?.inside20Percentage || 0,

              // OL 스탯
              penalties: player.stats?.penalties || 0,
              sacks_allowed: player.stats?.sacksAllowed || 0,

              // 수비 스탯 (DL, LB, DB 공통)
              TFL: player.stats?.tfl || 0,
              forced_fumbles: player.stats?.forcedFumbles || 0,
              fumble_recovery: player.stats?.fumbleRecoveries || 0,
              fumble_recovered_yards: player.stats?.fumbleRecoveryYards || 0,
              pass_defended: player.stats?.passesDefended || 0,
              interception_yards: player.stats?.interceptionYards || 0,
              touchdowns: player.stats?.defensiveTouchdowns || 0,
            };

            transformedData.push(playerData);

            console.log(
              `🐛 선수 데이터: ${player.name} - 포지션: ${
                player.position
              } (전체: ${player.positions?.join(', ')})`,
            );
          });

          console.log(
            `🐛 변환된 선수 데이터 ${transformedData.length}명:`,
            transformedData.slice(0, 2),
          );
          setData(transformedData);
        } else {
          throw new Error('Failed to fetch player data');
        }
      } catch (err) {
        console.error('Error fetching players:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <StatPosition data={data} teams={TEAMS} />
    </div>
  );
};

export default LeaguePositionPage;
