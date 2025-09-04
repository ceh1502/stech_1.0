import React from 'react';
import { Outlet } from 'react-router-dom';
import './index.css';

const AuthLayout = () => {
  return (
    <div
      className="authLayoutContainer"
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#141414',
      }}
    >
      <div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
