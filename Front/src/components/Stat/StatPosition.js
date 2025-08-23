import React, {useMemo, useState, useEffect, useRef} from "react";
import {RxTriangleDown} from "react-icons/rx";
import {FaChevronDown} from "react-icons/fa";
import "./StatPosition.css";

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
          if (onTouch) onTouch(); // 터치 콜백 호출
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
                    setTouched(true); // 사용자가 실제로 선택함
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

const TEAM_TO_LEAGUE = {
  // 서울
  "연세대학교 이글스": "서울",
  "서울대학교 그린테러스": "서울",
  "한양대학교 라이온스": "서울",
  "국민대학교 레이저백스": "서울",
  "서울시립대학교 시티혹스": "서울",
  "한국외국어대학교 블랙나이츠": "서울",
  "건국대학교 레이징불스": "서울",
  "홍익대학교 카우보이스": "서울",
  "동국대학교 터스커스": "서울",
  "고려대학교 타이거스": "서울",
  "중앙대학교 블루드래곤스": "서울",
  "숭실대학교 크루세이더스": "서울",
  "서강대학교 알바트로스": "서울",
  "경희대학교 커맨더스": "서울",

  "강원대학교 카프라스": "경기강원",
  "단국대학교 코디악베어스": "경기강원",
  "성균관대학교 로얄스": "경기강원",
  "용인대학교 화이트타이거스": "경기강원",
  "인하대학교 틸 드래곤스": "경기강원",
  "한림대학교 피닉스": "경기강원",
  "한신대학교 킬러웨일스": "경기강원",

  // 대구경북
  "경북대학교 오렌지파이터스": "대구경북",
  "경일대학교 블랙베어스": "대구경북",
  "계명대학교 슈퍼라이온스": "대구경북",
  "금오공과대학교 레이븐스": "대구경북",
  "대구가톨릭대학교 스커드엔젤스": "대구경북",
  "대구대학교 플라잉타이거스": "대구경북",
  "대구한의대학교 라이노스": "대구경북",
  "동국대학교 화이트엘리펀츠": "대구경북",
  "영남대학교 페가수스": "대구경북",
  "한동대학교 홀리램스": "대구경북",

  // 부산경남(부울경)
  "경성대학교 드래곤스": "부산경남",
  "동서대학교 블루돌핀스": "부산경남",
  "동아대학교 레오파즈": "부산경남",
  "동의대학교 터틀파이터스": "부산경남",
  "부산대학교 이글스": "부산경남",
  "부산외국어대학교 토네이도": "부산경남",
  "신라대학교 데빌스": "부산경남",
  "울산대학교 유니콘스": "부산경남",
  "한국해양대학교 바이킹스": "부산경남",

  //"사회인
  "군위 피닉스": "사회인",
  "부산 그리폰즈": "사회인",
  "삼성 블루스톰": "사회인",
  "서울 골든이글스": "사회인",
  "서울 디펜더스": "사회인",
  "서울 바이킹스": "사회인",
  "인천 라이노스": "사회인",
};

const LEAGUE_OPTIONS = [
  ...Array.from(new Set(Object.values(TEAM_TO_LEAGUE))),
];

const DIVISION_OPTIONS = ["1부", "2부"];
const POSITION_OPTIONS = [
  "QB",
  "RB",
  "WR",
  "TE",
  "K",
  "P",
  "OL",
  "DL",
  "LB",
  "DB",
];

// "적을수록 좋은" 지표
const LOWER_IS_BETTER = new Set([
  "interceptions",
  "sacks",
  "fumbles",
  "fumbles_lost",
  "penalties",
  "sacks_allowed",
  "touchback_percentage", // 필요시
]);

