// src/components/Auth/TermsModal.js
import React, { useState, useEffect, useCallback } from 'react';
import './TermsModal.css';

const TermsModal = ({ isOpen, onClose, onAgree, termType, currentAgreement = false }) => {
    const [termContent, setTermContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // 약관 타입별 정보
    const termInfo = {
        termsOfService: {
            title: 'Terms of Service',
            required: true,
        },
        privacyPolicy: {
            title: 'Privacy Policy',
            required: true,
        },
    };

    const loadTermContent = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            console.log(`Loading terms for: ${termType}`);

            let content = '';

            // 동적 import로 txt 파일 가져오기
            if (termType === 'termsOfService') {
                const module = await import('../../assets/terms/termsOfService.md');
                const response = await fetch(module.default);
                content = await response.text();
            } else if (termType === 'privacyPolicy') {
                const module = await import('../../assets/terms/privacyPolicy.md');
                const response = await fetch(module.default);
                content = await response.text();
            } else {
                throw new Error(`Unknown term type: ${termType}`);
            }

            console.log('Terms content loaded:', content.substring(0, 100) + '...');

            // 텍스트를 HTML로 변환 (줄바꿈 처리)
            const formattedContent = content.replace(/\n/g, '<br>').replace(/\r/g, '');

            setTermContent(formattedContent);
        } catch (err) {
            console.error('Error loading terms:', err);
            setError(`Failed to load terms: ${err.message}`);

            // 에러 발생시 기본 메시지 표시
            setTermContent(`
        <div style="color: #dc2626; padding: 20px;">
          <p><strong>약관을 불러올 수 없습니다.</strong></p>
          <p>파일 경로: src/assets/terms/${termType === 'termsOfService' ? 'termsOfService.txt' : 'privacyPolicy.txt'}</p>
          <p>에러: ${err.message}</p>
          <br>
          <p><strong>해결 방법:</strong></p>
          <p>1. 파일이 src/assets/terms/ 폴더에 있는지 확인</p>
          <p>2. 파일명이 정확한지 확인</p>
          <p>3. webpack이 txt 파일을 처리할 수 있도록 설정되어 있는지 확인</p>
        </div>
      `);
        } finally {
            setLoading(false);
        }
    }, [termType]);

    // 동의 핸들러
    const handleAgree = () => {
        console.log('Terms agreed for:', termType);
        onAgree(termType);
        onClose();
    };

    // 약관 내용 로드
    useEffect(() => {
        if (isOpen && termType) loadTermContent();
    }, [isOpen, termType, loadTermContent]);

    // 키보드 이벤트 처리
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const currentTermInfo = termInfo[termType];

    return (
        <div className="termsModalOverlay" onClick={onClose}>
            <div className="termsModalContent" onClick={(e) => e.stopPropagation()}>
                {/* 헤더 */}
                <div className="termsModalHeader" style={{ padding: '10px 10px 10px 20px' }}>
                    <h2 className="termsModalTitle">
                        {currentTermInfo?.title || 'Terms and Conditions'}
                        {currentTermInfo?.required && <span className="requiredBadge">Required</span>}
                    </h2>
                    <button className="termsModalCloseButton" onClick={onClose} aria-label="Close modal">
                        ✕
                    </button>
                </div>

                {/* 내용 */}
                <div className="termsModalBody">
                    {loading && (
                        <div className="termsModalLoading">
                            <div className="loadingSpinner"></div>
                            <p>Loading terms...</p>
                        </div>
                    )}

                    {!loading && (
                        <div
                            className="termsContent"
                            style={{
                                lineHeight: '1.6',
                                fontSize: '14px',
                                color: '#f9fafb',
                                whiteSpace: 'pre-wrap',
                            }}
                            dangerouslySetInnerHTML={{
                                __html: termContent,
                            }}
                        />
                    )}

                    {error && (
                        <div className="termsModalError">
                            <p>⚠️ {error}</p>
                            <button onClick={loadTermContent} className="retryButton">
                                Retry
                            </button>
                        </div>
                    )}
                </div>

                {/* 푸터 */}
                <div className="termsModalFooter">
                    <div className="currentAgreementStatus">
                        {currentAgreement ? <span className="agreedStatus">✅ Currently Agreed</span> : <span className="notAgreedStatus">❌ Not Agreed</span>}
                    </div>

                    <div className="termsModalActions">
                        <button className="termsModalCancelButton" onClick={onClose}>
                            Close
                        </button>

                        <button className="termsModalAgreeButton" onClick={handleAgree} disabled={loading}>
                            {currentAgreement ? 'Update Agreement' : 'I Agree'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsModal;
