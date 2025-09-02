import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Header from '../LandingHome/Header';
import Footer from '../LandingHome/Footer';
import './deck.css';
import TeamLogo from '../../../assets/images/png/TeamPng/teamLogo.png';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// PDF.js worker 설정
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const Deck = () => {
  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visiblePages, setVisiblePages] = useState(new Set([1])); // 보이는 페이지만 렌더링
  const [loadProgress, setLoadProgress] = useState(0);
  const containerRef = useRef(null);
  const pageRefs = useRef({});

  // 문서 로드 성공
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  // 문서 로드 에러
  const onDocumentLoadError = (error) => {
    console.error('PDF 로드 에러:', error);
    setError('PDF를 불러오는데 실패했습니다.');
    setLoading(false);
  };

  // 로드 진행률
  const onLoadProgress = ({ loaded, total }) => {
    setLoadProgress(Math.round((loaded / total) * 100));
  };

  // Intersection Observer로 보이는 페이지만 렌더링
  useEffect(() => {
    if (!numPages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageNumber = parseInt(entry.target.dataset.pageNumber);
          if (entry.isIntersecting) {
            setVisiblePages((prev) => new Set([...prev, pageNumber]));
          }
        });
      },
      {
        root: containerRef.current,
        rootMargin: '100px', // 미리 로드
        threshold: 0.01,
      },
    );

    // 모든 페이지 placeholder 관찰
    Object.values(pageRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [numPages]);

  // 페이지 컴포넌트
  const PDFPage = ({ pageNumber }) => {
    const isVisible = visiblePages.has(pageNumber);

    return (
      <div
        ref={(el) => (pageRefs.current[pageNumber] = el)}
        data-page-number={pageNumber}
        className="pdf-page-container"
      >
        {isVisible ? (
          <Page
            pageNumber={pageNumber}
            width={1080} // 고정 width
            renderMode="canvas"
            renderTextLayer={false}
            renderAnnotationLayer={false}
          />
        ) : (
          <div className="page-placeholder">
            <div className="page-number">
              페이지 {pageNumber}/{numPages}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="deckContainer">
      <Header style={{ zIndex: '2' }} />

      <div className="deckheader">
        <div className="decklogoandtitle">
          <img src={TeamLogo} alt="Stech Logo" className="deckheaderlogo" />
          <h1 className="decktitle">IR Deck</h1>
        </div>
      </div>

      {/* PDF 미리보기 */}
      <div className="deckmain">
        <div className="pdfViewer" ref={containerRef}>
          {loading && (
            <div className="pdf-loading-container">
              <div className="pdf-loading">
                <div className="loading-spinner"></div>
                <div className="loading-text">
                  PDF 로딩 중... {loadProgress}%
                </div>
                <div className="loading-bar">
                  <div
                    className="loading-progress"
                    style={{ width: `${loadProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="pdf-error">
              <p>{error}</p>
              <button onClick={() => window.location.reload()}>
                다시 시도
              </button>
            </div>
          )}

          <Document
            file="/pdf/KOR_Stech_Deck_Public.pdf"
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            onLoadProgress={onLoadProgress}
            loading={null} // 커스텀 로딩 사용
          >
            {numPages &&
              Array.from(new Array(numPages), (el, index) => (
                <PDFPage key={`page_${index + 1}`} pageNumber={index + 1} />
              ))}
          </Document>
        </div>
      </div>

      <div className="deckmessage">
        <p>
          Stech Pro는 AI 객체 인식 기술을 기반으로, 경기 영상을 자동 분석해
          코치와 선수들이 더 빠르고 정확한 인사이트를 얻을 수 있도록 돕습니다.{' '}
          <br />
          지금까지는 수작업 중심의 데이터 입력과 지연된 분석 결과 때문에
          코치들은 전략 수립과 현장 지도에 집중하기 어려웠습니다. <br />
          Stech Pro는 이러한 한계를 해결하며, 코칭 효율을 크게 향상시킵니다.
          <br />
          <br />
          우리의 IR Deck은 Stech이 바라보는 문제와 해결 방안, 그리고 우리가
          준비한 시장 기회·제품과 기술·비즈니스 모델·성장 로드맵을 담고
          있습니다. <br />
          글로벌 스포츠 데이터 분석 시장은 빠르게 성장하고 있으며, Stech은 Stech
          Pro를 한국시장에서 검증을 거쳐 미국과 아시아 시장까지 확장할
          계획입니다.
          <br />
          <br />
          투자자와 파트너는 IR Deck을 통해 Stech이 어떻게 스포츠 데이터 혁신을
          주도하고, 지속 가능한 수익 모델을 구축하며, <br /> 글로벌 리더십을
          확보하려는지 확인하실 수 있습니다.
        </p>
      </div>

      <Footer />
    </div>
  );
};

export default Deck;
