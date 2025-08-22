// pages/Service/Game/ClipPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import FootballFilter from '../../../../../components/FootballFilter/ClipFilter';
import { useFootballFilter } from '../../../../../hooks/useClipFilter';
import { TEAMS } from '../../../../../data/TEAMS';

// TEAMS에서 이름/코드로 팀 찾기(느슨한 매칭)
const findTeamMeta = (raw) => {
  if (!raw) return null;
  const norm = String(raw).toLowerCase();
  return (
    TEAMS.find(
      (t) =>
        String(t.name).toLowerCase() === norm ||
        String(t.enName || '').toLowerCase() === norm ||
        String(t.code || '').toLowerCase() === norm
    ) || { name: raw }
  );
};

export default function ClipPage() {
  const { gameKey } = useParams();
  const location = useLocation();

  // 1) GamePage에서 넘어온 상태(가장 빠름)
  const gameFromState = location.state?.game || null;

  // 2) 새로고침 대비: gameKey로 다시 조회
  const [game, setGame] = useState(gameFromState);
  useEffect(() => {
    if (game) return;
    if (!gameKey) return;
    // TODO: 실제 API 호출로 대체
    // 예: api.get(`/games/${gameKey}`).then(res => setGame(res.data))
    // 임시 목업:
    setGame({
      gameKey,
      homeTeam: 'Hanyang Lions',
      awayTeam: 'Yonsei Eagles',
      date: '2024-10-01',
    });
  }, [game, gameKey]);

  const persistKey = `clipFilters:${game?.gameKey || gameKey || 'default'}`;
  const {
    filters, handleFilterChange, removeFilter, clearAllFilters,
    activeFilters, filterData,
  } = useFootballFilter(persistKey);

  // 홈/원정 → 팀 드롭다운 옵션
  const teamOptions = useMemo(() => {
    const home = findTeamMeta(game?.homeTeam);
    const away = findTeamMeta(game?.awayTeam);
    const arr = [];
    if (home?.name) arr.push({ value: home.name, label: home.name, logo: home.logo });
    if (away?.name) arr.push({ value: away.name, label: away.name, logo: away.logo });
    return arr.filter((v, i, a) => a.findIndex((x) => x.value === v.value) === i);
  }, [game?.homeTeam, game?.awayTeam]);

  // 저장된 team 값이 이번 경기 팀 목록에 없으면 해제
  useEffect(() => {
    if (filters.team && !teamOptions.some((o) => o.value === filters.team)) {
      removeFilter('team');
    }
  }, [teamOptions, filters.team, removeFilter]);

  // 예시 데이터(실제 데이터로 교체)
  const [rawClips, setRawClips] = useState([]);
  useEffect(() => {
    if (!teamOptions.length) return;
    setRawClips([
      { id: 'p1', quarter: 1, playType: '런',  significantPlay: ['터치다운'], offensiveTeam: teamOptions[0]?.value },
      { id: 'p2', quarter: 2, playType: '패스', significantPlay: ['2PT 성공'], offensiveTeam: teamOptions[1]?.value },
    ]);
  }, [teamOptions]);

  const clips = filterData(rawClips);

  return (
    <div>
      <FootballFilter
        filters={filters}
        handleFilterChange={handleFilterChange}
        removeFilter={removeFilter}
        activeFilters={activeFilters}
        onReset={clearAllFilters}
        teamOptions={teamOptions}
      />

      <div className="clip-list">
        {clips.map((c) => (
          <div key={c.id} className="clip-row">
            <div>#{c.id}</div>
            <div>Q{c.quarter}</div>
            <div>{c.playType}</div>
            <div>{(c.significantPlay || []).join(', ')}</div>
            <div>{c.offensiveTeam}</div>
          </div>
        ))}
        {clips.length === 0 && <div className="empty">일치하는 플레이가 없습니다.</div>}
      </div>
    </div>
  );
}
