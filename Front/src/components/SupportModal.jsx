import { createPortal } from 'react-dom';
import { useEffect } from 'react';
import Logo from '../assets/images/png/LandingLogosmall.png';

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
                position: 'fixed',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.5)',
                zIndex: 9999,
            }}
        >
            <div /* 흰색 모달 박스 */
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: 500,
                    background: 'White',
                    borderRadius: 12,
                    padding: 24,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                    <img
                        src={Logo}
                        alt="Logo"
                        style={{ paddingLeft: 20, height: 40 }} // 원하는 높이로 조절
                    />
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 30px',
                            background: '#2563eb',
                            color: '#fff',
                            borderRadius: 6,
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        Close
                    </button>
                </div>
                <p style={{ marginBottom: 24, textAlign: 'center' }}>
                    If you have any inconvenience or problems, please contact us using the contact information below.
                    <br /> We will respond as quickly as possible.
                    <br />
                    <br /> <bold>Email: stechpro.ai@gmail.com</bold>
                </p>
            </div>
        </div>,
        document.body
    );
}
