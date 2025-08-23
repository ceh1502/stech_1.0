import React, {useEffect, useMemo, useRef, useState} from "react";
import {useNavigate} from "react-router-dom";
import dayjs from "dayjs";
import {FaChevronDown, FaRegFileAlt} from "react-icons/fa";

import "./GamePage.css";
import {TEAMS} from "../../../../../data/TEAMS";
import CalendarDropdown from "../../../../../components/Calendar.jsx";      // 경로 확인
import UploadVideoModal from "../../../../../components/UploadVideoModal";   // 경로 확인
import defaultLogo from "../../../../../assets/images/logos/Stechlogo.svg"; // 경로 확인

/* ===== 상수 ===== */
const TYPES = ["Scrimmage", "Friendly match", "Season"];

/* 팀명 → 리그 매핑 */
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

/* ===== Mock 데이터 (필터 데모용) ===== */
const mockGames = [
  {
    gameKey: "2024-09-08-DGT-KMR",
    homeTeam: "한국외국어대 블랙나이츠",
    awayTeam: "고려대 타이거스",
    homeScore: 12,
    awayScore: 2,
    location: "서울대",
    length: "01:15:24",
    date: "2024-09-08",
    type: "Season",
    report: true,
  },
  {
    gameKey: "2024-10-01-HY-YS",
    homeTeam: "한양대 라이온스",
    awayTeam: "연세대 이글스",
    homeScore: 12,
    awayScore: 2,
    location: "서울대",
    length: "01:15:24",
    date: "2024-10-01",
    type: "Friendly match",
    report: false,
  },
];

