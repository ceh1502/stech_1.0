// src/pages/Service/HighlightPage.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HighlightModal from '../../../../components/HighlightModal';
import { useAuth } from '../../../../context/AuthContext';
import { API_CONFIG } from '../../../../config/api';

const toId = (g) => g?.id || g?._id;
const toClipId = (c) => c?.id || c?._id;

const GameItem = ({ game, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'block',
      width: '100%',
      textAlign: 'left',
      padding: '10px 12px',
      borderBottom: '1px solid #f0f0f0',
      background: active ? '#eef6ff' : '#fff',
      cursor: 'pointer',
    }}
  >
    <div style={{ fontWeight: 600, marginBottom: 4 }}>
      {game.title || game.opponent || '경기'}
    </div>
    <div style={{ fontSize: 12, color: '#666' }}>
      {game.date ? new Date(game.date).toLocaleString() : ''}
    </div>
  </button>
);

const ClipItem = ({ clip, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'grid',
      gridTemplateColumns: '120px 1fr',
      gap: 12,
      width: '100%',
      textAlign: 'left',
      padding: '10px 12px',
      borderBottom: '1px solid #f0f0f0',
      background: '#fff',
      cursor: 'pointer',
    }}
    title={clip.title || '하이라이트'}
  >
    <div
      style={{
        width: '100%',
        aspectRatio: '16/9',
        background: `#ddd url(${clip.thumbnailUrl || ''}) center/cover no-repeat`,
        borderRadius: 6,
      }}
    />
    <div style={{ overflow: 'hidden' }}>
      <div style={{ fontWeight: 600, marginBottom: 4, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
        {clip.title || '하이라이트 클립'}
      </div>
      <div style={{ fontSize: 12, color: '#666' }}>
        {clip.playerName ? `${clip.playerName} · ` : ''}
        {Number.isFinite(clip.start) ? `${clip.start}s` : ''}{Number.isFinite(clip.end) ? ` ~ ${clip.end}s` : ''}
      </div>
    </div>
  </button>
);

const HighlightBrowser = ({ role, teamKey, playerId }) => {
  const navigate = useNavigate();

  const [games, setGames] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [gamesError, setGamesError] = useState('');

  const [selectedGameId, setSelectedGameId] = useState(null);

  const [clips, setClips] = useState([]);
  const [clipsLoading, setClipsLoading] = useState(false);
  const [clipsError, setClipsError] = useState('');

  // 게임 목록 로드
  const fetchGames = useCallback(async () => {
    setGamesLoading(true);
    setGamesError('');
    try {
      const url =
        role === 'coach'
          ? `${API_CONFIG.BASE_URL}/games/team/${encodeURIComponent(teamKey)}`
          : `${API_CONFIG.BASE_URL}/games/player/${encodeURIComponent(playerId)}`;

      const res = await fetch(url);
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || '경기 목록 로드 실패');

      const list = Array.isArray(json.data) ? json.data : [];
      setGames(list);
      setSelectedGameId(list.length ? toId(list[0]) : null);
    } catch (e) {
      setGamesError(e.message || '경기 목록을 불러올 수 없습니다.');
      setGames([]);
      setSelectedGameId(null);
    } finally {
      setGamesLoading(false);
    }
  }, [role, teamKey, playerId]);

  // 게임 선택 시 하이라이트 로드
  const fetchClips = useCallback(
    async (gameId) => {
      if (!gameId) {
        setClips([]);
        return;
      }
      setClipsLoading(true);
      setClipsError('');
      try {
        const q = role === 'player' ? `?playerId=${encodeURIComponent(playerId)}` : '';
        const url = `${API_CONFIG.BASE_URL}/highlights/game/${encodeURIComponent(gameId)}${q}`;
        const res = await fetch(url);
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.message || '하이라이트 로드 실패');

        const all = Array.isArray(json.data) ? json.data : [];
        const onlyHighlights = all.filter((c) => c.isHighlight);
        setClips(onlyHighlights);
      } catch (e) {
        setClipsError(e.message || '클립을 불러올 수 없습니다.');
        setClips([]);
      } finally {
        setClipsLoading(false);
      }
    },
    [role, playerId]
  );

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  useEffect(() => {
    fetchClips(selectedGameId);
  }, [selectedGameId, fetchClips]);

  const selectedGame = useMemo(
    () => games.find((g) => toId(g) === selectedGameId) || null,
    [games, selectedGameId]
  );

  const goVideo = (clip) => {
    // /video 로 이동 (clipId, gameId만 넘기고 /video 페이지에서 상세 조회를 권장)
    const clipId = toClipId(clip);
    const gid = selectedGameId;
    navigate(`/video?gameId=${encodeURIComponent(gid)}&clipId=${encodeURIComponent(clipId)}`);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
      {/* 좌측: 경기 목록 */}
      <div style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #eee', background: '#fafafa', fontWeight: 600 }}>
          경기 목록
        </div>
        <div style={{ maxHeight: 520, overflowY: 'auto' }}>
          {gamesLoading && <div style={{ padding: 12 }}>불러오는 중…</div>}
          {gamesError && <div style={{ padding: 12, color: '#cc0000' }}>⚠ {gamesError}</div>}
          {!gamesLoading && !gamesError && games.length === 0 && (
            <div style={{ padding: 12 }}>표시할 경기가 없습니다.</div>
          )}
          {games.map((g) => (
            <GameItem
              key={toId(g)}
              game={g}
              active={toId(g) === selectedGameId}
              onClick={() => setSelectedGameId(toId(g))}
            />
          ))}
        </div>
      </div>

      {/* 우측: 하이라이트 목록 (없으면 모달) */}
      <div>
        <div style={{ padding: '8px 0 12px', fontWeight: 700, fontSize: 16 }}>
          {selectedGame?.title || selectedGame?.opponent || '선택된 경기'}
        </div>

        {clipsLoading && <div style={{ padding: 12 }}>클립 불러오는 중…</div>}
        {clipsError && <div style={{ padding: 12, color: '#cc0000' }}>⚠ {clipsError}</div>}

        {!clipsLoading && !clipsError && clips.length === 0 && (
          <HighlightModal onClose={() => null /* stay on page */} />
        )}

        {!clipsLoading && !clipsError && clips.length > 0 && (
          <div style={{ border: '1px solid #eee', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #eee', background: '#fafafa', fontWeight: 600 }}>
              하이라이트
            </div>
            <div style={{ maxHeight: 520, overflowY: 'auto' }}>
              {clips.map((c) => (
                <ClipItem key={toClipId(c)} clip={c} onClick={() => goVideo(c)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const HighlightPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // { role: 'coach'|'player', teamName, _id }
  const role = user?.role === 'coach' ? 'coach' : 'player';
  const teamKey = user?.teamName || '';  // 코치
  const playerId = user?._id || user?.id || ''; // 선수

  return (
    <div style={{ padding: 16, width: 'min(1100px, 90vw)', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <h2 style={{ margin: 0 }}>하이라이트</h2>
        <button onClick={() => navigate(-1)} style={{ fontSize: 14 }}>닫기</button>
      </div>
      <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
        {role === 'coach' ? '코치 전용 · 팀 경기 하이라이트' : '선수 전용 · 내 하이라이트'}
      </div>

      <HighlightBrowser role={role} teamKey={teamKey} playerId={playerId} />
    </div>
  );
};

export default HighlightPage;
