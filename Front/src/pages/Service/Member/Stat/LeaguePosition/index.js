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
                
                if (result.success && result.data) {
                    // 백엔드 데이터를 프론트엔드 형식으로 변환
                    const transformedData = result.data.map((player, index) => {
                        // 팀명 매핑
                        const backendTeamName = player.teamId?.teamName || 'Unknown Team';
                        let frontendTeamName = backendTeamName;
                        
                        if (backendTeamName === '한양대 라이온즈') {
                            frontendTeamName = '한양대학교 라이온스';
                        } else if (backendTeamName === '한국외대 블랙나이츠') {
                            frontendTeamName = '한국외국어대학교 블랙나이츠';
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
}

export default LeaguePositionPage;