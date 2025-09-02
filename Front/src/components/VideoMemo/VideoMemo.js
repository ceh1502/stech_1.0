import React, { useState, useEffect } from 'react';
import { IoClose, IoSave, IoTrash, IoTime } from 'react-icons/io5';
import './VideoMemo.css';

const VideoMemo = ({
  isVisible,
  onClose,
  clipId,
  memos,
  onSaveMemo,
  clipInfo,
}) => {
  const [memoContent, setMemoContent] = useState('');
  const [savedMemos, setSavedMemos] = useState([]);

  useEffect(() => {
    // 저장된 메모 불러오기
    const storedMemos = JSON.parse(
      localStorage.getItem(`memo_${clipId}`) || '[]',
    );
    setSavedMemos(storedMemos);

    // 현재 클립의 메모 불러오기
    if (memos[clipId]) {
      setMemoContent(memos[clipId]);
    } else {
      setMemoContent('');
    }
  }, [clipId, memos, isVisible]);

  const saveMemo = () => {
    if (!memoContent.trim()) return;

    const newMemo = {
      id: Date.now(),
      content: memoContent,
      timestamp: new Date().toISOString(),
      clipInfo: clipInfo,
    };

    const updatedMemos = [...savedMemos, newMemo];
    setSavedMemos(updatedMemos);
    localStorage.setItem(`memo_${clipId}`, JSON.stringify(updatedMemos));
    onSaveMemo(clipId, memoContent);
    setMemoContent('');
  };

  const deleteMemo = (memoId) => {
    const updatedMemos = savedMemos.filter((m) => m.id !== memoId);
    setSavedMemos(updatedMemos);
    localStorage.setItem(`memo_${clipId}`, JSON.stringify(updatedMemos));

    if (updatedMemos.length === 0) {
      onSaveMemo(clipId, null);
    }
  };

  const exportMemos = () => {
    const dataStr = JSON.stringify(savedMemos, null, 2);
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `memos_clip_${clipId}_${Date.now()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  if (!isVisible) return null;

  return (
    <div className="memoOverlay">
      <div className="memoContainer">
        <div className="memoHeader">
          <h3>📝 플레이 메모</h3>
          <button className="memoCloseBtn" onClick={onClose}>
            <IoClose size={24} />
          </button>
        </div>

        <div className="memoClipInfo">
          <span>Q{clipInfo.quarter}</span>
          {clipInfo.down && <span>{clipInfo.down}번째 다운</span>}
          {clipInfo.playType && <span>{clipInfo.playType}</span>}
          <span className="memoTime">
            <IoTime size={14} /> {clipInfo.time}
          </span>
        </div>

        <div className="memoContent">
          <div className="memoInput">
            <textarea
              value={memoContent}
              onChange={(e) => setMemoContent(e.target.value)}
              placeholder="이 플레이에 대한 메모를 작성하세요..."
              rows={4}
            />
            <div className="memoActions">
              <button
                className="memoSaveBtn"
                onClick={saveMemo}
                disabled={!memoContent.trim()}
              >
                <IoSave /> 저장
              </button>
            </div>
          </div>

          {savedMemos.length > 0 && (
            <div className="memoList">
              <div className="memoListHeader">
                <h4>저장된 메모 ({savedMemos.length})</h4>
                <button className="memoExportBtn" onClick={exportMemos}>
                  내보내기
                </button>
              </div>
              {savedMemos.map((memo) => (
                <div key={memo.id} className="memoItem">
                  <div className="memoItemHeader">
                    <span className="memoDate">
                      {new Date(memo.timestamp).toLocaleString('ko-KR')}
                    </span>
                    <button
                      className="memoDeleteBtn"
                      onClick={() => deleteMemo(memo.id)}
                    >
                      <IoTrash size={16} />
                    </button>
                  </div>
                  <div className="memoItemContent">{memo.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoMemo;
