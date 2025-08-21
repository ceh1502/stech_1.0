import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { IoCloseCircleOutline } from "react-icons/io5";
import Logo from "../assets/images/logos/stech2.png";
import "./FAQModal.css";

/** Customer Support / FAQ Modal */
export default function FAQModal({ isOpen = true, onClose = () => {} }) {
  // ESC로 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const [expanded, setExpanded] = useState(null);
  const toggleFAQ = (idx) => setExpanded((cur) => (cur === idx ? null : idx));

  // 표시할 FAQ (8개)
  const faq = [
    {
      q: "StechPro는 무슨 서비스를 제공하나요?",
      a: "Stech Pro는 코치와 팀을 위한 객체인식 AI 기반 스포츠 분석 플랫폼입니다. 영상을 업로드하면 AI가 자동으로 객체를 인식하고 경기 데이터를 분석해 리포트를 생성합니다.",
    },
    {
      q: "어떻게 이용하나요?",
      a: "경기 영상을 업로드 하면 AI가 자동으로 분석을 시작합니다. 별도의 장비 없이 데이터 및 분석 리포트를 받을 수 있습니다.",
    },
    {
      q: "StechPro로부터 어떤 도움을 받을 수 있나요?",
      a: "플레이 유형, 주요 경기 상황 등의 분석을 통해 경기 데이터와 선수 데이터를 구체화하고 리포트를 통해 경기 피드백에 활용할 수 있습니다.",
    },
    {
      q: "특별한 촬영 장비가 필요한가요?",
      a: "일반 스마트폰, 캠코더로 사이드라인에서 촬영한 영상을 업로드 해주세요.",
    },
    {
      q: "분석 리포트는 어떤 형식으로 제공되나요?",
      a: "포지션별 움직임, 주요 스탯 등이 시각적으로 정리된 PDF 리포트와 함께, 대시보드에서 확인 가능한 인터랙티브 분석을 제공합니다.",
    },
    {
      q: "분석에는 시간이 얼마나 걸리나요?",
      a: "영상 업로드 이후 보통 24시간 이내 제공됩니다. 영상 길이나 화질에 따라 소요 시간은 달라질 수 있습니다.",
    },
    {
      q: "어떤 종목을 지원하나요?",
      a: "현재는 미식축구를 지원합니다. 추후 타 종목도 순차적으로 확장 예정입니다.",
    },
    {
      q: "서비스 이용 요금은 어떻게 되나요?",
      a: "경기 영상 1건당 과금되며, 정액제/팀 단위 요금제도 있습니다. 자세한 내용은 요금 안내 페이지를 확인해 주세요.",
    },
  ];

  if (!isOpen) return null;

  return createPortal(
    <div className="faq-modal-overlay" onClick={onClose}>
      <div className="faq-modal" onClick={(e) => e.stopPropagation()}>
        {/* Topbar */}
        <div className="faq-topbar">
          <button
            type="button"
            className="faq-close"
            aria-label="닫기"
            onClick={onClose}
          >
            <IoCloseCircleOutline />
          </button>
          <img className="faq-logo" src={Logo} alt="Stech" />
        </div>

        {/* Hero */}
        <div className="faq-hero">
          <h2>Frequently Asked Questions</h2>
          <p>
            아래의 질문으로 문제가 해결되지 않았다면 {" "}
            <a href="mailto:hello@squareup.com">stechpro.ai@gmail.com</a>로
            <br/>
            연락 주시면 최대한 빠르게 답변 드리겠습니다
          </p>
        </div>

        {/* Content */}
        <section className="faq-content">
          <div className="faq-grid">
            {[0, 1].map((col) => (
              <div className="faq-col" key={col}>
                {faq.slice(col * 4, col * 4 + 4).map((item, i) => {
                  const idx = col * 4 + i;
                  const open = expanded === idx;
                  return (
                    <article
                      className={`faq-item ${open ? "open" : ""}`}
                      key={idx}
                    >
                      <button
                        type="button"
                        className={`faq-header ${open ? "open" : ""}`}
                        aria-expanded={open}
                        aria-controls={`faq-body-${idx}`}
                        onClick={() => toggleFAQ(idx)}
                      >
                        <span className="faq-num">
                          {(idx + 1).toString().padStart(2, "0")}
                        </span>
                        <h4 className="faq-q">{item.q}</h4>
                        <span className="faq-toggle">{open ? "—" : "+"}</span>
                      </button>
                      <div
                        id={`faq-body-${idx}`}
                        className="faq-body"
                        role="region"
                      >
                        <p className="faq-a">{item.a}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>,
    document.body
  );
}
