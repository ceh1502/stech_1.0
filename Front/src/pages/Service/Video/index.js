// src/pages/Service/Video/index.js

import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  IoPlayCircleOutline,
  IoPauseCircleOutline,
  IoClose,
} from 'react-icons/io5';
import { HiOutlineMenuAlt3 } from 'react-icons/hi';
import { FaPencilAlt, FaStickyNote } from 'react-icons/fa'; // FaStickyNote import 추가
import './index.css';
import { useVideoSettings } from '../../../hooks/useVideoSetting';
// 경로 수정 필요 - MagicPencil과 VideoMemo 컴포넌트 경로 확인
// import MagicPencil from '../MagicPencil/MagicPencil';
// import VideoMemo from '../VideoMemo/VideoMemo';

// PlayType 표기 보정
const prettyPlayType = (raw) => {
  if (!raw) return '';
  const u = String(raw).toUpperCase();
  if (u === 'RUN') return 'Run';
  if (u === 'PASS') return 'Pass';
  if (u === 'NOPASS') return 'No Pass';
  return raw;
};

const normalizeClips = (clips = []) =>
  clips.map((c, idx) => {
    const startScoreArr = c?.StartScore || c?.startScore;
    const startScore = Array.isArray(startScoreArr) ? startScoreArr[0] : null;

    const id = c?.id ?? c?.ClipKey ?? c?.clipKey ?? c?.key ?? `idx-${idx}`;
    const url = c?.videoUrl ?? c?.clipUrl ?? c?.ClipUrl ?? null;
    const quarter = Number(c?.quarter ?? c?.Quarter) || 1;
    const downRaw = c?.down ?? c?.Down;
    const down =
      typeof downRaw === 'number' ? downRaw : parseInt(downRaw, 10) || null;
    const yardsToGo = c?.yardsToGo ?? c?.RemainYard ?? c?.remainYard ?? null;
    const playType = c?.playType ?? c?.PlayType ?? null;
    const offensiveTeam = c?.offensiveTeam ?? c?.OffensiveTeam ?? null;
    const significant = Array.isArray(c?.significantPlay)
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
  const { settings } = useVideoSettings();

  // nav state 수신
  const initialPlayId =
    location.state?.initialPlayId || location.state?.initialClipId || null;
  const teamMeta = location.state?.teamMeta || null;

  // 데이터 정규화
  const normalized = useMemo(() => {
    const navClips =
      location.state?.clips || location.state?.filteredPlaysData || [];
    return normalizeClips(navClips);
  }, [location.state?.clips, location.state?.filteredPlaysData]);

  // refs & state
  const videoRef = useRef(null);
  const timelineRef = useRef(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  // 매직펜슬과 메모 state - 함수 컴포넌트 내부로 이동
  const [showMagicPencil, setShowMagicPencil] = useState(false);
  const [showMemo, setShowMemo] = useState(false);
  const [memos, setMemos] = useState({});

  // 유틸
  const selected = useMemo(
    () => normalized.find((p) => p.id === selectedId) || normalized[0] || null,
    [normalized, selectedId],
  );
  const videoUrl = selected?.videoUrl || null;
  const hasNoVideo = !!selected && !selected.videoUrl;
  const isPlaySelected = useCallback((id) => id === selectedId, [selectedId]);

  const selectPlay = useCallback((id) => {
    setSelectedId(id);
    setIsPlaying(false);
    setHasError(false);
    setIsLoading(true);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  useEffect(() => {
    if (!normalized.length) return;
    if (initialPlayId) selectPlay(String(initialPlayId));
    else setSelectedId(normalized[0].id);
  }, [normalized, initialPlayId, selectPlay]);

  // Sync playback rate with settings
  useEffect(() => {
    const video = videoRef.current;
    if (videoRef.current) {
      video.playbackRate = settings.playbackRate;
    }
  }, [settings.playbackRate]);

  // 비디오 이벤트 바인딩
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    if (video.src !== videoUrl) {
      video.src = videoUrl;
      video.load();
    }

    const onLoadedMetadata = () => {
      setDuration(video.duration || 0);
      setIsLoading(false);
      setHasError(false);
      setCurrentTime(video.currentTime || 0);
    };

    const onTimeUpdate = () => setCurrentTime(video.currentTime || 0);
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
  }, [videoUrl]);

  // 컨트롤: 시간 기준 건너뛰기
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || hasError || !selected) return;
    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setHasError(true));
    }
  }, [isPlaying, hasError, selected]);

  const stepTime = useCallback(
    (dir) => {
      const video = videoRef.current;
      if (!video || hasError || duration === 0) return;

      const newTime = Math.max(
        0,
        Math.min(
          duration,
          video.currentTime +
            (dir > 0 ? settings.skipTime : -settings.skipTime),
        ),
      );
      video.currentTime = newTime;
    },
    [duration, hasError, settings.skipTime],
  );

  // 타임라인
  const handleTimelineClick = useCallback(
    (e) => {
      const video = videoRef.current;
      const tl = timelineRef.current;
      if (!video || !tl || hasError || duration === 0) return;
      const rect = tl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const padding = 10;
      const trackWidth = rect.width - padding * 2;
      const rel = Math.max(0, Math.min(trackWidth, x - padding));
      const pct = rel / trackWidth;
      video.currentTime = pct * duration;
    },
    [duration, hasError],
  );

  const handleMouseDown = useCallback(
    (e) => {
      const video = videoRef.current;
      const tl = timelineRef.current;
      if (!video || !tl || hasError || duration === 0) return;

      handleTimelineClick(e);
      const onMove = (me) => handleTimelineClick(me);
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [duration, hasError, handleTimelineClick],
  );

  // 키보드
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      const key = e.key.toUpperCase();
      const backwardKey = settings?.hotkeys?.backward?.toUpperCase();
      const forwardKey = settings?.hotkeys?.forward?.toUpperCase();

      if (key === ' ' && !e.repeat) {
        e.preventDefault();
        togglePlay();
      } else if (backwardKey && key === backwardKey) {
        e.preventDefault();
        stepTime(-1);
      } else if (forwardKey && key === forwardKey) {
        e.preventDefault();
        stepTime(1);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [togglePlay, stepTime, settings]);

  // 포맷터
  const formatTime = (sec) => {
    if (isNaN(sec) || sec === null) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const cs = Math.floor((sec % 1) * 100);
    return `${m}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  };

  // UI 도우미
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
        <button
          className="videoModalToggleButton"
          onClick={() => setIsModalOpen((o) => !o)}
        >
          <HiOutlineMenuAlt3 size={24} />
        </button>

        {/* 점수판 - 중앙 유지 */}
        <div className="videoScoreboard">
          <div className="scoreTeam leftTeam">
            {awayLogo ? (
              <img src={awayLogo} alt={awayName} className="scoreTeamLogo" />
            ) : (
              <div className="scoreTeamLogo placeholder">{awayName[0]}</div>
            )}
            <div className="scoreTeamInfo">
              <span className="scoreTeamName">{awayName}</span>
              <span className="scoreTeamScore">{scoreAway}</span>
            </div>
          </div>

          <div className="scoreCenter">
            <div className="scoreQuarter">Q{quarter}</div>
            <div className="scoreDown">
              {typeof down === 'number'
                ? `${down}${getOrdinal(down)} & ${ytg ?? 0}`
                : '1st & 10'}
            </div>
          </div>

          <div className="scoreTeam rightTeam">
            <div className="scoreTeamInfo">
              <span className="scoreTeamName">{homeName}</span>
              <span className="scoreTeamScore">{scoreHome}</span>
            </div>
            {homeLogo ? (
              <img src={homeLogo} alt={homeName} className="scoreTeamLogo" />
            ) : (
              <div className="scoreTeamLogo placeholder">{homeName[0]}</div>
            )}
          </div>
        </div>

        {/* 플로팅 도구 버튼들 - 스코어보드 외부 */}
        <div className="floatingToolButtons">
          {/* 메모 버튼 */}
          <button
            className="floatingToolBtn memoBtn"
            onClick={() => setShowMemo(true)}
            title="메모 작성"
          >
            <FaStickyNote size={24} />
            {memos[selectedId] && <span className="memoIndicator"></span>}
          </button>

          {/* 매직펜슬 버튼 */}
          <button
            className="floatingToolBtn magicPencilBtn"
            onClick={() => setShowMagicPencil(true)}
            disabled={isPlaying || hasError || !selected || hasNoVideo}
            title="매직펜슬 (일시정지 상태에서만 사용 가능)"
          >
            <FaPencilAlt size={24} />
          </button>
        </div>

        {/* 비디오 영역 - 기존 코드 유지 */}
        <div className="videoScreen">
          <div className="videoPlaceholder">
            <div className="videoContent">
              {selected && hasNoVideo && (
                <div className="videoNoVideoMessage">
                  <div className="videoNoVideoIcon">🎬</div>
                  <div className="videoNoVideoText">비디오가 없습니다</div>
                  <div className="videoNoVideoSubtext">
                    이 플레이의 비디오는 아직 준비되지 않았습니다
                  </div>
                </div>
              )}

              {!selected && (
                <div className="videoErrorMessage">표시할 클립이 없습니다.</div>
              )}

              {selected && videoUrl && (
                <>
                  {isLoading && (
                    <div className="videoLoadingMessage">Loading video...</div>
                  )}
                  {hasError && (
                    <div className="videoErrorMessage">
                      <div>비디오를 로드할 수 없습니다</div>
                      <div className="videoErrorUrl">URL: {videoUrl}</div>
                    </div>
                  )}
                  <video
                    ref={videoRef}
                    className={`videoElement ${
                      isLoading || hasError ? 'hidden' : ''
                    }`}
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

        {/* 나머지 코드는 동일... */}
        {/* 하단 컨트롤, 사이드 모달 등 기존 코드 유지 */}
      </div>

      {/* 매직펜슬과 메모 컴포넌트는 실제 경로에 맞게 import 후 사용 */}
      {/* <MagicPencil
        videoElement={videoRef.current}
        isVisible={showMagicPencil && !isPlaying}
        onClose={() => setShowMagicPencil(false)}
      /> */}

      {/* <VideoMemo
        isVisible={showMemo}
        onClose={() => setShowMemo(false)}
        clipId={selectedId}
        memos={memos}
        onSaveMemo={(id, content) => {
          setMemos(prev => ({ ...prev, [id]: content }));
        }}
        clipInfo={{
          quarter,
          down,
          yardsToGo: ytg,
          playType: selected?.playType,
          time: formatTime(currentTime)
        }}
      /> */}
    </div>
  );
}
