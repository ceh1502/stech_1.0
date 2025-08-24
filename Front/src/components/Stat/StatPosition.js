// src/components/Stat/StatPosition.jsx
import React, {useMemo, useState, useEffect, useRef} from "react";
import {RxTriangleDown} from "react-icons/rx";
import {FaChevronDown} from "react-icons/fa";
import "./StatPosition.css";

/* ─────────────────────────  공통 드롭다운  ───────────────────────── */
function Dropdown({value, options, onChange, label, placeholder, onTouch}) {
  const [open, setOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="dropdown-container" ref={ref} aria-label={label}>
      <button
        type="button"
        className={`dropdown-trigger ${open ? "open" : ""} ${
          !touched ? "placeholder" : ""
        }`}
        onClick={() => {
          setOpen((o) => !o);
          if (onTouch) onTouch();
        }}
      >
        <span className="dropdown-text">
          {touched ? value : placeholder ?? value}
        </span>
        <FaChevronDown
          size={16}
          className={`dropdown-arrow ${open ? "rotated" : ""}`}
        />
      </button>

      {open && (
        <div className="dropdown-menu">
          <ul className="dropdown-list">
            {options.map((opt) => (
              <li key={opt}>
                <button
                  className={`dropdown-option ${
                    value === opt ? "selected" : ""
                  }`}
                  onClick={() => {
                    onChange(opt);
                    setTouched(true);
                    setOpen(false);
                  }}
                  role="option"
                  aria-selected={value === opt}
                >
                  {opt}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────  리그 매핑/옵션  ───────────────────────── */
const TEAM_TO_LEAGUE = {
  // 서울
  "연세대 이글스": "서울",
  "서울대 그린테러스": "서울",
  "한양대 라이온스": "서울",
  "한양대 라이온즈": "서울",
  "국민대 레이저백스": "서울",
  "서울시립대 시티혹스": "서울",
  "한국외국어대 블랙나이츠": "서울",
  "한국외대 블랙나이츠": "서울",
  "건국대 레이징불스": "서울",
  "홍익대 카우보이스": "서울",
  "동국대 터스커스": "서울",
  "고려대 타이거스": "서울",
  "중앙대 블루드래곤스": "서울",
  "숭실대 크루세이더스": "서울",
  "서강대 알바트로스": "서울",
  "경희대 커맨더스": "서울",

  // 경기강원
  "강원대 카프라스": "경기강원",
  "단국대 코디악베어스": "경기강원",
  "성균관대 로얄스": "경기강원",
  "용인대 화이트타이거스": "경기강원",
  "인하대 틸 드래곤스": "경기강원",
  "한림대 피닉스": "경기강원",
  "한신대 킬러웨일스": "경기강원",

  // 대구경북
  "경북대 오렌지파이터스": "대구경북",
  "경일대 블랙베어스": "대구경북",
  "계명대 슈퍼라이온스": "대구경북",
  "금오공과대 레이븐스": "대구경북",
  "대구가톨릭대 스커드엔젤스": "대구경북",
  "대구대 플라잉타이거스": "대구경북",
  "대구한의대 라이노스": "대구경북",
  "동국대 화이트엘리펀츠": "대구경북",
  "영남대 페가수스": "대구경북",
  "한동대 홀리램스": "대구경북",

  // 부산경남
  "경성대 드래곤스": "부산경남",
  "동서대 블루돌핀스": "부산경남",
  "동아대 레오파즈": "부산경남",
  "동의대 터틀파이터스": "부산경남",
  "부산대 이글스": "부산경남",
  "부산외국어대 토네이도": "부산경남",
  "신라대 데빌스": "부산경남",
  "울산대 유니콘스": "부산경남",
  "한국해양대 바이킹스": "부산경남",

  // 사회인
  "군위 피닉스": "사회인",
  "부산 그리폰즈": "사회인",
  "삼성 블루스톰": "사회인",
  "서울 골든이글스": "사회인",
  "서울 디펜더스": "사회인",
  "서울 바이킹스": "사회인",
  "인천 라이노스": "사회인",
};

const BACKEND_TO_FRONTEND_TEAM = {
  KKRagingBulls: "건국대 레이징불스",
  KHCommanders: "경희대 커맨더스",
  SNGreenTerrors: "서울대 그린테러스",
  USCityhawks: "서울시립대 시티혹스",
  DGTuskers: "동국대 터스커스",
  KMRazorbacks: "국민대 레이저백스",
  YSEagles: "연세대 이글스",
  KUTigers: "고려대 타이거스",
  HICowboys: "홍익대 카우보이스",
  SSCrusaders: "숭실대 크루세이더스",
  HYLions: "한양대 라이온스",
  HFBlackKnights: "한국외국어대 블랙나이츠",
};

const LEAGUE_OPTIONS = [...Array.from(new Set(Object.values(TEAM_TO_LEAGUE)))];
const DIVISION_OPTIONS = ["1부", "2부"];
const POSITION_OPTIONS = ["QB", "RB", "WR", "TE", "K", "P", "OL", "DL", "LB", "DB"];

/* ─────────────────────────  정렬/보조 유틸  ───────────────────────── */
// "적을수록 좋은" 지표
const LOWER_IS_BETTER = new Set([
  "interceptions",
  "sacks",
  "fumbles",
  "fumbles_lost",
  "penalties",
  "sacks_allowed",
  "touchback_percentage",
]);

// "A-B" 문자열(앞 숫자 큰 쪽이 상위) — 예: K.field_goal = "성공-시도"
const PAIR_FIRST_DESC = new Set(["field_goal"]);
const parsePair = (str) => {
  if (typeof str !== "string") return [0, 0];
  const [a, b] = str.split("-").map((n) => parseFloat(n) || 0);
  return [a, b];
};

/* 포지션/카테고리 기본 정렬 키(주황) */
const PRIMARY_METRIC = {
  QB: {pass: "passing_yards", run: "rushing_yards"},
  RB: {run: "rushing_yards", pass: "receiving_yards", 스페셜팀: "kick_return_yards"},
  WR: {pass: "receiving_yards", run: "rushing_yards", 스페셜팀: "kick_return_yards"},
  TE: {pass: "receiving_yards", run: "rushing_yards"},
  K: {스페셜팀: "field_goal_percentage"},
  P: {스페셜팀: "average_punt_yards"},
  OL: {default: "offensive_snaps_played"},
  DL: {default: "sacks"},
  LB: {default: "tackles"},
  DB: {defense: "interceptions", 스페셜팀: "kick_return_yards"},
};

const POSITION_CATEGORIES = {
  QB: ["pass", "run"],
  RB: ["run", "pass", "스페셜팀"],
  WR: ["pass", "run", "스페셜팀"],
  TE: ["pass", "run"],
  K: ["스페셜팀"],
  P: ["스페셜팀"],
  OL: ["default"],
  DL: ["default"],
  LB: ["default"],
  DB: ["defense", "스페셜팀"],
};

const statColumns = {
  QB: {
    pass: [
      {key: "games", label: "경기 수"},
      {key: "passing_attempts", label: "패스 시도 수"},
      {key: "pass_completions", label: "패스 성공 수"},
      {key: "completion_percentage", label: "패스 성공률"},
      {key: "passing_yards", label: "패싱 야드"},
      {key: "passing_td", label: "패싱 터치다운"},
      {key: "interceptions", label: "인터셉트"},
      {key: "longest_pass", label: "가장 긴 패스"},
      {key: "sacks", label: "경기 당 색 허용 수"},
    ],
    run: [
      {key: "games", label: "경기 수"},
      {key: "rushing_attempts", label: "러싱 시도 수"},
      {key: "rushing_yards", label: "러싱 야드"},
      {key: "yards_per_carry", label: "볼 캐리 당 러싱 야드"},
      {key: "rushing_td", label: "러싱 터치다운"},
      {key: "longest_rushing", label: "가장 긴 러싱 야드"},
    ],
  },
  RB: {
    run: [
      {key: "games", label: "경기 수"},
      {key: "rushing_attempts", label: "러싱 시도 수"},
      {key: "rushing_yards", label: "러싱 야드"},
      {key: "yards_per_carry", label: "볼 캐리 당 러싱 야드"},
      {key: "rushing_td", label: "러싱 터치다운"},
      {key: "longest_rushing", label: "가장 긴 러싱 야드"},
      {key: "fumbles", label: "펌블 수"},
      {key: "fumbles_lost", label: "펌블 턴오버 수"},
    ],
    pass: [
      {key: "games", label: "경기 수"},
      {key: "targets", label: "패스 타겟 수"},
      {key: "receptions", label: "패스 캐치 수"},
      {key: "receiving_yards", label: "리시빙 야드"},
      {key: "yards_per_catch", label: "캐치 당 리시빙 야드"},
      {key: "receiving_td", label: "리시빙 터치다운 수"},
      {key: "longest_reception", label: "가장 긴 리시빙 야드"},
      {key: "receiving_first_downs", label: "리시브 후 퍼스트 다운 수"},
      {key: "fumbles", label: "펌블 수"},
      {key: "fumbles_lost", label: "펌블 턴오버 수"},
    ],
    스페셜팀: [
      {key: "games", label: "경기 수"},
      {key: "kick_returns", label: "킥 리턴 시도 수"},
      {key: "kick_return_yards", label: "킥 리턴 야드"},
      {key: "yards_per_kick_return", label: "킥 리턴 시도 당 리턴 야드"},
      {key: "punt_returns", label: "펀트 리턴 시도 수"},
      {key: "punt_return_yards", label: "펀트 리턴 야드"},
      {key: "yards_per_punt_return", label: "펀트 리턴 시도 당 리턴 야드"},
      {key: "return_td", label: "리턴 터치다운"},
    ],
  },
  WR: {
    pass: [
      {key: "games", label: "경기 수"},
      {key: "targets", label: "패스 타겟 수"},
      {key: "receptions", label: "패스 캐치 수"},
      {key: "receiving_yards", label: "리시빙 야드"},
      {key: "yards_per_catch", label: "캐치당 리시빙 야드"},
      {key: "receiving_td", label: "리시빙 터치다운"},
      {key: "longest_reception", label: "가장 긴 리시빙 야드"},
      {key: "receiving_first_downs", label: "리시브 후 퍼스트 다운 수"},
      {key: "fumbles", label: "펌블 수"},
      {key: "fumbles_lost", label: "펌블 턴오버 수"},
    ],
    run: [
      {key: "games", label: "경기 수"},
      {key: "rushing_attempts", label: "러싱 시도 수"},
      {key: "rushing_yards", label: "러싱 야드"},
      {key: "yards_per_carry", label: "볼 캐리 당 러싱 야드"},
      {key: "rushing_td", label: "러싱 터치다운"},
      {key: "longest_rushing", label: "가장 긴 러싱 야드"},
      {key: "fumbles", label: "펌블 수"},
      {key: "fumbles_lost", label: "펌블 턴오버 수"},
    ],
    스페셜팀: [
      {key: "games", label: "경기 수"},
      {key: "kick_returns", label: "킥 리턴 시도 수"},
      {key: "kick_return_yards", label: "킥 리턴 야드"},
      {key: "yards_per_kick_return", label: "킥 리턴 시도 당 리턴 야드"},
      {key: "punt_returns", label: "펀트 리턴 시도 수"},
      {key: "punt_return_yards", label: "펀트 리턴 야드"},
      {key: "yards_per_punt_return", label: "펀트 리턴 시도 당 리턴 야드"},
      {key: "return_td", label: "리턴 터치다운"},
    ],
  },
  TE: {
    pass: [
      {key: "games", label: "경기 수"},
      {key: "targets", label: "패스 타겟 수"},
      {key: "receptions", label: "패스 캐치 수"},
      {key: "receiving_yards", label: "리시빙 야드"},
      {key: "yards_per_catch", label: "캐치 당 리시빙 야드"},
      {key: "receiving_td", label: "리시빙 터치다운"},
      {key: "longest_reception", label: "가장 긴 리시빙 야드"},
      {key: "fumbles", label: "펌블 수"},
      {key: "fumbles_lost", label: "펌블 턴오버 수"},
    ],
    run: [
      {key: "games", label: "경기 수"},
      {key: "rushing_attempts", label: "러싱 시도 수"},
      {key: "rushing_yards", label: "러싱 야드"},
      {key: "yards_per_carry", label: "볼 캐리 당 러싱 야드"},
      {key: "rushing_td", label: "러싱 터치다운"},
      {key: "longest_rushing", label: "가장 긴 러싱 야드"},
      {key: "fumbles", label: "펌블 수"},
      {key: "fumbles_lost", label: "펌블 턴오버 수"},
    ],
  },
  K: {
    스페셜팀: [
      {key: "games", label: "경기 수"},
      {key: "extra_point_attempts", label: "PAT 시도 수"},
      {key: "extra_point_made", label: "PAT 성공 수"},
      {key: "field_goal", label: "필드골 성공-필드골 시도"},
      {key: "field_goal_percentage", label: "필드골 성공률"},
      {key: "field_goal_1_19", label: "1-19"},
      {key: "field_goal_20_29", label: "20-29"},
      {key: "field_goal_30_39", label: "30-39"},
      {key: "field_goal_40_49", label: "40-49"},
      {key: "field_goal_50_plus", label: "50+"},
      {key: "average_field_goal_length", label: "평균 필드골 거리"},
      {key: "longest_field_goal", label: "가장 긴 필드골 거리"},
    ],
  },
  P: {
    스페셜팀: [
      {key: "games", label: "경기 수"},
      {key: "punts", label: "펀트 수"},
      {key: "average_punt_yards", label: "평균 펀트 거리"},
      {key: "longest_punt", label: "가장 긴 펀트"},
      {key: "punt_yards", label: "펀트 야드"},
      {key: "touchback_percentage", label: "터치백 %"},
      {key: "punts_inside_20", label: "20 야드 안쪽 펀트 %"},
    ],
  },
  OL: {
    default: [
      {key: "offensive_snaps_played", label: "공격 플레이 스냅 참여 수"},
      {key: "penalties", label: "반칙 수"},
      {key: "sacks_allowed", label: "색 허용 수"},
    ],
  },
  DL: {
    default: [
      {key: "games", label: "경기 수"},
      {key: "tackles", label: "태클 수"},
      {key: "TFL", label: "TFL"},
      {key: "sacks", label: "색"},
      {key: "forced_fumbles", label: "펌블 유도 수"},
      {key: "fumble_recovery", label: "펌블 리커버리 수"},
      {key: "fumble_recovered_yards", label: "펌블 리커버리 야드"},
      {key: "pass_defended", label: "패스를 막은 수"},
      {key: "interceptions", label: "인터셉션"},
      {key: "interception_yards", label: "인터셉션 야드"},
      {key: "touchdowns", label: "수비 터치다운"},
    ],
  },
  LB: {
    default: [
      {key: "games", label: "경기 수"},
      {key: "tackles", label: "태클 수"},
      {key: "TFL", label: "TFL"},
      {key: "sacks", label: "색 "},
      {key: "forced_fumbles", label: "펌블 유도 수"},
      {key: "fumble_recovery", label: "펌블 리커버리 수"},
      {key: "fumble_recovered_yards", label: "펌블 리커버리 야드"},
      {key: "pass_defended", label: "패스를 막은 수"},
      {key: "interceptions", label: "인터셉션"},
      {key: "interception_yards", label: "인터셉션 야드"},
      {key: "touchdowns", label: "수비 터치다운"},
    ],
  },
  DB: {
    defense: [
      {key: "games", label: "경기 수"},
      {key: "tackles", label: "태클 수"},
      {key: "TFL", label: "TFL"},
      {key: "sacks", label: "색 "},
      {key: "forced_fumbles", label: "펌블 유도 수"},
      {key: "fumble_recovery", label: "펌블 리커버리 수"},
      {key: "fumble_recovered_yards", label: "펌블 리커버리 야드"},
      {key: "pass_defended", label: "패스를 막은 수"},
      {key: "interceptions", label: "인터셉션"},
      {key: "interception_yards", label: "인터셉션 야드"},
      {key: "touchdowns", label: "수비 터치다운"},
    ],
    스페셜팀: [
      {key: "games", label: "경기 수"},
      {key: "kick_returns", label: "킥 리턴 시도 수"},
      {key: "kick_return_yards", label: "킥 리턴 야드"},
      {key: "yards_per_kick_return", label: "킥 리턴 시도 당 리턴 야드"},
      {key: "punt_returns", label: "펀트 리턴 시도 수"},
      {key: "punt_return_yards", label: "펀트 리턴 야드"},
      {key: "yards_per_punt_return", label: "펀트 리턴 시도 당 리턴 야드"},
      {key: "return_td", label: "리턴 터치다운"},
    ],
  },
};

export default function StatPosition({data, teams = []}) {
  const [league, setLeague] = useState("서울");
  const [division, setDivision] = useState("1부");
  const [position, setPosition] = useState("QB");
  const [category, setCategory] = useState("pass");
  const [leagueSelected, setLeagueSelected] = useState(false);
  const categories = useMemo(
    () => POSITION_CATEGORIES[position] || ["default"],
    [position]
  );

  const showDivision = league !== "사회인" && leagueSelected;
  const [currentSort, setCurrentSort] = useState(null);

  useEffect(() => {
    const nextCategory = categories.includes(category)
      ? category
      : categories[0];
    setCategory(nextCategory);

    const baseKey =
      PRIMARY_METRIC[position]?.[nextCategory] ??
      PRIMARY_METRIC[position]?.default;
    if (baseKey) {
      setCurrentSort({key: baseKey, direction: "desc"});
    } else {
      setCurrentSort(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  useEffect(() => {
    const safeCategory = categories.includes(category)
      ? category
      : categories[0];
    if (safeCategory !== category) setCategory(safeCategory);

    const baseKey =
      PRIMARY_METRIC[position]?.[safeCategory] ??
      PRIMARY_METRIC[position]?.default;
    if (baseKey) {
      setCurrentSort({key: baseKey, direction: "desc"});
    } else {
      setCurrentSort(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const currentColumns = statColumns[position]?.[category] || [];

  const toggleSort = (key) => {
    setCurrentSort((prev) => {
      if (!prev || prev.key !== key) return {key, direction: "desc"};
      return {key, direction: prev.direction === "desc" ? "asc" : "desc"};
    });
  };

  const sortedPlayers = useMemo(() => {
    // ✅ 목 데이터 사용: 팀명 매핑 미사용
    // const mappedData = data.map((d) => ({
    //   ...d,
    //   team: BACKEND_TO_FRONTEND_TEAM[d.team] || d.team,
    // }));
    const mappedData = data;

    const rows = mappedData.filter((d) => {
      if (d.position !== position) return false;
      const teamLeague = TEAM_TO_LEAGUE[d.team] || "";
      if (teamLeague !== league) return false;
      if (league !== "사회인" && d.division !== division) return false;
      return true;
    });

    if (!currentSort) return rows;

    const {key, direction} = currentSort;

    return [...rows].sort((a, b) => {
      // ── "A-B" 문자열(앞 숫자 우선) ──
      if (PAIR_FIRST_DESC.has(key)) {
        const [a1, a2] = parsePair(a[key] ?? "0-0");
        const [b1, b2] = parsePair(b[key] ?? "0-0");
        const prefSign = LOWER_IS_BETTER.has(key) ? 1 : -1; // 낮을수록 좋으면 뒤집기
        const dirSign = direction === "asc" ? -1 : 1;
        const d1 = (a1 - b1) * prefSign * dirSign;
        if (d1 !== 0) return d1;
        const d2 = (a2 - b2) * prefSign * dirSign;
        return d2;
      }

      // ── 일반 숫자 ──
      const av = a[key] ?? 0;
      const bv = b[key] ?? 0;
      const base = av < bv ? -1 : av > bv ? 1 : 0;
      const sign = direction === "asc" ? 1 : -1;
      const lowBetter = LOWER_IS_BETTER.has(key) ? -1 : 1;
      return base * sign * lowBetter;
    });
  }, [data, league, division, position, currentSort]);

  const rankedPlayers = useMemo(() => {
    if (!sortedPlayers.length || !currentSort)
      return sortedPlayers.map((r, i) => ({...r, __rank: i + 1}));

    const {key} = currentSort;

    const valueOf = (row) => {
      if (PAIR_FIRST_DESC.has(key)) {
        const [x, y] = parsePair(row[key] ?? "0-0");
        return `${x}|${y}`;
      }
      return row[key] ?? 0;
    };

    let lastValue = null;
    let currentRank = 0;
    let seen = 0;

    return sortedPlayers.map((r) => {
      seen += 1;
      const currentValue = valueOf(r);
      if (currentValue !== lastValue) currentRank = seen;
      lastValue = currentValue;
      return {...r, __rank: currentRank};
    });
  }, [sortedPlayers, currentSort]);

  // 값 포맷(퍼센트/소수점)
  const fmt = (key, v) => {
    if (typeof v === "number") {
      const isPct = String(key).toLowerCase().includes("percentage");
      return isPct ? `${v.toFixed(1)}%` : v % 1 !== 0 ? v.toFixed(1) : v;
    }
    return v ?? "0";
  };

  return (
    <div className="stat-position">
      {/* 드롭다운들 */}
      <div className="stat-header">
        <div className="stat-dropdown-group">
          <Dropdown
            label="League"
            placeholder="리그"
            value={league}
            options={LEAGUE_OPTIONS}
            onChange={(v) => {
              setLeague(v);
            }}
            onTouch={() => setLeagueSelected(true)}
          />
          {showDivision && (
            <Dropdown
              label="Division"
              placeholder="디비전"
              value={division}
              options={DIVISION_OPTIONS}
              onChange={setDivision}
            />
          )}
          <Dropdown
            label="Position"
            placeholder="포지션"
            value={position}
            options={POSITION_OPTIONS}
            onChange={(v) => setPosition(v)}
          />

          {categories.length > 1 && (
            <Dropdown
              label="Category"
              placeholder="유형"
              value={category}
              options={categories}
              onChange={(v) => setCategory(v)}
            />
          )}
        </div>
      </div>

      <div className="table-header">
        <div className="table-title">포지션별 선수 순위</div>
      </div>

      {/* ▼▼▼ 렌더 구조 유지 ▼▼▼ */}
      <div className="table-wrapper">
        <table className="stat-table">
          <thead className="table-head">
            <tr className="table-row">
              <div className="table-row1">
                <th className="table-header-cell rank-column">순위</th>
                <th className="table-header-cell player-column">선수 이름</th>
                <th className="table-header-cell team-column">소속팀</th>
              </div>
              <div
                className="table-row2"
                style={{"--cols": currentColumns.length}}
              >
                {currentColumns.map((col) => {
                  const isActive = currentSort && currentSort.key === col.key;
                  const direction = isActive ? currentSort.direction : null;
                  const isPrimary =
                    PRIMARY_METRIC[position]?.[category] === col.key ||
                    PRIMARY_METRIC[position]?.default === col.key;

                  return (
                    <th
                      key={col.key}
                      className={`table-header-cell stat-column sortable
                      ${isActive ? "active-blue" : ""}
                      ${isPrimary && !isActive ? "primary-orange" : ""}
                    `}
                    >
                      <button
                        type="button"
                        className={`sort-toggle one ${direction ?? "none"}`}
                        onClick={() => toggleSort(col.key)}
                        title={
                          direction
                            ? `정렬: ${
                                direction === "desc" ? "내림차순" : "오름차순"
                              }`
                            : "정렬 적용"
                        }
                      >
                        <span className="column-label">{col.label}</span>
                        <RxTriangleDown
                          className={`chev ${
                            direction === "asc" ? "asc" : ""
                          } ${isActive ? "active-blue" : ""}`}
                          size={30}
                        />
                      </button>
                    </th>
                  );
                })}
              </div>
            </tr>
          </thead>

          <tbody className="table-body">
            {rankedPlayers.map((row, idx) => {
              const teamInfo = teams.find((t) => t.name === row.team);
              const rowClass = `table-rows ${
                division === "2부" ? "is-division2" : ""
              }`;

              return (
                <tr
                  key={row.id || row.name || idx}
                  className={`table-rows ${rowClass}`}
                >
                  <div className="table-row1">
                    <td className="table-cell">{row.__rank}위</td>
                    <td className="table-cell player-name clickable">
                      {row.name}
                    </td>

                    <td className="table-cell team-name">
                      {teamInfo?.logo && (
                        <div className='team-logo'>
                          <img
                            src={teamInfo.logo}
                            alt={`${row.team} 로고`}
                            className={`team-logo-img ${
                              teamInfo.logo.endsWith(".svg")
                                ? "svg-logo"
                                : "png-logo"
                            }`}
                          />
                        </div>
                      )}
                      <span>{row.team}</span>
                    </td>
                  </div>

                  <div
                    className="table-row2"
                    style={{"--cols": currentColumns.length}}
                  >
                    {currentColumns.map((col) => (
                      <td key={col.key} className="table-cell">
                        {fmt(col.key, row[col.key])}
                      </td>
                    ))}
                  </div>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
