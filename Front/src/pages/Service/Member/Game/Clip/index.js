// src/pages/Service/Member/Game/Clip/index.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import "./ClipPage.css";
import { TEAMS } from "../../../../../data/TEAMS";
import { useClipFilter } from "../../../../../hooks/useClipFilter";
import UploadVideoModal from "../../../../../components/UploadVideoModal";
import defaultLogo from "../../../../../assets/images/logos/Stechlogo.svg";
import Clipdata from "./clipdata.png";

/* ========== 공용 드롭다운 (이 페이지 내부 구현) ========== */
function Dropdown({ label, summary, isOpen, onToggle, onClose, width = 220, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    };
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

/* ========== 표시 라벨/상반 항목 ========== */
const PT_LABEL = { RUN: "런", PASS: "패스" }; // 화면 표기용
const PLAY_TYPES = { RUN: "RUN", PASS: "PASS" }; // 필터 저장/비교용

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

const OPPOSITES = {
  "2PT 성공": "2PT 실패",
  "2PT 실패": "2PT 성공",
  "PAT 성공": "PAT 실패",
  "PAT 실패": "PAT 성공",
  "FG 성공": "FG 실패",
  "FG 실패": "FG 성공",
};

/* TEAMS에서 이름/영문/코드로 팀 찾기(느슨 매칭) */
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
  const navigate = useNavigate();

  /* ===== 내 팀 (고정 표기) — GamePage와 동일한 방식 ===== */
  const MY_TEAM_NAME = "한양대학교 라이온스";
  const selfTeam = useMemo(
    () => TEAMS.find((t) => t.name === MY_TEAM_NAME) || TEAMS[0] || null,
    []
  );
  const logoSrc = selfTeam?.logo || defaultLogo;
  const label = selfTeam?.name || "Choose Team";

  /* 업로드 모달 상태 */
  const [showUpload, setShowUpload] = useState(false);

  // GamePage에서 넘어온 상태(가장 빠름)
  const gameFromState = location.state?.game || null;

  // 새로고침 대비: gameKey로 재조회(목업)
  const [game, setGame] = useState(gameFromState);
  useEffect(() => {
    if (game) return;
    if (!gameKey) return;
    // TODO: 실제 API로 대체
    setGame({
      gameKey,
      homeTeam: "Hanyang Lions",
      awayTeam: "Yonsei Eagles",
      date: "2024-10-01",
    });
  }, [game, gameKey]);

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

  /* ========== 예시 클립 데이터(실제 API로 교체) ========== */
  const [rawClips, setRawClips] = useState([]);
  useEffect(() => {
    if (!teamOptions.length) return;
    setRawClips([
      { id: "p1", quarter: 1, clipUrl:'https://res.cloudinary.com/dhmq7d7no/video/upload/v1753534853/IMG_3313_r3dhah.mov' , playType: "KICKOFF", significantPlay: [], offensiveTeam: "한양대 라이온스" },
      { id: "p2", quarter: 1, playType: "RUN",     down: 1, yardsToGo: 10, significantPlay: ["TFL"],              offensiveTeam: "한양대 라이온스" },
      { id: "p3", quarter: 1, playType: "PASS",    down: 3, yardsToGo: 7,  significantPlay: ["색"],               offensiveTeam: "한양대 라이온스" },
      // Q2
      { id: "p4", quarter: 2, playType: "PASS",    down: 2, yardsToGo: 5,  significantPlay: ["인터셉트", "턴오버"], offensiveTeam: "한양대 라이온스" },
      { id: "p5", quarter: 2, playType: "RUN",     down: 1, yardsToGo: 10, significantPlay: ["펌블", "턴오버"],     offensiveTeam: "연세대 이글스" },
      { id: "p6", quarter: 2, playType: "PASS",    down: 3, yardsToGo: 12, significantPlay: ["터치다운", "PAT 성공"], offensiveTeam: "한양대 라이온스" },
      // Q3
      { id: "p7", quarter: 3, playType: "RUN",     down: 2, yardsToGo: 3,  significantPlay: ["2PT 실패"],         offensiveTeam: "연세대 이글스" },
      { id: "p8", quarter: 3, playType: "PASS",    down: 1, yardsToGo: 10, significantPlay: ["페널티"],           offensiveTeam: "연세대 이글스" },
      // Q4
      { id: "p9", quarter: 4, playType: "PASS",    down: 3, yardsToGo: 8,  significantPlay: ["FG 성공"],          offensiveTeam: "한양대 라이온스" },
      { id: "p10",quarter: 4, playType: "RUN",     down: 4, yardsToGo: 1,  significantPlay: ["세이프티"],         offensiveTeam: "연세대 이글스" },
    ]);
  }, [teamOptions]);

  /* ========== 훅 사용 (필터/클립/요약/초기화/네비) ========== */
  const persistKey = `clipFilters:${game?.gameKey || gameKey || "default"}`;
  const {
    filters,
    setFilters,
    summaries,
    activeFilters,
    clips,
    handleFilterChange,
    removeFilter,
    clearAllFilters,
    buildPlayerNavState,
  } = useClipFilter({
    persistKey,
    rawClips,
    teamOptions,
    opposites: OPPOSITES,
  });

  /* 버튼 요약 텍스트 */
  const teamSummary = summaries.team;
  const quarterSummary = summaries.quarter;
  const playTypeSummary = filters.playType ? PT_LABEL[filters.playType] : "유형";
  const significantSummary = summaries.significant;
  const clearSignificant = () => setFilters((prev) => ({ ...prev, significantPlay: [] }));

  /* 리스트 클릭 → 비디오 플레이어로 이동 */
const onClickClip = (c) => {
  const normalized = clips.map((p) => ({
    ...p,
    id: String(p.id ?? p.ClipKey),
    videoUrl: p.videoUrl ?? p.clipUrl ?? p.ClipUrl ?? null,
  }));

  navigate("/service/video", {
    state: {
      filteredPlaysData: normalized,
      initialPlayId: String(c.id ?? c.ClipKey),
    },
  });
};
  return (
    <div className="clip-root">
      {/* ===== 헤더 ===== */}
      <header className="stechHeader">
        <div className="headerContainer">
          {/* 왼쪽: 내 팀 고정 */}
          <div className="header-team-box">
            <div className="header-team-logo-box">
              <img
                src={logoSrc}
                alt={label}
                className={`header-team-logo-img ${logoSrc?.endsWith(".svg") ? "svg-logo" : "png-logo"}`}
              />
            </div>
            <span className="header-team-name">{label}</span>
          </div>

          {/* 오른쪽: 필터 + 업로드 */}
          <div className="bottomRow">
            <div className="filterGroup">
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
                    onClick={() => {
                      handleFilterChange("team", null);
                      closeAll();
                    }}
                  >
                    전체
                  </button>
                  {teamOptions.map((opt) => (
                    <button
                      key={opt.value}
                      className={`ff-dd-item ${filters.team === opt.value ? "selected" : ""}`}
                      onClick={() => {
                        handleFilterChange("team", opt.value);
                        closeAll();
                      }}
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
                  <button
                    className={`ff-dd-item ${!filters.quarter ? "selected" : ""}`}
                    onClick={() => {
                      handleFilterChange("quarter", null);
                      closeAll();
                    }}
                  >
                    전체
                  </button>
                  {[1, 2, 3, 4].map((q) => (
                    <button
                      key={q}
                      className={`ff-dd-item ${filters.quarter === q ? "selected" : ""}`}
                      onClick={() => {
                        handleFilterChange("quarter", q);
                        closeAll();
                      }}
                    >
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
                  <button
                    className={`ff-dd-item ${!filters.playType ? "selected" : ""}`}
                    onClick={() => {
                      handleFilterChange("playType", null);
                      closeAll();
                    }}
                  >
                    전체
                  </button>
                  <button
                    className={`ff-dd-item ${filters.playType === PLAY_TYPES.RUN ? "selected" : ""}`}
                    onClick={() => {
                      handleFilterChange("playType", PLAY_TYPES.RUN);
                      closeAll();
                    }}
                  >
                    {PT_LABEL.RUN}
                  </button>
                  <button
                    className={`ff-dd-item ${filters.playType === PLAY_TYPES.PASS ? "selected" : ""}`}
                    onClick={() => {
                      handleFilterChange("playType", PLAY_TYPES.PASS);
                      closeAll();
                    }}
                  >
                    {PT_LABEL.PASS}
                  </button>
                </Dropdown>

                {/* SIGNIFICANT (다중선택) */}
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
                      const selected =
                        Array.isArray(filters.significantPlay) &&
                        filters.significantPlay.includes(label);
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
                    <button className="ff-dd-clear" onClick={clearSignificant}>
                      모두 해제
                    </button>
                    <button className="ff-dd-close" onClick={closeAll}>
                      닫기
                    </button>
                  </div>
                </Dropdown>

                {/* RESET */}
                <button type="button" className="resetButton" onClick={clearAllFilters}>
                  초기화
                </button>
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
                <div className="activeFiltersSection">
                  <div className="nonActiveFiltersContainer" />
                </div>
              )}
            </div>

            {/* 업로드 모달 버튼 */}
            <button className="newVideoButton" onClick={() => setShowUpload(true)}>
              경기 업로드
            </button>
          </div>
        </div>

        {/* 업로드 모달 */}
        <UploadVideoModal
          isOpen={showUpload}
          onClose={() => setShowUpload(false)}
          onUploaded={() => {
            setShowUpload(false);
            // TODO: 업로드 후 목록 갱신
          }}
        />
      </header>

      {/* ===== 본문 ===== */}
      <div className="clip-page-container">
        <div className="clip-list">
          {clips.map((c) => (
            <div key={c.id} className="clip-row" onClick={() => onClickClip(c)}>
              <div className="quarter-name">
                <div>{c.quarter}Q</div>
              </div>
              <div className="clip-rows">
                <div className="clip-row1">
                  {c.playType === "KICKOFF" ? (
                    <div className="clip-down">킥오프</div>
                  ) : (
                    <div className="clip-down">
                      {typeof c.down === "number" ? c.down : c.down} & {c.yardsToGo ?? 0}
                    </div>
                  )}
                  <div className="clip-type">#{PT_LABEL[c.playType] || c.playType}</div>
                </div>
                <div className="clip-row2">
                  <div className="clip-oT">{c.offensiveTeam}</div>
                  {Array.isArray(c.significantPlay) && c.significantPlay.length > 0 ? (
                    <div className="clip-sig">
                      {c.significantPlay.map((t, idx) => (
                        <span key={`${c.id}-sig-${idx}`}>#{t}</span>
                      ))}
                    </div>
                  ) : (
                    <div className="clip-sig" />
                  )}
                </div>
              </div>
            </div>
          ))}
          {clips.length === 0 && <div className="empty">일치하는 플레이가 없습니다.</div>}
        </div>

        <div className="clip-data">
          <div className="clip-playcall">
            <div className="clip-playcall-header">플레이콜 비율</div>
            <div className="clip-playcall-content">
              <div className="playcall-team">
                <div className="playcall-team-name">연세대 이글스</div>
                <div className="pc-run">
                  <div className="pc-row1">
                    <div>런</div>
                    <div> 32%</div>
                  </div>
                  <div className="pc-row2">
                    <div className="run1"></div>
                  </div>
                </div>
                <div className="pc-pass">
                  <div className="pc-row1">
                    <div>패스</div>
                    <div> 68%</div>
                  </div>
                  <div className="pc-row2">
                    <div className="pass1"></div>
                  </div>
                </div>
              </div>
              <div className="playcall-team">
                <div className="playcall-team-name">한양대 라이온스</div>
                <div className="pc-run">
                  <div className="pc-row1">
                    <div>런</div>
                    <div> 55%</div>
                  </div>
                  <div className="pc-row2">
                    <div className="run2"></div>
                  </div>
                </div>
                <div className="pc-pass">
                  <div className="pc-row1">
                    <div>패스</div>
                    <div> 45%</div>
                  </div>
                  <div className="pc-row2">
                    <div className="pass2"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="clip-data2">
            <img src={Clipdata} alt="clipdata2" />
          </div>
          <div className="clip-datas"></div>
        </div>
      </div>
    </div>
  );
}
