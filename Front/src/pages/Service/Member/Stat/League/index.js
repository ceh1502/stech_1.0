import StatLeague from "../../../../../components/Stat/StatLeague";
import {FALL_2024_DATA} from "../../../../../data/fall2024";
import {TEAMS } from "../../../../../data/TEAMS";
const LeaguePage = () => {
  return <StatLeague data={FALL_2024_DATA} teams={TEAMS} />;
};
export default LeaguePage;
