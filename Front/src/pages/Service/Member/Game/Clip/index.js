import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import "./ClipPage.css";
import { TEAMS } from "../../../../../data/TEAMS";

/* ========== 공용 드롭다운 (이 페이지 내부 구현) ========== */
function Dropdown({ label, summary, isOpen, onToggle, onClose, width = 220, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose?.(); };
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="ff-dropdown" ref={ref}>
      <button
        type="button"
        className={`ff-dd-btn ${isOpen ? "open" : ""}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={onToggle}
      >
        <span className="ff-dd-label">{summary || label}</span>
        <span className="ff-dd-icon">▾</span>
      </button>
      {isOpen && (
        <div className="ff-dd-menu" role="menu" style={{ width }}>
          {children}
        </div>
      )}
    </div>
  );
}

/* ========== 상수/유틸 ========== */
const DEFAULT_FILTERS = {
  quarter: null,          // 1|2|3|4|null
  playType: null,         // '런' | '패스' | null
  significantPlay: [],    // ['터치다운', ...]
  team: null,             // 공격팀(홈/원정 중 택1) | null
};

const PLAY_TYPES = { RUN: "런", PASS: "패스" };

const SIGNIFICANT_PLAYS = {
  TOUCHDOWN: "터치다운",
  TWOPTCONVGOOD: "2PT 성공",
  TWOPTCONVNOGOOD: "2PT 실패",
  PATSUCCESS: "PAT 성공",
  PATFAIL: "PAT 실패",
  FIELDGOALGOOD: "FG 성공",
  FIELDGOALNOGOOD: "FG 실패",
  PENALTY: "페널티",
  SACK: "색",
  TFL: "TFL",
  FUMBLE: "펌블",
  INTERCEPTION: "인터셉트",
  TURNOVER: "턴오버",
  SAFETY: "세이프티",
};

// 상충 항목(둘 중 하나만 선택되도록)
const OPPOSITES = {
  "2PT 성공": "2PT 실패",
  "2PT 실패": "2PT 성공",
  "PAT 성공": "PAT 실패",
  "PAT 실패": "PAT 성공",
  "FG 성공": "FG 실패",
  "FG 실패": "FG 성공",
};

// TEAMS에서 이름/영문/코드로 팀 찾기(느슨 매칭)
const findTeamMeta = (raw) => {
  if (!raw) return null;
  const norm = String(raw).toLowerCase();
  return (
    TEAMS.find(
      (t) =>
        String(t.name).toLowerCase() === norm ||
        String(t.enName || "").toLowerCase() === norm ||
        String(t.code || "").toLowerCase() === norm
    ) || { name: raw }
  );
};

export default function ClipPage() {
  const { gameKey } = useParams();
  const location = useLocation();

  // GamePage에서 넘어온 상태(가장 빠름)
  const gameFromState = location.state?.game || null;

  // 새로고침 대비: gameKey로 재조회(목업)
  const [game, setGame] = useState(gameFromState);
  useEffect(() => {
    if (game) return;
    if (!gameKey) return;
    // TODO: 실제 API로 대체하세요
    setGame({
      gameKey,
      homeTeam: "Hanyang Lions",
      awayTeam: "Yonsei Eagles",
      date: "2024-10-01",
    });
  }, [game, gameKey]);

  // 필터 상태/영속 저장 (로컬스토리지)
  const persistKey = `clipFilters:${game?.gameKey || gameKey || "default"}`;
  const [filters, setFilters] = useState(() => {
    try {
      const raw = localStorage.getItem(persistKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          quarter: parsed?.quarter ?? null,
          playType: parsed?.playType ?? null,
          significantPlay: Array.isArray(parsed?.significantPlay) ? parsed.significantPlay : [],
          team: parsed?.team ?? null,
        };
      }
    } catch {}
    return { ...DEFAULT_FILTERS };
  });
  useEffect(() => {
    try {
      localStorage.setItem(persistKey, JSON.stringify(filters));
    } catch {}
  }, [filters, persistKey]);

  // 드롭다운 상태
  const [openMenu, setOpenMenu] = useState(null); // 'team'|'quarter'|'playType'|'significant'|null
  const closeAll = () => setOpenMenu(null);

  // 홈/원정 → 팀 드롭다운 옵션
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
      setFilters((f) => ({ ...f, team: null }));
    }
  }, [teamOptions, filters.team]);

  /* ========== 필터 핸들러 ========== */
  const handleFilterChange = (category, value) => {
    setFilters((prev) => {
      const next = { ...prev };
      switch (category) {
        case "team":
          next.team = value || null;
          break;
        case "quarter":
          next.quarter = value ?? null;
          break;
        case "playType":
          next.playType = value || null; // '런' | '패스' | null
          break;
        case "significantPlay": {
          const arr = Array.isArray(prev.significantPlay) ? [...prev.significantPlay] : [];
          const idx = arr.indexOf(value);
          if (idx >= 0) {
            // 선택 해제
            arr.splice(idx, 1);
          } else {
            // 상충 항목 제거 후 추가
            const opp = OPPOSITES[value];
            if (opp) {
              const oppIdx = arr.indexOf(opp);
              if (oppIdx >= 0) arr.splice(oppIdx, 1);
            }
            arr.push(value);
          }
          next.significantPlay = arr;
          break;
        }
        default:
          break;
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

  /* ========== 활성 필터 칩 ========== */
  const activeFilters = useMemo(() => {
    const chips = [];
    if (filters.team) chips.push({ category: "team", value: filters.team, label: filters.team });
    if (filters.quarter) chips.push({ category: "quarter", value: filters.quarter, label: `Q${filters.quarter}` });
    if (filters.playType) chips.push({ category: "playType", value: filters.playType, label: filters.playType });
    if (Array.isArray(filters.significantPlay)) {
      filters.significantPlay.forEach((s) => chips.push({ category: "significantPlay", value: s, label: s }));
    }
    return chips;
  }, [filters]);

  /* ========== 예시 클립 데이터(실제 API로 교체) ========== */
  const [rawClips, setRawClips] = useState([]);
  useEffect(() => {
    if (!teamOptions.length) return;
    setRawClips([
      { id: "p1", quarter: 1, playType: "런",  significantPlay: ["터치다운"], offensiveTeam: teamOptions[0]?.value },
      { id: "p2", quarter: 2, playType: "패스", significantPlay: ["2PT 성공"], offensiveTeam: teamOptions[1]?.value },
      { id: "p3", quarter: 3, playType: "런",  significantPlay: ["펌블"],     offensiveTeam: teamOptions[0]?.value },
      { id: "p4", quarter: 4, playType: "패스", significantPlay: ["FG 성공"],  offensiveTeam: teamOptions[0]?.value },
    ]);
  }, [teamOptions]);

  /* ========== 필터 적용 ========== */
  const filterData = (rows) => {
    return rows.filter((r) => {
      if (filters.team && r.offensiveTeam !== filters.team) return false;
      if (filters.quarter && r.quarter !== filters.quarter) return false;
      if (filters.playType && r.playType !== filters.playType) return false;
      if (filters.significantPlay?.length) {
        // 다중선택: OR 매칭 (선택된 것 중 하나라도 포함되면 통과)
        const hasAny = (r.significantPlay || []).some((s) => filters.significantPlay.includes(s));
        if (!hasAny) return false;
      }
      return true;
    });
  };
  const clips = useMemo(() => filterData(rawClips), [rawClips, filters]);

  /* ========== 버튼 요약 텍스트 ========== */
  const teamSummary = filters.team || "공격팀";
  const quarterSummary = filters.quarter ? `Q${filters.quarter}` : "쿼터";
  const playTypeSummary = filters.playType || "유형";
  const significantSummary = (() => {
    const arr = Array.isArray(filters.significantPlay) ? filters.significantPlay : [];
    if (arr.length === 0) return "중요플레이";
    if (arr.length === 1) return arr[0];
    return `${arr[0]} 외 ${arr.length - 1}`;
  })();

  const clearSignificant = () => {
    setFilters((prev) => ({ ...prev, significantPlay: [] }));
  };

  return (
    <div className="clip-root">
      {/* ===== 필터 바 ===== */}
      <div className="filterContainer">
        <div className="ff-bar">
          {/* TEAM */}
          <Dropdown
            label="공격팀"
            summary={teamSummary}
            isOpen={openMenu === "team"}
            onToggle={() => setOpenMenu(openMenu === "team" ? null : "team")}
            onClose={closeAll}
            width={240}
          >
            <button
              className={`ff-dd-item ${!filters.team ? "selected" : ""}`}
              onClick={() => { handleFilterChange("team", null); closeAll(); }}
            >
              전체
            </button>
            {teamOptions.map((opt) => (
              <button
                key={opt.value}
                className={`ff-dd-item ${filters.team === opt.value ? "selected" : ""}`}
                onClick={() => { handleFilterChange("team", opt.value); closeAll(); }}
              >
                {opt.logo && <img className="ff-dd-avatar" src={opt.logo} alt="" />}
                {opt.label || opt.value}
              </button>
            ))}
          </Dropdown>

          {/* QUARTER */}
          <Dropdown
            label="쿼터"
            summary={quarterSummary}
            isOpen={openMenu === "quarter"}
            onToggle={() => setOpenMenu(openMenu === "quarter" ? null : "quarter")}
            onClose={closeAll}
            width={200}
          >
            <button className={`ff-dd-item ${!filters.quarter ? "selected" : ""}`} onClick={() => { handleFilterChange("quarter", null); closeAll(); }}>
              전체
            </button>
            {[1, 2, 3, 4].map((q) => (
              <button key={q} className={`ff-dd-item ${filters.quarter === q ? "selected" : ""}`} onClick={() => { handleFilterChange("quarter", q); closeAll(); }}>
                Q{q}
              </button>
            ))}
          </Dropdown>

          {/* PLAY TYPE */}
          <Dropdown
            label="유형"
            summary={playTypeSummary}
            isOpen={openMenu === "playType"}
            onToggle={() => setOpenMenu(openMenu === "playType" ? null : "playType")}
            onClose={closeAll}
            width={200}
          >
            <button className={`ff-dd-item ${!filters.playType ? "selected" : ""}`} onClick={() => { handleFilterChange("playType", null); closeAll(); }}>
              전체
            </button>
            <button className={`ff-dd-item ${filters.playType === PLAY_TYPES.RUN ? "selected" : ""}`} onClick={() => { handleFilterChange("playType", PLAY_TYPES.RUN); closeAll(); }}>
              런
            </button>
            <button className={`ff-dd-item ${filters.playType === PLAY_TYPES.PASS ? "selected" : ""}`} onClick={() => { handleFilterChange("playType", PLAY_TYPES.PASS); closeAll(); }}>
              패스
            </button>
          </Dropdown>

          {/* SIGNIFICANT (다중선택, 토글) */}
          <Dropdown
            label="중요플레이"
            summary={significantSummary}
            isOpen={openMenu === "significant"}
            onToggle={() => setOpenMenu(openMenu === "significant" ? null : "significant")}
            onClose={closeAll}
            width={260}
          >
            <div className="ff-dd-section">
              {Object.values(SIGNIFICANT_PLAYS).map((label) => {
                const selected = Array.isArray(filters.significantPlay) && filters.significantPlay.includes(label);
                return (
                  <button
                    key={label}
                    className={`ff-dd-item ${selected ? "selected" : ""}`}
                    onClick={() => handleFilterChange("significantPlay", label)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div className="ff-dd-actions">
              <button className="ff-dd-clear" onClick={clearSignificant}>모두 해제</button>
              <button className="ff-dd-close" onClick={closeAll}>닫기</button>
            </div>
          </Dropdown>

          {/* RESET */}
          <button type="button" className="ff-reset" onClick={clearAllFilters}>초기화</button>
        </div>

        {/* 활성 필터 칩 */}
        {activeFilters.length > 0 ? (
          <div className="activeFiltersSection">
            <div className="activeFiltersContainer">
              {activeFilters.map((filter, i) => (
                <div
                  key={`${filter.category}-${filter.value}-${i}`}
                  className="filterChip"
                  onClick={() => removeFilter(filter.category, filter.value)}
                >
                  <div className="filterChipText">{filter.label}</div>
                  <span className="filterChipClose">✕</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="activeFiltersSection"><div className="nonActiveFiltersContainer" /></div>
        )}
      </div>

      {/* ===== 리스트 ===== */}
      <div className="clip-list">
        {clips.map((c) => (
          <div key={c.id} className="clip-row">
            <div>#{c.id}</div>
            <div>Q{c.quarter}</div>
            <div>{c.playType}</div>
            <div>{(c.significantPlay || []).join(", ")}</div>
            <div>{c.offensiveTeam}</div>
          </div>
        ))}
        {clips.length === 0 && <div className="empty">일치하는 플레이가 없습니다.</div>}
      </div>
    </div>
  );
}
