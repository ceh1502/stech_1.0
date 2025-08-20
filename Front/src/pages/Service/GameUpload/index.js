import React, { useState } from 'react';
import axios from 'axios';
import './index.css';

const GameUploadPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validation = validateFile(file);
      if (validation.valid) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError(validation.message);
        setSelectedFile(null);
      }
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      const validation = validateFile(file);
      if (validation.valid) {
        setSelectedFile(file);
        setError(null);
      } else {
        setError(validation.message);
      }
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    setUploadStatus('uploading');
    setError(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('gameFile', selectedFile);

    try {
      const response = await axios.post('/api/game/upload-json', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(progress);
        }
      });

      if (response.data.success) {
        setResult(response.data.data);
        setUploadStatus('success');
        console.log('업로드 성공:', response.data);
      } else {
        setError(response.data.message);
        setUploadStatus('error');
      }

    } catch (error) {
      console.error('업로드 에러:', error);
      setError(error.response?.data?.message || '업로드 중 오류가 발생했습니다');
      setUploadStatus('error');
    }
  };

  const validateFile = (file) => {
    if (!file) {
      return { valid: false, message: '파일을 선택해주세요' };
    }
    
    if (!file.name.toLowerCase().endsWith('.json') && file.type !== 'application/json') {
      return { valid: false, message: 'JSON 파일만 업로드 가능합니다' };
    }
    
    if (file.size > 10 * 1024 * 1024) {
      return { valid: false, message: '파일 크기가 너무 큽니다 (최대 10MB)' };
    }
    
    return { valid: true };
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setResult(null);
    setError(null);
  };

  return (
    <div className="game-upload-container">
      <div className="upload-header">
        <h2>🏈 게임 데이터 업로드</h2>
        <p>JSON 파일을 업로드하면 자동으로 모든 선수의 통계를 분석합니다</p>
      </div>

      {/* 파일 드롭 존 */}
      <div 
        className={`drop-zone ${selectedFile ? 'has-file' : ''} ${uploadStatus === 'uploading' ? 'uploading' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input 
          type="file" 
          accept=".json"
          onChange={handleFileSelect}
          disabled={uploadStatus === 'uploading'}
          style={{ display: 'none' }}
          id="file-input"
        />
        <label htmlFor="file-input" className="drop-label">
          {selectedFile ? (
            <div className="file-info">
              <div className="file-icon">📄</div>
              <div className="file-details">
                <div className="file-name">{selectedFile.name}</div>
                <div className="file-size">크기: {(selectedFile.size / 1024).toFixed(1)}KB</div>
              </div>
            </div>
          ) : (
            <div className="drop-content">
              <div className="drop-icon">📤</div>
              <div className="drop-text">
                <div className="primary-text">JSON 파일을 드래그하거나 클릭해서 선택하세요</div>
                <div className="secondary-text">최대 10MB, JSON 형식만 지원</div>
              </div>
            </div>
          )}
        </label>
      </div>

      {/* 에러 메시지 */}
      {error && (
        <div className="error-message">
          <span className="error-icon">❌</span>
          <span className="error-text">{error}</span>
        </div>
      )}

      {/* 업로드 버튼 */}
      {selectedFile && uploadStatus === 'idle' && (
        <div className="action-buttons">
          <button onClick={uploadFile} className="upload-button">
            🚀 게임 데이터 분석 시작
          </button>
          <button onClick={resetUpload} className="reset-button">
            취소
          </button>
        </div>
      )}

      {/* 업로드 진행 상황 */}
      {uploadStatus === 'uploading' && (
        <div className="upload-progress">
          <h3>🔄 업로드 및 분석 중... ({uploadProgress}%)</h3>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <div className="progress-steps">
            <div className={`step ${uploadProgress > 0 ? 'active' : ''}`}>
              📤 파일 업로드
            </div>
            <div className={`step ${uploadProgress === 100 ? 'active' : ''}`}>
              🔍 데이터 분석
            </div>
            <div className="step">
              💾 통계 저장
            </div>
          </div>
          <p>파일 업로드 및 게임 데이터 분석 중입니다. 잠시만 기다려주세요...</p>
        </div>
      )}

      {/* 성공 결과 */}
      {uploadStatus === 'success' && result && (
        <div className="success-result">
          <div className="success-header">
            <h3>✅ 업로드 완료!</h3>
            <button onClick={resetUpload} className="new-upload-button">
              새 파일 업로드
            </button>
          </div>
          
          <div className="result-content">
            <div className="game-info">
              <h4>🎮 게임 정보</h4>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">경기:</span>
                  <span className="value">{result.gameInfo.homeTeam} vs {result.gameInfo.awayTeam}</span>
                </div>
                <div className="info-item">
                  <span className="label">게임 키:</span>
                  <span className="value">{result.gameInfo.gameKey}</span>
                </div>
                <div className="info-item">
                  <span className="label">날짜:</span>
                  <span className="value">{result.gameInfo.date}</span>
                </div>
                <div className="info-item">
                  <span className="label">장소:</span>
                  <span className="value">{result.gameInfo.location}</span>
                </div>
                {result.gameInfo.finalScore && (
                  <div className="info-item">
                    <span className="label">최종 스코어:</span>
                    <span className="value">
                      {result.gameInfo.finalScore.home || 0} - {result.gameInfo.finalScore.away || 0}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="analysis-summary">
              <h4>📊 분석 결과 요약</h4>
              <div className="summary-grid">
                <div className="summary-item">
                  <div className="summary-number">{result.summary.totalClipsProcessed}</div>
                  <div className="summary-label">총 클립 수</div>
                </div>
                <div className="summary-item">
                  <div className="summary-number">{result.summary.totalPlayers}</div>
                  <div className="summary-label">참여 선수</div>
                </div>
                <div className="summary-item">
                  <div className="summary-number">{result.summary.successfulPlayers}</div>
                  <div className="summary-label">분석 성공</div>
                </div>
                <div className="summary-item">
                  <div className="summary-number">{result.summary.successRate}%</div>
                  <div className="summary-label">성공률</div>
                </div>
              </div>
            </div>

            {/* 선수별 결과 */}
            <div className="player-results">
              <h4>👥 선수별 분석 결과</h4>
              
              {/* 성공한 선수들 */}
              {result.playerResults.filter(p => p.success).length > 0 && (
                <div className="player-section">
                  <h5 className="section-title success">✅ 분석 성공 ({result.playerResults.filter(p => p.success).length}명)</h5>
                  <div className="player-list">
                    {result.playerResults
                      .filter(p => p.success)
                      .sort((a, b) => a.playerNumber - b.playerNumber)
                      .map(player => (
                        <div key={player.playerNumber} className="player-item success">
                          <div className="player-info">
                            <span className="player-number">#{player.playerNumber}</span>
                            <span className="player-position">{player.position}</span>
                          </div>
                          <div className="player-stats">
                            <span className="player-clips">{player.clipsAnalyzed}개 클립</span>
                            <span className="status-icon">✅</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 실패한 선수들 */}
              {result.playerResults.filter(p => !p.success).length > 0 && (
                <div className="player-section">
                  <h5 className="section-title error">❌ 분석 실패 ({result.playerResults.filter(p => !p.success).length}명)</h5>
                  <div className="player-list">
                    {result.playerResults
                      .filter(p => !p.success)
                      .sort((a, b) => a.playerNumber - b.playerNumber)
                      .map(player => (
                        <div key={player.playerNumber} className="player-item failed">
                          <div className="player-info">
                            <span className="player-number">#{player.playerNumber}</span>
                            <span className="error-msg">{player.error}</span>
                          </div>
                          <div className="player-stats">
                            <span className="status-icon">❌</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* 처리 시간 */}
            <div className="processing-info">
              <small>
                처리 완료 시간: {new Date(result.gameInfo.processedAt).toLocaleString('ko-KR')}
              </small>
            </div>
          </div>
        </div>
      )}

      {/* 에러 상태 */}
      {uploadStatus === 'error' && (
        <div className="error-result">
          <h3>❌ 업로드 실패</h3>
          <p>{error}</p>
          <button onClick={resetUpload} className="retry-button">
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
};

export default GameUploadPage;