export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:4000/api',
  TIMEOUT: 10000,
  ENDPOINTS: {
    //Auth
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    VERIFY_EMAIL: '/auth/verify-email',
    USER_INFO: '/auth/me',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    CHECK_EMAIL: '/auth/check-email',
    REFRESH_TOKEN: '/auth/refresh',
    LOGOUT: '/auth/logout',
    VERIFY_TOKEN: '/auth/verify',
    UPDATE_USER: '/auth/user',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    DELETE_ACCOUNT: '/auth/delete-account',


    UPLOAD_VIDEO: '/video/upload', //<-- 건아 임마를 조져
    JSON_EX: '/player/analyze-game-data',

    //player
    PLAYER_CREATE: '/player',                               // POST
    PLAYER_UPDATE_STATS: '/player/{playerId}/stats',        // PUT
    PLAYER_CAREER_RANKINGS: '/player/career-rankings',      // GET
    PLAYER_BY_CODE: '/player/code/{playerId}',              // GET
    PLAYER_GAME_STATS_BATCH: '/player/game-stats-batch',    // POST
    PLAYER_JERSEY_ANALYZE_NEW_CLIPS: '/player/jersey/{jerseyNumber}/analyze-new-clips',        // POST
    PLAYER_JERSEY_ANALYZE_NEW_CLIPS_ONLY: '/player/jersey/{jerseyNumber}/analyze-new-clips-only', // POST
    PLAYER_JERSEY_CAREER_STATS: '/player/jersey/{jerseyNumber}/career-stats', // GET
    PLAYER_JERSEY_GAME_STATS: '/player/jersey/{jerseyNumber}/game-stats',     // GET
    PLAYER_JERSEY_SEASON_STATS: '/player/jersey/{jerseyNumber}/season-stats', // GET
    PLAYER_BY_POSITION: '/player/position/{position}',      // GET
    PLAYER_RANKINGS: '/player/rankings',                    // GET
    PLAYER_SAMPLE: '/player/sample',                        // POST
    PLAYER_SEASON_RANKINGS: '/player/season-rankings/{season}/{league}', // GET
    PLAYER_BY_TEAM: '/player/team/{teamId}',                // GET
    PLAYER_UPDATE_GAME_STATS: '/player/update-game-stats',  // POST
  }
};