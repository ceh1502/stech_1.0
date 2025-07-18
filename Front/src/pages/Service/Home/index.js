import React from 'react';
import './index.css';

const ServiceHome = () => {
  const HEADERTEXTS=['Date', 'Game Score', 'Detail', 'Report'];
  
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
    </div>
  )
}

export default ServiceHome;