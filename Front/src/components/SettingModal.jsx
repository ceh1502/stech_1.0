import {createPortal} from "react-dom";
import {useEffect} from "react";
import Setting from "./setting.png";

/** Customer Support 모달 */
export default function SettingModal({onClose}) {
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
          width: "1340px",
          height: "1094px",
          background: "#2C2C2C",
          borderRadius: 12,
          padding: 24,
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
        }}
      >
        <div
          onClick={onClose}
          style={{
            display: "grid",
            gridTemplateRows: "1fr auto",
            alignItems: "center",
            marginBottom: 40,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
          onClick={onClose}
            src={Setting}
            alt="settings"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "center",
            }}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
