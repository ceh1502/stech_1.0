// src/pages/Service/Video/VideoSettingsPage.js

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVideoSettings } from '../../../../hooks/useVideoSetting'; // Adjust path as needed
import { IoPlayCircleOutline } from 'react-icons/io5';
import './index.css'; // This is the CSS file you need to create.

export default function SettingsPage() {
  const { settings, updateSetting, updateHotkey, resetSettings } = useVideoSettings();
  const [currentHotkey, setCurrentHotkey] = useState(null);
  const navigate=useNavigate();
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = settings.playbackRate;
    }
  }, [settings.playbackRate]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleHotkeyInput = (action, e) => {
    e.preventDefault();
    const key = e.key.toUpperCase();
    if (key.length === 1 && key.match(/[A-Z0-9]/)) {
      updateHotkey(action, key);
      setCurrentHotkey(null);
    }
  };

  return (
    <div className="settings-page-container">
      <div className="settings-panel">
        <div className="settings-section video-settings-section">
          <div className="section-header">
            <span className="section-number">1</span>
            <h4>비디오</h4>
          </div>
          <div className="settings-row">
            <div className="setting-item">
              <label>영상 재생 속도 제어</label>
              <div className="slider-control">
                <span>0.1X</span>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={settings.playbackRate}
                  onChange={(e) => updateSetting('playbackRate', parseFloat(e.target.value))}
                />
                <span>2X</span>
              </div>
            </div>
            <div className="setting-item">
              <label>영상 건너뛰기 시간 조절</label>
              <div className="slider-control">
                <span>0.1초</span>
                <input
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={settings.skipTime}
                  onChange={(e) => updateSetting('skipTime', parseFloat(e.target.value))}
                />
                <span>2초</span>
              </div>
            </div>
            <button className="save-button">저장</button>
          </div>
          <div className="test-video-container">
            <label>테스트 영상 재생</label>
            <div className="video-player-frame">
              <video ref={videoRef} src="https://www.w3schools.com/html/mov_bbb.mp4" controls={false} />
              <button className="play-button" onClick={togglePlay}>
                <IoPlayCircleOutline size={48} />
              </button>
            </div>
          </div>
        </div>
        <div className="settings-section interface-settings-section">
          <div className="section-header">
            <span className="section-number">2</span>
            <h4>인터페이스</h4>
          </div>
          <div className="settings-row">
            <div className="setting-item">
              <label>언어 설정</label>
              <select value={settings.language} onChange={(e) => updateSetting('language', e.target.value)}>
                <option value="ko">한국어</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="setting-item">
              <label>화면 비율 설정</label>
              <select value={settings.screenRatio} onChange={(e) => updateSetting('screenRatio', e.target.value)}>
                <option value="1920:1080">1920:1080</option>
                <option value="1280:720">1280:720</option>
              </select>
            </div>
            <div className="setting-item initial-screen-item">
              <label>초기화면 설정</label>
              <div className="initial-screen-settings">
                <span>리그 팀 순위:</span>
                <select value={settings.leaguePosition} onChange={(e) => updateSetting('leaguePosition', parseInt(e.target.value))}>
                  <option value={1}>1부</option>
                  <option value={2}>2부</option>
                </select>
                <span>리그 포지션 순위:</span>
                <select value={settings.teamRank} onChange={(e) => updateSetting('teamRank', parseInt(e.target.value))}>
                  <option value={1}>1부</option>
                  <option value={2}>2부</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        <div className="settings-section hotkey-settings-section">
          <div className="section-header">
            <span className="section-number">3</span>
            <h4>단축키 설정</h4>
          </div>
          <div className="hotkey-grid">
            <div className="hotkey-item">
              <label>앞으로 넘기기:</label>
              <input
                type="text"
                value={currentHotkey === 'forward' ? 'Press a key...' : settings.hotkeys.forward}
                readOnly
                onFocus={() => setCurrentHotkey('forward')}
                onBlur={() => setCurrentHotkey(null)}
                onKeyDown={(e) => handleHotkeyInput('forward', e)}
              />
            </div>
            <div className="hotkey-item">
              <label>뒤로 넘기기:</label>
              <input
                type="text"
                value={currentHotkey === 'backward' ? 'Press a key...' : settings.hotkeys.backward}
                readOnly
                onFocus={() => setCurrentHotkey('backward')}
                onBlur={() => setCurrentHotkey(null)}
                onKeyDown={(e) => handleHotkeyInput('backward', e)}
              />
            </div>
            <div className="hotkey-item">
              <label>다음 영상 재생:</label>
              <input
                type="text"
                value={currentHotkey === 'nextVideo' ? 'Press a key...' : settings.hotkeys.nextVideo}
                readOnly
                onFocus={() => setCurrentHotkey('nextVideo')}
                onBlur={() => setCurrentHotkey(null)}
                onKeyDown={(e) => handleHotkeyInput('nextVideo', e)}
              />
            </div>
            <div className="hotkey-item">
              <label>이전 영상 재생:</label>
              <input
                type="text"
                value={currentHotkey === 'prevVideo' ? 'Press a key...' : settings.hotkeys.prevVideo}
                readOnly
                onFocus={() => setCurrentHotkey('prevVideo')}
                onBlur={() => setCurrentHotkey(null)}
                onKeyDown={(e) => handleHotkeyInput('prevVideo', e)}
              />
            </div>
          </div>
          <div className="settings-buttons">
            <button className="cancel-button" onClick={resetSettings}>취소</button>
            <button className="primary-button" onClick={() => navigate(-1)}>설정 저장</button>
          </div>
        </div>
      </div>
    </div>
  );
}