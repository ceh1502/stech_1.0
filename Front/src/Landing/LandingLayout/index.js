import {Outlet} from 'react-router-dom';

const LandingLayout = () => {
  return(
    <div>
      <div>
        <Outlet/>
      </div>
    </div>
  )
}

export default LandingLayout;


