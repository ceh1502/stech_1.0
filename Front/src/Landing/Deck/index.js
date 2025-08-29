import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Header from '../LandingHome/Header';
import Footer from '../LandingHome/Footer';
import './deck.css';
import TeamLogo from '../../../assets/images/png/TeamPng/teamLogo.png';

// PDF.js worker 설정
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`;

const Deck = () => {
    const [numPages, setNumPages] = useState(null);

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
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
                <div className="pdfViewer" style={{ overflowY: 'auto', maxHeight: '600px', maxWidth: '1080px', margin: '0 auto' }}>
                    <Document file="/pdf/KOR_Stech_Deck_Public.pdf" onLoadSuccess={onDocumentLoadSuccess}>
                        {Array.from(new Array(numPages), (el, index) => (
                            <Page
                                key={`page_${index + 1}`}
                                pageNumber={index + 1}
                                width={1060} // 고정 width
                                height={600} // 고정 height
                                renderMode="canvas" // 이미지처럼 보이게
                                options={{ disableTextLayer: false, disableAnnotationLayer: false }} // 텍스트 레이어 비활성화
                            />
                        ))}
                    </Document>
                </div>
            </div>

            <div className="deckmessage">
                <p>
                    Stech Pro는 AI 객체 인식 기술을 기반으로, 경기 영상을 자동 분석해 코치와 선수들이 더 빠르고 정확한 인사이트를 얻을 수 있도록 돕습니다. <br />
                    지금까지는 수작업 중심의 데이터 입력과 지연된 분석 결과 때문에 코치들은 전략 수립과 현장 지도에 집중하기 어려웠습니다. <br />
                    Stech Pro는 이러한 한계를 해결하며, 코칭 효율을 크게 향상시킵니다.
                    <br />
                    <br />
                    우리의 IR Deck은 Stech이 바라보는 문제와 해결 방안, 그리고 우리가 준비한 시장 기회·제품과 기술·비즈니스 모델·성장 로드맵을 담고 있습니다. <br />
                    글로벌 스포츠 데이터 분석 시장은 빠르게 성장하고 있으며, Stech은 Stech Pro를 한국시장에서 검증을 거쳐 미국과 아시아 시장까지 확장할 계획입니다.
                    <br />
                    <br />
                    투자자와 파트너는 IR Deck을 통해 Stech이 어떻게 스포츠 데이터 혁신을 주도하고, 지속 가능한 수익 모델을 구축하며, <br /> 글로벌 리더십을 확보하려는지 확인하실 수 있습니다.
                </p>
            </div>

            <Footer />
        </div>
    );
};

export default Deck;
