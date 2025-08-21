import HighlightModal from '../../../../components/HighlightModal';
import { useNavigate }  from 'react-router-dom';

const HighlightPage = () => {
    const navigate = useNavigate();
    return (
        <div>
            <HighlightModal onClose={() => navigate(-1)} />
        </div>
    );
}

export default HighlightPage;