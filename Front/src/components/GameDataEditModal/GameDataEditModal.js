import React, { useState, useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
import './GameDataEditModal.css';

const GameDataEditModal = ({ isVisible, onClose, clipId, gameId }) => {
  const [gameData, setGameData] = useState({
    gameId: '',
    clipId: '',
  });
  const [requestContent, setRequestContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 모달이 열릴 때 백엔드에서 경기 ID와 클립 ID 조회
  useEffect(() => {
    const fetchGameData = async () => {
      if (!isVisible || !clipId) return;

      setIsLoading(true);
      try {
        // 백엔드 API 호출 - 실제 API 엔드포인트로 변경해주세요
        const response = await fetch(`/api/clips/${clipId}/game-info`);
        const data = await response.json();

        setGameData({
          gameId: data.gameId || '',
          clipId: data.clipId || clipId,
        });
      } catch (error) {
        console.error('게임 데이터 조회 실패:', error);
        // 실패 시 기본값 설정
        setGameData({
          gameId: gameId || '',
          clipId: clipId || '',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchGameData();
  }, [isVisible, clipId, gameId]);

  // 수정 요청 제출
  const handleSubmit = async () => {
    if (!requestContent.trim()) {
      alert('수정 요청 사항을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Slack 알림 전송 API 호출
      const response = await fetch('/api/game-data/edit-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId: gameData.gameId,
          clipId: gameData.clipId,
          requestContent: requestContent.trim(),
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        alert('수정 요청이 전송되었습니다.');
        setRequestContent('');
        onClose();
      } else {
        throw new Error('요청 전송에 실패했습니다.');
      }
    } catch (error) {
      console.error('수정 요청 전송 실패:', error);
      alert('수정 요청 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRequestContent('');
    onClose();
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="gameDataEditOverlay" onClick={handleClose} />
      <div className="gameDataEditModal">
        <div className="gameDataEditHeader">
          <h3>경기 데이터 수정 요청</h3>
          <button className="gameDataEditCloseBtn" onClick={handleClose}>
            <IoClose size={24} />
          </button>
        </div>

        <div className="gameDataEditContent">
          <div className="gameDataEditRow">
            <label className="gameDataEditLabel">경기 ID</label>
            <input
              type="text"
              className="gameDataEditInput"
              value={isLoading ? '로딩 중...' : gameData.gameId}
              readOnly
              placeholder="경기 ID를 불러오는 중..."
            />
          </div>

          <div className="gameDataEditRow">
            <label className="gameDataEditLabel">클립 ID</label>
            <input
              type="text"
              className="gameDataEditInput"
              value={isLoading ? '로딩 중...' : gameData.clipId}
              readOnly
              placeholder="클립 ID를 불러오는 중..."
            />
          </div>

          <div className="gameDataEditRow">
            <label className="gameDataEditLabel">수정 요청 사항</label>
            <textarea
              className="gameDataEditTextarea"
              value={requestContent}
              onChange={(e) => setRequestContent(e.target.value)}
              placeholder="수정이 필요한 내용을 상세히 작성해주세요."
              rows={6}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="gameDataEditActions">
          <button
            className="gameDataEditSubmitBtn"
            onClick={handleSubmit}
            disabled={isSubmitting || isLoading || !requestContent.trim()}
          >
            {isSubmitting ? '전송 중...' : '수정 요청'}
          </button>
        </div>
      </div>
    </>
  );
};

export default GameDataEditModal;
