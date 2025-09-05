// FAQModal.jsx

// ✨ 수정된 부분: 'react'와 'react-dom'에서 올바르게 import 합니다.
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { IoCloseCircleOutline } from "react-icons/io5";
import "./FAQModal.css";

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

  const faqData = [
    {
      question: "StechPro는 무슨 서비스를 제공하나요?",
      answer: "Stech Pro는 코치와 팀을 위한 객체인식 AI 기반 스포츠 분석 플랫폼입니다. 영상을 업로드하면 AI가 자동으로 객체를 인식하고 경기 데이터를 분석해 리포트를 생성합니다.",
    },
    {
      question: "어떻게 이용하나요?",
      answer: "경기 영상을 업로드 하면 AI가 자동으로 분석을 시작합니다. \n 별도의 장비 없이 데이터 및 분석 리포트를 받을 수 있습니다. ",
    },
    {
      question: "StechPro로부터 어떤 도움을 받을 수 있나요?",
      answer: "플레이 유형, 주요 경기 상황 등의 분석을 통해 경기 데이터와 선수 데이터를 구체화하고 리포트를 통해 경기 피드백에 활용할 수 있습니다.",
    },
    {
      question: "특별한 촬영 장비가 필요한가요?",
      answer: "일반 스마트폰, 캠코더로 사이드라인에서 촬영한 영상을 \n업로드 해주세요.",
    },
    {
      question: "분석 리포트는 어떤 형식으로 제공되나요?",
      answer: "포지션별 움직임, 주요 스탯 등이 시각적으로 정리된 PDF \n리포트와 함께, 대시보드 상에서 확인할 수 있는 인터랙티브 \n분석을 제공합니다.",
    },
    {
      question: "분석에 걸리는 시간은 얼마나 걸리나요?",
      answer: "영상 업로드 이후 24시간 이내에 제공됩니다. \n영상 길이나 화질에 따라 소요 시간은 달라질 수 있습니다.",
    },
    {
      question: "어떤 종목을 지원하나요?",
      answer: "현재는 미식축구를 지원합니다. \n추후 타 종목도 확장 예정입니다.",
    },
    {
      question: "서비스 이용 요금은 어떻게 되나요?",
      answer: "경기 영상 1건 당 분석 단위로 과금되며, 정액제 요금제나 \n팀 단위 요금제도 제공합니다. 자세한 내용은 요금 안내 \n페이지를 확인해 주세요.",
    },
  ];

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-faq-overlay" onClick={onClose}>
      <div className="modal-faq-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-faq-close-btn" onClick={onClose}>
          <IoCloseCircleOutline />
        </button>
        
        <div className="modal-faqContent">
          <h2>자주 묻는 질문 (FAQ)</h2>
          <p>
            여전히 궁금하신 점이 있으신가요?
            <br />
            ethos614@stechpro.ai
          </p>
        </div>
        <div className="modal-faqGrid">
          <div className="modal-faqColumn">
            {faqData.slice(0, 4).map((item, index) => {
              const lines = item.answer.split('\n');
              return (
                <div key={index} className={`modal-faqItem ${expanded === index ? 'expanded' : ''}`}>
                  <div
                    className={`modal-faqHeader ${expanded === index ? 'expanded' : ''}`}
                    onClick={() => toggleFAQ(index)}
                  >
                    <span className="modal-faqNumber">0{index + 1}</span>
                    <h4>{item.question}</h4>
                    <span className="modal-toggleIcon">{expanded === index ? '—' : '+'}</span>
                  </div>
                  <div className={`modal-faqBody ${expanded === index ? 'expanded' : ''}`}>
                    <p>
                      {lines.map((line, lineIndex) => (
                        <React.Fragment key={lineIndex}>
                          {line}
                          {lineIndex < lines.length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="modal-faqColumn">
            {faqData.slice(4).map((item, index) => {
              const idx = index + 4;
              const lines = item.answer.split('\n');
              return (
                <div key={idx} className={`modal-faqItem ${expanded === idx ? 'expanded' : ''}`}>
                  <div
                    className={`modal-faqHeader ${expanded === idx ? 'expanded' : ''}`}
                    onClick={() => toggleFAQ(idx)}
                  >
                    <span className="modal-faqNumber">0{index + 5}</span>
                    <h4>{item.question}</h4>
                    <span className="modal-toggleIcon">{expanded === idx ? '—' : '+'}</span>
                  </div>
                  <div className={`modal-faqBody ${expanded === idx ? 'expanded' : ''}`}>
                    <p>
                      {lines.map((line, lineIndex) => (
                        <React.Fragment key={lineIndex}>
                          {line}
                          {lineIndex < lines.length - 1 && <br />}
                        </React.Fragment>
                      ))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}