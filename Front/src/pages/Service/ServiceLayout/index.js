import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import './index.css';

const ServiceLayout = () => {
  return ( 
    <div className='serviceLayoutContainer'>
      <div>
        <Sidebar />
      </div>
      <div>
        <Outlet />
      </div>


    </div>
  )
}

export default ServiceLayout;