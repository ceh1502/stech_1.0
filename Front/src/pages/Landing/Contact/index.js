import React, { useState } from 'react';
import Header from '../LandingHome/Header';
import Footer from '../LandingHome/Footer';
import './contact.css';
import TeamLogo from '../../../assets/images/png/TeamPng/teamLogo.png';
import email from '../../../assets/images/png/ContactPng/email-icon.png';
import phone from '../../../assets/images/png/ContactPng/phone-icon.png';
import location from '../../../assets/images/png/ContactPng/location-icon.png';

const Contact = () => {
  const [expanded, setExpanded] = useState(null);

  const faqData = [
    {
      question: 'StechPro는 무슨 서비스를 제공하나요?',
      answer:
        'Stech Pro는 코치와 팀을 위한 객체인식 AI 기반 스포츠 분석 플랫폼입니다. 영상을 업로드하면 AI가 자동으로 객체를 인식하고 경기 데이터를 분석해 리포트를 생성합니다.',
    },
    {
      question: '어떻게 이용하나요?',
      answer:
        '경기 영상을 업로드 하면 AI가 자동으로 분석을 시작합니다. \n 별도의 장비 없이 데이터 및 분석 리포트를 받을 수 있습니다. ',
    },
    {
      question: 'StechPro로부터 어떤 도움을 받을 수 있나요?',
      answer:
        '플레이 유형, 주요 경기 상황 등의 분석을 통해 경기 데이터와 선수 데이터를 구체화하고 리포트를 통해 경기 피드백에 활용할 수 있습니다.',
    },
    {
      question: '특별한 촬영 장비가 필요한가요?',
      answer:
        '일반 스마트폰, 캠코더로 사이드라인에서 촬영한 영상을 \n업로드 해주세요.',
    },
    {
      question: '분석 리포트는 어떤 형식으로 제공되나요?',
      answer:
        '포지션별 움직임, 주요 스탯 등이 시각적으로 정리된 PDF \n리포트와 함께, 대시보드 상에서 확인할 수 있는 인터랙티브 \n분석을 제공합니다.',
    },
    {
      question: '분석에 걸리는 시간은 얼마나 걸리나요?',
      answer:
        '영상 업로드 이후 24시간 이내에 제공됩니다. \n영상 길이나 화질에 따라 소요 시간은 달라질 수 있습니다.',
    },
    {
      question: '어떤 종목을 지원하나요?',
      answer: '현재는 미식축구를 지원합니다. \n추후 타 종목도 확장 예정입니다.',
    },
    {
      question: '서비스 이용 요금은 어떻게 되나요?',
      answer:
        '경기 영상 1건 당 분석 단위로 과금되며, 정액제 요금제나 \n팀 단위 요금제도 제공합니다. 자세한 내용은 요금 안내 \n페이지를 확인해 주세요.',
    },
  ];

  const toggleFAQ = (index) => {
    setExpanded(expanded === index ? null : index);
  };

  return (
    <div>
      <div className="contactContainer">
        <Header style={{ zIndex: '2' }} />

        <section className="contactSection">
          <div className="contactHeader">
            <h1>Hello We are</h1>
            <img src={TeamLogo} alt="Stech Logo" className="contactLogo" />
          </div>
          <div className="contactLinks">
            <a href="mailto:ethos614@stechpro.ai" className="contactLink">
              <img src={email} alt="Email" className="contacticon" /> ethos614@stechpro.ai
            </a>
            <a href="tel:+821023887500" className="contactLink">
              <img src={phone} alt="phone" className="contacticon" /> +82 10 2388 7500
            </a>
            <a href="https://maps.app.goo.gl/9kVkpUNULNxzgyHS6" className="contactLink">
              <img src={location} alt="location" className="contacticon" /> 서울특별시 송파구 송파대로
            </a>
          </div>

          <form className="contactForm">
            <div className="ContactformGroup">
              <div className="inputRow">
                <div className="inputWrapper">
                  <label htmlFor="fullName">이름</label>
                  <input type="text" id="fullName" placeholder="Type here" />
                </div>
                <div className="inputWrapper">
                  <label htmlFor="email">이메일</label>
                  <input type="email" id="email" placeholder="Type here" />
                </div>
              </div>
              <div className="inputWrapper">
                <label htmlFor="reason">문의하시는 이유가 무엇입니까?</label>
                <textarea id="reason" placeholder="Type here"></textarea>
              </div>
              <div className="inputWrapper">
                <label htmlFor="message">내용</label>
                <textarea id="message" placeholder="Type here"></textarea>
              </div>
            </div>
            <button type="submit" className="contactsubmitButton">제출하기</button>
          </form>
        </section>

        <section className="faqSection">
          <div className="faqContent">
            <h2>자주 묻는 질문 (FAQ)</h2>
            <p>
              여전히 궁금하신 점이 있으신가요?
              <br />
              ethos614@stechpro.ai
            </p>
          </div>
          <div className="faqGrid">
            <div className="faqColumn">
              {faqData.slice(0, 4).map((item, index) => {
                const lines = item.answer.split('\n');
                return (
                  <div key={index} className={`faqItem ${expanded === index ? 'expanded' : ''}`}>
                    <div
                      className={`faqHeader ${expanded === index ? 'expanded' : ''}`}
                      onClick={() => toggleFAQ(index)}
                    >
                      <span className="faqNumber">0{index + 1}</span>
                      <h4>{item.question}</h4>
                      <span className="toggleIcon">{expanded === index ? '—' : '+'}</span>
                    </div>
                    <div className={`faqBody ${expanded === index ? 'expanded' : ''}`}>
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
            <div className="faqColumn">
              {faqData.slice(4).map((item, index) => {
                const idx = index + 4;
                const lines = item.answer.split('\n');
                return (
                  <div key={idx} className={`faqItem ${expanded === idx ? 'expanded' : ''}`}>
                    <div
                      className={`faqHeader ${expanded === idx ? 'expanded' : ''}`}
                      onClick={() => toggleFAQ(idx)}
                    >
                      <span className="faqNumber">0{index + 5}</span>
                      <h4>{item.question}</h4>
                      <span className="toggleIcon">{expanded === idx ? '—' : '+'}</span>
                    </div>
                    <div className={`faqBody ${expanded === idx ? 'expanded' : ''}`}>
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
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
