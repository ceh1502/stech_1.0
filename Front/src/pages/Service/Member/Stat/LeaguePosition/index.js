import StatPosition from "../../../../../components/Stat/StatPosition";
import {mockData} from './../../../../../data/mockData';
import {TEAMS} from "../../../../../data/TEAMS";

const LeaguePositionPage = () => {
    return (
        <div>
            <StatPosition data={mockData} teams={TEAMS} />
        </div>
    );
}

export default LeaguePositionPage;