// StatTeam.jsx
import React, {useMemo, useState, useEffect, useRef} from "react";
import {RxTriangleDown} from "react-icons/rx";
import {FaChevronDown} from "react-icons/fa";
import "./StatTeam.css";

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
  "국민대 레이저백스": "서울",
  "서울시립대 시티혹스": "서울",
  "한국외국어대 블랙나이츠": "서울",
  "건국대 레이징불스": "서울",
  "홍익대 카우보이스": "서울",
  "동국대 터스커스": "서울",
  "고려대 타이거스": "서울",
  "중앙대 블루드래곤스": "서울",
  "숭실대 크루세이더스": "서울",
  "서강대 알바트로스": "서울",
  "경희대 커맨더스": "서울",
  // 경기·강원
  "강원대 카프라스": "경기강원",
  "단국대 코디악베어스": "경기강원",
  "성균관대 로얄스": "경기강원",
  "용인대 화이트타이거스": "경기강원",
  "인하대 틸 드래곤스": "경기강원",
  "한림대 피닉스": "경기강원",
  "한신대 킬러웨일스": "경기강원",
  // 대구·경북
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
  // 부산·경남
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

const LEAGUE_OPTIONS = [...Array.from(new Set(Object.values(TEAM_TO_LEAGUE)))];
const DIVISION_OPTIONS = ["1부", "2부"];
const PLAY_TYPES = ["득점/경기", "run", "pass", "스페셜팀", "기타"]; // ← 유형 드롭다운

/* ─────────────────────────  정렬/컬럼 정의  ───────────────────────── */
const LOWER_IS_BETTER = new Set([
  "interceptions",
  "sacks",
  "fumbles",
  "fumbles_lost",
  "penalties",
  "sacks_allowed",
  "touchback_percentage",
  "fumble-turnover",
  "turnover_per_game",
  "turnover_rate",
  "penalty-pen_yards",
  "pen_yards_per_game",
]);
// "A-B" 형태로 표시되는 컬럼들: 앞 숫자(A)로 정렬
const PAIR_FIRST_DESC = new Set([
  "pass_completions-attempts",
  "field_goal_completions-attempts",
  "fumble-turnover",
  "penalty-pen_yards",
]);

// "10-22" 같은 쌍 값을 파싱
const parsePair = (str) => {
  if (typeof str !== "string") return [0, 0];
  const [a, b] = str.split("-").map((n) => parseFloat(n) || 0);
  return [a, b];
};

// 정렬 비교에 쓸 숫자 값으로 변환
const getSortValue = (row, key) => {
  const v = row?.[key];
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    switch (key) {
      case "pass_completions-attempts": {
        const [c, a] = parsePair(v); // 성공/시도 → 성공률
        return a > 0 ? c / a : 0;
      }
      case "field_goal_completions-attempts": {
        const [m, a] = parsePair(v); // 성공/시도 → 성공률
        return a > 0 ? m / a : 0;
      }
      case "fumble-turnover": {
        const [, t] = parsePair(v); // 턴오버 개수
        return t;
      }
      case "penalty-pen_yards": {
        const [, y] = parsePair(v); // 페널티 야드
        return y;
      }
      default:
        return parseFloat(v) || 0;
    }
  }
  return 0;
};
// 백엔드 팀명을 프론트엔드 팀명으로 매핑
const BACKEND_TO_FRONTEND_TEAM = {
  // 기존 매핑
  한양대: "한양대 라이온스",
  외대: "한국외국어대 블랙나이츠",
  "한양대 라이온즈": "한양대 라이온스",
  "한국외대 블랙나이츠": "한국외국어대 블랙나이츠",
  HYLions: "한양대 라이온스",
  HFBlackKnights: "한국외국어대 블랙나이츠",

  // 새로운 백엔드 팀 코드명 매핑 (10개 대학)
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
};

// 카테고리별 기본 정렬 키
const PRIMARY_TEAM_METRIC = {
  "득점/경기": "total_yards",
  pass: "pass_completions-attempts",
  run: "rushing_attempts",
  스페셜팀: "total_return_yards",
  기타: "turnover_per_game",
};

