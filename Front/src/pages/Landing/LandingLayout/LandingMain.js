import React from 'react';
import {Link} from 'react-router-dom';
import './LandingMain.css';
import Ground from '../../../assets/images/png/ground.png';

const LandingMain = () =>{
  return(
    <div className="mainBox">
      <div className="sloganBox">
        Where Data Meets the Game <br/>
        Effortlessly
      </div>
      <div className="etcBox">
        Stech's AI-powered object recognition solution for American football <br/>
        automates game analysis, saving coaches time and effort.
      </div>
      <div className="link">
        <button className="toServiceButton">
          <Link to="/service" className="serviceButton">
            Experience Demo
          </Link>
        </button>
      </div>
      <div className="imgBox">
        <img alt="groundImg" className="groundImg" src={Ground}></img>
      </div>
    </div>
  )
}

export default LandingMain;