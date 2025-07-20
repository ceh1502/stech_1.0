import React from 'react';
import {NavLink, Link} from 'react-router-dom';
import './LandingHeader.css';
import Logo from '../../../assets/images/png/LandingLogo.png'

const LandingHeader = () => {
  return(
    <div className="headerBox">
      <div className="logoBox">
        <Link to= "/">
        <img src={Logo} alt="Logo" className="logoImg"/>
        </Link>
      </div>
      <div className="menu">
        <div className="homeButton">
          <NavLink to ="/" className={({isActive})=> isActive ? "homeActive" : "home"} end >Home</NavLink>
        </div>
        <div className="docsButton">
          <div className="docs" onClick={() => window.open('https://stech-2.gitbook.io/stech-docs', '_blank')}>Docs</div>
        </div>
        <div className="teamButton">
          <NavLink to="/Team"  className={({isActive})=> isActive ? "teamActive" : "team"}>Team</NavLink>
        </div>
        <div className='serviceButton'> 
          <NavLink to='/service' className='goToServiceButton' > Go to Service </ NavLink>
        </div>
      </div>
    </div>
  )
}

export default LandingHeader;