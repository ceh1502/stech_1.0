import './NotFound.css';
import Error from '../../../assets/images/png/404Png/404Error.png';

const NotFoundPage = () => {
  return (
    <div className="notfound">
      <img
        src={Error}
        alt="404 Error Page"
        className="Error-Page"
      />
      <q1> 404, 페이지를 찾을 수 없습니다. </q1>
      <q2> 페이지가 존재하지 않거나, 사용할 수 없는 페이지입니다. <br />
      입력하신 주소가 정확한지 다시 한 번 확인해주세요.</q2>
      <div className="button-group">
        <a href="../" className="back-button"> ← 이전 페이지 </a>
        <a href="/" className="home-button"> ⌂ 홈으로 돌아가기 </a>
      </div>
    </div>
  );
};

export default NotFoundPage;
