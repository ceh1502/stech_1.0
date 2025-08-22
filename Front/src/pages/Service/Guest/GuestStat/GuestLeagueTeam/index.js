import StatTeam from '../../../../../components/Stat/StatTeam';
import { TEAMS } from '../../../../../data/TEAMS';

const GuestLeagueTeamPage = () => {
    return (
        <div>
          {/* 건아 여기에 팀*/}
           <StatTeam teams={TEAMS} />
        </div>
    );
}
export default GuestLeagueTeamPage;