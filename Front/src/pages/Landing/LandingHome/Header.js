import React  from 'react';
import { NavLink, Link } from 'react-router-dom';
import './Header.css'; // Assuming you have a separate CSS file for Header styles
import Logo from './images/stech.png';

const Header = () => {
    return (
        <div className="headerBox">
            <div className="logoBox">
                <Link to="/">
                    <img src={Logo} alt="Logo" className="logoImg" />
                </Link>
            </div>
            <div className="menu">
                <div className="homeButton">
                    <NavLink to="/" className={({ isActive }) => (isActive ? 'homeActive' : 'home')} end>
                        Home
                    </NavLink>
                </div>
                <div className="docsButton">
                    <div className="docs" onClick={() => window.open('https://stech-2.gitbook.io/stech-docs', '_blank')}>
                        Docs
                    </div>
                </div>
                <div className="teamButton">
                    <NavLink to="/Team" className={({ isActive }) => (isActive ? 'teamActive' : 'team')}>
                        Team
                    </NavLink>
                </div>
                <div className="deckButton">
                    <NavLink to="/Deck" className={({ isActive }) => (isActive ? 'deckActive' : 'deck')}>
                        Deck
                    </NavLink>
                </div>
                <div className="contactButton">
                    <NavLink to="/Contact" className={({ isActive }) => (isActive ? 'contactActive' : 'contact')}>
                        Contact
                    </NavLink>
                </div>
                <button className="toService">
                    {/* Link 컴포넌트에 직접 스타일 적용 */}
                    <Link to="/service" className="serviceButton" style={{ color: '#4f46e5', textDecoration: 'none' }}>
                        Go to Service
                    </Link>
                </button>
            </div>
        </div>
    );
};

export default Header;
