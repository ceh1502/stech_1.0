import React, { useState } from 'react';
import './Sidebar.css'

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [currentPath, setCurrentPath] = useState('/service');

  // Mock 사용자 데이터
  const user = {
    nickname: '홍길동',
    email: 'user@example.com'
  };

  // 메뉴 아이템들
  const menuItems = [
    {
      path: '/service',
      label: '홈',
      icon: '🏠'
    },
    {
      path: '/service/clip',
      label: '클립',
      icon: '📎'
    },
    {
      path: '/service/data',
      label: '데이터',
      icon: '📊'
    }
  ];

  const handleToggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const handleMenuClick = (path) => {
    setCurrentPath(path);
    console.log('Navigate to:', path);
  };

  const handleLogout = () => {
    console.log('로그아웃');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'sidebarOpen' : 'sidebarClosed'}`}>
      {/* 사이드바 헤더 */}
      <div className="sidebarHeader">
        <div className="logo">
          <span className="logoIcon">🚀</span>
          {isOpen && <span className="logoText">STECH</span>}
        </div>
        <button 
          onClick={handleToggleSidebar}
          className="toggleButton"
        >
          {isOpen ? '◀' : '▶'}
        </button>
      </div>

      {/* 사용자 정보 */}
      {isOpen && (
        <div className="userInfo">
          <div className="userAvatar">
            {user.nickname.charAt(0)}
          </div>
          <div className="userDetails">
            <div className="userName">{user.nickname}</div>
            <div className="userEmail">{user.email}</div>
          </div>
        </div>
      )}

      {/* 네비게이션 메뉴 */}
      <nav className="sidebarNav">
        <ul className="navMenu">
          {menuItems.map((item) => (
            <li key={item.path} className="navItem">
              <button
                onClick={() => handleMenuClick(item.path)}
                className={`navLink ${currentPath === item.path ? 'navLinkActive' : ''}`}
              >
                <span className="navIcon">{item.icon}</span>
                {isOpen && <span className="navLabel">{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* 로그아웃 버튼 */}
      <div className="sidebarFooter">
        <button 
          onClick={handleLogout}
          className="logoutButton"
        >
          <span className="logoutIcon">🚪</span>
          {isOpen && <span className="logoutText">로그아웃</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;