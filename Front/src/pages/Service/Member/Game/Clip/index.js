// src/pages/Service/Member/Game/Clip/index.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import './ClipPage.css';
import { TEAMS } from '../../../../../data/TEAMS';
import { useClipFilter } from '../../../../../hooks/useClipFilter';
import UploadVideoModal from '../../../../../components/UploadVideoModal';
import defaultLogo from '../../../../../assets/images/logos/Stechlogo.svg';
import { useAuth } from '../../../../../context/AuthContext';

/* ========== 공용 드롭다운 (이 페이지 내부 구현) ========== */
function Dropdown({ label, summary, isOpen, onToggle, onClose, children }) {
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        console.log('Clicking outside, closing dropdown'); // 디버깅용
        onClose?.();
      }
    };

    const onKey = (e) => {
      if (e.key === 'Escape') {
        console.log('Escape key pressed, closing dropdown'); // 디버깅용
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', onClickOutside);
      document.addEventListener('keydown', onKey);
    }

    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose, isOpen]); // isOpen 의존성 추가

  const handleToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Toggle clicked, current state:', isOpen); // 디버깅용
    onToggle();
  };

  return (
    <div className="ff-dropdown" ref={ref}>
      <button
        type="button"
        className={`ff-dd-btn ${isOpen ? 'open' : ''}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={handleToggle}
      >
        <span className="ff-dd-label">{summary || label}</span>
        <span className="ff-dd-icon">▾</span>
      </button>
      {isOpen && (
        <div className="ff-dd-menu" role="menu">
          {children}
        </div>
      )}
    </div>
  );
}

/* ========== 표시 라벨/상반 항목 ========== */
export const PT_LABEL = {
  RUN: '런',
  PASS: '패스',
  PASS_INCOMPLETE: '패스 실패',
  KICKOFF: '킥오프',
  PUNT: '펀트',
  PAT: 'PAT',
  TWOPT: '2PT',
  FIELDGOAL: 'FG',
};
const PLAY_TYPES = {
  RUN: 'RUN',
  PASS: 'PASS',
  PASS_INCOMPLETE: 'PASS_INCOMPLETE',
  KICKOFF: 'KICKOFF',
  PUNT: 'PUNT',
  PAT: 'PAT',
  TWOPT: 'TWOPT',
  FIELDGOAL: 'FIELDGOAL',
};
const SIGNIFICANT_PLAYS = {
  TOUCHDOWN: '터치다운',
  TWOPTCONVGOOD: '2PT 성공',
  TWOPTCONVNOGOOD: '2PT 실패',
  PATSUCCESS: 'PAT 성공',
  PATFAIL: 'PAT 실패',
  FIELDGOALGOOD: 'FG 성공',
  FIELDGOALNOGOOD: 'FG 실패',
  PENALTY: '페널티',
  SACK: '색',
  TFL: 'TFL',
  FUMBLE: '펌블',
  INTERCEPTION: '인터셉트',
  TURNOVER: '턴오버',
  SAFETY: '세이프티',
};

const OPPOSITES = {
  '2PT 성공': '2PT 실패',
  '2PT 실패': '2PT 성공',
  'PAT 성공': 'PAT 실패',
  'PAT 실패': 'PAT 성공',
  'FG 성공': 'FG 실패',
  'FG 실패': 'FG 성공',
};

const normalizeTeamStats = (s) => {
  if (!s) {
    return {
      teamName: '',
      totalYards: 0,
      passingYards: 0,
      rushingYards: 0,
      thirdDownPct: 0,
      turnovers: 0,
      penaltyYards: 0,
    };
  }
  const thirdDownPct =
    s.thirdDownPercentage ??
    s.thirdDownPct ??
    (s.thirdDownAttempts
      ? Math.round(((s.thirdDownMade || 0) / s.thirdDownAttempts) * 100)
      : 0);

  const turnovers =
    s.turnovers ?? (s.interceptions || 0) + (s.fumblesLost || 0);

  return {
    teamName: s.teamName ?? '',
    totalYards: s.totalYards ?? 0,
    passingYards: s.passingYards ?? s.passYards ?? 0,
    rushingYards: s.rushingYards ?? s.rushYards ?? 0,
    thirdDownPct,
    turnovers,
    penaltyYards: s.penaltyYards ?? 0,
  };
};

/* TEAMS에서 이름/영문/코드로 팀 찾기(느슨 매칭) */
const findTeamMeta = (raw) => {
  if (!raw) return { name: '', logo: null };
  const norm = String(raw).toLowerCase();
  return (
    TEAMS.find(
      (t) =>
        String(t.name).toLowerCase() === norm ||
        String(t.enName || '').toLowerCase() === norm ||
        String(t.code || '').toLowerCase() === norm
    ) || { name: String(raw), logo: null }
  );
};
const TEAM_BY_ID = TEAMS.reduce((m, t) => { m[t.id] = t; return m; }, {});



export default function ClipPage() {
  const { gameKey } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const {user } = useAuth();

  const [teamStats, setTeamStats] = useState(null); // {home, away}
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState(null);



  const MY_TEAM_ID =
    user?.teamName || user?.team;

  const selfTeam = useMemo(
    () => (MY_TEAM_ID ? TEAM_BY_ID[MY_TEAM_ID] : null) || TEAMS[0] || null,
    [MY_TEAM_ID]
  );
  const logoSrc = selfTeam?.logo || defaultLogo;
  const label = selfTeam?.name || 'Choose Team';

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
      home: '한양대 라이온스',
      away: '연세대 이글스',
      date: '2024-10-01',
    });
  }, [game, gameKey]);

  useEffect(() => {
    const key = game?.gameKey || gameKey;
    if (!key) return;

    let abort = false;
    setStatsLoading(true);
    setStatsError(null);

    fetch(`/api/team/stats/${encodeURIComponent(key)}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (abort) return;
        const payload = json?.data || json;
        setTeamStats({
          home: normalizeTeamStats(payload?.homeTeamStats),
          away: normalizeTeamStats(payload?.awayTeamStats),
        });
      })
      .catch((err) => {
        if (!abort) setStatsError(err);
      })
      .finally(() => {
        if (!abort) setStatsLoading(false);
      });

    return () => {
      abort = true;
    };
  }, [game?.gameKey, gameKey]);
  // 드롭다운 상태
  const [openMenu, setOpenMenu] = useState(null); // 'team'|'quarter'|'playType'|'significant'|null
  const closeAll = () => setOpenMenu(null);

  const handleMenuToggle = (menuName) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  };
  const homeMeta = useMemo(() => findTeamMeta(game?.home), [game?.home]);
  const awayMeta = useMemo(() => findTeamMeta(game?.away), [game?.away]);

  // 홈/원정 → 팀 드롭다운 옵션
  const teamOptions = useMemo(() => {
    const home = homeMeta;
    const away = awayMeta;
    const arr = [];
    if (home?.name)
      arr.push({ value: home.name, label: home.name, logo: home.logo });
    if (away?.name)
      arr.push({ value: away.name, label: away.name, logo: away.logo });
    // 중복 제거
    return arr.filter(
      (v, i, a) => a.findIndex((x) => x.value === v.value) === i,
    );
  }, [homeMeta, awayMeta]);


  const SPECIAL_DOWN_MAP = {
  TPT: '2PT',
  KICKOFF: '킥오프',
  PAT: 'PAT',
};
const getDownDisplay = (c) => {
  const pt = String(c.playType || '').trim().toUpperCase();
  const downRaw = c.down;
  const downStr = downRaw != null ? String(downRaw).trim().toUpperCase() : '';

  // 1) down 값이 특수 문자열이면 그 라벨만 표시 (야드투고 X)
  if (SPECIAL_DOWN_MAP[downStr]) return SPECIAL_DOWN_MAP[downStr];

  // 2) playType으로도 특수 플레이라면 라벨만 표시
  if (SPECIAL_DOWN_MAP[pt]) return SPECIAL_DOWN_MAP[pt];

  // 3) 일반 다운: "n & ytg"
  const d =
    typeof downRaw === 'number'
      ? downRaw
      : Number.isFinite(parseInt(downStr, 10))
      ? parseInt(downStr, 10)
      : null;

  if (d != null) {
    const ytg = c.yardsToGo ?? 0;
    return `${d} & ${ytg}`;
  }

  // 다운 정보가 없으면 빈값/대시 등
  return '';
};
  /* ========== 예시 클립 데이터(실제 API로 교체) ========== */
  const [rawClips, setRawClips] = useState([]);
  useEffect(() => {
    if (!teamOptions.length) return;
    setRawClips([
      {
        id: 'p1',
        quarter: 1,
        clipUrl:
          'https://res.cloudinary.com/dhmq7d7no/video/upload/v1753534853/IMG_3313_r3dhah.mov',
        playType: 'KICKOFF',
        down: 'kickoff',
        significantPlay: [],
        offensiveTeam: '한양대 라이온스',
      },
      {
        id: 'p2',
        quarter: 1,
        playType: 'RUN',
        down: 1,
        yardsToGo: 10,
        significantPlay: ['TFL'],
        offensiveTeam: '한양대 라이온스',
      },
      {
        id: 'p3',
        quarter: 1,
        playType: 'PASS',
        down: 3,
        yardsToGo: 7,
        significantPlay: ['색'],
        offensiveTeam: '한양대 라이온스',
      },
      // Q2
      {
        id: 'p4',
        quarter: 2,
        playType: 'PASS',
        down: 2,
        yardsToGo: 5,
        significantPlay: ['인터셉트', '턴오버'],
        offensiveTeam: '한양대 라이온스',
      },
      {
        id: 'p5',
        quarter: 2,
        playType: 'RUN',
        down: 1,
        yardsToGo: 10,
        significantPlay: ['펌블', '턴오버'],
        offensiveTeam: '연세대 이글스',
      },
      {
        id: 'p6',
        quarter: 2,
        playType: 'PASS',
        down: 3,
        yardsToGo: 12,
        significantPlay: ['터치다운', 'PAT 성공'],
        offensiveTeam: '한양대 라이온스',
      },
      // Q3
      {
        id: 'p7',
        quarter: 3,
        playType: 'RUN',
        down: 2,
        yardsToGo: 3,
        significantPlay: ['2PT 실패'],
        offensiveTeam: '연세대 이글스',
      },
      {
        id: 'p8',
        quarter: 3,
        playType: 'PASS',
        down: 1,
        yardsToGo: 10,
        significantPlay: ['페널티'],
        offensiveTeam: '연세대 이글스',
      },
      // Q4
      {
        id: 'p9',
        quarter: 4,
        playType: 'PASS',
        down: 'pat',
        yardsToGo: 8,
        significantPlay: ['FG 성공'],
        offensiveTeam: '한양대 라이온스',
      },
      {
        id: 'p10',
        quarter: 4,
        playType: 'RUN',
        down: 'tpt',
        yardsToGo: 1,
        significantPlay: ['세이프티'],
        offensiveTeam: '연세대 이글스',
      },
    ]);
  }, [teamOptions]);

  /* ========== 훅 사용 (필터/클립/요약/초기화/네비) ========== */
  const persistKey = `clipFilters:${game?.gameKey || gameKey || 'default'}`;
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
  const playTypeSummary = filters.playType
    ? PT_LABEL[filters.playType]
    : '유형';
  const significantSummary = summaries.significant;
  const clearSignificant = () =>
    setFilters((prev) => ({ ...prev, significantPlay: [] }));

  /* 리스트 클릭 → 비디오 플레이어로 이동 */
  const onClickClip = (c) => {
    // navigate 함수의 state 객체에 더 많은 정보를 담아서 전달합니다.
    navigate('/service/video', {
      state: {
        // 1. 필터링에 필요한 원본 데이터 전달
        rawClips: rawClips,
        initialFilters: filters,
        teamOptions: teamOptions,

        // 2. 비디오 플레이어 UI 구성에 필요한 정보 전달
        initialPlayId: String(c.id ?? c.ClipKey),
        teamMeta: {
          homeName: homeMeta?.name,
          awayName: awayMeta?.name,
          homeLogo: homeMeta?.logo,
          awayLogo: awayMeta?.logo,
        },
      },
    });
  };

  const rpStats = useMemo(() => {
    const calc = (teamName, apiStat) => {
      if (!teamName) return { runPct: 0, passPct: 0, run: 0, pass: 0 };

      const arr = clips.filter(
        (c) =>
          c.offensiveTeam === teamName &&
          (c.playType === 'RUN' ||
            c.playType === 'PASS' ||
            c.playType === 'PASS_INCOMPLETE'),
      );

      const run = arr.filter((c) => c.playType === 'RUN').length;
      const pass = arr.length - run;
      const total = run + pass;

      if (total > 0) {
        const runPct = Math.round((run / total) * 100);
        return { runPct, passPct: 100 - runPct, run, pass };
      }

      return { runPct: 0, passPct: 0, run: 0, pass: 0 };
    };

    return {
      home: calc(homeMeta?.name, teamStats?.home),
      away: calc(awayMeta?.name, teamStats?.away),
    };
  }, [clips, homeMeta?.name, awayMeta?.name, teamStats]);

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
                className={`header-team-logo-img ${
                  logoSrc?.endsWith('.svg') ? 'svg-logo' : 'png-logo'
                }`}
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
                  isOpen={openMenu === 'team'}
                  onToggle={() => handleMenuToggle('team')}
                  onClose={closeAll}
                >
                  <button
                    className={`ff-dd-item ${!filters.team ? 'selected' : ''}`}
                    onClick={() => {
                      handleFilterChange('team', null);
                      closeAll();
                    }}
                  >
                    전체
                  </button>
                  {teamOptions.map((opt) => (
                    <button
                      key={opt.value}
                      className={`ff-dd-item ${
                        filters.team === opt.value ? 'selected' : ''
                      }`}
                      onClick={() => {
                        handleFilterChange('team', opt.value);
                        closeAll();
                      }}
                    >
                      {opt.logo && (
                        <img className="ff-dd-avatar" src={opt.logo} alt="" />
                      )}
                      {opt.label || opt.value}
                    </button>
                  ))}
                </Dropdown>

                {/* QUARTER */}
                <Dropdown
                  label="쿼터"
                  summary={quarterSummary}
                  isOpen={openMenu === 'quarter'}
                  onToggle={() => handleMenuToggle('quarter')}
                  onClose={closeAll}
                >
                  <button
                    className={`ff-dd-item ${
                      !filters.quarter ? 'selected' : ''
                    }`}
                    onClick={() => {
                      handleFilterChange('quarter', null);
                      closeAll();
                    }}
                  >
                    전체
                  </button>
                  {[1, 2, 3, 4].map((q) => (
                    <button
                      key={q}
                      className={`ff-dd-item ${
                        filters.quarter === q ? 'selected' : ''
                      }`}
                      onClick={() => {
                        handleFilterChange('quarter', q);
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
                  isOpen={openMenu === 'playType'}
                  onToggle={() => handleMenuToggle('playType')}
                  onClose={closeAll}
                >
                  <button
                    className={`ff-dd-item ${
                      !filters.playType ? 'selected' : ''
                    }`}
                    onClick={() => {
                      handleFilterChange('playType', null);
                      closeAll();
                    }}
                  >
                    전체
                  </button>
                  {Object.entries(PLAY_TYPES).map(([code, label]) => (
                    <button
                      key={code}
                      className={`ff-dd-item ${
                        filters.playType === code ? 'selected' : ''
                      }`}
                      onClick={() => {
                        handleFilterChange('playType', code);
                        closeAll();
                      }}
                    >
                      {PT_LABEL[code] || code}
                    </button>
                  ))}
                </Dropdown>

                {/* SIGNIFICANT (다중선택) */}
                <Dropdown
                  label="중요플레이"
                  summary={significantSummary}
                  isOpen={openMenu === 'significant'}
                  onToggle={() => handleMenuToggle('significant')}
                  onClose={closeAll}
                >
                  <div className="ff-dd-section">
                    {Object.values(SIGNIFICANT_PLAYS).map((label) => {
                      const selected =
                        Array.isArray(filters.significantPlay) &&
                        filters.significantPlay.includes(label);
                      return (
                        <button
                          key={label}
                          className={`ff-dd-item ${selected ? 'selected' : ''}`}
                          onClick={() =>
                            handleFilterChange('significantPlay', label)
                          }
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
                <button
                  type="button"
                  className="resetButton"
                  onClick={clearAllFilters}
                >
                  초기화
                </button>
              </div>
            </div>

            {/* 업로드 모달 버튼 */}
            <button
              className="newVideoButton"
              onClick={() => setShowUpload(true)}
            >
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
                  <div className="clip-down">{getDownDisplay(c)}</div>
                  <div className="clip-type">
                    #{PT_LABEL[c.playType] || c.playType}
                  </div>
                </div>
                <div className="clip-row2">
                  <div className="clip-oT">{c.offensiveTeam}</div>
                  {Array.isArray(c.significantPlay) &&
                  c.significantPlay.length > 0 ? (
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
          {clips.length === 0 && (
            <div className="empty">일치하는 플레이가 없습니다.</div>
          )}
        </div>

        <div className="clip-data">
          <div className="clip-playcall">
            <div className="clip-playcall-header">플레이콜 비율</div>
            <div className="clip-playcall-content">
              <div className="playcall-team">
                <div className="playcall-team-name">{homeMeta.name}</div>
                <div className="pc-run">
                  <div className="pc-row1">
                    <div>런</div>
                    <div>{rpStats.home.runPct}%</div>
                  </div>
                  <div className="pc-row2">
                    <div
                      className="bar bar-run"
                      style={{ width: `${rpStats.home.runPct}%` }}
                    />
                  </div>
                </div>
                <div className="pc-pass">
                  <div className="pc-row1">
                    <div>패스</div>
                    <div>{rpStats.home.passPct}%</div>
                  </div>
                  <div className="pc-row2">
                    <div
                      className="bar bar-pass"
                      style={{ width: `${rpStats.home.passPct}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="playcall-team">
                <div className="playcall-team-name">{awayMeta.name}</div>
                <div className="pc-run">
                  <div className="pc-row1">
                    <div>런</div>
                    <div>{rpStats.away.runPct}%</div>
                  </div>
                  <div className="pc-row2">
                    <div
                      className="bar bar-run"
                      style={{ width: `${rpStats.away.runPct}%` }}
                    />
                  </div>
                </div>
                <div className="pc-pass">
                  <div className="pc-row1">
                    <div>패스</div>
                    <div>{rpStats.away.passPct}%</div>
                  </div>
                  <div className="pc-row2">
                    <div
                      className="bar bar-pass"
                      style={{ width: `${rpStats.away.passPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="clip-teamstats">
            <div className="tsc-header">
              <div className="tsc-team tsc-left">
                {homeMeta?.logo && (
                  <img
                    className="tsc-logo"
                    src={homeMeta.logo}
                    alt={homeMeta?.name}
                  />
                )}
                <span className="tsc-pill">
                  {homeMeta?.name || teamStats?.home?.teamName || '홈팀'}
                </span>
              </div>
              <div className="tsc-team tsc-right">
                {awayMeta?.logo && (
                  <img
                    className="tsc-logo"
                    src={awayMeta.logo}
                    alt={awayMeta?.name}
                  />
                )}
                <span className="tsc-pill">
                  {awayMeta?.name || teamStats?.away?.teamName || '원정팀'}
                </span>
              </div>
            </div>

            {statsLoading && (
              <div className="tsc-loading">팀 스탯 불러오는 중…</div>
            )}
            {statsError && !statsLoading && (
              <div className="tsc-error">팀 스탯을 불러올 수 없어요.</div>
            )}

            {teamStats && !statsLoading && (
              <>
                <div className="tsc-row">
                  <div>{teamStats.home.totalYards}</div>
                  <div className="tsc-label">총 야드</div>
                  <div>{teamStats.away.totalYards}</div>
                </div>
                <div className="tsc-row">
                  <div>{teamStats.home.passingYards}</div>
                  <div className="tsc-label">패싱 야드</div>
                  <div>{teamStats.away.passingYards}</div>
                </div>
                <div className="tsc-row">
                  <div>{teamStats.home.rushingYards}</div>
                  <div className="tsc-label">러싱 야드</div>
                  <div>{teamStats.away.rushingYards}</div>
                </div>
                <div className="tsc-row">
                  <div>{teamStats.home.thirdDownPct}%</div>
                  <div className="tsc-label">3rd Down %</div>
                  <div>{teamStats.away.thirdDownPct}%</div>
                </div>
                <div className="tsc-row">
                  <div>{teamStats.home.turnovers}</div>
                  <div className="tsc-label">턴오버</div>
                  <div>{teamStats.away.turnovers}</div>
                </div>
                <div className="tsc-row">
                  <div>{teamStats.home.penaltyYards}</div>
                  <div className="tsc-label">페널티 야드</div>
                  <div>{teamStats.away.penaltyYards}</div>
                </div>
              </>
            )}
          </div>

          <div className="clip-datas"></div>
        </div>
      </div>
    </div>
  );
}
