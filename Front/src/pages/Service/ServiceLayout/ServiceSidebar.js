import React, {useState} from "react";
import {useNavigate, NavLink, useLocation} from "react-router-dom";
import "./ServiceSidebar.css";
import {useAuth} from "../../../context/AuthContext";
import Logo from "../../../assets/images/logos/stech.png";
import {CiLogin, CiLogout} from "react-icons/ci";
import {
  GoHome,
  GoLightBulb,
  GoChevronDown,
  GoChevronRight,
} from "react-icons/go";
import {BsPlayBtn} from "react-icons/bs";
import {BiSolidBarChartAlt2} from "react-icons/bi";
import {MdOutlineSupportAgent, MdOutlineQuiz} from "react-icons/md";
import {IoSettingsOutline} from "react-icons/io5";
import {CgProfile} from "react-icons/cg";

const ServiceSidebar = () => {
  const {isAuthenticated, logout} = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({}); // 펼쳐진 메뉴 상태 관리

  // Menu Items (Guest)
  //Description 수정
  const guestMenuItems = [
    {
      path: "/service",
      label: "홈",
      icon: <GoHome />,
      description: "Dashboard overview",
    },
    {
      path: "/service/guest/game",
      label: "경기",
      icon: <BsPlayBtn />,
      description: "Video analysis",
    },
    {
      path: "/service/guest/clip",
      label: "경기클립",
      icon: <BsPlayBtn />,
      description: "Performance analytics",
    },
    {
      path: "/service/guest/stat/league",
      label: "스탯",
      icon: <BiSolidBarChartAlt2 />,
      description: "AI recommendations",
      hasSubmenu: true,
      submenu: [
        {
          path: "/service/guest/stat/league",
          label: "리그 순위",
          icon: <BiSolidBarChartAlt2 />,
          description: "League rankings",
        },
        {
          path: "/service/guest/stat/team",
          label: "리그 팀 순위",
          icon: <BiSolidBarChartAlt2 />,
          description: "Team rankings",
        },
        {
          path: "/service/guest/stat/position",
          label: "리그 포지션 순위",
          icon: <BiSolidBarChartAlt2 />,
          description: "Position rankings",
        },
      ],
    },
  ];

  // 추가 메뉴 아이템 (member) - 하위 메뉴 포함
  const memberMenuItems = [
    {
      path: "/service",
      label: "홈",
      icon: <GoHome />,
      description: "Dashboard overview",
    },
    {
      path: "/service/game",
      label: "소속팀 경기",
      icon: <BsPlayBtn />,
      description: "Video analysis",
    },
    {
      path: "/service/stat/league",
      label: "스탯",
      icon: <BiSolidBarChartAlt2 />,
      description: "Performance analytics",
      hasSubmenu: true,
      submenu: [
        {
          path: "/service/stat/league",
          label: "리그 순위",
          icon: <BiSolidBarChartAlt2 />,
          description: "League rankings",
        },
        {
          path: "/service/stat/team",
          label: "리그 팀 순위",
          icon: <BiSolidBarChartAlt2 />,
          description: "Team rankings",
        },
        {
          path: "/service/stat/position",
          label: "리그 포지션 순위",
          icon: <BiSolidBarChartAlt2 />,
          description: "Position rankings",
        },
      ],
    },
    {
      path: "/service/highlight",
      label: "경기 하이라이트",
      icon: <BsPlayBtn />,
      description: "Video analysis",
    },
    {
      path: "/service/suggestion",
      label: "Stech 제안",
      icon: <GoLightBulb />,
      description: "AI recommendations",
      badge: "βeta", // 베타 태그 추가
    },
  ];

  // Footer Items
  const memberFooterItems = [
    {
      path: "/service/faq",
      label: "FAQ",
      icon: <MdOutlineQuiz />,
      description: "Frequently Asked Questions",
    },
    {
      path: "/service/support",
      label: "문의하기",
      icon: <MdOutlineSupportAgent />,
      description: "Get help",
      modal: true,
    },
    {
      path: "/service/profile",
      label: "내 페이지",
      icon: <CgProfile />,
      description: "Profile Settings",
    },
    {
      path: "/service/settings",
      label: "시스템 설정",
      icon: <IoSettingsOutline />,
      description: "Settings",
    },
  ];
  const guestFooterItems = [
    {
      path: "/service/support",
      label: "문의하기",
      icon: <MdOutlineSupportAgent />,
      description: "Get help",
    },
  ];

  // 로그아웃 핸들러 (로딩 효과 추가)
  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      logout();
    } finally {
      setIsLoading(false);
      navigate("/service");
    }
  };

  // 로그인 핸들러
  const handleLogin = () => {
    navigate("/auth");
  };

  // 다른 메뉴 클릭 시 스탯 메뉴 닫기
  const handleOtherMenuClick = () => {
    setExpandedMenus({});
  };

  // 현재 경로가 해당 메뉴의 하위 경로인지 확인
  const isSubmenuActive = (item) => {
    if (!item.hasSubmenu) return false;
    return item.submenu.some((subItem) => location.pathname === subItem.path);
  };

  // 현재 경로가 스탯 관련 경로인지 확인 (메인 스탯 페이지 포함)
  const isStatMenuActive = (item) => {
    if (!item.hasSubmenu) return false;
    return (
      location.pathname === item.path ||
      item.submenu.some((subItem) => location.pathname === subItem.path)
    );
  };

  // 페이지 로드 시 현재 경로에 해당하는 상위 메뉴 자동 확장
  React.useEffect(() => {
    [...guestMenuItems, ...memberMenuItems].forEach((item) => {
      if (item.hasSubmenu && isStatMenuActive(item)) {
        setExpandedMenus((prev) => ({
          ...prev,
          [item.path]: true,
        }));
      }
    });
  }, [location.pathname]);

  // 메뉴 아이템 렌더링 함수
  const renderMenuItem = (item) => {
    // ② 하위 메뉴가 있는 경우
    if (item.hasSubmenu) {
      const isExpanded = expandedMenus[item.path];
      const isActive = location.pathname === item.path || isSubmenuActive(item);




      return (
        <li key={item.path} className="navItem">
          {/* 상위 메뉴 */}
          <div
            className={`navLink ${isActive ? "navLinkActive" : ""} ${
              hoveredItem === item.path ? "navLinkHovered" : ""
            } expandableMenu`}
            onMouseEnter={() => setHoveredItem(item.path)}
            onMouseLeave={() => setHoveredItem(null)}
            onClick={() => navigate(item.path)}
            title={item.description}
          >
            <span className="navIcon">{item.icon}</span>
            <span className="navLabel">{item.label}</span>
            {item.badge && <span className="badge">{item.badge}</span>}

            {hoveredItem === item.path && (
              <div className="navTooltip">
                <span>{item.description}</span>
              </div>
            )}
          </div>

          {/* 하위 메뉴 */}
          {isExpanded && (
            <ul className="submenu">
              {item.submenu.map((subItem) => (
                <li key={subItem.path} className="submenuItem">
                  <NavLink
                    to={subItem.path}
                    className={({isActive}) =>
                      `submenuLink ${isActive ? "submenuLinkActive" : ""}`
                    }
                    title={subItem.description}
                  >
                    <span className="submenuIcon">{subItem.icon}</span>
                    <span className="submenuLabel">{subItem.label}</span>
                    {location.pathname === subItem.path && (
                      <div className="activeIndicator" />
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </li>
      );
    }

    // ③ 평범한 메뉴 (기존과 동일)
    return (
      <li
        key={item.path}
        className="navItem"
        onMouseEnter={() => setHoveredItem(item.path)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <NavLink
          to={item.path}
          end={item.path === "/service"}
          className={({isActive}) => {
            let cls = `navLink ${isActive ? "navLinkActive" : ""}`;
            if (hoveredItem === item.path) cls += " navLinkHovered";
            return cls;
          }}
          title={item.description}
          onClick={handleOtherMenuClick} // 다른 메뉴 클릭 시 스탯 메뉴 닫기
        >
          <span className="navIcon">{item.icon}</span>
          <span className="navLabel">{item.label}</span>
          {item.badge && <span className="badge">{item.badge}</span>}

          {location.pathname === item.path && (
            <div className="activeIndicator" />
          )}
          {hoveredItem === item.path && (
            <div className="navTooltip">
              <span>{item.description}</span>
            </div>
          )}
        </NavLink>
      </li>
    );
  };

  return (
    <aside className="sidebar">
      {/* Sidebar Header */}
      <div className="sidebarHeader">
        <div className="stech-logo-box">
          <img
            className="stech-logo"
            src={Logo}
            alt="STECH Logo"
            onClick={() => navigate("/service")}
          />
        </div>

        <div className="authSection">
          {!isAuthenticated ? (
            <button
              onClick={handleLogout}
              className={`logoutButton ${isLoading ? "loading" : ""}`}
              disabled={isLoading}
            >
              <div className="logoutIcon">
                {isLoading ? <div className="spinner" /> : <CiLogout />}
              </div>
              <span className="logoutText">
                {isLoading ? "Logging out..." : "Logout"}
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
          {!isAuthenticated ? (
            <ul className="navMenu">
              {memberMenuItems.map((item) => renderMenuItem(item))}
            </ul>
          ) : (
            <ul className="navMenu">
              {guestMenuItems.map((item) => renderMenuItem(item))}
            </ul>
          )}
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebarFooter">
        <div className="menuSection">
          <div className="sectionTitle">Support</div>
          {!isAuthenticated ? (
            <ul className="navMenu">
              {memberFooterItems.map((item) => renderMenuItem(item))}
            </ul>
          ) : (
            <ul className="navMenu">
              {guestFooterItems.map((item) => renderMenuItem(item))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
};

export default ServiceSidebar;
