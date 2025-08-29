import StatPosition from "../../../../../components/Stat/StatPosition";
import {TEAMS} from "../../../../../data/TEAMS";
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
                        "KKRagingBulls": "건국대 레이징불스",
                        "KHCommanders": "경희대 커맨더스",
                        "SNGreenTerrors": "서울대 그린테러스",
                        "USCityhawks": "서울시립대 시티혹스",
                        "DGTuskers": "동국대 터스커스",
                        "KMRazorbacks": "국민대 레이저백스",
                        "YSEagles": "연세대 이글스",
                        "KUTigers": "고려대 타이거스",
                        "HICowboys": "홍익대 카우보이스",
                        "SSCrusaders": "숭실대 크루세이더스",
                        "HYLions": "한양대 라이온스",
                        "HFBlackKnights": "한국외국어대 블랙나이츠"
                    };

                    // 멀티 포지션 지원: 백엔드 데이터를 여러 포지션으로 변환
                    const transformedData = [];
                    
                    result.data.forEach((player, index) => {
                        // 팀명 매핑
                        const backendTeamName = player.teamName || 'Unknown Team';
                        const frontendTeamName = BACKEND_TO_FRONTEND_TEAM[backendTeamName] || backendTeamName;

                        // 기본 선수 데이터 생성 함수
                        const createPlayerData = (position) => ({
                            id: `${player._id}_${position}`,
                            rank: index + 1,
                            name: player.name,
                            team: frontendTeamName,
                            position: position,
                            division: '1부',

                            // 게임 스탯
                            games: player.stats?.gamesPlayed || 0,

                            // QB 패스 스탯
                            passing_attempts: player.stats?.passingAttempts || 0,
                            pass_completions: player.stats?.passingCompletions || 0,
                            completion_percentage: player.stats?.completionPercentage || 0,
                            passing_yards: player.stats?.passingYards || 0,
                            passing_td: player.stats?.passingTouchdowns || 0,
                            interceptions: player.stats?.passingInterceptions || 0,
                            longest_pass: player.stats?.longestPass || 0,
                            sacks: player.stats?.sacks || 0,

                            // 러싱 스탯
                            rushing_attempts: player.stats?.rushingAttempts || player.stats?.rbRushingAttempts || player.stats?.wrRushingAttempts || player.stats?.teRushingAttempts || 0,
                            rushing_yards: player.stats?.rushingYards || player.stats?.rbRushingYards || player.stats?.wrRushingYards || player.stats?.teRushingYards || 0,
                            yards_per_carry: player.stats?.yardsPerCarry || player.stats?.rbYardsPerCarry || player.stats?.wrYardsPerCarry || player.stats?.teYardsPerCarry || 0,
                            rushing_td: player.stats?.rushingTouchdowns || player.stats?.rbRushingTouchdowns || player.stats?.wrRushingTouchdowns || player.stats?.teRushingTouchdowns || 0,
                            longest_rushing: player.stats?.longestRush || player.stats?.rbLongestRush || player.stats?.wrLongestRush || player.stats?.teLongestRush || 0,

                            // 리시빙 스탯
                            targets: player.stats?.receivingTargets || player.stats?.rbReceivingTargets || player.stats?.wrReceivingTargets || player.stats?.teReceivingTargets || 0,
                            receptions: player.stats?.receptions || player.stats?.rbReceptions || player.stats?.wrReceptions || player.stats?.teReceptions || 0,
                            receiving_yards: player.stats?.receivingYards || player.stats?.rbReceivingYards || player.stats?.wrReceivingYards || player.stats?.teReceivingYards || 0,
                            yards_per_catch: player.stats?.yardsPerReception || player.stats?.rbYardsPerReception || player.stats?.wrYardsPerReception || player.stats?.teYardsPerReception || 0,
                            receiving_td: player.stats?.receivingTouchdowns || player.stats?.rbReceivingTouchdowns || player.stats?.wrReceivingTouchdowns || player.stats?.teReceivingTouchdowns || 0,
                            longest_reception: player.stats?.longestReception || player.stats?.rbLongestReception || player.stats?.wrLongestReception || player.stats?.teLongestReception || 0,
                            receiving_first_downs: player.stats?.receivingFirstDowns || player.stats?.rbReceivingFirstDowns || player.stats?.wrReceivingFirstDowns || 0,

                            // 수비 스탯
                            tackles: player.stats?.tackles || 0,
                            fumbles: player.stats?.fumbles || player.stats?.rbFumbles || 0,
                            fumbles_lost: player.stats?.fumblesLost || player.stats?.rbFumblesLost || 0,

                            // 스페셜 팀 스탯
                            kick_returns: player.stats?.kickReturns || player.stats?.rbKickReturns || player.stats?.wrKickReturns || 0,
                            kick_return_yards: player.stats?.kickReturnYards || player.stats?.rbKickReturnYards || player.stats?.wrKickReturnYards || 0,
                            yards_per_kick_return: player.stats?.yardsPerKickReturn || player.stats?.rbYardsPerKickReturn || player.stats?.wrYardsPerKickReturn || 0,
                            punt_returns: player.stats?.puntReturns || player.stats?.rbPuntReturns || player.stats?.wrPuntReturns || 0,
                            punt_return_yards: player.stats?.puntReturnYards || player.stats?.rbPuntReturnYards || player.stats?.wrPuntReturnYards || 0,
                            yards_per_punt_return: player.stats?.yardsPerPuntReturn || player.stats?.rbYardsPerPuntReturn || player.stats?.wrYardsPerPuntReturn || 0,
                            return_td: player.stats?.returnTouchdowns || player.stats?.rbReturnTouchdowns || player.stats?.wrReturnTouchdowns || 0,

                            // 키커 스탯
                            field_goals_made: player.stats?.fieldGoalsMade || 0,
                            field_goals_attempted: player.stats?.fieldGoalsAttempted || 0,
                            field_goal_percentage: player.stats?.fieldGoalPercentage || 0,
                            longest_field_goal: player.stats?.longestFieldGoal || 0,
                            extra_points_made: player.stats?.extraPointsMade || 0,
                            extra_points_attempted: player.stats?.extraPointsAttempted || 0,
                            field_goal: `${player.stats?.fieldGoalsMade || 0}-${player.stats?.fieldGoalsAttempted || 0}`
                        });

                        // 멀티 포지션 지원: 각 포지션별로 유효한 스탯이 있으면 해당 포지션으로 추가
                        const positions = [];
                        
                        // 원래 포지션은 항상 추가
                        positions.push(player.position);
                        
                        // 실제 키커 활동이 있는 선수만 키커로 분류 (실제 시도가 있거나 백엔드에서 키커로 분류된 경우)
                        const hasActualKickerActivity = 
                            player.position === 'K' || // 원래 키커이거나
                            (player.stats?.fieldGoalsAttempted > 0) || // 필드골 시도가 있거나  
                            (player.stats?.extraPointsAttempted > 0); // PAT 시도가 있는 경우
                        
                        if (hasActualKickerActivity && player.position !== 'K') {
                            positions.push('K');
                        }

                        // 각 포지션별로 데이터 생성
                        positions.forEach(pos => {
                            transformedData.push(createPlayerData(pos));
                        });

                        if (hasActualKickerActivity && player.position !== 'K') { 
                            console.log(`🐛 멀티포지션 선수: ${player.name} (${player.position} + K) - 팀: ${frontendTeamName}`);
                            console.log(`🐛 키커 스탯:`, {
                                fieldGoalsAttempted: player.stats?.fieldGoalsAttempted,
                                fieldGoalsMade: player.stats?.fieldGoalsMade,
                                extraPointsAttempted: player.stats?.extraPointsAttempted,
                                extraPointsMade: player.stats?.extraPointsMade
                            });
                        }
                    });

                    console.log(`🐛 변환된 선수 데이터 ${transformedData.length}명:`, transformedData.slice(0, 2));
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
            <StatPosition  data={data} teams={TEAMS} />
        </div>
    );
}

export default LeaguePositionPage;