export default function GamePage() {
  const navigate = useNavigate();

  /* ===== 내 팀 (고정 표기) ===== */
  const MY_TEAM_NAME = "한양대 라이온스"; // 필요 시 전역 상태/API로 대체
  const selfTeam = useMemo(
    () => TEAMS.find((t) => t.name === MY_TEAM_NAME) || TEAMS[0] || null,
    []
  );
  const logoSrc = selfTeam?.logo || defaultLogo;
  const label = selfTeam?.name || "Choose Team";

  /* ===== 필터 상태 ===== */
  const [showDate, setShowDate] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  const [showType, setShowType] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  const [showOpps, setShowOpps] = useState(false);
  const [selectedOpps, setSelectedOpps] = useState(null);
  const [activeLeague, setActiveLeague] = useState(null);

  const [showUpload, setShowUpload] = useState(false);

  /* 바깥 클릭 닫기 */
  const dateWrapRef = useRef(null);
  const typeWrapRef = useRef(null);
  const oppsWrapRef = useRef(null);

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

  /* ===== 상대팀 드롭다운: 리그별 묶기 ===== */
  const teamsByLeague = useMemo(() => {
    const m = {};
    TEAMS.forEach((t) => {
      if (t.name === selfTeam?.name) return; // 내 팀 제외
      const lg = TEAM_TO_LEAGUE[t.name] || "기타";
      (m[lg] ||= []).push(t);
    });
    return m;
  }, [selfTeam]);

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

  const resetFilters = () => {
    setSelectedDate(null);
    setSelectedType(null);
    setSelectedOpps(null);
    setShowDate(false);
    setShowType(false);
    setShowOpps(false);
  };

  /* ===== 경기 리스트 ===== */
  const [games, setGames] = useState([]);
  useEffect(() => {
    setGames(mockGames); // TODO: 실제 API로 교체
  }, []);

  /* 필터 적용 */
  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      if (selectedDate && !dayjs(g.date).isSame(selectedDate, "day")) return false;
      if (selectedType && g.type !== selectedType) return false;
      if (selectedOpps) {
        const opp = selectedOpps.name;
        if (g.homeTeam !== opp && g.awayTeam !== opp) return false;
      }
      return true;
    });
  }, [games, selectedDate, selectedType, selectedOpps]);

  /* 이동 */
  const openClips = (game) => {
    navigate(`/service/game/${game.gameKey}/clip`, {state: {game}});
  };

  return (
    <div className="gamepage-root">
      {/* ===== 헤더(기존 ServiceHeader 이식) ===== */}
      <header className="stechHeader">
        <div className="headerContainer">
          {/* 왼쪽: 내 팀 고정 */}
          <div className="header-team-box">
            <div className="header-team-logo-box">
              <img
                src={logoSrc}
                alt={label}
                className={`header-team-logo-img ${
                  logoSrc?.endsWith(".svg") ? "svg-logo" : "png-logo"
                }`}
              />
            </div>
            <span className="header-team-name">{label}</span>
          </div>

          {/* 오른쪽: 필터 + 업로드 */}
          <div className="bottomRow">
            <div className="filterGroup">
              {/* 날짜 */}
              <div className="datePickerWrap" ref={dateWrapRef}>
                <button
                  className={`filterButton ${showDate || selectedDate ? "active" : ""}`}
                  onClick={() => setShowDate(!showDate)}
                >
                  {selectedDate ? selectedDate.format("YYYY-MM-DD") : "날짜"}{" "}
                  <FaChevronDown size={10} />
                </button>
                {showDate && (
                  <CalendarDropdown
                    value={selectedDate || dayjs()}
                    onChange={(d) => {
                      setSelectedDate(d);
                      setShowDate(false);
                    }}
                  />
                )}
              </div>

              {/* 유형 */}
              <div className="typePickerWrap" ref={typeWrapRef}>
                <button
                  className={`filterButton ${selectedType ? "active" : ""}`}
                  onClick={() => setShowType(!showType)}
                >
                  {selectedType ?? "유형"} <FaChevronDown size={10} />
                </button>
                {showType && (
                  <ul className="typeDropdown">
                    {TYPES.map((t) => (
                      <li key={t}>
                        <button
                          className={`typeItem ${selectedType === t ? "active" : ""}`}
                          onClick={() => {
                            setSelectedType(t);
                            setShowType(false);
                          }}
                        >
                          {t}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 상대 (리그 → 팀 메가드롭다운) */}
              <div className="oppsPickerWrap" ref={oppsWrapRef}>
                <button
                  className={`filterButton ${selectedOpps ? "active" : ""}`}
                  onClick={() => setShowOpps((v) => !v)}
                >
                  {selectedOpps ? selectedOpps.name : "상대"} <FaChevronDown size={10} />
                </button>

                {showOpps && (
                  <div className="oppsMega" role="menu">
                    {/* 왼쪽: 리그 */}
                    <ul className="oppsLeagues" role="menu">
                      {leaguesList.map((lg) => (
                        <li key={lg}>
                          <button
                            type="button"
                            className={`leagueItem ${activeLeague === lg ? "active" : ""}`}
                            onMouseEnter={() => setActiveLeague(lg)}
                            onFocus={() => setActiveLeague(lg)}
                            onClick={() => setActiveLeague(lg)}
                          >
                            {lg}
                          </button>
                        </li>
                      ))}
                    </ul>

                    {/* 오른쪽: 팀 */}
                    <ul className="oppsTeams" role="menu">
                      {(teamsByLeague[activeLeague] || []).map((t) => (
                        <li key={t.name}>
                          <button
                            type="button"
                            className="oppsItem"
                            onClick={() => {
                              setSelectedOpps(t);
                              setShowOpps(false);
                            }}
                          >
                            {t.logo && (
                              <div className="opps-team-logo-img-box">
                                <img
                                  src={t.logo}
                                  alt={t.name}
                                  className={`opps-team-logo-img ${
                                    t.logo.endsWith(".svg") ? "svg-logo" : "png-logo"
                                  }`}
                                />
                              </div>
                            )}
                            {t.name}
                          </button>
                        </li>
                      ))}
                      {(!activeLeague || (teamsByLeague[activeLeague] || []).length === 0) && (
                        <li className="oppsEmpty">해당 리그 팀이 없습니다</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              {/* 초기화 */}
              <button className="resetButton" onClick={resetFilters}>초기화</button>
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

      {/* ===== 경기 표 ===== */}
      <div className="game-container">
        <div className="game-header">
          <div className="game-header-cell">날짜</div>
          <div className="game-header-cell">경기 결과</div>
          <div className="game-header-cell">세부사항</div>
          <div className="game-header-cell">경기보고서</div>
          <div className="game-header-cell">길이</div>
        </div>

        <div className="game-list">
          {filteredGames.map((g) => {
            const homeMeta = TEAMS.find((t) => t.name === g.homeTeam);
            const awayMeta = TEAMS.find((t) => t.name === g.awayTeam);

            return (
              <div
                key={g.gameKey}
                className="game-card"
                onClick={() => openClips(g)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && openClips(g)}
              >
                <div className="date">{g.date}</div>

                <div className="game-results">
                  <div className="game-team left">
                    {homeMeta?.logo && (
                      <div className="game-team-logo">
                        <img
                          src={homeMeta.logo}
                          alt={`${homeMeta.name} 로고`}
                          className={`game-team-logo-img ${
                            homeMeta.logo.endsWith(".svg") ? "svg-logo" : "png-logo"
                          }`}
                        />
                      </div>
                    )}
                    <span className="game-team-name">{g.homeTeam}</span>
                  </div>

                  <div className="game-score">
                    {g.homeScore} : {g.awayScore}
                  </div>

                  <div className="game-team right">
                    {awayMeta?.logo && (
                      <div className="game-team-logo">
                        <img
                          src={awayMeta.logo}
                          alt={`${awayMeta.name} 로고`}
                          className={`game-team-logo-img ${
                            awayMeta.logo.endsWith(".svg") ? "svg-logo" : "png-logo"
                          }`}
                        />
                      </div>
                    )}
                    <span className="game-team-name">{g.awayTeam}</span>
                  </div>
                </div>

                <div className="meta">
                  <span>{g.location}</span>
                </div>

                <div className={`game-report ${g.report ? "reportY" : "reportN"}`}>
                  <span className="report-text">
                    {g.report ? "보고서 생성됨" : "보고서 생성 중…"}
                  </span>
                  {g.report ? <FaRegFileAlt size={16} /> : ""}
                </div>

                <div className="game-length">{g.length}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
