import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import Logo from "../assets/images/logos/stech2.png";
import {IoCloseCircleOutline} from "react-icons/io5";

/** Customer Support 모달 */
export default function SupportModal({ onClose }) {
    // ESC 키로 닫기
    useEffect(() => {
        const handler = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
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
          <img
            src={Logo}
            alt="Logo"
            style={{ width:'21.25rem', justifySelf:'center'}} // 원하는 높이로 조절
          />
        </div>
        <div style={{paddingTop: '3rem'}}>
          <p style={{color: '#fff', fontSize: '1.875rem', fontFamily:'Inter', lineHeight: 'normal',fontWeight:'600', marginBottom: 24, textAlign: "center"}}>
            불편하시거나 문제가 있으시면 아래 연락처로 문의해주세요.
            <br /> 
            최대한 빨리 답변해 드리겠습니다.
            <br/>
            <br/>
            이메일 : stechpro.ai@gmail.com
            <br/>
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
