import {createPortal} from "react-dom";
import {useEffect} from "react";
import Logo from "../assets/images/logos/stech2.png";
import {IoCloseCircleOutline} from "react-icons/io5";
import { MdOutlineHandyman } from "react-icons/md";

/** Customer Support 모달 */
export default function SuggestionModal({onClose}) {
  // ESC 키로 닫기
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  /* ── 여기: open 같은 prop 검사는 없습니다! ── */

  return createPortal(
    <div /* 검은 반투명 오버레이 */
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.5)",
        zIndex: 9999,
      }}
    >
      <div /* 흰색 모달 박스 */
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "56.25rem",
          height: "31.25rem",
          background: "#2C2C2C",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateRows: "1fr auto",
            alignItems: "center",
            marginBottom: 40,
          }}
        >
          <IoCloseCircleOutline onClick={onClose} 
          style={{
            width: '4rem',
            color:' #fff',
            height: '4rem',
            justifySelf:'end',
          }} />
          <MdOutlineHandyman
            style={{color:'#A5A5A5', width:'6.5rem',height:'6.5rem', justifySelf:'center'}} // 원하는 높이로 조절
          />
        </div>
        <div style={{paddingTop: '4rem'}}>
          <p style={{color: '#fff', fontSize: '3.5rem', fontFamily:'Inter', fontWeight:'600', marginBottom: 24, textAlign: "center"}}> 서비스 구축 중</p>
          <br/>
          <p style={{color: '#fff', fontSize: '1.875rem', fontFamily:'Inter', fontWeight:'600', marginBottom: 24, textAlign: "center"}}>
            현재 이 기능은 구축중입니다. 빠른 시일내에 돌아오겠습니다!
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
