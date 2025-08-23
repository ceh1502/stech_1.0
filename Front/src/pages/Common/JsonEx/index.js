import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import axios from "axios";
import { API_CONFIG } from '../../../config/api';

/**
 * JSON 전체 게임 데이터를 업로드하는 컴포넌트
 * - 드래그앤드롭 + 파일 선택
 * - 파일 검증 (확장자/용량)
 * - 파일 읽기 -> 파싱 -> /api/game/upload-complete-game POST
 * - 업로드/분석 진행상황 표시 (클립 수/선수 수/현재 선수 등)
 * - 성공/에러 결과 표시
 *
 * 필요 CSS 클래스:
 * .upload-zone, .upload-zone.dragover, .upload-progress, .success-result, .error-result, .hidden
 */
export default function JsonEx() {
  const [uploadStatus, setUploadStatus] = useState("idle"); // 'idle' | 'uploading' | 'success' | 'error'
  const [uploadProgress, setUploadProgress] = useState({
    totalClips: 0,
    playersFound: 0,
    currentPlayer: "",
    completedPlayers: [],
  });
  const [resultData, setResultData] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [resetStatus, setResetStatus] = useState("idle"); // 'idle' | 'resetting' | 'success' | 'error'
  const [resetMessage, setResetMessage] = useState("");

  const fileInputRef = useRef(null);
  const simulateTimerRef = useRef(null);
  const abortRef = useRef(null);

  // ──────────────────────────────
  // 유틸
  // ──────────────────────────────
  const validateFile = useCallback((file) => {
    if (!file) return false;

    // MIME 타입 또는 확장자로 검사 (브라우저/OS에 따라 type이 빈 문자열일 수 있음)
    const isJsonMime = file.type === "application/json";
    const isJsonExt = /\.json$/i.test(file.name);
    if (!(isJsonMime || isJsonExt)) {
      alert("JSON 파일만 업로드 가능합니다");
      return false;
    }
    // 10MB 이하
    if (file.size > 10 * 1024 * 1024) {
      alert("파일 크기가 너무 큽니다 (최대 10MB)");
      return false;
    }
    return true;
  }, []);

  const extractStatsFromGameData = useCallback((gameData) => {
    const clips = Array.isArray(gameData?.Clips) ? gameData.Clips : [];
    const totalClips = clips.length;

    // 선수 추정: clips[].players[].number를 기준으로 유니크 카운트
    const playerNumbers = new Set();
    for (const c of clips) {
      if (Array.isArray(c.players)) {
        for (const p of c.players) {
          if (p?.number != null) playerNumbers.add(String(p.number));
        }
      }
    }
    return {
      totalClips,
      playersFound: playerNumbers.size,
      uniquePlayers: Array.from(playerNumbers),
    };
  }, []);

  // 업로드 중 "분석 중"처럼 보이는 진행 표시를 가볍게 시뮬레이션
  const startSimulateProcessing = useCallback((uniquePlayers) => {
    stopSimulateProcessing();
    if (!uniquePlayers || uniquePlayers.length === 0) return;

    let idx = 0;
    const completed = [];

    simulateTimerRef.current = setInterval(() => {
      // 완료 처리
      if (idx > 0) {
        const prev = uniquePlayers[idx - 1];
        if (!completed.includes(prev)) completed.push(prev);
      }
      const curr = uniquePlayers[idx] ?? "";

      setUploadProgress((prev) => ({
        ...prev,
        currentPlayer: curr ? `${curr}번` : "",
        completedPlayers: [...completed],
      }));

      idx += 1;
      if (idx > uniquePlayers.length) {
        idx = uniquePlayers.length; // 멈춰있게
      }
    }, 700);
  }, []);

  const stopSimulateProcessing = useCallback(() => {
    if (simulateTimerRef.current) {
      clearInterval(simulateTimerRef.current);
      simulateTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopSimulateProcessing();
      if (abortRef.current) abortRef.current.abort();
    };
  }, [stopSimulateProcessing]);

  // ──────────────────────────────
  // 파일 업로드 처리
  // ──────────────────────────────
  const handleFileUpload = useCallback(
    async (file) => {
      try {
        if (!validateFile(file)) return;

        setResultData(null);
        setErrorMessage("");
        setUploadStatus("uploading");

        // 1) 파일 읽기 & 파싱
        const text = await file.text();
        const gameData = JSON.parse(text);

        // 2) 초깃값 세팅 (클립수/선수수)
        const { totalClips, playersFound, uniquePlayers } =
          extractStatsFromGameData(gameData);
        setUploadProgress((prev) => ({
          ...prev,
          totalClips,
          playersFound,
          currentPlayer: "",
          completedPlayers: [],
        }));

        // "분석 중" 시뮬
        startSimulateProcessing(uniquePlayers);

        // 3) 백엔드 호출 준비 (백엔드가 기대하는 형식에 맞춤)
        const payload = {
          gameKey: gameData.gameKey,
          date: gameData.date,
          homeTeam: gameData.homeTeam,
          awayTeam: gameData.awayTeam,
          location: gameData.location,
          score: gameData.score,
          Clips: Array.isArray(gameData.Clips) ? gameData.Clips : [],
        };

        // 4) axios 호출 (업로드 진행률 콜백은 FormData일 때 유효. 여기선 전체 JSON POST이므로 서버 처리시간 기준)
        abortRef.current = new AbortController();
        const response = await axios.post(
   `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.JSON_EX}`,
  payload,
  {
    timeout: API_CONFIG.TIMEOUT,
    signal: abortRef.current.signal,
   }
);

        // 5) 성공 처리
        stopSimulateProcessing();
        setUploadStatus("success");
        setResultData(response.data);
      } catch (err) {
        stopSimulateProcessing();
        setUploadStatus("error");
        // axios error message 정리
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "업로드 중 오류가 발생했습니다.";
        setErrorMessage(msg);
      }
    },
    [extractStatsFromGameData, startSimulateProcessing, stopSimulateProcessing, validateFile]
  );

  // ──────────────────────────────
  // 스탯 초기화
  // ──────────────────────────────
  const handleResetStats = useCallback(async () => {
    if (!window.confirm('⚠️ 모든 선수 스탯과 팀 스탯을 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다!')) {
      return;
    }

    try {
      setResetStatus("resetting");
      setResetMessage("");

      // 1. 선수 스탯 초기화
      await axios.post(
        `${API_CONFIG.BASE_URL}/player/reset-all-stats`,
        {},
        { timeout: API_CONFIG.TIMEOUT }
      );

      // 2. 팀 스탯 초기화 (2024 시즌)
      await axios.post(
        `${API_CONFIG.BASE_URL}/player/reset-team-stats/2024`,
        {},
        { timeout: API_CONFIG.TIMEOUT }
      );

      setResetStatus("success");
      setResetMessage("모든 스탯이 성공적으로 초기화되었습니다!");
      
      // 3초 후 자동으로 상태 리셋
      setTimeout(() => {
        setResetStatus("idle");
        setResetMessage("");
      }, 3000);

    } catch (error) {
      setResetStatus("error");
      const errorMsg = error?.response?.data?.message || error?.message || "초기화 중 오류가 발생했습니다.";
      setResetMessage(errorMsg);
      
      // 5초 후 자동으로 상태 리셋
      setTimeout(() => {
        setResetStatus("idle");
        setResetMessage("");
      }, 5000);
    }
  }, []);

  // ──────────────────────────────
  // 드래그앤드롭
  // ──────────────────────────────
  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);

      const file = e.dataTransfer?.files?.[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const onDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  // 업로드 완료 카드에 표시할 안전한 요약
  const successSummary = useMemo(() => {
    if (!resultData) return null;

    // 서버가 그대로 돌려주는 구조가 다를 수 있으니 방어적으로 처리
    const game = resultData?.game || resultData?.gameInfo || {};
    const clips = resultData?.clips || resultData?.updatedClips || [];

    const gameName =
      game?.gameName ||
      (game?.homeTeam && game?.awayTeam
        ? `${game.homeTeam} vs ${game.awayTeam}`
        : "게임");
    const date = game?.date || resultData?.date || "";
    const analyzedClips =
      resultData?.data?.summary?.totalClipsProcessed ||
      resultData?.summary?.totalClipsProcessed ||
      typeof resultData?.analyzedClips === "number"
        ? resultData.analyzedClips
        : Array.isArray(clips)
        ? clips.length
        : uploadProgress.totalClips;
    const updatedPlayers =
      resultData?.data?.summary?.successfulPlayers ||
      resultData?.summary?.successfulPlayers ||
      typeof resultData?.updatedPlayers === "number"
        ? resultData.updatedPlayers
        : uploadProgress.playersFound;

    return { gameName, date, analyzedClips, updatedPlayers };
  }, [resultData, uploadProgress.playersFound, uploadProgress.totalClips]);

  // ──────────────────────────────
  // 렌더
  // ──────────────────────────────
  return (
    <div>
      {/* 스탯 초기화 버튼 */}
      <div style={{ marginBottom: '20px', padding: '15px', border: '2px solid #ff6b6b', borderRadius: '8px', backgroundColor: '#ffe0e0' }}>
        <h3 style={{ color: '#d63031', marginBottom: '10px' }}>⚠️ 위험한 작업</h3>
        <p style={{ marginBottom: '15px', color: '#666' }}>
          모든 선수 스탯과 팀 스탯을 초기화합니다. 이 작업은 되돌릴 수 없습니다!
        </p>
        <button
          type="button"
          onClick={handleResetStats}
          disabled={resetStatus === "resetting"}
          style={{
            padding: '10px 20px',
            backgroundColor: resetStatus === "resetting" ? '#ccc' : '#d63031',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: resetStatus === "resetting" ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {resetStatus === "resetting" ? "🔄 초기화 중..." : "🗑️ 모든 스탯 초기화"}
        </button>
        
        {/* 초기화 상태 메시지 */}
        {resetMessage && (
          <div style={{ 
            marginTop: '10px', 
            padding: '8px 12px', 
            borderRadius: '4px',
            backgroundColor: resetStatus === "success" ? '#d4edda' : '#f8d7da',
            color: resetStatus === "success" ? '#155724' : '#721c24',
            border: `1px solid ${resetStatus === "success" ? '#c3e6cb' : '#f5c6cb'}`
          }}>
            {resetStatus === "success" ? "✅" : "❌"} {resetMessage}
          </div>
        )}
      </div>
      {/* 파일 업로드 영역 */}
      <div
        className={`upload-zone ${dragOver ? "dragover" : ""}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" && fileInputRef.current) fileInputRef.current.click();
        }}
        onClick={() => fileInputRef.current?.click()}
        aria-label="JSON 파일을 드래그하거나 클릭해서 업로드하세요"
      >
        <div>📤 JSON 파일을 드래그하거나 클릭해서 업로드하세요</div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
            e.target.value = ""; // 동일 파일 재업로드 가능하도록 초기화
          }}
        />
      </div>

      {/* 업로드/분석 진행 상황 */}
      {uploadStatus === "uploading" && (
        <div className="upload-progress">
          <h3>🔄 게임 데이터 분석 중...</h3>
          <p>📊 총 클립 수: {uploadProgress.totalClips}개</p>
          <p>👥 발견된 선수: {uploadProgress.playersFound}명</p>
          {!!uploadProgress.currentPlayer && (
            <p>🔄 {uploadProgress.currentPlayer} 분석 중...</p>
          )}
          {uploadProgress.completedPlayers.length > 0 && (
            <p>
              ✅ 완료된 선수:{" "}
              {uploadProgress.completedPlayers.map((n) => `${n}번`).join(", ")}
            </p>
          )}
        </div>
      )}

      {/* 성공 결과 */}
      {uploadStatus === "success" && successSummary && (
        <div className="success-result">
          <h3>✅ 업로드 완료!</h3>
          <p>🎮 게임: {successSummary.gameName}</p>
          {successSummary.date && <p>📅 날짜: {successSummary.date}</p>}
          <p>📊 분석된 클립: {successSummary.analyzedClips}개</p>
          <p>👥 업데이트된 선수: {successSummary.updatedPlayers}명</p>
        </div>
      )}

      {/* 에러 결과 */}
      {uploadStatus === "error" && (
        <div className="error-result">
          <h3>⚠️ 업로드 실패</h3>
          <p>{errorMessage}</p>
          <button
            type="button"
            onClick={() => {
              setUploadStatus("idle");
              setErrorMessage("");
            }}
          >
            다시 시도
          </button>
        </div>
      )}
    </div>
  );
}