// 테이블 컬럼
const TEAM_COLUMNS = {
  // 시즌 요약(종합)
  "득점/경기": [
    {key: "points_per_game", label: "경기당 평균 득점"},
    {key: "total_points", label: "총 득점"},
    {key: "total_touchdowns", label: "총 터치다운"},
    {key: "total_yards", label: "총 전진야드"},
    {key: "yards_per_game", label: "경기당 전진 야드"},
  ],
  // 러시
  run: [
    {key: "rushing_attempts", label: "러싱 시도"},
    {key: "rushing_yards", label: "러싱 야드"},
    {key: "yards_per_carry", label: "볼 캐리 당 러싱 야드"},
    {key: "rushing_yards_per_game", label: "경기당 러싱 야드"},
    {key: "rushing_td", label: "러싱 터치다운"},
  ],
  // 패스
  pass: [
    {key: "pass_completions-attempts", label: "패스 성공-패스 시도"},
    {key: "passing_yards", label: "패싱 야드"},
    {
      key: "passing_yards_per_passing_attempts",
      label: "패스 시도 당 패스 야드",
    },
    {key: "passing_yards_per_game", label: "경기당 패스 야드"},
    {key: "passing_td", label: "패스 터치다운"},
    {key: "interceptions", label: "인터셉트"},
  ],
  // 스페셜팀(킥/펀트/리턴 통합)
  스페셜팀: [
    {key: "total_punt_yards", label: "총 펀트 야드"},
    {key: "average_punt_yards", label: "평균 펀트 야드"},
    {key: "touchback_percentage", label: "터치백 퍼센티지"},

    {key: "field_goal_completions-attempts", label: "필드골 성공-총 시도"},
    {key: "yards_per_kick_return", label: "평균 킥 리턴 야드"},

    {key: "yards_per_punt_return", label: "평균 펀트 리턴 야드"},
    {key: "total_return_yards", label: "총 리턴 야드"},
  ],
  기타: [
    {key: "fumble-turnover", label: "펌블 수-펌블 턴오버 수"},
    {key: "turnover_per_game", label: "경기 당 턴오버 수"},
    {key: "turnover_rate", label: "턴오버 비율"},
    {key: "penalty-pen_yards", label: "총 페널티 수-총 페널티 야드"},
    {key: "pen_yards_per_game", label: "경기 당 페널티 야드"},
  ],
};

