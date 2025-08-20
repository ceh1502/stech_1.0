// src/.../ServiceHeader.jsx
import {useState, useRef, useEffect, useMemo} from "react";
import {FaChevronDown} from "react-icons/fa";
import defaultLogo from "../../../assets/images/logos/Stechlogo.svg";
import "./ServiceHeader.css";
import CalendarDropdown from "../../../components/Calendar.jsx";
import UploadVideoModal from "../../../components/UploadVideoModal"; // 경로 맞춰줘
import dayjs from "dayjs";

const TYPES = ["Scrimmage", "Friendly match", "Season"];

// 팀명 → 리그 매핑
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
  // 경기·강원
  "강원대학교 카프라스": "경기강원",
  "단국대학교 코디악베어스": "경기강원",
  "성균관대학교 로얄스": "경기강원",
  "용인대학교 화이트타이거스": "경기강원",
  "인하대학교 틸 드래곤스": "경기강원",
  "한림대학교 피닉스": "경기강원",
  "한신대학교 킬러웨일스": "경기강원",
  // 대구·경북
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
  // 부산·경남
  "경성대학교 드래곤스": "부산경남",
  "동서대학교 블루돌핀스": "부산경남",
  "동아대학교 레오파즈": "부산경남",
  "동의대학교 터틀파이터스": "부산경남",
  "부산대학교 이글스": "부산경남",
  "부산외국어대학교 토네이도": "부산경남",
  "신라대학교 데빌스": "부산경남",
  "울산대학교 유니콘스": "부산경남",
  "한국해양대학교 바이킹스": "부산경남",
  // 사회인
  "군위 피닉스": "사회인",
  "부산 그리폰즈": "사회인",
  "삼성 블루스톰": "사회인",
  "서울 골든이글스": "사회인",
  "서울 디펜더스": "사회인",
  "서울 바이킹스": "사회인",
  "인천 라이노스": "사회인",
};

const ServiceHeader = ({
  teams = [],
  myTeamName,
  myTeam,
}) => {
  /* ── 내 팀(고정) ── */
  const selfTeam = useMemo(() => {
    if (myTeam) return myTeam;
    if (myTeamName) return teams.find((t) => t.name === myTeamName) || null;
    return teams[0] || null;
  }, [teams, myTeamName, myTeam]);

  /* ── Date / Type ── */
  const [showDate, setShowDate] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null); // 기본 라벨 "날짜"
  const [showType, setShowType] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  /* ── 상대팀 2단 드롭다운 ── */
  const [showOpps, setShowOpps] = useState(false);
  const [selectedOpps, setSelectedOpps] = useState(null);
  const [activeLeague, setActiveLeague] = useState(null); // 왼쪽 리그 hover 상태

  /* ── 업로드 모달(헤더 내부에 내장) ── */
  const [showUpload, setShowUpload] = useState(false);

  /* ── refs & 바깥클릭 닫기 ── */
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

  /* ── 로고/라벨 ── */
  const logoSrc = selfTeam?.logo || defaultLogo;
  const label = selfTeam?.name || "Choose Team";

  /* ── 내 팀 제외 후 리그별 그룹 ── */
  const teamsByLeague = useMemo(() => {
    const m = {};
    teams.forEach((t) => {
      if (t.name === selfTeam?.name) return;
      const lg = TEAM_TO_LEAGUE[t.name] || "기타";
      (m[lg] ||= []).push(t);
    });
    return m;
  }, [teams, selfTeam]);

  /* ── 리그 리스트(존재하는 리그만) ── */
  const leaguesList = useMemo(() => {
    const base = ["서울", "경기강원", "대구경북", "부산경남", "사회인"];
    const keys = Object.keys(teamsByLeague);
    const extras = keys.filter((k) => !base.includes(k)).sort();
    return [...base.filter((k) => keys.includes(k)), ...extras];
  }, [teamsByLeague]);

  /* 드롭다운 열릴 때 기본 활성 리그 */
  useEffect(() => {
    if (showOpps) {
      setActiveLeague((cur) =>
        cur && teamsByLeague[cur]?.length ? cur : leaguesList[0]
      );
    }
  }, [showOpps, leaguesList, teamsByLeague]);

  /* 초기화 */
  const resetFilters = () => {
    setSelectedDate(null);
    setSelectedType(null);
    setSelectedOpps(null);
    setShowDate(false);
    setShowType(false);
    setShowOpps(false);

  };

  return (
    <header className="stechHeader">
      <div className="headerContainer">
        {/* 왼쪽: 내 팀 고정 표기 */}
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

        {/* 오른쪽: 필터 + 업로드 버튼 */}
        <div className="headerRow bottomRow">
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

            {/* 상대 (2단 드롭다운: 리그 -> 팀) */}
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
                                className={`opps-team-logo-img ${t.logo.endsWith(".svg") ? "svg-logo" : "png-logo"}`}
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

          {/* 업로드 모달 여는 버튼 (prop 없이 내부 상태로 제어) */}
          <button className="newVideoButton" onClick={() => setShowUpload(true)}>
            경기 업로드
          </button>
        </div>
      </div>

      {/* ===== 업로드 모달을 헤더 내부에 "박아넣음" ===== */}
      <UploadVideoModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        onUploaded={() => {
          setShowUpload(false);
          // 업로드 후 목록 갱신 등 필요하면 여기서 처리
        }}
      />
    </header>
  );
};

export default ServiceHeader;
