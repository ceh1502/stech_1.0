import React from 'react';
import './index.css';
import {useNavigate } from 'react-router-dom';
import  logo from '../../../../assets/images/logos/stech2.png';


const MemberHomePage = () => {
  const navigate = useNavigate();

  return(
    <div className='serviceHomeContainer'>
      <div className='serviceHomeHeader'>
        <img src={logo} alt="STECH Logo" className='serviceHomeLogo' />
        <h1 className='serviceHomeTitle'>사용방법</h1>
      </div>
      <div className='tutorialContainer'>
        <iframe 
        src={`https://player.vimeo.com/video/1108074372?badge=0&autopause=0&player_id=0&app_id=58479`}
        frameBorder="0" 
        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" 
        referrerPolicy="strict-origin-when-cross-origin" 
        className='tutorialVideo'
        title="미식축구 영상 분석 서비스 사용법" 
      />
        </div>
    </div>
  )
}

export default MemberHomePage;