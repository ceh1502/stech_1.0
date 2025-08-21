import { BsArrowReturnRight } from 'react-icons/bs';
import FAQModal from '../../../../components/FAQModal';
import {useNavigate} from 'react-router-dom';

const FAQPage = () => {
  const navigate = useNavigate();
  return(
    <div>
      <FAQModal onClose={() => navigate(-1)} />
    </div>
  )

}

export default FAQPage;