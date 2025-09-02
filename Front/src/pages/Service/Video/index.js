// src/components/VideoPlayer.js

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IoPlayCircleOutline, IoPauseCircleOutline, IoClose } from 'react-icons/io5';
import { HiOutlineMenuAlt3 } from 'react-icons/hi';
import './index.css';
import { useVideoSettings } from '../../../hooks/useVideoSetting';
import { useClipFilter } from '../../../hooks/useClipFilter'; // 1. 필터 훅 import

/**
 * 이 컴포넌트에서만 사용되므로 여기에 복사해왔습니다.
 * 여러 곳에서 사용된다면 별도의 공용 파일로 분리하는 것이 좋습니다.
 */
// 2. Dropdown 컴포넌트와 필터 관련 상수들 추가
function Dropdown({ label, summary, isOpen, onToggle, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
    if (isOpen) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [onClose, isOpen]);
  return (
    <div className="ff-dropdown" ref={ref} style={{ marginBottom: '8px' }}>
      <button type="button" className={`ff-dd-btn ${isOpen ? 'open' : ''}`} onClick={onToggle}>
        <span className="ff-dd-label">{summary || label}</span>
        <span className="ff-dd-icon">▾</span>
      </button>
      {isOpen && <div className="ff-dd-menu" role="menu">{children}</div>}
    </div>
  );
}

export const PT_LABEL = { RUN: '런', PASS: '패스', PASS_INCOMPLETE: '패스 실패', KICKOFF: '킥오프', PUNT: '펀트', PAT: 'PAT', TWOPT: '2PT', FIELDGOAL: 'FG' };
const PLAY_TYPES = { RUN: 'RUN', PASS: 'PASS', KICKOFF: 'KICKOFF', PUNT: 'PUNT' };
const SIGNIFICANT_PLAYS = { TOUCHDOWN: '터치다운', TWOPTCONVGOOD: '2PT 성공', TWOPTCONVNOGOOD: '2PT 실패', PATSUCCESS: 'PAT 성공', PATFAIL: 'PAT 실패', FIELDGOALGOOD: 'FG 성공', FIELDGOALNOGOOD: 'FG 실패', PENALTY: '페널티', SACK: '색', TFL: 'TFL', FUMBLE: '펌블', INTERCEPTION: '인터셉트', TURNOVER: '턴오버', SAFETY: '세이프티' };
const OPPOSITES = { '2PT 성공': '2PT 실패', '2PT 실패': '2PT 성공', 'PAT 성공': 'PAT 실패', 'PAT 실패': 'PAT 성공', 'FG 성공': 'FG 실패', 'FG 실패': 'FG 성공' };


// (prettyPlayType, normalizeClips, getOrdinal 함수는 기존과 동일)
const prettyPlayType = (raw) => { /* ... 기존 코드 ... */ };
const normalizeClips = (clips = []) => { /* ... 기존 코드 ... */ };
const getOrdinal = (n) => { /* ... 기존 코드 ... */ };


