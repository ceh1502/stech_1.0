import SuggestionModal from '../../../../components/SuggestionModal';
import { useNavigate } from 'react-router-dom';

const SuggetsionPage = () => {
    const navigate = useNavigate();
    return (
        <div>
            <SuggestionModal onClose={() => navigate(-1)} />
        </div>
    );
}

export default SuggetsionPage;