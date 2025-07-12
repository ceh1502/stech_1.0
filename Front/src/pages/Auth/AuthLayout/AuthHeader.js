import { useNavigate } from 'react-router-dom';
import Logo from '../../../assets/images/logos/stech.png';
import './AuthHeader.css';


const AuthHeader = () => {
    const navigate = useNavigate();

  return(
    <header className="authHeader">
        <div className="authLogoBox">
          <img  
            src={Logo} 
            alt="STECH Logo"
            onClick={() => navigate('/service')}
          />
        </div>
    </header>
  )
}

export default AuthHeader;