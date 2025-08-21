// src/components/UploadVideoModal.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "./UploadVideoModal.css";
import Stechlogo from "../assets/images/logos/stech2.png";
import { IoCloseCircleOutline } from "react-icons/io5";
import { API_CONFIG } from "../config/api";
import { getToken } from "../utils/tokenUtils";
import {TEAMS} from '../data/TEAMS.js';

/* 팀명 → 리그 매핑 */
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

/** 로고+이름 드롭다운 (기본형) */
function TeamSelect({ value, options = [], onChange, placeholder = "Select" }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="teamSelect" ref={boxRef}>
      <button
        type="button"
        className={`teamSelect-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        {value?.logo && (
          <img
            src={value.logo}
            alt={value.name}
            className={`teamSelect-logo ${
              String(value.logo).endsWith(".svg") ? "svg-logo" : "png-logo"
            }`}
          />
        )}
        <span className={`teamSelect-label ${value ? "" : "placeholder"}`}>
          {value?.name || placeholder}
        </span>
      </button>

      {open && (
        <ul className="teamSelect-menu">
          {options.map((t) => (
            <li key={t.name}>
              <button
                type="button"
                className="teamSelect-option"
                onClick={() => {
                  onChange?.(t);
                  setOpen(false);
                }}
              >
                {t.logo && (
                  <img
                    src={t.logo}
                    alt={t.name}
                    className={`teamSelect-logo ${
                      String(t.logo).endsWith(".svg") ? "svg-logo" : "png-logo"
                    }`}
                  />
                )}
                <span>{t.name}</span>
              </button>
            </li>
          ))}
          {options.length === 0 && (
            <li className="teamSelect-empty">No teams</li>
          )}
        </ul>
      )}
    </div>
  );
}

/** 리그 → 팀 2단 드롭다운 (상대팀 전용) */
function LeagueTeamSelect({
  value,
  options = [],
  onChange,
  placeholder = "Select",
}) {
  const [open, setOpen] = useState(false);
  const [activeLeague, setActiveLeague] = useState(null);
  const boxRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const teamsByLeague = useMemo(() => {
    const m = {};
    options.forEach((t) => {
      const lg = TEAM_TO_LEAGUE[t.name] || "기타";
      (m[lg] ||= []).push(t);
    });
    return m;
  }, [options]);

  const leaguesList = useMemo(() => {
    const base = ["서울", "경기강원", "대구경북", "부산경남", "사회인"];
    const keys = Object.keys(teamsByLeague);
    const extras = keys.filter((k) => !base.includes(k)).sort();
    return [...base.filter((k) => keys.includes(k)), ...extras];
  }, [teamsByLeague]);

  useEffect(() => {
    if (!open) return;
    setActiveLeague((cur) =>
      cur && teamsByLeague[cur]?.length ? cur : leaguesList[0]
    );
  }, [open, leaguesList, teamsByLeague]);

  return (
    <div className="teamSelect" ref={boxRef}>
      <button
        type="button"
        className={`teamSelect-trigger ${open ? "open" : ""}`}
        onClick={() => setOpen((o) => !o)}
      >
        {value?.logo && (
          <img
            src={value.logo}
            alt={value.name}
            className={`teamSelect-logo ${
              String(value.logo).endsWith(".svg") ? "svg-logo" : "png-logo"
            }`}
          />
        )}
        <span className={`teamSelect-label ${value ? "" : "placeholder"}`}>
          {value?.name || placeholder}
        </span>
      </button>

      {open && (
        <div className="oppsMega">
          <ul className="oppsLeagues">
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

          <ul className="oppsTeams">
            {(teamsByLeague[activeLeague] || []).map((t) => (
              <li key={t.name}>
                <button
                  type="button"
                  className="oppsItem"
                  onClick={() => {
                    onChange?.(t);
                    setOpen(false);
                  }}
                >
                  {t.logo && (
                    <span className="opps-team-logo-img-box">
                      <img
                        src={t.logo}
                        alt={t.name}
                        className={`opps-team-logo-img ${
                          String(t.logo).endsWith(".svg")
                            ? "svg-logo"
                            : "png-logo"
                        }`}
                      />
                    </span>
                  )}
                  {t.name}
                </button>
              </li>
            ))}
            {(!activeLeague ||
              (teamsByLeague[activeLeague] || []).length === 0) && (
              <li className="oppsEmpty">해당 리그 팀이 없습니다</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Q1~Q4 업로드 라인 */
function QuarterRow({ q, file, onPick, onPreview }) {
  const inputRef = useRef(null);
  return (
    <div className="quarterRow">
      <input
        ref={inputRef}
        type="file"
        accept="video/*"
        className="hiddenFile"
        onChange={(e) => onPick(e.target.files?.[0] || null)}
      />
      <button
        className="btn primary"
        type="button"
        onClick={() => inputRef.current?.click()}
      >
        {q} 경기 영상 업로드
      </button>
      <button
        className="btn ghost"
        type="button"
        disabled={!file}
        onClick={onPreview}
        title={file ? "영상 확인" : "영상 파일을 먼저 선택하세요"}
      >
        영상 확인
      </button>
      <span className="quarterFilename">
        {file ? file.name : "선택된 파일 없음"}
      </span>
    </div>
  );
}

const UploadVideoModal = ({
  isOpen,
  onClose,
  onUploaded,
  defaultHomeTeam,
  defaultAwayTeam,
}) => {
  // TEAMS prop 없으면 전역 TEAMS로 fallback
  const teamsList =  TEAMS ;

  // 훅은 항상 호출
  const [home, setHome] = useState(defaultHomeTeam || teamsList[0] || null);
  const [away, setAway] = useState(defaultAwayTeam || teamsList[1] || null);

  const selectableHomes = useMemo(() => teamsList, [teamsList]);
  const selectableAways = useMemo(
    () => teamsList.filter((t) => t?.name !== home?.name),
    [teamsList, home]
  );

  const [matchDate, setMatchDate] = useState("");
  const [scoreHome, setScoreHome] = useState("");
  const [scoreAway, setScoreAway] = useState("");
  const [gameType, setGameType] = useState("리그");
  const [leagueName, setLeagueName] = useState("2024 Fall Cup");
  const [week, setWeek] = useState("Week1");
  const [stadium, setStadium] = useState("서울대학교 경기장");

  const [q1, setQ1] = useState(null);
  const [q2, setQ2] = useState(null);
  const [q3, setQ3] = useState(null);
  const [q4, setQ4] = useState(null);

  const [preview, setPreview] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  useEffect(() => {
    if (!isOpen || !preview) return;
    const url = URL.createObjectURL(preview);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [isOpen, preview]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClose = () => {
    if (loading) return;
    setPreview(null);
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!home || !away) return setError("홈/원정 팀을 선택해 주세요.");
    if (!matchDate) return setError("경기 날짜를 선택해 주세요.");
    if (!q1 && !q2 && !q3 && !q4)
      return setError("최소 1개 분기 영상을 업로드해 주세요.");

    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("home_team", home?.name || "");
      fd.append("away_team", away?.name || "");
      fd.append("match_datetime", matchDate);
      fd.append("score_home", String(scoreHome || 0));
      fd.append("score_away", String(scoreAway || 0));
      fd.append("game_type", gameType);
      fd.append("league_name", leagueName);
      fd.append("week", week);
      fd.append("stadium", stadium);
      if (q1) fd.append("q1", q1);
      if (q2) fd.append("q2", q2);
      if (q3) fd.append("q3", q3);
      if (q4) fd.append("q4", q4);

      const token = getToken?.();
      const resp = await fetch(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD_VIDEO}`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: fd,
        }
      );
      if (!resp.ok) throw new Error((await resp.text()) || "업로드 실패");
      onUploaded?.();
      handleClose();
    } catch (err) {
      setError(err?.message || "업로드 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 조건부 렌더링은 마지막에만
  return !isOpen ? null : (
    <div className="uvm-overlay" onClick={handleClose}>
      <div className="uvm-card" onClick={(e) => e.stopPropagation()}>
        {/* 상단: 로고 + 닫기 */}
        <div className="uvm-topbar">
          <img className="uvm-logo" src={Stechlogo} alt="Stech" />
          <button
            type="button"
            className="uvm-close"
            onClick={handleClose}
            aria-label="닫기"
          >
            <IoCloseCircleOutline />
          </button>
        </div>

        {/* 본문: 좌우 2단 */}
        <form className="uvm-body" onSubmit={handleSubmit}>
          {/* 왼쪽: 경기 정보 입력 */}
          <section className="uvm-col left">
            <h3 className="uvm-section-title">경기 정보 입력</h3>

            <div className="uvm-field two">
              <label>홈팀 (HOME)</label>
              <TeamSelect
                value={home}
                options={selectableHomes}
                onChange={setHome}
                placeholder="홈팀 선택"
              />
            </div>

            <div className="uvm-field two">
              <label>원정팀 (AWAY)</label>
              {/* ⬇️ 상대팀은 리그 → 팀 2단 드롭다운 */}
              <LeagueTeamSelect
                value={away}
                options={selectableAways}
                onChange={setAway}
                placeholder="원정팀 선택"
              />
            </div>

            <div className="uvm-field">
              <label>경기 날짜/시간</label>
              <input
                type="datetime-local"
                value={matchDate}
                onChange={(e) => setMatchDate(e.target.value)}
              />
            </div>

            <div className="uvm-field two">
              <label>스코어 (HOME)</label>
              <input
                type="number"
                min="0"
                value={scoreHome}
                onChange={(e) => setScoreHome(e.target.value)}
                placeholder="예: 24"
              />
            </div>
            <div className="uvm-field two">
              <label>스코어 (AWAY)</label>
              <input
                type="number"
                min="0"
                value={scoreAway}
                onChange={(e) => setScoreAway(e.target.value)}
                placeholder="예: 18"
              />
            </div>

            <h3 className="uvm-section-title">경기 정보 입력</h3>

            <div className="uvm-field two">
              <label>경기 유형</label>
              <select
                value={gameType}
                onChange={(e) => setGameType(e.target.value)}
              >
                <option>리그</option>
                <option>친선전</option>
                <option>연습 경기</option>
              </select>
            </div>

            <div className="uvm-field two">
              <label>리그 명칭</label>
              <input
                value={leagueName}
                onChange={(e) => setLeagueName(e.target.value)}
              />
            </div>

            <div className="uvm-field two">
              <label>주차</label>
              <input value={week} onChange={(e) => setWeek(e.target.value)} />
            </div>

            <div className="uvm-field two">
              <label>경기장</label>
              <input
                value={stadium}
                onChange={(e) => setStadium(e.target.value)}
              />
            </div>
          </section>

          {/* 오른쪽: 분기 업로드 */}
          <section className="uvm-col right">
            <h3 className="uvm-section-title">경기 영상 업로드</h3>

            <QuarterRow q="Q1" file={q1} onPick={setQ1} onPreview={() => setPreview(q1)} />
            <QuarterRow q="Q2" file={q2} onPick={setQ2} onPreview={() => setPreview(q2)} />
            <QuarterRow q="Q3" file={q3} onPick={setQ3} onPreview={() => setPreview(q3)} />
            <QuarterRow q="Q4" file={q4} onPick={setQ4} onPreview={() => setPreview(q4)} />

            {error && <p className="uvm-error">{error}</p>}

            <div className="uvm-actions">
              <button type="button" className="btn ghost" onClick={handleClose} disabled={loading}>
                닫기
              </button>
              <button type="submit" className="btn primary" disabled={loading}>
                {loading ? "업로드 중…" : "경기 업로드"}
              </button>
            </div>
          </section>
        </form>

        {/* 간단 미리보기 */}
        {preview && previewUrl && (
          <div className="uvm-preview" onClick={() => setPreview(null)}>
            <video
              src={previewUrl}
              controls
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadVideoModal;
