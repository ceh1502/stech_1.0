import StatTeam from '../../../../../components/Stat/StatTeam';
import { TEAMS } from '../../../../../data/TEAMS';

const LeagueTeamPage = () => {
  return (
    <div>
      <StatTeam teams={TEAMS}/>
    </div>
  );
}
export default LeagueTeamPage;  