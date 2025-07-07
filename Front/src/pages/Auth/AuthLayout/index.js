import React from 'react';
import { Outlet } from 'react-router-dom';
import AuthHeader from './AuthHeader';
import './index.css';

const AuthLayout = () => {
  return(
    <div className='authLayoutContainer'>
      <div>
        <AuthHeader />
      </div>
      <div>
        <Outlet />
      </div>
    </div>
  )
}

export default AuthLayout;


