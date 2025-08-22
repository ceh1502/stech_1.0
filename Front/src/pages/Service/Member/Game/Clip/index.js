// pages/ClipPage.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import FootballFilter from '../../../../../components/FootballFilter/FootballFilter';
import { useFootballFilter } from '../../../../../hooks/useFootballFilter';
import { TEAMS } from '../../../../../data/TEAMS'; // name, logo 등 포함

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

const ClipPage = ({ game }) => {
  // 라우터에서 gameKey를 받을 수도 있음
  const { gameKey: gameKeyFromUrl } = useParams();
  const key = game?.gameKey || gameKeyFromUrl || 'default';

  const {
    filters, handleFilterChange, removeFilter, clearAllFilters,
    activeFilters, filterData,
  } = useFootballFilter(`clipFilters:${key}`);

  // 홈/원정 메타 → 팀 드롭다운 옵션으로
  const teamOptions = useMemo(() => {
    const home = findTeamMeta(game?.homeTeam);
    const away = findTeamMeta(game?.awayTeam);
    const arr = [];
    if (home?.name) arr.push({ value: home.name, label: home.name, logo: home.logo });
    if (away?.name) arr.push({ value: away.name, label: away.name, logo: away.logo });
    // 중복 제거
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
    // offensiveTeam 값이 teamOptions의 value(= 팀 이름)과 같아야 필터가 맞습니다.
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
        teamOptions={teamOptions}   // ← 여기!
      />

      {/* 이하 클립 렌더링 */}
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
      </div>
    </div>
  );
};

export default ClipPage;
