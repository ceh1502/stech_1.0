import React from 'react';
import './Footer.css';
import { NavLink } from 'react-router-dom';
import insta from './images/insta.png';
import linkedin from './images/linkedin.png';
import facebook from './images/facebook.png';
import X from './images/X.png';
import nvidialogo from './images/nvidia.png';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="menu2">
        <div className="homeButton2">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'homeActive2' : 'home2')} end>
            Home
          </NavLink>
        </div>
        <div className="docsButton2">
          <div
            className="docs2"
            onClick={() => window.open('https://stech-2.gitbook.io/stech-docs', '_blank')}
            style={{ cursor: 'pointer' }}
          >
            Docs
          </div>
        </div>
        <div className="teamButton2">
          <NavLink to="/Team" className={({ isActive }) => (isActive ? 'teamActive2' : 'team3')}>
            Team
          </NavLink>
        </div>
        <div className="deckButton2">
          <NavLink to="/Deck" className={({ isActive }) => (isActive ? 'deckActive2' : 'deck2')}>
            Deck
          </NavLink>
        </div>
        <div className="contactButton2">
          <NavLink to="/Contact" className={({ isActive }) => (isActive ? 'contactActive2' : 'contact2')}>
            Contact
          </NavLink>
        </div>
        <div className="serviceButton2">
          <NavLink to="/Service">Service</NavLink>
        </div>
      </div>

      <div className="information">
        대표이사: 이상원
        <br />
        사업장: 서울시 송파구 송파대로 345
        <br />
        사업자등록번호: 506-47-01142
        <br />
        이메일: ethos614@stechpro.ai
      </div>

      <div className="footer-socials">
        <img src={insta} alt="insta" style={{ height: '45px' }} />
        <img src={linkedin} alt="linkedin" style={{ height: '45px' }} />
        <img src={facebook} alt="facebook" style={{ height: '45px' }} />
        <img src={X} alt="X" style={{ height: '45px' }} />
        <img src={nvidialogo} alt="Nvidia" style={{ height: '45px' }} />
      </div>

      <div className="FinishLine"></div>

      <div className="copyright">© Stech Company 2025. All right reserved</div>
    </footer>
  );
};

export default Footer;