export default function VideoPlayer() {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useVideoSettings();

  // 3. ClipPage에서 전달받은 모든 state를 변수에 저장
  const {
    rawClips = [],
    initialFilters = null,
    teamOptions = [],
    teamMeta = null,
    initialPlayId = null,
  } = location.state || {};


  // 4. VideoPlayer 컴포넌트 내부에서 필터 훅을 직접 사용
  const {
    clips, // 훅을 통해 필터링된 클립 목록
    filters,
    setFilters,
    summaries,
    handleFilterChange,
    clearAllFilters,
  } = useClipFilter({
    rawClips,
    initialFilters,
    teamOptions,
    opposites: OPPOSITES,
    persistKey: `videoPlayerFilters:${teamMeta?.homeName}`,
  });
  
  // 5. 필터링된 결과(`clips`)를 기반으로 화면에 표시할 데이터 정규화
  const normalized = useMemo(() => normalizeClips(clips), [clips]);

  // ---- refs & state ----
  const videoRef = useRef(null);
  const timelineRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // 모달 내 드롭다운 메뉴 상태 관리
  const [openMenu, setOpenMenu] = useState(null);
  const closeAllMenus = useCallback(() => setOpenMenu(null), []);
  const handleMenuToggle = useCallback((menuName) => {
    setOpenMenu(prev => (prev === menuName ? null : menuName));
  }, []);

  // ---- 유틸 ----
  const selected = useMemo(
    () => normalized.find((p) => p.id === selectedId) || normalized[0] || null,
    [normalized, selectedId]
  );
  const videoUrl = selected?.videoUrl || null;
  const hasNoVideo = !!selected && !selected.videoUrl;
  const isPlaySelected = useCallback((id) => id === selectedId, [selectedId]);

  const selectPlay = useCallback((id) => {
    if (!id) { // 선택할 id가 없으면 초기화
      setSelectedId(null);
      return;
    }
    setSelectedId(id);
    setIsPlaying(false);
    setHasError(false);
    setIsLoading(true);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  // 최초 로딩 시 또는 필터링된 목록이 변경되었을 때 선택 클립 처리
  useEffect(() => {
    // 최초 진입 시 initialPlayId로 클립 선택
    if (initialPlayId && clips.some(c => String(c.id) === String(initialPlayId))) {
      selectPlay(String(initialPlayId));
    } else if (clips.length > 0) {
      // 필터링 후 현재 선택된 클립이 목록에 없으면, 첫번째 클립을 선택
      if (!selectedId || !clips.some(c => String(c.id) === selectedId)) {
        selectPlay(String(clips[0].id));
      }
    } else {
      // 필터링 결과 클립이 없으면 선택 해제
      selectPlay(null);
    }
  }, [clips, initialPlayId, selectPlay]); // selectedId 의존성 제거

  
  // (나머지 비디오 컨트롤 관련 useEffect와 핸들러 함수들은 기존과 거의 동일)
  // ... useEffect for playbackRate ...
  // ... useEffect for video event binding ...
  // ... togglePlay, stepTime, handleTimelineClick, handleMouseDown ...
  // ... useEffect for keyboard ...
  // ... formatTime ...

  // ---- UI 도우미 ----
  const homeName = teamMeta?.homeName || 'Home';
  const awayName = teamMeta?.awayName || 'Away';
  const homeLogo = teamMeta?.homeLogo || null;
  const awayLogo = teamMeta?.awayLogo || null;
  const scoreHome = selected?.scoreHome ?? 0;
  const scoreAway = selected?.scoreAway ?? 0;
  const quarter = selected?.quarter ?? 1;
  const down = selected?.down;
  const ytg = selected?.yardsToGo;

  // 필터 드롭다운 UI를 위한 요약 텍스트
  const teamSummary = summaries.team;
  const quarterSummary = summaries.quarter;
  const playTypeSummary = filters.playType ? PT_LABEL[filters.playType] : '유형';
  const significantSummary = summaries.significant;
  const clearSignificant = () => setFilters((prev) => ({ ...prev, significantPlay: [] }));

  return (
    <div className="videoPlayerPage">
      {/* ... (VideoContainer, Scoreboard, VideoScreen 등은 기존과 동일) ... */}

      {/* 6. 사이드 모달 UI 수정 */}
      <div className={`videoSideModal ${isModalOpen ? 'open' : ''}`}>
        <div className="videoModalHeader">
          <h3>Clips</h3>
          <button className="videoCloseButton" onClick={() => setIsModalOpen(false)}>
            <IoClose size={20} />
          </button>
        </div>

        <div className="videoModalContent">
          <div className="videoMatchInfo">
            {/* ... (기존 경기 정보 UI) ... */}
          </div>

          {/* ===== 필터 컨트롤 UI 추가 ===== */}
          <div className="videoFilterControls" onClick={(e) => e.stopPropagation()}>
            <Dropdown
              label="공격팀"
              summary={teamSummary}
              isOpen={openMenu === 'team'}
              onToggle={() => handleMenuToggle('team')}
              onClose={closeAllMenus}
            >
              <button className={`ff-dd-item ${!filters.team ? 'selected' : ''}`} onClick={() => { handleFilterChange('team', null); closeAllMenus(); }}>전체</button>
              {teamOptions.map((opt) => (
                <button key={opt.value} className={`ff-dd-item ${filters.team === opt.value ? 'selected' : ''}`} onClick={() => { handleFilterChange('team', opt.value); closeAllMenus(); }}>
                  {opt.logo && <img className="ff-dd-avatar" src={opt.logo} alt="" />}
                  {opt.label || opt.value}
                </button>
              ))}
            </Dropdown>

            <Dropdown
              label="쿼터"
              summary={quarterSummary}
              isOpen={openMenu === 'quarter'}
              onToggle={() => handleMenuToggle('quarter')}
              onClose={closeAllMenus}
            >
              <button className={`ff-dd-item ${!filters.quarter ? 'selected' : ''}`} onClick={() => { handleFilterChange('quarter', null); closeAllMenus(); }}>전체</button>
              {[1, 2, 3, 4].map((q) => (
                <button key={q} className={`ff-dd-item ${filters.quarter === q ? 'selected' : ''}`} onClick={() => { handleFilterChange('quarter', q); closeAllMenus(); }}>Q{q}</button>
              ))}
            </Dropdown>

            <Dropdown
              label="유형"
              summary={playTypeSummary}
              isOpen={openMenu === 'playType'}
              onToggle={() => handleMenuToggle('playType')}
              onClose={closeAllMenus}
            >
              <button className={`ff-dd-item ${!filters.playType ? 'selected' : ''}`} onClick={() => { handleFilterChange('playType', null); closeAllMenus(); }}>전체</button>
              {Object.entries(PLAY_TYPES).map(([code]) => (
                <button key={code} className={`ff-dd-item ${filters.playType === code ? 'selected' : ''}`} onClick={() => { handleFilterChange('playType', code); closeAllMenus(); }}>
                  {PT_LABEL[code] || code}
                </button>
              ))}
            </Dropdown>
            
            <Dropdown
              label="중요플레이"
              summary={significantSummary}
              isOpen={openMenu === 'significant'}
              onToggle={() => handleMenuToggle('significant')}
              onClose={closeAllMenus}
            >
              <div className="ff-dd-section">
                {Object.values(SIGNIFICANT_PLAYS).map((label) => {
                  const selected = filters.significantPlay?.includes(label);
                  return (
                    <button key={label} className={`ff-dd-item ${selected ? 'selected' : ''}`} onClick={() => handleFilterChange('significantPlay', label)}>
                      {label}
                    </button>
                  );
                })}
              </div>
              <div className="ff-dd-actions">
                <button className="ff-dd-clear" onClick={clearSignificant}>모두 해제</button>
                <button className="ff-dd-close" onClick={closeAllMenus}>닫기</button>
              </div>
            </Dropdown>

            <button type="button" className="resetButton" onClick={clearAllFilters}>
              초기화
            </button>
          </div>

          <div className="videoPlaysList">
            {normalized.length > 0 ? (
              normalized.map((p) => (
                <div key={p.id} className={`videoPlayCard ${isPlaySelected(p.id) ? 'selected' : ''}`} onClick={() => selectPlay(p.id)}>
                  {/* ... (기존 클립 카드 UI) ... */}
                </div>
              ))
            ) : (
              <div className="videoNoPlaysMessage">
                일치하는 클립이 없습니다.
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && <div className="videoModalOverlay" onClick={() => setIsModalOpen(false)} />}
    </div>
  );
}