export default function StatTeam({data, teams = []}) {
  const [league, setLeague] = useState("서울");
  const [division, setDivision] = useState("1부");
  const [playType, setPlayType] = useState("득점/경기");
  const [leagueSelected, setLeagueSelected] = useState(false); // 리그 선택 여부 추적

  const showDivision = league !== "사회인" && leagueSelected;
  const currentColumns = TEAM_COLUMNS[playType] || [];

  // 단일 정렬 상태: {key, direction} | null
  const [currentSort, setCurrentSort] = useState(null);

  // 유형 바뀌면 기본 정렬 리셋
  useEffect(() => {
    const baseKey = PRIMARY_TEAM_METRIC[playType];
    if (baseKey) {
      setCurrentSort({key: baseKey, direction: "desc"});
    } else {
      setCurrentSort(null);
    }
  }, [playType]);

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

  // 필터 + 파생지표 계산 + 정렬
  const sortedTeams = useMemo(() => {
    const source = Array.isArray(data) ? data : []; // ✅ safety guard

    // 백엔드 응답을 프론트엔드 컴포넌트가 기대하는 형태로 변환
    // const mappedData = source.map(item => ({
    //     team: BACKEND_TO_FRONTEND_TEAM[item.teamName] || item.teamName, // 팀명 매핑
    //     division: "1부", // 기본값 (실제로는 팀별로 설정 필요)

    //     // 득점/경기 관련
    //     points_per_game: item.pointsPerGame,
    //     total_points: item.totalPoints,
    //     total_touchdowns: item.totalTouchdowns,
    //     total_yards: item.totalYards,
    //     yards_per_game: item.yardsPerGame,

    //     // 러시 관련
    //     rushing_attempts: item.rushingAttempts,
    //     rushing_yards: item.rushingYards,
    //     yards_per_carry: item.yardsPerCarry,
    //     rushing_yards_per_game: item.rushingYardsPerGame,
    //     rushing_td: item.rushingTouchdowns,

    //     // 패스 관련
    //     "pass_completions-attempts": item.passCompletionAttempts,
    //     passing_yards: item.passingYards,
    //     passing_yards_per_passing_attempts: item.yardsPerPassAttempt,
    //     passing_yards_per_game: item.passingYardsPerGame,
    //     passing_td: item.passingTouchdowns,
    //     interceptions: item.interceptions,

    //     // 스페셜팀 관련
    //     total_punt_yards: item.totalPuntYards,
    //     average_punt_yards: item.averagePuntYards,
    //     touchback_percentage: item.puntTouchbackPercentage,
    //     "field_goal_completions-attempts": item.fieldGoalStats,
    //     yards_per_kick_return: item.averageKickReturnYards,
    //     yards_per_punt_return: item.averagePuntReturnYards,
    //     total_return_yards: item.totalReturnYards,

    //     // 기타
    //     "fumble-turnover": item.fumbleStats,
    //     turnover_per_game: item.turnoversPerGame,
    //     turnover_rate: item.turnoversPerGame, // 같은 값 사용
    //     "penalty-pen_yards": item.penaltyStats,
    //     pen_yards_per_game: item.penaltyYardsPerGame,

    //     // 기본 정보
    //     id: item.teamName,
    //     season: item.season,
    //     gamesPlayed: item.gamesPlayed
    // }));

    const rows = source.filter((d) => {
      if (league !== "전체") {
        const teamLeague = TEAM_TO_LEAGUE[d.team] || "";
        if (teamLeague !== league) return false;
      }
      if (league !== "사회인" && d.division !== division) return false;
      return true;
    });
    if (!currentSort) return rows;

    const {key, direction} = currentSort;
    const cmp = (a, b) => {
    if (PAIR_FIRST_DESC.has(key)) {
    const [a1, a2] = parsePair(a[key] ?? "0-0");    
    const [b1, b2] = parsePair(b[key] ?? "0-0");
    // 낮을수록 좋은 지표면 prefSign=+1, 클수록 좋으면 -1
    const prefSign = LOWER_IS_BETTER.has(key) ? 1 : -1;
    // asc 클릭 시 뒤집기
    const dirSign  = direction === "asc" ? -1 : 1;
    const d1 = (a1 - b1) * prefSign * dirSign;
    if (d1 !== 0) return d1;
    const d2 = (a2 - b2) * prefSign * dirSign;
    return d2;
  }
      const av = getSortValue(a, key);
      const bv = getSortValue(b, key);
      if (av === bv) return 0;
      // 낮을수록 좋은 지표는 비교 방향 반전
      let diff = av - bv;
      if (LOWER_IS_BETTER.has(key)) diff = -diff;
      return direction === "asc" ? diff : -diff;
    };
    return [...rows].sort(cmp);
  }, [data, league, division, currentSort]);

  // 동순위 처리
  const rankedTeams = useMemo(() => {
    if (!sortedTeams.length || !currentSort)
      return sortedTeams.map((r, i) => ({...r, __rank: i + 1}));

    const {key} = currentSort;
    let lastValue = null;
    let currentRank = 0;
    let seen = 0;

    return sortedTeams.map((r) => {
      seen += 1;
      const currentValue = r[key] ?? 0;
      if (currentValue !== lastValue) currentRank = seen;
      lastValue = currentValue;
      return {...r, __rank: currentRank};
    });
  }, [sortedTeams, currentSort]);

  return (
    <div className="stat-position">
      {/* 필터 드롭다운 */}
      <div className="stat-header">
        <div className="stat-dropdown-group">
          <Dropdown
            label="League"
            placeholder="리그"
            value={league}
            options={LEAGUE_OPTIONS}
            onChange={setLeague}
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
            label="PlayType"
            placeholder="유형"
            value={playType}
            options={PLAY_TYPES}
            onChange={setPlayType}
          />
        </div>
      </div>

      <div className="table-header">
        <div className="table-title">팀 순위</div>
      </div>

      <div className="table-wrapper">
        <table className="stat-table">
          <thead className="table-head">
            <tr className="table-row">
              <div className="team-table-row1">
                <th className="team-table-header-cell rank-column">순위</th>
                <th className="team-table-header-cell team-column">팀</th>
              </div>
              <div
                className="team-table-row2"
                style={{"--cols": currentColumns.length}}
              >
                {currentColumns.map((col) => {
                  const isActive = currentSort && currentSort.key === col.key;
                  const direction = isActive ? currentSort.direction : null;
                  const isPrimary = PRIMARY_TEAM_METRIC[playType] === col.key;
                  return (
                    <th
                      key={col.key}
                      className={`team-table-header-cell stat-column sortable
                        ${isActive ? "active-blue" : ""}
                        ${isPrimary && !isActive ? "primary-orange" : ""}`}
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
                          className={`chev ${direction === "asc" ? "asc" : ""} ${isActive? "active-blue": ""}`}
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
            {rankedTeams.map((row) => {
              const teamInfo = teams.find((t) => t.name === row.team);
              const isSecondDiv =
                league === "사회인"
                  ? row.division === "2부"
                  : division === "2부";
              return (
                <tr
                  key={row.id || row.team}
                  className={`team-table-rows ${isSecondDiv ? "is-division2" : ""}`}
                >
                  <div className="team-table-row1">
                    <td className="team-table-cell">{row.__rank}위</td>
     
                    <td className="team-table-cell team-name">{teamInfo?.logo && (
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
                      )}<span>{row.team}</span></td>
                  </div>
                  <div
                    className="team-table-row2"
                    style={{"--cols": currentColumns.length}}
                  >
                    {currentColumns.map((col) => {
                      const v = row[col.key];
                      if (typeof v === "number") {
                        const isPct = String(col.key).includes("percentage");
                        const shown =
                          v % 1 !== 0 || isPct
                            ? isPct
                              ? `${v.toFixed(1)}`
                              : v.toFixed(1)
                            : v;
                        return (
                          <td key={col.key} className="team-table-cell">
                            {shown}
                          </td>
                        );
                      }
                      return (
                        <td key={col.key} className="team-table-cell">
                          {v ?? "0"}
                        </td>
                      );
                    })}
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

