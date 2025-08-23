// hooks/useFootballFilter.js
import {useState, useCallback, useMemo, useEffect} from "react";

// 내부 기본값
const DEFAULT_FILTERS = {
  quarter: null,
  playType: null,
  significantPlay: [],
  team: null,
};

// 팀 코드 → 표시명 (FootballFilter와 일치)
const TEAM_NAMES = {
  HY: "Hanyang Lions",
  YS: "Yonsei Eagles",
  KM: "Kookmin Razorbacks", // 필요시 확장
};

// 반대 속성(중복 선택 방지) — FootballFilter의 라벨과 맞춤
const OPPOSITES = {
  "2PT 성공": "2PT 실패",
  "2PT 실패": "2PT 성공",
  "PAT 성공": "PAT 실패",
  "PAT 실패": "PAT 성공",
  "FG 성공": "FG 실패",
  "FG 실패": "FG 성공",
};

export const useFootballFilter = (persistKey = null) => {
  // 초기 로드(로컬스토리지) → 없으면 기본값
  const [filters, setFilters] = useState(() => {
    if (!persistKey) return DEFAULT_FILTERS;
    try {
      const saved = JSON.parse(localStorage.getItem(persistKey) || "{}");
      if (saved?.filters) {
        return {...DEFAULT_FILTERS, ...saved.filters};
      }
    } catch (_) {}
    return DEFAULT_FILTERS;
  });

  const [selectedPlay, setSelectedPlay] = useState(() => {
    if (!persistKey) return null;
    try {
      const saved = JSON.parse(localStorage.getItem(persistKey) || "{}");
      return saved?.selectedPlay ?? null;
    } catch (_) {}
    return null;
  });

  // 변경 시 저장
  useEffect(() => {
    if (!persistKey) return;
    const payload = JSON.stringify({filters, selectedPlay});
    localStorage.setItem(persistKey, payload);
  }, [persistKey, filters, selectedPlay]);

  // ── 필터 변경
  const handleFilterChange = useCallback((category, value) => {
    if (category === "significantPlay") {
      setFilters((prev) => {
        const current = [...prev.significantPlay];

        if (OPPOSITES[value]) {
          // 반대값 제거
          const filtered = current.filter((v) => v !== OPPOSITES[value]);
          const exists = filtered.includes(value);
          return {
            ...prev,
            significantPlay: exists
              ? filtered.filter((v) => v !== value)
              : [...filtered, value],
          };
        } else {
          const idx = current.indexOf(value);
          if (idx > -1) {
            current.splice(idx, 1);
          } else {
            current.push(value);
          }
          return {...prev, significantPlay: current};
        }
      });
    } else {
      setFilters((prev) => ({
        ...prev,
        [category]: prev[category] === value ? null : value,
      }));
    }
  }, []);

  // ── 단일/전체 제거
  const removeFilter = useCallback((category, value = null) => {
    if (category === "significantPlay" && value) {
      setFilters((prev) => ({
        ...prev,
        significantPlay: prev.significantPlay.filter((v) => v !== value),
      }));
    } else {
      setFilters((prev) => ({
        ...prev,
        [category]: category === "significantPlay" ? [] : null,
      }));
    }
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // ── 활성 필터 칩
  const activeFilters = useMemo(() => {
    const active = [];
    if (filters.quarter) {
      active.push({
        category: "quarter",
        value: filters.quarter,
        label: `Q${filters.quarter}`,
      });
    }
    if (filters.playType) {
      active.push({
        category: "playType",
        value: filters.playType,
        label: filters.playType,
      });
    }
    if (filters.significantPlay?.length) {
      filters.significantPlay.forEach((p) => {
        active.push({category: "significantPlay", value: p, label: p});
      });
    }
    if (filters.team) {
      active.push({category: "team", value: filters.team, label: filters.team});
    }
    return active;
  }, [filters]);

  // ── 데이터 필터링
  const filterData = useCallback(
    (data) => {
      const filtered = data.filter((play) => {
        // Quarter
        if (filters.quarter && play.quarter !== filters.quarter) return false;

        // Play Type
        if (filters.playType && play.playType !== filters.playType)
          return false;

        // Significant (모든 선택 포함 AND)
        if (filters.significantPlay?.length) {
          const ok = filters.significantPlay.every(
            (s) => play.significantPlay && play.significantPlay.includes(s)
          );
          if (!ok) return false;
        }

        // Team
        if (filters.team) {
          if (
            (play.offensiveTeam || "").toLowerCase() !==
            filters.team.toLowerCase()
          )
            return false;
        }

        return true;
      });

      // 선택된 플레이가 사라졌으면 선택 해제
      if (selectedPlay && !filtered.find((p) => p.id === selectedPlay)) {
        setSelectedPlay(null);
      }
      return filtered;
    },
    [filters, selectedPlay]
  );

  // ── 플레이 선택
  const selectPlay = useCallback((playId) => {
    setSelectedPlay((prev) => (prev === playId ? null : playId));
  }, []);
  const clearSelectedPlay = useCallback(() => setSelectedPlay(null), []);
  const isPlaySelected = useCallback(
    (playId) => selectedPlay === playId,
    [selectedPlay]
  );
  const getSelectedPlayData = useCallback(
    (data) => (selectedPlay ? data.find((p) => p.id === selectedPlay) : null),
    [selectedPlay]
  );

  return {
    filters,
    handleFilterChange,
    removeFilter,
    clearAllFilters,
    activeFilters,
    filterData,
    // 선택 관련
    selectedPlay,
    selectPlay,
    clearSelectedPlay,
    isPlaySelected,
    getSelectedPlayData,
  };
};
