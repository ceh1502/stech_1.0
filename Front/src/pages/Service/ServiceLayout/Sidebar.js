import React, { useState } from 'react';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import './Sidebar.css'
import { useAuth } from '../../../context/AuthContext';

import Logo from '../../../assets/images/logos/stech.png';
import { CiLogin, CiLogout } from "react-icons/ci";
import { GoHome, GoLightBulb } from "react-icons/go";
import { BsPlayBtn } from "react-icons/bs";
import { BiSolidBarChartAlt2 } from "react-icons/bi";
import { MdOutlineSupportAgent, MdOutlineQuiz } from "react-icons/md";
import { IoSettingsOutline } from "react-icons/io5";

const Sidebar = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Menu Items 
  const menuItems = [
    {
      path: '/service',
      label: 'Home',
      icon: <GoHome />,
      description: 'Dashboard overview'
    },
    {
      path: '/service/clip',
      label: 'Clip',
      icon: <BsPlayBtn />,
      description: 'Video analysis'
    },
    {
      path: '/service/data',
      label: 'Data',
      icon: <BiSolidBarChartAlt2 />,
      description: 'Performance analytics'
    },
    {
      path: '/service/suggestion',
      label: 'Stech Suggestion',
      icon: <GoLightBulb />,
      description: 'AI recommendations'
    }
  ];

  // Footer Items
  const footerItems = [
    {
      path: '/service/team',
      label: 'Team Setting',
      icon: <IoSettingsOutline />,
      description: 'Configure team'
    },
    {
      path: '/service/support',
      label: 'Customer Support',
      icon: <MdOutlineQuiz />,
      description: 'Get help'
    },
    {
      path: '/service/FAQ',
      label: 'FAQ',
      icon: <MdOutlineSupportAgent />,
      description: 'Common questions'
    }
  ];

  // 로그아웃 핸들러 (로딩 효과 추가)
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // 로딩 시뮬레이션
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인 핸들러
  const handleLogin = () => {
    navigate('/service/login');
  };

  // 메뉴 아이템 렌더링 함수
  const renderMenuItem = (item, isFooter = false) => (
    <li 
      key={item.path} 
      className="navItem"
      onMouseEnter={() => setHoveredItem(item.path)}
      onMouseLeave={() => setHoveredItem(null)}
    >
      <NavLink
        to={item.path}
        end={item.path==='/service'}
        className={({ isActive }) => {
          let className = `navLink ${isActive ? 'navLinkActive' : ''}`;
          if (hoveredItem === item.path) className += ' navLinkHovered';
          return className;
        }}
        title={item.description}
      >
        <span className="navIcon">{item.icon}</span>
        <span className="navLabel">{item.label}</span>
        
        {/* 활성 상태 인디케이터 */}
        {location.pathname === item.path && (
          <div className="activeIndicator" />
        )}
        
        {/* 호버 툴팁 */}
        {hoveredItem === item.path && (
          <div className="navTooltip">
            <span>{item.description}</span>
          </div>
        )}
      </NavLink>
    </li>
  );

  return (
    <aside className="sidebar">
      {/* Sidebar Header */}
      <div className="sidebarHeader">
        <div className="logo">
          <img 
            className="stechLogo" 
            src={Logo} 
            alt="STECH Logo"
            onClick={() => navigate('/service')}
          />
        </div>
        
        <div className="authSection">
          {isAuthenticated ? (
            <button 
              onClick={handleLogout} 
              className={`logoutButton ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              <div className="logoutIcon">
                {isLoading ? (
                  <div className="spinner" />
                ) : (
                  <CiLogout />
                )}
              </div>
              <span className="logoutText">
                {isLoading ? 'Logging out...' : 'Logout'}
              </span>
            </button>
          ) : (
            <button onClick={handleLogin} className="loginButton">
              <div className="loginIcon">
                <CiLogin />
              </div>
              <span className="loginText">Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Sidebar Menu */}
      <nav className="sidebarNav">
        <div className="menuSection">
          <div className="sectionTitle">Main Menu</div>
          <ul className="navMenu">
            {menuItems.map(item => renderMenuItem(item))}
          </ul>
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebarFooter">
        <div className="menuSection">
          <div className="sectionTitle">Support</div>
          <ul className="navMenu">
            {footerItems.map(item => renderMenuItem(item, true))}
          </ul>
        </div>
        
        {/* Status Indicator */}
        <div className="statusIndicator">
          <div className="statusDot online"></div>
          <span className="statusText">System Online</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;