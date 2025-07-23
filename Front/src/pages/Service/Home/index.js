import React from 'react';
import './index.css';
import {useNavigate } from 'react-router-dom';

const ServiceHome = () => {
  const HEADERTEXTS=['Date', 'Game Score', 'Detail', 'Report'];
  const navigate = useNavigate();

  return(
    <div className='serviceHomeContainer'>
      <div className='serviceHomeHeader'>
        <div className='headerTextsBox'>
          {HEADERTEXTS.map((t)=>(
            <div className='headerTexts'>
              {t}
            </div>
          ))
          }
        </div>
      </div>
      <div className='gameListBox'>
        
      </div>
    </div>
  )
}

export default ServiceHome;