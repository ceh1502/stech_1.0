// src/hooks/useClipFiltering.js
import { useEffect, useMemo, useState } from "react";

const DEFAULT_FILTERS = {
  quarter: null,          // 1|2|3|4|null
  playType: null,         // '런' | '패스' | null
  significantPlay: [],    // ['터치다운', ...]
  team: null,             // 팀명 | null
};

export function useClipFilter({ persistKey = "clipFilters:default", rawClips = [], teamOptions = [] }) {
  const [filters, setFilters] = useState(() => {
    try {
      const raw = localStorage.getItem(persistKey);
      if (raw) {
        const p = JSON.parse(raw);
        return {
          quarter: p?.quarter ?? null,
          playType: p?.playType ?? null,
          significantPlay: Array.isArray(p?.significantPlay) ? p.significantPlay : [],
          team: p?.team ?? null,
        };
      }
    } catch {}
    return { ...DEFAULT_FILTERS };
  });

  useEffect(() => {
    try { localStorage.setItem(persistKey, JSON.stringify(filters)); } catch {}
  }, [filters, persistKey]);

  // 저장된 team 값이 현재 팀 옵션에 없다면 해제
  useEffect(() => {
    if (filters.team && !teamOptions.some((o) => o.value === filters.team)) {
      setFilters((f) => ({ ...f, team: null }));
    }
  }, [teamOptions, filters.team]);

  const handleFilterChange = (category, value) => {
    setFilters((prev) => {
      const next = { ...prev };
      switch (category) {
        case "team": next.team = value || null; break;
        case "quarter": next.quarter = value ?? null; break;
        case "playType": next.playType = value || null; break;
        case "significantPlay": {
          const arr = Array.isArray(prev.significantPlay) ? [...prev.significantPlay] : [];
          const idx = arr.indexOf(value);
          if (idx >= 0) arr.splice(idx, 1);
          else arr.push(value);
          next.significantPlay = arr;
          break;
        }
        default: break;
      }
      return next;
    });
  };

  const removeFilter = (category, value) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (category === "significantPlay") {
        next.significantPlay = (prev.significantPlay || []).filter((v) => v !== value);
      } else {
        next[category] = null;
      }
      return next;
    });
  };

  const clearAllFilters = () => setFilters({ ...DEFAULT_FILTERS });

  // 실제 필터 적용
  const clips = useMemo(() => {
    return (rawClips || []).filter((r) => {
      if (filters.team && r.offensiveTeam !== filters.team) return false;
      if (filters.quarter && r.quarter !== filters.quarter) return false;
      if (filters.playType && r.playType !== filters.playType) return false;
      if (filters.significantPlay?.length) {
        const hasAny = (r.significantPlay || []).some((s) => filters.significantPlay.includes(s));
        if (!hasAny) return false;
      }
      return true;
    });
  }, [rawClips, filters]);

  // 요약/칩
  const summaries = {
    team: filters.team || "공격팀",
    quarter: filters.quarter ? `Q${filters.quarter}` : "쿼터",
    playType: filters.playType || "유형",
    significant: (() => {
      const arr = Array.isArray(filters.significantPlay) ? filters.significantPlay : [];
      if (arr.length === 0) return "중요플레이";
      if (arr.length === 1) return arr[0];
      return `${arr[0]} 외 ${arr.length - 1}`;
    })(),
  };

  const activeFilters = useMemo(() => {
    const chips = [];
    if (filters.team) chips.push({ category: "team", value: filters.team, label: filters.team });
    if (filters.quarter) chips.push({ category: "quarter", value: filters.quarter, label: `Q${filters.quarter}` });
    if (filters.playType) chips.push({ category: "playType", value: filters.playType, label: filters.playType });
    (filters.significantPlay || []).forEach((s) => chips.push({ category: "significantPlay", value: s, label: s }));
    return chips;
  }, [filters]);

  // 플레이어로 넘길 때 함께 보낼 페이로드(필터 결과 + 선택 ID + 메타)
  const buildPlayerNavState = (initialPlayId = null) => ({
    filteredPlaysData: clips,
    initialPlayId,
    filtersSnapshot: filters,
  });

  return {
    filters,
    setFilters,
    summaries,
    activeFilters,
    clips,                 // 필터 적용된 클립들
    handleFilterChange,
    removeFilter,
    clearAllFilters,
    buildPlayerNavState,   // 플레이어 네비게이션용 스냅샷 빌더
  };
}
