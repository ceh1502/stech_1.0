import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const ServiceLayout = () => {
  return ( 
    <div>
      <Sidebar />
      <Outlet />
    </div>
  )
}

export default ServiceLayout;