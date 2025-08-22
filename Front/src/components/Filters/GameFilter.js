import React, {useMemo, useRef, useEffect, useState} from "react";
// import './GameFilter.css';
import {FaChevronDown} from "react-icons/fa";
import CalendarDropdown from "../Calendar.jsx";

const TEAM_TO_LEAGUE = {
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
  "경성대학교 드래곤스": "부산경남",
  "동서대학교 블루돌핀스": "부산경남",
  "동아대학교 레오파즈": "부산경남",
  "동의대학교 터틀파이터스": "부산경남",
  "부산대학교 이글스": "부산경남",
  "부산외국어대학교 토네이도": "부산경남",
  "신라대학교 데빌스": "부산경남",
  "울산대학교 유니콘스": "부산경남",
  "한국해양대학교 바이킹스": "부산경남",
  "군위 피닉스": "사회인",
  "부산 그리폰즈": "사회인",
  "삼성 블루스톰": "사회인",
  "서울 골든이글스": "사회인",
  "서울 디펜더스": "사회인",
  "서울 바이킹스": "사회인",
  "인천 라이노스": "사회인",
};

const TYPES = ["Scrimmage", "Friendly match", "Season"];

const GameFilter = ({teams = [], api}) => {
  const {
    date,
    type,
    opponent,
    setDate,
    setType,
    setOpponent,
    clearAllFilters,
    activeFilters,
    removeFilter,
  } = api;

  const dateWrapRef = useRef(null);
  const typeWrapRef = useRef(null);
  const oppsWrapRef = useRef(null);
  const [showDate, setShowDate] = useState(false);
  const [showType, setShowType] = useState(false);
  const [showOpps, setShowOpps] = useState(false);
  const [activeLeague, setActiveLeague] = useState(null);

  useEffect(() => {
    const out = (e) => {
      const isIn = (ref) => ref.current && ref.current.contains(e.target);
      if (!isIn(dateWrapRef)) setShowDate(false);
      if (!isIn(typeWrapRef)) setShowType(false);
      if (!isIn(oppsWrapRef)) setShowOpps(false);
    };
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
  }, []);

  const teamsByLeague = useMemo(() => {
    const m = {};
    teams.forEach((t) => {
      const lg = TEAM_TO_LEAGUE[t.name] || "기타";
      (m[lg] ||= []).push(t);
    });
    return m;
  }, [teams]);

  const leaguesList = useMemo(() => {
    const base = ["서울", "경기강원", "대구경북", "부산경남", "사회인"];
    const keys = Object.keys(teamsByLeague);
    const extras = keys.filter((k) => !base.includes(k)).sort();
    return [...base.filter((k) => keys.includes(k)), ...extras];
  }, [teamsByLeague]);

  useEffect(() => {
    if (showOpps) {
      setActiveLeague((cur) =>
        cur && teamsByLeague[cur]?.length ? cur : leaguesList[0]
      );
    }
  }, [showOpps, leaguesList, teamsByLeague]);

  return (
    <div className="game-filter-bar">
      {/* 날짜 */}
      <div className="gf-item" ref={dateWrapRef}>
        <button
          className={`gf-btn ${showDate || date ? "active" : ""}`}
          onClick={() => setShowDate((v) => !v)}
        >
          {date ? date.format("YYYY-MM-DD") : "날짜"}{" "}
          <FaChevronDown size={12} />
        </button>
        {showDate && (
          <CalendarDropdown
            value={date}
            onChange={(d) => {
              setDate(d);
              setShowDate(false);
            }}
          />
        )}
      </div>

      {/* 유형 */}
      <div className="gf-item" ref={typeWrapRef}>
        <button
          className={`gf-btn ${type ? "active" : ""}`}
          onClick={() => setShowType((v) => !v)}
        >
          {type || "유형"} <FaChevronDown size={12} />
        </button>
        {showType && (
          <ul className="gf-dd">
            {TYPES.map((t) => (
              <li key={t}>
                <button
                  className={`gf-dd-item ${type === t ? "selected" : ""}`}
                  onClick={() => {
                    setType(t);
                    setShowType(false);
                  }}
                >
                  {t}
                </button>
              </li>
            ))}
            <li>
              <button
                className="gf-dd-item"
                onClick={() => {
                  setType(null);
                  setShowType(false);
                }}
              >
                전체
              </button>
            </li>
          </ul>
        )}
      </div>

      {/* 상대 (리그 → 팀) */}
      <div className="gf-item" ref={oppsWrapRef}>
        <button
          className={`gf-btn ${opponent ? "active" : ""}`}
          onClick={() => setShowOpps((v) => !v)}
        >
          {opponent ? opponent.name : "상대"} <FaChevronDown size={12} />
        </button>
        {showOpps && (
          <div className="gf-mega">
            <ul className="gf-mega-left">
              {leaguesList.map((lg) => (
                <li key={lg}>
                  <button
                    className={`gf-league ${
                      activeLeague === lg ? "active" : ""
                    }`}
                    onMouseEnter={() => setActiveLeague(lg)}
                    onFocus={() => setActiveLeague(lg)}
                    onClick={() => setActiveLeague(lg)}
                  >
                    {lg}
                  </button>
                </li>
              ))}
            </ul>
            <ul className="gf-mega-right">
              {(teamsByLeague[activeLeague] || []).map((t) => (
                <li key={t.name}>
                  <button
                    className="gf-team"
                    onClick={() => {
                      setOpponent(t);
                      setShowOpps(false);
                    }}
                  >
                    {t.logo && (
                      <img
                        src={t.logo}
                        alt={t.name}
                        className={`gf-team-logo ${
                          t.logo.endsWith(".svg") ? "svg" : "png"
                        }`}
                      />
                    )}
                    {t.name}
                  </button>
                </li>
              ))}
              {(!activeLeague ||
                (teamsByLeague[activeLeague] || []).length === 0) && (
                <li className="gf-empty">해당 리그 팀이 없습니다</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* 초기화 */}
      <button className="gf-reset" onClick={clearAllFilters}>
        초기화
      </button>

      {/* (선택) 활성 칩 */}
      {activeFilters?.length > 0 && (
        <div className="gf-chips">
          {activeFilters.map((f, i) => (
            <button
              key={i}
              className="gf-chip"
              onClick={() => removeFilter(f.category)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default GameFilter;
