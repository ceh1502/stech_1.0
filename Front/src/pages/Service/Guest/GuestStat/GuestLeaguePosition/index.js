import StatPosition from "../../../../../components/Stat/StatPosition";
import {TEAMS} from "../../../../../data/TEAMS";


const GuestLeagueLPositionPage = () => {
    return (
        <div>
            <StatPosition  teams={TEAMS} />
        </div>
    );
}
export default GuestLeagueLPositionPage;