// 포지션/카테고리별 기본(주황) 정렬 컬럼
const PRIMARY_METRIC = {
  QB: {pass: "passing_yards", run: "rushing_yards"},
  RB: {run: "rushing_yards", pass: "receiving_yards", ST: "kick_return_yards"},
  WR: {pass: "receiving_yards", run: "rushing_yards", ST: "kick_return_yards"},
  TE: {pass: "receiving_yards", run: "rushing_yards"},
  K: {ST: "field_goal_percentage"},
  P: {ST: "average_punt_yards"},
  OL: {default: "offensive_snaps_played"},
  DL: {default: "sacks"},
  LB: {default: "tackles"},
  DB: {defense: "interceptions", ST: "kick_return_yards"},
};
const POSITION_CATEGORIES = {
  QB: ["pass", "run"],
  RB: ["run", "pass", "ST"],
  WR: ["pass", "run", "ST"],
  TE: ["pass", "run"],
  K: ["ST"],
  P: ["ST"],
  OL: ["default"],
  DL: ["default"],
  LB: ["default"],
  DB: ["defense", "ST"],
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
    ST: [
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
    ST: [
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
    ST: [
      {key: "games", label: "경기 수"},
      {key: "extra_point_attempts", label: "PAT 시도 수"},
      {key: "extra_point_made", label: "PAT 성공 수"},
      {key: "field_goal", label: "필드골 성공-필드골 시도"},
      {key: "field_goal_percentage", label: "필드골 성공률"},
      {key: "field_goal_1_19", label: "1-19 야드 사이 성공"},
      {key: "field_goal_20_29", label: "20-29 야드 사이 성공"},
      {key: "field_goal_30_39", label: "30-39 야드 사이 성공"},
      {key: "field_goal_40_49", label: "40-49 야드 사이 성공"},
      {key: "field_goal_50_plus", label: "50 야드 이상 성공"},
      {key: "average_field_goal_length", label: "평균 필드골 거리"},
      {key: "longest_field_goal", label: "가장 긴 필드골 거리"},
    ],
  },
  P: {
    ST: [
      {key: "games", label: "경기 수"},
      {key: "punts", label: "펀트 수"},
      {key: "average_punt_yards", label: "평균 펀트 거리"},
      {key: "longest_punt", label: "가장 긴 펀트"},
      {key: "punt_yards", label: "펀트 야드"},
      {key: "touchback_percentage", label: "터치백 퍼센티지"},
      {key: "punts_inside_20", label: "20 야드 안쪽 펀트 퍼센티지"},
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
      {key: "sacks", label: "색 수"},
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
      {key: "sacks", label: "색 수"},
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
      {key: "sacks", label: "색 수"},
      {key: "forced_fumbles", label: "펌블 유도 수"},
      {key: "fumble_recovery", label: "펌블 리커버리 수"},
      {key: "fumble_recovered_yards", label: "펌블 리커버리 야드"},
      {key: "pass_defended", label: "패스를 막은 수"},
      {key: "interceptions", label: "인터셉션"},
      {key: "interception_yards", label: "인터셉션 야드"},
      {key: "touchdowns", label: "수비 터치다운"},
    ],
    ST: [
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
  const [leagueSelected, setLeagueSelected] = useState(false); // 리그 선택 여부 추적
  const categories = useMemo(
    ()=> POSITION_CATEGORIES[position] || ['default'],
    [position]
  );

  const showDivision = league !== "사회인" && leagueSelected;

  // 단일 정렬 상태: {key, direction} | null
  const [currentSort, setCurrentSort] = useState(null);

  // 포지션/카테고리 변경 시 기본(주황) 정렬 설정
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
  }, [category, position]);

  const currentColumns = statColumns[position]?.[category] || [];

  // 헤더 클릭 → 다른 컬럼이면 새로 desc 적용, 같은 컬럼이면 desc ↔ asc 토글
  const toggleSort = (key) => {
    setCurrentSort((prev) => {
      if (!prev || prev.key !== key) {
        // 새로운 컬럼 클릭
        return {key, direction: "desc"};
      }
      
      // 같은 컬럼 클릭 - desc와 asc 사이에서 토글
      return {key, direction: prev.direction === "desc" ? "asc" : "desc"};
    });
  };

  const sortedPlayers = useMemo(() => {
    const rows = data.filter((d) => {
      if (d.position !== position) return false;

      // 리그 필터 (TEAM_TO_LEAGUE로 팀-리그 매칭)
      const teamLeague = TEAM_TO_LEAGUE[d.team] || "";
      if (teamLeague !== league) return false;

      // 사회인은 디비전 무시, 그 외엔 디비전 일치
      if (league !== "사회인" && d.division !== division) return false;

      return true;
    });

    if (!currentSort) return rows;

    const {key, direction} = currentSort;
    
    return [...rows].sort((a, b) => {
      const av = a[key] ?? 0;
      const bv = b[key] ?? 0;
      const base = av < bv ? -1 : av > bv ? 1 : 0;
      const sign = direction === "asc" ? 1 : -1;
      const lowBetter = LOWER_IS_BETTER.has(key) ? -1 : 1;
      return base * sign * lowBetter;
    });
  }, [data, league, division, position, currentSort]);

  const rankedPlayers = useMemo(() => {
    if (!sortedPlayers.length || !currentSort) return sortedPlayers.map((r, i) => ({...r, __rank: i + 1}));

    const {key} = currentSort;
    let lastValue = null;
    let currentRank = 0;
    let seen = 0;

    return sortedPlayers.map((r) => {
      seen += 1;
      const currentValue = r[key] ?? 0;
      if (currentValue !== lastValue) currentRank = seen;
      lastValue = currentValue;
      return { ...r, __rank: currentRank };
    });
  }, [sortedPlayers, currentSort]);

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
            onTouch={() => setLeagueSelected(true)} // 리그 드롭다운을 터치하면 디비전 표시
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

      <div className="table-wrapper">
        <table className="stat-table">
          <thead className="table-head">
            <tr className="table-row">
              <div className="table-row1">
                <th className="table-header-cell rank-column">순위</th>
                <th className="table-header-cell player-column">선수 이름</th>
                <th className="table-header-cell team-logo"></th>
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
                    PRIMARY_METRIC[position]?.[category] === col.key;

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
                          className={`chev ${direction === "asc" ? "asc" : ""} ${isActive ? "active-blue" : ""}`}
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
              const rowClass = `table-rows ${division === '2부' ? 'is-division2' : ''}`;

              return (
                <tr key={row.id || row.name} className={`table-rows ${rowClass}`}>
                  <div className="table-row1">
                    <td className="table-cell">{row.__rank}위</td>
                    <td className="table-cell player-name clickable">
                      {row.name}
                    </td>
                    <td className="table-cell team-logo-cell">
                      {teamInfo?.logo && (
                        <div className="team-logo">
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
                    </td>
                    <td className="table-cell team-name">{row.team}</td>
                  </div>
                  <div
                    className="table-row2"
                    style={{"--cols": currentColumns.length}}
                  >
                    {currentColumns.map((col) => (
                      <td key={col.key} className="table-cell">
                        {typeof row[col.key] === "number" &&
                        row[col.key] % 1 !== 0
                          ? row[col.key].toFixed(1)
                          : row[col.key] ?? "0"}
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