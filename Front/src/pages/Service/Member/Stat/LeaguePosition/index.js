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

                    // 백엔드 데이터를 프론트엔드 형식으로 변환
                    const transformedData = result.data.map((player, index) => {
                        // 팀명 매핑
                        const backendTeamName = player.teamName || 'Unknown Team';
                        const frontendTeamName = BACKEND_TO_FRONTEND_TEAM[backendTeamName] || backendTeamName;

                        if (index < 3) { // 처음 3명만 로그 출력
                            console.log(`🐛 선수 ${index + 1}: ${player.name} (${backendTeamName} → ${frontendTeamName})`);
                        }

                        return ({
                        id: player._id,
                        rank: index + 1,
                        name: player.name,
                        team: frontendTeamName,
                        position: player.position,
                        division: '1부', // 모든 선수가 1부리그로 설정됨

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

                        // QB & 러싱 스탯
                        rushing_attempts: player.stats?.rushingAttempts || 0,
                        rushing_yards: player.stats?.rushingYards || 0,
                        yards_per_carry: player.stats?.yardsPerCarry || 0,
                        rushing_td: player.stats?.rushingTouchdowns || 0,
                        longest_rushing: player.stats?.longestRush || 0,

                        // 리시빙 스탯
                        targets: player.stats?.receivingTargets || 0,
                        receptions: player.stats?.receptions || 0,
                        receiving_yards: player.stats?.receivingYards || 0,
                        yards_per_catch: player.stats?.yardsPerReception || 0,
                        receiving_td: player.stats?.receivingTouchdowns || 0,
                        longest_reception: player.stats?.longestReception || 0,
                        receiving_first_downs: player.stats?.receivingFirstDowns || 0,

                        // 수비 스탯
                        tackles: player.stats?.tackles || 0,
                        sacks: player.stats?.sacks || 0,
                        fumbles: player.stats?.fumbles || 0,
                        fumbles_lost: player.stats?.fumblesLost || 0,

                        // 스페셜 팀 스탯
                        kick_returns: player.stats?.kickReturns || 0,
                        kick_return_yards: player.stats?.kickReturnYards || 0,
                        yards_per_kick_return: player.stats?.yardsPerKickReturn || 0,
                        punt_returns: player.stats?.puntReturns || 0,
                        punt_return_yards: player.stats?.puntReturnYards || 0,
                        yards_per_punt_return: player.stats?.yardsPerPuntReturn || 0,
                        return_td: player.stats?.returnTouchdowns || 0
                    })});

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