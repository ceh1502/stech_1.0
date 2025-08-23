import SettingModal from '../../../../components/SettingModal';
import {useNavigate} from 'react-router-dom';

const SettingsPage = () => {
  const navigate = useNavigate();  
  return (
        <div>
            <SettingModal onClose={() => navigate(-1)}/>
        </div>
    );
}   
export default SettingsPage;