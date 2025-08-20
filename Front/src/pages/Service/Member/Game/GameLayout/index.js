import { Outlet } from 'react-router-dom';
import ServiceHeader from '../../../ServiceLayout/ServiceHeader';
import {TEAMS} from '../../../../../data/TEAMS';

const GameLayout = () => {
    return (
        <div>
            <ServiceHeader teams={TEAMS}            
    myTeamName="한양대학교 라이온스" // 내 팀 이름(혹은)
  onOpponentChange={(opps) => console.log('상대팀:', opps)}
  onNewVideo={() => {/* ... */}}
  onReset={() => {/* ... */}}
/>
            <Outlet />
        </div>
    );
}

export default GameLayout;