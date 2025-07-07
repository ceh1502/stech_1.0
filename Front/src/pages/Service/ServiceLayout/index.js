import React from 'react';
import { Outlet } from 'react-router-dom';
import ServiceSidebar from './ServiceSidebar';
import './index.css';

const ServiceLayout = () => {
  return ( 
    <div className='serviceLayoutContainer'>
      <div>
        <ServiceSidebar />
      </div>
      <div>
        <Outlet />
      </div>


    </div>
  )
}

export default ServiceLayout;