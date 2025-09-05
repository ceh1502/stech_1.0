import React, { useEffect, useMemo, useRef, useState } from 'react';
import { RxTriangleDown } from 'react-icons/rx';
import { FaChevronDown } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
// import { API_CONFIG } from '../../config/api'; // 🔒 API 미사용

import '../../components/Stat/StatPosition.css';

// ✅ 목데이터 임포트 (포지션별 두 명, 건국대 기준으로 만든 그 파일)
import { mockData } from '../../data/teamplayermock';

/* ───────── 공통 드롭다운 ───────── */
function Dropdown({ value, options, onChange, label, placeholder }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onClickOutside = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);
  return (
    <div className="dropdown-container" ref={ref} aria-label={label}>
      <button type="button" className={`dropdown-trigger ${open ? 'open' : ''}`} onClick={() => setOpen((o) => !o)}>
        <span className="dropdown-text">{value || placeholder}</span>
        <FaChevronDown size={16} className={`dropdown-arrow ${open ? 'rotated' : ''}`} />
      </button>
      {open && (
        <div className="dropdown-menu">
          <ul className="dropdown-list">
            {options.map((opt) => (
              <li key={opt.value}>
                <button
                  className={`dropdown-option ${value === opt.value ? 'selected' : ''}`}
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ───────── 상수/컬럼 정의 (StatPosition 과 동일 규칙) ───────── */
const POSITION_ORDER = ['QB','RB','WR','TE','OL','DL','LB','DB','K','P'];

const POSITION_CATEGORIES = {
  QB: ['pass','run'],
  RB: ['run','pass','스페셜팀'],
  WR: ['pass','run','스페셜팀'],
  TE: ['pass','run'],
  OL: ['default'],
  DL: ['default'],
  LB: ['default'],
  DB: ['defense','스페셜팀'],
  K:  ['스페셜팀'],
  P:  ['스페셜팀'],
};

const PRIMARY_METRIC = {
  QB: { pass: 'passing_yards', run: 'rushing_yards' },
  RB: { run: 'rushing_yards', pass: 'receiving_yards', 스페셜팀: 'kick_return_yards' },
  WR: { pass: 'receiving_yards', run: 'rushing_yards', 스페셜팀: 'kick_return_yards' },
  TE: { pass: 'receiving_yards', run: 'rushing_yards' },
  OL: { default: 'offensive_snaps_played' },
  DL: { default: 'sacks' },
  LB: { default: 'tackles' },
  DB: { defense: 'interceptions', 스페셜팀: 'kick_return_yards' },
  K:  { 스페셜팀: 'field_goal_percentage' },
  P:  { 스페셜팀: 'average_punt_yard' },
};

const statColumns = {
  QB: {
    pass: [
      { key: 'games', label: '경기 수' },
      { key: 'passing_attempts', label: '패스 시도' },
      { key: 'pass_completions', label: '패스 성공' },
      { key: 'completion_percentage', label: '패스 성공률' },
      { key: 'passing_yards', label: '패싱 야드' },
      { key: 'passing_td', label: '패싱 TD' },
      { key: 'interceptions', label: '인터셉트' },
      { key: 'longest_pass', label: '최장 패스' },
      { key: 'sacks', label: '색' },
    ],
    run: [
      { key: 'games', label: '경기 수' },
      { key: 'rushing_attempts', label: '러싱 시도' },
      { key: 'rushing_yards', label: '러싱 야드' },
      { key: 'yards_per_carry', label: '시도당 러싱' },
      { key: 'rushing_td', label: '러싱 TD' },
      { key: 'longest_rushing', label: '최장 러싱' },
    ],
  },
  RB: {
    run: [
      { key: 'games', label: '경기 수' },
      { key: 'rushing_attempts', label: '러싱 시도' },
      { key: 'rushing_yards', label: '러싱 야드' },
      { key: 'yards_per_carry', label: '시도당 러싱' },
      { key: 'rushing_td', label: '러싱 TD' },
      { key: 'longest_rushing', label: '최장 러싱' },
      { key: 'rushingFumbles', label: '러싱 펌블' },
      { key: 'rushingFumblesLost', label: '러싱 펌블 로스트' },
    ],
    pass: [
      { key: 'games', label: '경기 수' },
      { key: 'targets', label: '타겟' },
      { key: 'receptions', label: '캐치' },
      { key: 'receiving_yards', label: '리시빙 야드' },
      { key: 'yards_per_catch', label: '캐치당 야드' },
      { key: 'receiving_td', label: '리시빙 TD' },
      { key: 'longest_reception', label: '최장 리시빙' },
      { key: 'receiving_first_downs', label: '퍼스트다운' },
      { key: 'passingFumbles', label: '패싱 펌블' },
      { key: 'passingFumblesLost', label: '패싱 펌블 로스트' },
    ],
    스페셜팀: [
      { key: 'games', label: '경기 수' },
      { key: 'kick_returns', label: '킥 리턴' },
      { key: 'kick_return_yards', label: '킥 리턴 야드' },
      { key: 'yards_per_kick_return', label: '리턴당 야드' },
      { key: 'punt_returns', label: '펀트 리턴' },
      { key: 'punt_return_yards', label: '펀트 리턴 야드' },
      { key: 'yards_per_punt_return', label: '리턴당(펀트)' },
      { key: 'return_td', label: '리턴 TD' },
    ],
  },
  WR: {
    pass: [
      { key: 'games', label: '경기 수' },
      { key: 'targets', label: '타겟' },
      { key: 'receptions', label: '캐치' },
      { key: 'receiving_yards', label: '리시빙 야드' },
      { key: 'yards_per_catch', label: '캐치당 야드' },
      { key: 'receiving_td', label: '리시빙 TD' },
      { key: 'longest_reception', label: '최장 리시빙' },
      { key: 'receiving_first_downs', label: '퍼스트다운' },
      { key: 'passingFumbles', label: '패싱 펌블' },
      { key: 'passingFumblesLost', label: '패싱 펌블 로스트' },
    ],
    run: [
      { key: 'games', label: '경기 수' },
      { key: 'rushing_attempts', label: '러싱 시도' },
      { key: 'rushing_yards', label: '러싱 야드' },
      { key: 'yards_per_carry', label: '시도당 러싱' },
      { key: 'rushing_td', label: '러싱 TD' },
      { key: 'longest_rushing', label: '최장 러싱' },
      { key: 'rushingFumbles', label: '러싱 펌블' },
      { key: 'rushingFumblesLost', label: '러싱 펌블 로스트' },
    ],
    스페셜팀: [
      { key: 'games', label: '경기 수' },
      { key: 'kick_returns', label: '킥 리턴' },
      { key: 'kick_return_yards', label: '킥 리턴 야드' },
      { key: 'yards_per_kick_return', label: '리턴당 야드' },
      { key: 'punt_returns', label: '펀트 리턴' },
      { key: 'punt_return_yards', label: '펀트 리턴 야드' },
      { key: 'yards_per_punt_return', label: '리턴당(펀트)' },
      { key: 'return_td', label: '리턴 TD' },
    ],
  },
  TE: {
    pass: [
      { key: 'games', label: '경기 수' },
      { key: 'targets', label: '타겟' },
      { key: 'receptions', label: '캐치' },
      { key: 'receiving_yards', label: '리시빙 야드' },
      { key: 'yards_per_catch', label: '캐치당 야드' },
      { key: 'receiving_td', label: '리시빙 TD' },
      { key: 'longest_reception', label: '최장 리시빙' },
      { key: 'fumbles', label: '펌블' },
      { key: 'fumbles_lost', label: '펌블 로스트' },
    ],
    run: [
      { key: 'games', label: '경기 수' },
      { key: 'rushing_attempts', label: '러싱 시도' },
      { key: 'rushing_yards', label: '러싱 야드' },
      { key: 'yards_per_carry', label: '시도당 러싱' },
      { key: 'rushing_td', label: '러싱 TD' },
      { key: 'longest_rushing', label: '최장 러싱' },
    ],
  },
  OL: { default: [
    { key: 'offensive_snaps_played', label: '공격 스냅' },
    { key: 'penalties', label: '반칙' },
    { key: 'sacks_allowed', label: '색 허용' },
  ]},
  DL: { default: [
    { key: 'games', label: '경기 수' },
    { key: 'tackles', label: '태클' },
    { key: 'TFL', label: 'TFL' },
    { key: 'sacks', label: '색' },
    { key: 'forced_fumbles', label: '펌블 유도' },
    { key: 'fumble_recovery', label: '펌블 리커버' },
    { key: 'fumble_recovered_yards', label: '리커버 야드' },
    { key: 'pass_defended', label: '패스 디펜스' },
    { key: 'interceptions', label: '인터셉션' },
    { key: 'interception_yards', label: '인터셉션 야드' },
    { key: 'touchdowns', label: '수비 TD' },
  ]},
  LB: { default: [
    { key: 'games', label: '경기 수' },
    { key: 'tackles', label: '태클' },
    { key: 'TFL', label: 'TFL' },
    { key: 'sacks', label: '색' },
    { key: 'forced_fumbles', label: '펌블 유도' },
    { key: 'fumble_recovery', label: '펌블 리커버' },
    { key: 'fumble_recovered_yards', label: '리커버 야드' },
    { key: 'pass_defended', label: '패스 디펜스' },
    { key: 'interceptions', label: '인터셉션' },
    { key: 'interception_yards', label: '인터셉션 야드' },
    { key: 'touchdowns', label: '수비 TD' },
  ]},
  DB: {
    defense: [
      { key: 'games', label: '경기 수' },
      { key: 'tackles', label: '태클' },
      { key: 'TFL', label: 'TFL' },
      { key: 'sacks', label: '색' },
      { key: 'forced_fumbles', label: '펌블 유도' },
      { key: 'fumble_recovery', label: '펌블 리커버' },
      { key: 'fumble_recovered_yards', label: '리커버 야드' },
      { key: 'pass_defended', label: '패스 디펜스' },
      { key: 'interceptions', label: '인터셉션' },
      { key: 'interception_yards', label: '인터셉션 야드' },
      { key: 'touchdowns', label: '수비 TD' },
    ],
    스페셜팀: [
      { key: 'games', label: '경기 수' },
      { key: 'kick_returns', label: '킥 리턴' },
      { key: 'kick_return_yards', label: '킥 리턴 야드' },
      { key: 'yards_per_kick_return', label: '리턴당 야드' },
      { key: 'punt_returns', label: '펀트 리턴' },
      { key: 'punt_return_yards', label: '펀트 리턴 야드' },
      { key: 'yards_per_punt_return', label: '리턴당(펀트)' },
      { key: 'return_td', label: '리턴 TD' },
    ],
  },
  K: { 스페셜팀: [
    { key: 'games', label: '경기 수' },
    { key: 'extra_points_attempted', label: 'PAT 시도' },
    { key: 'extra_points_made', label: 'PAT 성공' },
    { key: 'field_goal', label: '필드골 성공-시도' },
    { key: 'field_goal_percentage', label: '필드골 성공률' },
    { key: 'longest_field_goal', label: '최장 필드골' },
  ]},
  P: { 스페셜팀: [
    { key: 'games', label: '경기 수' },
    { key: 'punt_count', label: '펀트 수' },
    { key: 'punt_yards', label: '펀트 야드' },
    { key: 'average_punt_yard', label: '평균 펀트' },
    { key: 'longest_punt', label: '최장 펀트' },
    { key: 'touchbacks', label: '터치백' },
    { key: 'touchback_percentage', label: '터치백 %' },
    { key: 'inside20', label: '인사이드20' },
    { key: 'inside20_percentage', label: '인사이드20 %' },
  ]},
};

const LOWER_IS_BETTER = new Set(['interceptions','sacks','fumbles','fumbles_lost','penalties','sacks_allowed','touchback_percentage']);
const PAIR_FIRST_DESC = new Set(['field_goal']);
const parsePair = (str) => {
  if (typeof str !== 'string') return [0, 0];
  const [a, b] = str.split('-').map((n) => parseFloat(n) || 0);
  return [a, b];
};

/* (팀 키 ↔ 한글명 매핑은 목데이터에선 필요 없음이지만 남겨둠) */
const BACKEND_TO_FRONTEND_TEAM = {
  KKRagingBulls:'건국대 레이징불스', KHCommanders:'경희대 커맨더스', SNGreenTerrors:'서울대 그린테러스',
  USCityhawks:'서울시립대 시티혹스', DGTuskers:'동국대 터스커스', KMRazorbacks:'국민대 레이저백스',
  YSEagles:'연세대 이글스', KUTigers:'고려대 타이거스', HICowboys:'홍익대 카우보이스',
  SSCrusaders:'숭실대 크루세이더스', HYLions:'한양대 라이온스', HFBlackKnights:'한국외대 블랙나이츠',
};
const FRONTEND_TO_BACKEND_TEAM = Object.fromEntries(Object.entries(BACKEND_TO_FRONTEND_TEAM).map(([k,v]) => [v,k]));

/* ───────── 섹션 (포지션 한 블럭) ───────── */
function PositionSection({ title, rows, categoryKey, primaryKey }) {
  const columns = statColumns[title]?.[categoryKey] || statColumns[title]?.default || [];
  const [sort, setSort] = useState(primaryKey ? { key: primaryKey, direction: 'desc' } : null);
  useEffect(() => { setSort(primaryKey ? { key: primaryKey, direction: 'desc' } : null); }, [primaryKey]);

  const toggleSort = (key) => {
    setSort((prev) => (!prev || prev.key !== key ? { key, direction: 'desc' } : { key, direction: prev.direction === 'desc' ? 'asc' : 'desc' }));
  };

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const { key, direction } = sort;
    return [...rows].sort((a,b) => {
      if (PAIR_FIRST_DESC.has(key)) {
        const [a1,a2] = parsePair(a[key] ?? '0-0');
        const [b1,b2] = parsePair(b[key] ?? '0-0');
        const prefSign = LOWER_IS_BETTER.has(key) ? 1 : -1;
        const dirSign  = direction === 'asc' ? -1 : 1;
        const d1 = (a1-b1)*prefSign*dirSign;
        if (d1 !== 0) return d1;
        return (a2-b2)*prefSign*dirSign;
      }
      const av = a[key] ?? 0, bv = b[key] ?? 0;
      const base = av<bv ? -1 : av>bv ? 1 : 0;
      const sign = direction === 'asc' ? 1 : -1;
      const low  = LOWER_IS_BETTER.has(key) ? -1 : 1;
      return base*sign*low;
    });
  }, [rows, sort]);

  const ranked = useMemo(() => {
    if (!sorted.length || !sort) return sorted.map((r,i)=>({...r,__rank:i+1}));
    const { key } = sort;
    const valueOf = (r)=> (PAIR_FIRST_DESC.has(key) ? parsePair(r[key] ?? '0-0').join('|') : r[key] ?? 0);
    let last=null, rank=0, seen=0;
    return sorted.map((r)=>{ seen++; const v=valueOf(r); if(v!==last) rank=seen; last=v; return {...r,__rank:rank}; });
  }, [sorted, sort]);

  const fmt = (k,v) => (typeof v === 'number' ? (String(k).includes('percentage') ? v.toFixed(1) : v%1!==0 ? v.toFixed(1) : v) : v ?? '0');

  if (!rows.length) return null;

  return (
    <div className="stat-position-section">
      <div className="table-header"><div className="table-title">{title} 선수 스탯</div></div>
      <div className="table-wrapper">
        <div className="stat-table">
          <div className="table-head">
            <div className="table-row">
              <div className="table-row1">
                <div className="table-header-cell rank-column">순위</div>
                <div className="table-header-cell player-column">선수 이름</div>
              </div>
              <div className="table-row2" style={{ '--cols': columns.length }}>
                {columns.map((col) => {
                  const isActive = sort && sort.key === col.key;
                  const direction = isActive ? sort.direction : null;
                  const isPrimary = primaryKey === col.key;
                  return (
                    <div
                      key={col.key}
                      className={`table-header-cell stat-column sortable ${isActive ? 'active-blue' : ''} ${isPrimary && !isActive ? 'primary-orange' : ''}`}
                    >
                      <button type="button" className={`sort-toggle one ${direction ?? 'none'}`} onClick={() => toggleSort(col.key)}>
                        <span className="column-label">{col.label}</span>
                        <RxTriangleDown className={`chev ${direction === 'asc' ? 'asc' : ''} ${isActive ? 'active-blue' : ''}`} size={30} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="table-body">
            {ranked.map((row, idx) => (
              <div key={row.id || row.name || idx} className="table-rows">
                <div className="table-row1">
                  <div className="table-cell">{row.__rank}위</div>
                  <div className="table-cell player-name">{row.name}</div>
                </div>
                <div className="table-row2" style={{ '--cols': columns.length }}>
                  {columns.map((col) => (
                    <div key={col.key} className="table-cell">{fmt(col.key, row[col.key])}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

/* ───────── 메인: 모든 포지션 섹션을 ‘쫘르륵’ 출력 ───────── */
export default function CoachTeamPositions() {
  const { user } = useAuth();

  // 상단 드롭다운 1) 게임유형 2) 스탯유형
  const GAME_OPTIONS = [
    { value: '전체', label: '전체' },
    { value: '시즌', label: '시즌' },
    { value: '친선전', label: '친선전' },
  ];
  const CATEGORY_OPTIONS = [
    { value: 'pass', label: '패스' },
    { value: 'run', label: '런' },
    { value: '스페셜팀', label: '스페셜팀' },
  ];

  const [gameType, setGameType] = useState('전체');
  const [globalCategory, setGlobalCategory] = useState('전체');
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  // ✅ 목데이터로만 로드 (API 완전 주석/미사용)
  useEffect(() => {
    setLoading(true);
    setApiError('');
    // mockData: { QB: [...], RB: [...], ... } → 플랫 배열로 변환
    const flattened = Object.entries(mockData).flatMap(([pos, arr]) =>
      (arr || []).map((p) => ({
        ...p,
        position: p.position || pos,
        division: p.division || '1부',
      })),
    );
    setPlayers(flattened);
    setLoading(false);
  }, [gameType]); // 게임유형 바꿔도 지금은 목이라 그대로 — 트리거만 유지

  // 각 포지션에서 실제로 사용할 카테고리(글로벌 선택이 안 맞으면 포지션의 첫 카테고리로 대체)
  const categoryFor = (pos) => {
    if (globalCategory === '전체') return (POSITION_CATEGORIES[pos]?.[0]) || 'default';
    return POSITION_CATEGORIES[pos]?.includes(globalCategory)
      ? globalCategory
      : (POSITION_CATEGORIES[pos]?.[0] || 'default');
  };

  // 포지션별 데이터 분리
  const byPos = useMemo(() => {
    const g = {};
    POSITION_ORDER.forEach((p) => (g[p] = []));
    players.forEach((p) => { if (g[p.position]) g[p.position].push(p); });
    return g;
  }, [players]);

  return (
    <div className="stat-position">
      {/* 상단 필터: 게임유형 / 스탯유형 */}
      <div className="stat-header">
        <div className="stat-dropdown-group">
          <Dropdown
            label="game"
            placeholder="게임 유형"
            value={gameType}
            options={GAME_OPTIONS}
            onChange={setGameType}
          />
          <Dropdown
            label="category"
            placeholder="스탯 유형"
            value={globalCategory}
            options={CATEGORY_OPTIONS}
            onChange={setGlobalCategory}
          />
        </div>
      </div>


      {apiError && <p className="errorMessage" style={{ marginTop: 8 }}>⚠️ {apiError}</p>}
      {loading ? (
        <div style={{ padding: 16 }}>Loading...</div>
      ) : (
        <div className="team-stats-by-position">
          {POSITION_ORDER.map((pos) => {
            const rows = byPos[pos] || [];
            if (!rows.length) return null;
            const cat = categoryFor(pos);
            const primaryKey =
              (PRIMARY_METRIC[pos] && (PRIMARY_METRIC[pos][cat] || PRIMARY_METRIC[pos].default)) || null;
            return (
              <PositionSection
                key={pos}
                title={pos}
                rows={rows}
                categoryKey={cat}
                primaryKey={primaryKey}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
