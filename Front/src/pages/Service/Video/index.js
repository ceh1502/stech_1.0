// src/components/VideoPlayer.js

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IoPlayCircleOutline, IoPauseCircleOutline, IoClose } from 'react-icons/io5';
import { HiOutlineMenuAlt3 } from 'react-icons/hi';
import './index.css';
import { useVideoSettings } from '../../../hooks/useVideoSetting';
import { useClipFilter } from '../../../hooks/useClipFilter';

// (Dropdown, 상수, 헬퍼 함수들은 여기에 그대로 둡니다)
function Dropdown({ label, summary, isOpen, onToggle, onClose, children }) {
    const ref = useRef(null);
    useEffect(() => {
        const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose?.(); };
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
const prettyPlayType = (raw) => {
    if (!raw) return '';
    const u = String(raw).toUpperCase();
    if (u === 'RUN') return 'Run';
    if (u === 'PASS') return 'Pass';
    if (u === 'NOPASS') return 'No Pass';
    return raw;
};
const normalizeClips = (clips = []) => clips.map((c, idx) => {
    const startScoreArr = c?.StartScore || c?.startScore;
    const startScore = Array.isArray(startScoreArr) ? startScoreArr[0] : null;
    const id = c?.id ?? c?.ClipKey ?? c?.clipKey ?? c?.key ?? `idx-${idx}`;
    const url = c?.videoUrl ?? c?.clipUrl ?? c?.ClipUrl ?? null;
    const quarter = Number(c?.quarter ?? c?.Quarter) || 1;
    const downRaw = c?.down ?? c?.Down;
    const down = typeof downRaw === "number" ? downRaw : parseInt(downRaw, 10) || null;
    const yardsToGo = c?.yardsToGo ?? c?.RemainYard ?? c?.remainYard ?? null;
    const playType = c?.playType ?? c?.PlayType ?? null;
    const offensiveTeam = c?.offensiveTeam ?? c?.OffensiveTeam ?? null;
    const significant = Array.isArray(c?.significantPlay) ? c.significantPlay : Array.isArray(c?.SignificantPlays) ? c.SignificantPlays.map((sp) => sp?.label || sp?.key).filter(Boolean) : [];
    return { id: String(id), videoUrl: url, quarter, offensiveTeam, specialTeam: !!(c?.specialTeam ?? c?.SpecialTeam), down, yardsToGo, playType, startYard: c?.startYard ?? c?.StartYard ?? null, endYard: c?.endYard ?? c?.EndYard ?? null, carriers: Array.isArray(c?.carriers) ? c.carriers : Array.isArray(c?.Carrier) ? c.Carrier : [], significant, scoreHome: startScore?.Home ?? c?.scoreHome ?? 0, scoreAway: startScore?.Away ?? c?.scoreAway ?? 0, raw: c };
});
const getOrdinal = (n) => {
    if (n === 1) return 'st';
    if (n === 2) return 'nd';
    if (n === 3) return 'rd';
    return 'th';
};

// =================================================================
// 1. 핵심 로직을 담당할 내부 컴포넌트 생성
// =================================================================
function PlayerCore({ stateData }) {
  const navigate = useNavigate();
  const { settings } = useVideoSettings();

  const {
    rawClips, initialFilters, teamOptions, teamMeta, initialPlayId,
  } = stateData;

  const filterHookResult = useClipFilter({
    rawClips, initialFilters, teamOptions, opposites: OPPOSITES,
    persistKey: `videoPlayerFilters:${teamMeta?.homeName}`,
  }) || {};

  const {
    clips = [], filters = {}, setFilters = () => {}, summaries = {},
    handleFilterChange = () => {}, clearAllFilters = () => {},
  } = filterHookResult;
  
  const normalized = useMemo(() => normalizeClips(clips), [clips]);

  const videoRef = useRef(null);
  const timelineRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [openMenu, setOpenMenu] = useState(null);

  const closeAllMenus = useCallback(() => setOpenMenu(null), []);
  const handleMenuToggle = useCallback((menuName) => {
    setOpenMenu(prev => (prev === menuName ? null : menuName));
  }, []);

  const selected = useMemo(
    () => (normalized || []).find((p) => p.id === selectedId) || (normalized || [])[0] || null,
    [normalized, selectedId]
  );

  const videoUrl = selected?.videoUrl || null;
  const hasNoVideo = !!selected && !selected.videoUrl;
  const isPlaySelected = useCallback((id) => id === selectedId, [selectedId]);

  const selectPlay = useCallback((id) => {
    setSelectedId(id || null);
    setIsPlaying(false);
    setHasError(false);
    setIsLoading(true);
    setCurrentTime(0);
    setDuration(0);
  }, []);
  
  useEffect(() => {
    const isInitialClipAvailable = initialPlayId && clips.some(c => String(c.id) === String(initialPlayId));
    if (isInitialClipAvailable) {
      if (selectedId !== initialPlayId) selectPlay(String(initialPlayId));
    } else if (clips.length > 0) {
      const isSelectedClipInList = selectedId && clips.some(c => String(c.id) === selectedId);
      if (!isSelectedClipInList) selectPlay(String(clips[0].id));
    } else {
      selectPlay(null);
    }
  }, [clips, initialPlayId, selectedId, selectPlay]);
  
  useEffect(() => {
    const video = videoRef.current;
    if (video) video.playbackRate = settings.playbackRate;
  }, [settings.playbackRate, selectedId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) {
      if (video) video.src = '';
      return;
    }
    if (video.src !== videoUrl) {
      video.src = videoUrl;
      video.load();
    }
    const onLoadedMetadata = () => { setDuration(video.duration || 0); setIsLoading(false); setHasError(false); setCurrentTime(video.currentTime || 0); };
    const onTimeUpdate = () => setCurrentTime(video.currentTime || 0);
    const onEnded = () => setIsPlaying(false);
    const onError = () => { setHasError(true); setIsLoading(false); };
    const onCanPlay = () => setIsLoading(false);
    const onLoadStart = () => setIsLoading(true);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('loadstart', onLoadStart);
    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('loadstart', onLoadStart);
    };
  }, [videoUrl]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || hasError || !selected) return;
    if (isPlaying) { video.pause(); setIsPlaying(false); }
    else { video.play().then(() => setIsPlaying(true)).catch(() => setHasError(true)); }
  }, [isPlaying, hasError, selected]);

  const stepTime = useCallback((dir) => {
    const video = videoRef.current;
    if (!video || hasError || duration === 0) return;
    const newTime = Math.max(0, Math.min(duration, video.currentTime + (dir > 0 ? settings.skipTime : -settings.skipTime)));
    video.currentTime = newTime;
  }, [duration, hasError, settings.skipTime]);
  
  const handleTimelineClick = useCallback((e) => {
    const video = videoRef.current; const tl = timelineRef.current;
    if (!video || !tl || hasError || duration === 0) return;
    const rect = tl.getBoundingClientRect(); const x = e.clientX - rect.left;
    const padding = 10; const trackWidth = rect.width - padding * 2;
    const rel = Math.max(0, Math.min(trackWidth, x - padding));
    const pct = rel / trackWidth;
    video.currentTime = pct * duration;
  }, [duration, hasError]);

  const handleMouseDown = useCallback((e) => {
    const video = videoRef.current; const tl = timelineRef.current;
    if (!video || !tl || hasError || duration === 0) return;
    handleTimelineClick(e);
    const onMove = (me) => handleTimelineClick(me);
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [duration, hasError, handleTimelineClick]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.target?.tagName === 'INPUT' || e.target?.tagName === 'TEXTAREA') return;
      const key = e.key.toUpperCase();
      const backwardKey = settings?.hotkeys?.backward?.toUpperCase();
      const forwardKey = settings?.hotkeys?.forward?.toUpperCase();
      if (key === ' ' && !e.repeat) { e.preventDefault(); togglePlay(); }
      else if (backwardKey && key === backwardKey) { e.preventDefault(); stepTime(-1); }
      else if (forwardKey && key === forwardKey) { e.preventDefault(); stepTime(1); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [togglePlay, stepTime, settings]);

  const formatTime = (sec) => {
    if (isNaN(sec) || sec === null) return '0:00';
    const m = Math.floor(sec / 60); const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const homeName = teamMeta?.homeName || 'Home';
  const awayName = teamMeta?.awayName || 'Away';
  const homeLogo = teamMeta?.homeLogo || null;
  const awayLogo = teamMeta?.awayLogo || null;
  const scoreHome = selected?.scoreHome ?? 0;
  const scoreAway = selected?.scoreAway ?? 0;
  const quarter = selected?.quarter ?? 1;
  const down = selected?.down;
  const ytg = selected?.yardsToGo;

  const teamSummary = summaries.team;
  const quarterSummary = summaries.quarter;
  const playTypeSummary = filters.playType ? PT_LABEL[filters.playType] : '유형';
  const significantSummary = summaries.significant;
  const clearSignificant = () => setFilters((prev) => ({ ...prev, significantPlay: [] }));

  return (
    <div className="videoPlayerPage">
        <div className="videoContainer">
            <button className="videoBackButton" onClick={() => navigate(-1)}><IoClose size={24} /></button>
            <button className="videoModalToggleButton" onClick={() => setIsModalOpen((o) => !o)}><HiOutlineMenuAlt3 size={24} /></button>
            <div className="videoScoreboard">
                <div className="scoreTeam leftTeam">
                    {awayLogo ? <img src={awayLogo} alt={awayName} className="scoreTeamLogo" /> : <div className="scoreTeamLogo placeholder">{awayName[0]}</div>}
                    <div className="scoreTeamInfo"><span className="scoreTeamName">{awayName}</span><span className="scoreTeamScore">{scoreAway}</span></div>
                </div>
                <div className="scoreCenter">
                    <div className="scoreQuarter">Q{quarter}</div>
                    <div className="scoreDown">{typeof down === 'number' ? `${down}${getOrdinal(down)} & ${ytg ?? 0}` : '--'}</div>
                </div>
                <div className="scoreTeam rightTeam">
                    <div className="scoreTeamInfo"><span className="scoreTeamName">{homeName}</span><span className="scoreTeamScore">{scoreHome}</span></div>
                    {homeLogo ? <img src={homeLogo} alt={homeName} className="scoreTeamLogo" /> : <div className="scoreTeamLogo placeholder">{homeName[0]}</div>}
                </div>
            </div>
            <div className="videoScreen">
                <div className="videoPlaceholder">
                    <div className="videoContent">
                        {hasNoVideo && <div className="videoNoVideoMessage"><div className="videoNoVideoIcon">🎬</div><div className="videoNoVideoText">비디오가 없습니다</div></div>}
                        {!selected && clips.length === 0 && <div className="videoNoVideoMessage"><div className="videoNoVideoIcon">🧐</div><div className="videoNoVideoText">표시할 클립이 없습니다</div></div>}
                        {selected && videoUrl && (
                            <>
                                {isLoading && <div className="videoLoadingMessage">Loading...</div>}
                                {hasError && <div className="videoErrorMessage"><div>비디오를 로드할 수 없습니다</div><div className="videoErrorUrl">URL: {videoUrl}</div></div>}
                                <video ref={videoRef} className={`videoElement ${isLoading || hasError ? 'hidden' : ''}`} src={videoUrl} preload="metadata" controls={false} crossOrigin="anonymous" />
                            </>
                        )}
                    </div>
                </div>
            </div>
            <div className="videoEditorControls">
                <div className="videoControlsTop">
                    <button className="videoPlayButton" onClick={togglePlay} disabled={hasError || !selected || hasNoVideo}>{isPlaying ? <IoPauseCircleOutline size={32} /> : <IoPlayCircleOutline size={32} />}</button>
                    <div className="videoTimeInfo"><span className="videoCurrentTime">{formatTime(currentTime)}</span><span className="videoTimeDivider">/</span><span className="videoDuration">{formatTime(duration)}</span></div>
                    <div className="videoFrameNavigation">
                        <button className="videoFrameStepButton" onClick={() => stepTime(-1)} disabled={hasError || !selected} title={`Previous ${settings.skipTime}s`}>◀ {settings.skipTime}s</button>
                        <button className="videoFrameStepButton" onClick={() => stepTime(1)} disabled={hasError || !selected} title={`Next ${settings.skipTime}s`}> {settings.skipTime}s ▶</button>
                    </div>
                </div>
                <div className="videoTimelineContainer">
                    <div ref={timelineRef} className="videoTimeline" onMouseDown={handleMouseDown}>
                        <div className="videoTimelineTrack">
                            <div className="videoTimelineProgress" style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }} />
                            <div className="videoTimelineHandle" style={{ left: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className={`videoSideModal ${isModalOpen ? 'open' : ''}`}>
            <div className="videoModalHeader"><h3>Clips</h3><button className="videoCloseButton" onClick={() => setIsModalOpen(false)}><IoClose size={20} /></button></div>
            <div className="videoModalContent">
                <div className="videoMatchInfo">
                    <div className="videoMatchTeams">
                        {awayLogo ? <img src={awayLogo} alt={awayName} className="videoTeamLogos" /> : <div className="videoTeamLogos placeholder">{awayName[0]}</div>}
                        <span>{`${homeName} VS ${awayName}`}</span>
                        {homeLogo ? <img src={homeLogo} alt={homeName} className="videoTeamLogos" /> : <div className="videoTeamLogos placeholder">{homeName[0]}</div>}
                    </div>
                </div>
                <div className="videoFilterControls" onClick={(e) => e.stopPropagation()}>
                    <Dropdown label="공격팀" summary={teamSummary} isOpen={openMenu === 'team'} onToggle={() => handleMenuToggle('team')} onClose={closeAllMenus}>
                        <button className={`ff-dd-item ${!filters.team ? 'selected' : ''}`} onClick={() => { handleFilterChange('team', null); closeAllMenus(); }}>전체</button>
                        {teamOptions.map((opt) => (<button key={opt.value} className={`ff-dd-item ${filters.team === opt.value ? 'selected' : ''}`} onClick={() => { handleFilterChange('team', opt.value); closeAllMenus(); }}>{opt.logo && <img className="ff-dd-avatar" src={opt.logo} alt="" />}{opt.label || opt.value}</button>))}
                    </Dropdown>
                    <Dropdown label="쿼터" summary={quarterSummary} isOpen={openMenu === 'quarter'} onToggle={() => handleMenuToggle('quarter')} onClose={closeAllMenus}>
                        <button className={`ff-dd-item ${!filters.quarter ? 'selected' : ''}`} onClick={() => { handleFilterChange('quarter', null); closeAllMenus(); }}>전체</button>
                        {[1, 2, 3, 4].map((q) => (<button key={q} className={`ff-dd-item ${filters.quarter === q ? 'selected' : ''}`} onClick={() => { handleFilterChange('quarter', q); closeAllMenus(); }}>Q{q}</button>))}
                    </Dropdown>
                    <Dropdown label="유형" summary={playTypeSummary} isOpen={openMenu === 'playType'} onToggle={() => handleMenuToggle('playType')} onClose={closeAllMenus}>
                        <button className={`ff-dd-item ${!filters.playType ? 'selected' : ''}`} onClick={() => { handleFilterChange('playType', null); closeAllMenus(); }}>전체</button>
                        {Object.entries(PLAY_TYPES).map(([code]) => (<button key={code} className={`ff-dd-item ${filters.playType === code ? 'selected' : ''}`} onClick={() => { handleFilterChange('playType', code); closeAllMenus(); }}>{PT_LABEL[code] || code}</button>))}
                    </Dropdown>
                    <Dropdown label="중요플레이" summary={significantSummary} isOpen={openMenu === 'significant'} onToggle={() => handleMenuToggle('significant')} onClose={closeAllMenus}>
                        <div className="ff-dd-section">{Object.values(SIGNIFICANT_PLAYS).map((label) => (<button key={label} className={`ff-dd-item ${filters.significantPlay?.includes(label) ? 'selected' : ''}`} onClick={() => handleFilterChange('significantPlay', label)}>{label}</button>))}</div>
                        <div className="ff-dd-actions"><button className="ff-dd-clear" onClick={clearSignificant}>모두 해제</button><button className="ff-dd-close" onClick={closeAllMenus}>닫기</button></div>
                    </Dropdown>
                    <button type="button" className="resetButton" onClick={clearAllFilters}>초기화</button>
                </div>
                <div className="videoPlaysList">
                    {normalized.length > 0 ? (
                        normalized.map((p) => (
                            <div key={p.id} className={`videoPlayCard ${isPlaySelected(p.id) ? 'selected' : ''}`} onClick={() => selectPlay(p.id)}>
                                <div className="videoPlayInfo">
                                    <div className="videoPlayBasicInfo"><span className="videoQuarter">{p.quarter}Q</span><span className="videoDown">{typeof p.down === 'number' ? `${p.down}${getOrdinal(p.down)} & ${p.yardsToGo ?? 0}` : '—'}</span><span className="videoPlayerNumber">{p.offensiveTeam || ''}</span></div>
                                    <div className="videoPlayTags">{p.playType && <span className="videoPT">#{prettyPlayType(p.playType)}</span>}{Array.isArray(p.significant) && p.significant.map((t, i) => (<span key={`${p.id}-sig-${i}`} className="videoSignificantTag">#{t}</span>))}</div>
                                </div>
                                <IoPlayCircleOutline className="videoPlayIcon" />
                            </div>
                        ))
                    ) : (<div className="videoNoPlaysMessage">일치하는 클립이 없습니다.</div>)}
                </div>
            </div>
        </div>
        {isModalOpen && <div className="videoModalOverlay" onClick={() => setIsModalOpen(false)} />}
    </div>
  );
}


// =================================================================
// 2. 껍데기 역할의 메인 컴포넌트
// =================================================================
export default function VideoPlayer() {
  const location = useLocation();
  const navigate = useNavigate();

  // 데이터가 없으면(새로고침) 에러 메시지를 표시하고, 있으면 PlayerCore를 렌더링합니다.
  if (!location.state) {
    return (
      <div className="videoPlayerPage">
        <div className="videoContainer" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div className="videoErrorMessage">
              클립 정보를 찾을 수 없습니다.
              <button onClick={() => navigate(-1)} style={{marginTop: '1rem', cursor: 'pointer'}}>
                이전 페이지로 돌아가기
              </button>
            </div>
        </div>
      </div>
    );
  }

  // 데이터가 존재하므로 PlayerCore에 props로 전달합니다.
  return <PlayerCore stateData={location.state} />;
}