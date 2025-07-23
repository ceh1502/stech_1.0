import LandingHeader from './LandingHeader';
import LandingMain from './LandingMain';
import {Outlet} from 'react-router-dom';

const LandingLayout = () => {
  return(
    <div>
      <div>    
        <LandingHeader />
        <LandingMain/>
      </div>
      <div>
        <Outlet/>
      </div>
    </div>
  )
}

export default LandingLayout;


