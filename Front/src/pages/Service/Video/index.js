import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { IoPlayCircleOutline, IoPauseCircleOutline, IoClose } from 'react-icons/io5';
import { HiOutlineMenuAlt3 } from 'react-icons/hi';
import './index.css';

/**
 * VideoPlayer
 * - ClipPage(또는 다른 페이지)에서 state로 넘긴 clips(원본 스키마)와 initialPlayId를 사용
 * - 스키마(ClipKey, ClipUrl, Quarter, Down, RemainYard, ... )를 내부 표준 형태로 정규화 후 사용
 * - 좌측(또는 사이드) 목록에서 클릭 시 선택 클립 재생
 * - 타임라인 클릭/드래그, Space/←/→ 단축키, ±10프레임 스텝
 */

const FRAME_RATE_DEFAULT = 30;
const FRAME_STEP = 10;

// PlayType 표기 보정(원문 그대로 써도 되지만, UI 표기를 깔끔히 하려면 맵핑)
const prettyPlayType = (raw) => {
  if (!raw) return '';
  const u = String(raw).toUpperCase();
  if (u === 'RUN') return 'Run';
  if (u === 'PASS') return 'Pass';
  if (u === 'NOPASS') return 'No Pass';
  return raw; // 그 외 값은 원문 유지 (KICKOFF 등)
};

const normalizeClips = (clips = []) =>
  clips.map((c, idx) => {
    const startScoreArr = c?.StartScore || c?.startScore;
    const startScore = Array.isArray(startScoreArr) ? startScoreArr[0] : null;

    const id =
      c?.id ?? c?.ClipKey ?? c?.clipKey ?? c?.key ?? `idx-${idx}`;

    const url =
      c?.videoUrl ?? c?.clipUrl ?? c?.ClipUrl ?? null;

    const quarter = Number(c?.quarter ?? c?.Quarter) || 1;

    const downRaw = c?.down ?? c?.Down;
    const down =
      typeof downRaw === "number"
        ? downRaw
        : parseInt(downRaw, 10) || null;

    const yardsToGo =
      c?.yardsToGo ?? c?.RemainYard ?? c?.remainYard ?? null;

    const playType = c?.playType ?? c?.PlayType ?? null;

    const offensiveTeam =
      c?.offensiveTeam ?? c?.OffensiveTeam ?? null;

    const significant =
      Array.isArray(c?.significantPlay)
        ? c.significantPlay
        : Array.isArray(c?.SignificantPlays)
        ? c.SignificantPlays.map((sp) => sp?.label || sp?.key).filter(Boolean)
        : [];

    return {
      id: String(id),
      videoUrl: url,
      quarter,
      offensiveTeam,
      specialTeam: !!(c?.specialTeam ?? c?.SpecialTeam),
      down,
      yardsToGo,
      playType,
      startYard: c?.startYard ?? c?.StartYard ?? null,
      endYard: c?.endYard ?? c?.EndYard ?? null,
      carriers: Array.isArray(c?.carriers)
        ? c.carriers
        : Array.isArray(c?.Carrier)
        ? c.Carrier
        : [],
      significant,
      scoreHome: startScore?.Home ?? c?.scoreHome ?? 0,
      scoreAway: startScore?.Away ?? c?.scoreAway ?? 0,
      raw: c,
    };
  });
const getOrdinal = (n) => {
  if (n === 1) return 'st';
  if (n === 2) return 'nd';
  if (n === 3) return 'rd';
  return 'th';
};

export default function VideoPlayer() {
  const navigate = useNavigate();
  const location = useLocation();

  // ---- nav state 수신 ----
  const navClips = location.state?.clips || location.state?.filteredPlaysData || [];
  const teamMeta = location.state?.teamMeta || null; // {homeName, awayName, homeLogo, awayLogo}
  const initialPlayId = location.state?.initialPlayId || location.state?.initialClipId || null;

  // ---- 데이터 정규화 ----
  const normalized = useMemo(() => normalizeClips(navClips), [navClips]);

  // ---- refs & state ----
  const videoRef = useRef(null);
  const timelineRef = useRef(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [frameRate] = useState(FRAME_RATE_DEFAULT);
  const [duration, setDuration] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // ---- 유틸 ----
  const selected = useMemo(
    () => normalized.find((p) => p.id === selectedId) || normalized[0] || null,
    [normalized, selectedId]
  );

  const videoUrl = selected?.videoUrl || null;
  const hasNoVideo = !!selected && !selected.videoUrl;

  const isPlaySelected = useCallback((id) => id === selectedId, [selectedId]);

  const selectPlay = useCallback((id) => {
    setSelectedId(id);
    // 재생 상태 리셋
    setIsPlaying(false);
    setHasError(false);
    setIsLoading(true);
    setCurrentTime(0);
    setCurrentFrame(0);
    setDuration(0);
    setTotalFrames(0);
    // 실제 src는 effect에서 주입
  }, []);

  // ---- 최초 선택 ----
  useEffect(() => {
    if (!normalized.length) return;
    if (initialPlayId) selectPlay(String(initialPlayId));
    else setSelectedId(normalized[0].id);
  }, [normalized, initialPlayId, selectPlay]);

  // ---- 비디오 이벤트 바인딩 ----
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    // src 교체 & 로드
    if (video.src !== videoUrl) {
      video.src = videoUrl;
      video.load();
    }

    const onLoadedMetadata = () => {
      const d = video.duration || 0;
      setDuration(d);
      const frames = Math.max(0, Math.floor(d * frameRate));
      setTotalFrames(frames);
      setIsLoading(false);
      setHasError(false);
      setCurrentTime(video.currentTime || 0);
      setCurrentFrame(Math.round((video.currentTime || 0) * frameRate));
    };

    const onTimeUpdate = () => {
      const t = video.currentTime || 0;
      setCurrentTime(t);
      setCurrentFrame(Math.round(t * frameRate));
    };

    const onEnded = () => setIsPlaying(false);
    const onError = () => {
      setHasError(true);
      setIsLoading(false);
    };
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
  }, [videoUrl, frameRate]);

  // ---- 컨트롤 ----
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || hasError || !selected) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => setIsPlaying(true)).catch(() => setHasError(true));
    }
  }, [isPlaying, hasError, selected]);

  const stepFrame = useCallback(
    (dir) => {
      const video = videoRef.current;
      if (!video || hasError || totalFrames === 0) return;
      const currentVideoFrame = Math.round((video.currentTime || 0) * frameRate);
      const targetFrame = Math.max(0, Math.min(totalFrames - 1, currentVideoFrame + (dir > 0 ? FRAME_STEP : -FRAME_STEP)));
      const targetTime = targetFrame / frameRate;

      const wasPlaying = !video.paused;
      if (wasPlaying) video.pause();
      video.currentTime = targetTime;
      if (wasPlaying) {
        setTimeout(() => {
          video.play().catch(() => {});
        }, 50);
      }
    },
    [frameRate, totalFrames, hasError]
  );

  // ---- 타임라인 ----
  const handleTimelineClick = useCallback(
    (e) => {
      const video = videoRef.current;
      const tl = timelineRef.current;
      if (!video || !tl || hasError || duration === 0) return;
      const rect = tl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const padding = 10; // CSS 패딩과 맞추기
      const trackWidth = rect.width - padding * 2;
      const rel = Math.max(0, Math.min(trackWidth, x - padding));
      const pct = rel / trackWidth;
      video.currentTime = pct * duration;
    },
    [duration, hasError]
  );

  const handleMouseDown = useCallback(
    (e) => {
      const video = videoRef.current;
      const tl = timelineRef.current;
      if (!video || !tl || hasError || duration === 0) return;

      setIsDragging(true);
      handleTimelineClick(e);

      const onMove = (me) => handleTimelineClick(me);
      const onUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [duration, hasError, handleTimelineClick]
  );

  // ---- 키보드 ----
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        stepFrame(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepFrame(1);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [togglePlay, stepFrame]);

  // ---- 포맷터 ----
  const formatTime = (sec) => {
    if (!sec && sec !== 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const cs = Math.floor((sec % 1) * 100);
    return `${m}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };
  const formatFrame = (f) => String(f || 0).padStart(4, '0');

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

  return (
    <div className="videoPlayerPage">
      <div className="videoContainer">
        {/* 뒤로가기 */}
        <button className="videoBackButton" onClick={() => navigate(-1)}>
          <IoClose size={24} />
        </button>

        {/* 모달 토글 */}
        <button className="videoModalToggleButton" onClick={() => setIsModalOpen((o) => !o)}>
          <HiOutlineMenuAlt3 size={24} />
        </button>

        {/* 점수판 */}
        <div className="videoScoreboard">
          <div className="scoreTeam leftTeam">
            {awayLogo ? <img src={awayLogo} alt={awayName} className="scoreTeamLogo" /> : <div className="scoreTeamLogo placeholder">{awayName[0]}</div>}
            <div className="scoreTeamInfo">
              <span className="scoreTeamName">{awayName}</span>
              <span className="scoreTeamScore">{scoreAway}</span>
            </div>
          </div>

          <div className="scoreCenter">
            <div className="scoreQuarter">Q{quarter}</div>
            <div className="scoreDown">
              {typeof down === 'number' ? `${down}${getOrdinal(down)} & ${ytg ?? 0}` : '1st & 10'}
            </div>
          </div>

          <div className="scoreTeam rightTeam">
            <div className="scoreTeamInfo">
              <span className="scoreTeamName">{homeName}</span>
              <span className="scoreTeamScore">{scoreHome}</span>
            </div>
            {homeLogo ? <img src={homeLogo} alt={homeName} className="scoreTeamLogo" /> : <div className="scoreTeamLogo placeholder">{homeName[0]}</div>}
          </div>
        </div>

        {/* 비디오 영역 */}
        <div className="videoScreen">
          <div className="videoPlaceholder">
            <div className="videoContent">
              {selected && hasNoVideo && (
                <div className="videoNoVideoMessage">
                  <div className="videoNoVideoIcon">🎬</div>
                  <div className="videoNoVideoText">비디오가 없습니다</div>
                  <div className="videoNoVideoSubtext">이 플레이의 비디오는 아직 준비되지 않았습니다</div>
                </div>
              )}

              {!selected && <div className="videoErrorMessage">표시할 클립이 없습니다.</div>}

              {selected && videoUrl && (
                <>
                  {isLoading && <div className="videoLoadingMessage">Loading video...</div>}
                  {hasError && (
                    <div className="videoErrorMessage">
                      <div>비디오를 로드할 수 없습니다</div>
                      <div className="videoErrorUrl">URL: {videoUrl}</div>
                    </div>
                  )}
                  <video
                    ref={videoRef}
                    className={`videoElement ${isLoading || hasError ? 'hidden' : ''}`}
                    src={videoUrl}
                    preload="metadata"
                    controls={false}
                    crossOrigin="anonymous"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* 하단 컨트롤 */}
        <div className="videoEditorControls">
          <div className="videoControlsTop">
            <button className="videoPlayButton" onClick={togglePlay} disabled={hasError || !selected || hasNoVideo}>
              {isPlaying ? <IoPauseCircleOutline size={32} /> : <IoPlayCircleOutline size={32} />}
            </button>

            <div className="videoTimeInfo">
              <span className="videoCurrentTime">{formatTime(currentTime)}</span>
              <span className="videoTimeDivider">/</span>
              <span className="videoDuration">{formatTime(duration)}</span>
            </div>

            <div className="videoFrameInfo">
              <span className="videoFrameLabel">Frame:</span>
              <span className="videoCurrentFrame">{formatFrame(currentFrame)}</span>
              <span className="videoFrameDivider">/</span>
              <span className="videoTotalFrames">{formatFrame(totalFrames)}</span>
            </div>

            <div className="videoFrameNavigation">
              <button
                className="videoFrameStepButton"
                onClick={() => stepFrame(-1)}
                disabled={hasError || currentFrame < FRAME_STEP}
                title="Previous 10 Frames (←)"
              >
                ◀ -10F
              </button>
              <button
                className="videoFrameStepButton"
                onClick={() => stepFrame(1)}
                disabled={hasError || currentFrame > totalFrames - FRAME_STEP}
                title="Next 10 Frames (→)"
              >
                +10F ▶
              </button>
            </div>
          </div>

          {/* 타임라인 */}
          <div className="videoTimelineContainer">
            <div ref={timelineRef} className="videoTimeline" onMouseDown={handleMouseDown}>
              <div className="videoTimelineTrack">
                <div
                  className="videoTimelineProgress"
                  style={{ width: totalFrames > 0 ? `${(currentFrame / totalFrames) * 100}%` : '0%' }}
                />
                <div
                  className="videoTimelineHandle"
                  style={{ left: totalFrames > 0 ? `${(currentFrame / totalFrames) * 100}%` : '0%' }}
                />
              </div>

              {/* 프레임 마커(간격 20개 이내) */}
              <div className="videoFrameMarkers">
                {Array.from({ length: Math.min(20, Math.floor(totalFrames / frameRate)) }, (_, i) => {
                  const frameNumber = Math.floor((i / Math.min(20, Math.floor(totalFrames / frameRate))) * totalFrames);
                  const position = (frameNumber / totalFrames) * 100;
                  return (
                    <div key={i} className="videoFrameMarker" style={{ left: `${position}%` }}>
                      <div className="videoFrameTick" />
                      <span className="videoFrameNumber">{formatFrame(frameNumber)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="videoControlsHint">
            <span>Space: Play/Pause | ← →: 10 Frame Step</span>
          </div>
        </div>
      </div>

      {/* 사이드 모달: 필터링된(=넘겨받은) 클립 목록 */}
      <div className={`videoSideModal ${isModalOpen ? 'open' : ''}`}>
        <div className="videoModalHeader">
          <h3>Clips</h3>
          <button className="videoCloseButton" onClick={() => setIsModalOpen(false)}>
            <IoClose size={20} />
          </button>
        </div>

        <div className="videoModalContent">
          <div className="videoMatchInfo">
            <div className="videoMatchTeams">
              {awayLogo ? <img src={awayLogo} alt={awayName} className="videoTeamLogos" /> : <div className="videoTeamLogos placeholder">{awayName[0]}</div>}
              <span>{`${homeName} VS ${awayName}`}</span>
              {homeLogo ? <img src={homeLogo} alt={homeName} className="videoTeamLogos" /> : <div className="videoTeamLogos placeholder">{homeName[0]}</div>}
            </div>
          </div>

          <div className="videoPlaysList">
            {normalized.map((p) => (
              <div
                key={p.id}
                className={`videoPlayCard ${isPlaySelected(p.id) ? 'selected' : ''}`}
                onClick={() => selectPlay(p.id)}
              >
                <div className="videoPlayInfo">
                  <div className="videoPlayBasicInfo">
                    <span className="videoQuarter">{p.quarter}Q</span>
                    <span className="videoDown">
                      {typeof p.down === 'number' ? `${p.down}${getOrdinal(p.down)} & ${p.yardsToGo ?? 0}` : '—'}
                    </span>
                    <span className="videoPlayerNumber">{p.offensiveTeam || ''}</span>
                  </div>

                  <div className="videoPlayTags">
                    {p.playType && <span className="videoPT">#{prettyPlayType(p.playType)}</span>}
                    {Array.isArray(p.significant) &&
                      p.significant.map((t, i) => (
                        <span key={`${p.id}-sig-${i}`} className="videoSignificantTag">
                          #{t}
                        </span>
                      ))}
                  </div>
                </div>

                <IoPlayCircleOutline className="videoPlayIcon" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 오버레이 */}
      {isModalOpen && <div className="videoModalOverlay" onClick={() => setIsModalOpen(false)} />}
    </div>
  );
}
