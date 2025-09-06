import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TeamGameStats, TeamGameStatsDocument } from '../schemas/team-game-stats.schema';
import { TeamTotalStats, TeamTotalStatsDocument } from '../schemas/team-total-stats.schema';
import {
  PLAY_TYPE,
  SIGNIFICANT_PLAY,
  PlayAnalysisHelper,
} from '../player/constants/play-types.constants';

export interface TeamStatsResult {
  homeTeamStats: TeamStatsData;
  awayTeamStats: TeamStatsData;
}

export interface TeamStatsData {
  teamName: string;
  totalYards: number;
  passingYards: number;
  rushingYards: number;
  interceptionReturnYards: number;
  puntReturnYards: number;
  turnovers: number;
  opponentTurnovers: number;
  penaltyYards: number;
  sackYards: number;
  puntAttempts: number;
  puntYards: number;
  fumbles: number;
  fumblesLost: number;
  touchdowns: number;
  fieldGoals: number;
  patGood: number;
  twoPtGood: number;
  safeties: number;
  totalPoints: number;
  passingAttempts: number;
  passingCompletions: number;
  passingTouchdowns: number;
  rushingAttempts: number;
  rushingTouchdowns: number;
  interceptions: number;
  sacks: number;
  kickReturns: number;
  kickReturnYards: number;
  puntReturns: number;
  totalReturnYards: number;
  penalties: number;
  touchbacks: number;
  fieldGoalAttempts: number;
}

@Injectable()
export class TeamStatsAnalyzerService {
  constructor(
    @InjectModel(TeamGameStats.name)
    private teamGameStatsModel: Model<TeamGameStatsDocument>,
    @InjectModel(TeamTotalStats.name)
    private teamTotalStatsModel: Model<TeamTotalStatsDocument>,
  ) {}

  async analyzeTeamStats(gameData: any): Promise<TeamStatsResult> {
    console.log('팀 스탯 분석 시작:', gameData.gameKey);

    const homeTeamStats: TeamStatsData = this.createEmptyStats(gameData.homeTeam || 'Home');
    const awayTeamStats: TeamStatsData = this.createEmptyStats(gameData.awayTeam || 'Away');

    // 각 클립 분석
    for (const clip of gameData.Clips || []) {
      this.analyzeClip(clip, homeTeamStats, awayTeamStats);
    }

    // 총 야드 계산
    homeTeamStats.totalYards = homeTeamStats.passingYards + homeTeamStats.rushingYards;
    awayTeamStats.totalYards = awayTeamStats.passingYards + awayTeamStats.rushingYards;

    // 총 리턴 야드 계산
    homeTeamStats.totalReturnYards = 
      homeTeamStats.puntReturnYards + 
      homeTeamStats.kickReturnYards + 
      homeTeamStats.interceptionReturnYards;
      
    awayTeamStats.totalReturnYards = 
      awayTeamStats.puntReturnYards + 
      awayTeamStats.kickReturnYards + 
      awayTeamStats.interceptionReturnYards;

    // 총 점수 계산
    homeTeamStats.totalPoints = 
      (homeTeamStats.touchdowns * 6) +
      (homeTeamStats.fieldGoals * 3) + 
      (homeTeamStats.patGood * 1) +
      (homeTeamStats.twoPtGood * 2) +
      (homeTeamStats.safeties * 2);
      
    awayTeamStats.totalPoints = 
      (awayTeamStats.touchdowns * 6) +
      (awayTeamStats.fieldGoals * 3) + 
      (awayTeamStats.patGood * 1) +
      (awayTeamStats.twoPtGood * 2) +
      (awayTeamStats.safeties * 2);

    console.log('팀 스탯 분석 완료');
    
    return {
      homeTeamStats,
      awayTeamStats,
    };
  }

  private analyzeClip(clip: any, homeTeamStats: TeamStatsData, awayTeamStats: TeamStatsData): void {
    const gainYard = clip.gainYard || 0;
    const playType = clip.playType;
    const significantPlays = clip.significantPlays || [];
    const offensiveTeam = clip.offensiveTeam;

    const isHomeOffense = offensiveTeam === 'Home';
    const offenseStats = isHomeOffense ? homeTeamStats : awayTeamStats;
    const defenseStats = isHomeOffense ? awayTeamStats : homeTeamStats;

    // 패싱 스탯
    if (playType === 'PASS' || playType === 'PassComplete') {
      offenseStats.passingAttempts += 1;
      offenseStats.passingCompletions += 1;
      if (gainYard > 0) {
        offenseStats.passingYards += gainYard;
      }
      
      // 패싱 터치다운 별도 카운트
      if (significantPlays.includes('TOUCHDOWN') && !significantPlays.includes('TURNOVER')) {
        offenseStats.passingTouchdowns = (offenseStats.passingTouchdowns || 0) + 1;
      }
    } else if (playType === 'NOPASS' || playType === 'PassIncomplete') {
      offenseStats.passingAttempts += 1;
    }

    // 러싱 스탯
    if (playType === 'RUN' || playType === 'Run') {
      offenseStats.rushingAttempts += 1;
      // 러싱 야드는 양수든 음수든 모두 포함
      offenseStats.rushingYards += gainYard;
      
      // 러싱 터치다운 별도 카운트
      if (significantPlays.includes('TOUCHDOWN') && !significantPlays.includes('TURNOVER')) {
        offenseStats.rushingTouchdowns = (offenseStats.rushingTouchdowns || 0) + 1;
      }
    }

    // 펀트 처리
    if (playType === 'PUNT' || playType === 'Punt') {
      offenseStats.puntAttempts += 1;
      
      // 펀트 블록 판단: tkl 또는 tkl2에 선수가 있으면 블록된 것으로 판단
      const isBlocked = clip.tkl?.num || clip.tkl2?.num;
      if (isBlocked) {
        offenseStats.puntYards += 0;
      } else {
        const puntYards = Math.abs(gainYard);
        offenseStats.puntYards += puntYards;
      }
      
      // 펀트 리턴 처리 (상대팀이 리턴하는 것)
      if (!isBlocked && gainYard !== 0) {
        const returningTeam = isHomeOffense ? awayTeamStats : homeTeamStats;
        returningTeam.puntReturns += 1;
        returningTeam.puntReturnYards += Math.abs(gainYard);
      }
    }

    // 킥오프 처리
    if (playType === 'KICKOFF' || playType === 'Kickoff') {
      const kickoffYards = Math.abs(gainYard);
      const returningTeam = isHomeOffense ? awayTeamStats : homeTeamStats;
      returningTeam.kickReturns += 1;
      returningTeam.kickReturnYards += kickoffYards;
    }

    // 인터셉트 처리 (TURNOVER가 있을 때만 카운트)
    if (significantPlays.includes('INTERCEPT') && significantPlays.includes('TURNOVER')) {
      // 우리팀이 당한 인터셉트를 기록 (공격팀의 인터셉트로 카운트)
      offenseStats.interceptions += 1;
      offenseStats.turnovers += 1; // 인터셉트도 턴오버
      // 상대팀이 얻은 턴오버 증가
      if (!defenseStats.opponentTurnovers) defenseStats.opponentTurnovers = 0;
      defenseStats.opponentTurnovers += 1;
      console.log(`   🔥 팀 인터셉트 기록! 팀: ${isHomeOffense ? '홈' : '어웨이'}`);
      // 상대팀의 인터셉트 리턴 야드는 수비팀에 기록
      if (gainYard > 0) {
        defenseStats.interceptionReturnYards += gainYard;
      }
    }

    // 터치다운 처리 (TURNOVER와 함께 있으면 수비팀 터치다운)
    if (significantPlays.includes('TOUCHDOWN')) {
      if (significantPlays.includes('TURNOVER')) {
        // TURNOVER + TOUCHDOWN = 수비팀(상대편) 터치다운
        defenseStats.touchdowns += 1;
      } else {
        // 일반 터치다운은 공격팀 터치다운
        offenseStats.touchdowns += 1;
      }
    }

    // 색 처리
    if (significantPlays.includes('Sack') || significantPlays.includes('SACK')) {
      defenseStats.sacks += 1;
      console.log(`   🔥 팀 색 기록! 팀: ${isHomeOffense ? '어웨이' : '홈'}`);
      if (gainYard < 0) {
        offenseStats.sackYards += Math.abs(gainYard);
      }
    }

    // 펌블 처리
    if (significantPlays.includes('FUMBLE')) {
      offenseStats.fumbles += 1;
      console.log(`   🔥 팀 펌블 기록! 팀: ${isHomeOffense ? '홈' : '어웨이'}`);
    }
    
    // 펌블 로스트 처리 (TURNOVER가 있을 때만 카운트)
    if (significantPlays.includes('TURNOVER') && significantPlays.includes('FUMBLERECDEF')) {
      // 수비팀이 펌블을 회수하고 턴오버가 확정된 경우만
      offenseStats.fumblesLost += 1;
      offenseStats.turnovers += 1; // 턴오버 카운트
      // 상대팀이 얻은 턴오버 증가
      if (!defenseStats.opponentTurnovers) defenseStats.opponentTurnovers = 0;
      defenseStats.opponentTurnovers += 1;
      console.log(`   🔥 팀 펌블 로스트 기록! 팀: ${isHomeOffense ? '홈' : '어웨이'}`);
    }

    // 필드골 처리
    if (playType === 'FIELDGOAL' || playType === 'FieldGoal' || playType === 'FG') {
      offenseStats.fieldGoalAttempts += 1;
      if (significantPlays.includes('FIELDGOALGOOD') || significantPlays.includes('FIELDGOAL') || significantPlays.includes('FG')) {
        offenseStats.fieldGoals += 1;
      }
    }

    // PAT 처리
    if (playType === 'PAT') {
      if (significantPlays.includes('PATGOOD')) {
        offenseStats.patGood += 1;
      }
    }

    // 2점 컨버전 처리
    if (playType === '2PT' || playType === 'TWOPOINT') {
      if (significantPlays.includes('2PTGOOD') || significantPlays.includes('TWOPTGOOD')) {
        offenseStats.twoPtGood += 1;
      }
    }

    // 세이프티 처리
    if (significantPlays.includes('SAFETY')) {
      // 세이프티는 수비팀 점수
      defenseStats.safeties += 1;
    }

    // 페널티 처리 (PENALTY.HOME 또는 PENALTY.AWAY)
    const isPenalty = significantPlays.some(play => 
      play && (play.includes('PENALTY.HOME') || play.includes('PENALTY.AWAY'))
    );
    
    if (isPenalty) {
      // 해당 팀의 페널티인지 확인 
      const isHomePenalty = significantPlays.some(play => play && play.includes('PENALTY.HOME'));
      const isAwayPenalty = significantPlays.some(play => play && play.includes('PENALTY.AWAY'));
      
      if ((isHomeOffense && isHomePenalty) || (!isHomeOffense && isAwayPenalty)) {
        // 공격팀의 페널티
        offenseStats.penalties += 1;
        // 페널티 야드는 gainYard의 절댓값 (페널티는 보통 음수로 기록)
        offenseStats.penaltyYards += Math.abs(gainYard);
      } else if ((isHomeOffense && isAwayPenalty) || (!isHomeOffense && isHomePenalty)) {
        // 수비팀의 페널티
        defenseStats.penalties += 1;
        defenseStats.penaltyYards += Math.abs(gainYard);
      }
    }
  }

  async saveTeamStats(gameKey: string, teamStatsResult: TeamStatsResult, gameData: any): Promise<void> {
    console.log('팀 스탯 저장:', gameKey);
    
    try {
      // 1. 홈팀 게임별 스탯 저장
      const homeTeamGameStats = new this.teamGameStatsModel({
        teamName: teamStatsResult.homeTeamStats.teamName,
        gameKey,
        date: gameData.date || new Date().toISOString(),
        season: gameData.date ? gameData.date.substring(0, 4) : new Date().getFullYear().toString(),
        opponent: teamStatsResult.awayTeamStats.teamName,
        isHomeGame: true,
        stats: {
          totalYards: teamStatsResult.homeTeamStats.totalYards,
          passingYards: teamStatsResult.homeTeamStats.passingYards,
          rushingYards: teamStatsResult.homeTeamStats.rushingYards,
          passingAttempts: teamStatsResult.homeTeamStats.passingAttempts,
          passingCompletions: teamStatsResult.homeTeamStats.passingCompletions,
          passingTouchdowns: teamStatsResult.homeTeamStats.passingTouchdowns,
          rushingAttempts: teamStatsResult.homeTeamStats.rushingAttempts,
          touchdowns: teamStatsResult.homeTeamStats.touchdowns,
          fieldGoals: teamStatsResult.homeTeamStats.fieldGoals,
          turnovers: teamStatsResult.homeTeamStats.turnovers,
          fumbles: teamStatsResult.homeTeamStats.fumbles,
          sacks: teamStatsResult.homeTeamStats.sacks,
          interceptions: teamStatsResult.homeTeamStats.interceptions,
          puntAttempts: teamStatsResult.homeTeamStats.puntAttempts,
          puntYards: teamStatsResult.homeTeamStats.puntYards,
          penalties: teamStatsResult.homeTeamStats.penalties,
          penaltyYards: teamStatsResult.homeTeamStats.penaltyYards,
        },
        finalScore: {
          own: teamStatsResult.homeTeamStats.totalPoints,
          opponent: teamStatsResult.awayTeamStats.totalPoints,
        },
      });
      
      // 2. 어웨이팀 게임별 스탯 저장
      const awayTeamGameStats = new this.teamGameStatsModel({
        teamName: teamStatsResult.awayTeamStats.teamName,
        gameKey,
        date: gameData.date || new Date().toISOString(),
        season: gameData.date ? gameData.date.substring(0, 4) : new Date().getFullYear().toString(),
        opponent: teamStatsResult.homeTeamStats.teamName,
        isHomeGame: false,
        stats: {
          totalYards: teamStatsResult.awayTeamStats.totalYards,
          passingYards: teamStatsResult.awayTeamStats.passingYards,
          rushingYards: teamStatsResult.awayTeamStats.rushingYards,
          passingAttempts: teamStatsResult.awayTeamStats.passingAttempts,
          passingCompletions: teamStatsResult.awayTeamStats.passingCompletions,
          passingTouchdowns: teamStatsResult.awayTeamStats.passingTouchdowns,
          rushingAttempts: teamStatsResult.awayTeamStats.rushingAttempts,
          touchdowns: teamStatsResult.awayTeamStats.touchdowns,
          fieldGoals: teamStatsResult.awayTeamStats.fieldGoals,
          turnovers: teamStatsResult.awayTeamStats.turnovers,
          fumbles: teamStatsResult.awayTeamStats.fumbles,
          sacks: teamStatsResult.awayTeamStats.sacks,
          interceptions: teamStatsResult.awayTeamStats.interceptions,
          puntAttempts: teamStatsResult.awayTeamStats.puntAttempts,
          puntYards: teamStatsResult.awayTeamStats.puntYards,
          penalties: teamStatsResult.awayTeamStats.penalties,
          penaltyYards: teamStatsResult.awayTeamStats.penaltyYards,
        },
        finalScore: {
          own: teamStatsResult.awayTeamStats.totalPoints,
          opponent: teamStatsResult.homeTeamStats.totalPoints,
        },
      });
      
      await homeTeamGameStats.save();
      await awayTeamGameStats.save();
      console.log('✅ 게임별 팀 스탯 저장 완료');
      
      // 2. 홈팀 누적 스탯 업데이트
      await this.updateTeamTotalStats(teamStatsResult.homeTeamStats, gameKey);
      
      // 3. 어웨이팀 누적 스탯 업데이트
      await this.updateTeamTotalStats(teamStatsResult.awayTeamStats, gameKey);
      
      console.log('✅ 팀 누적 스탯 업데이트 완료');
    } catch (error) {
      console.error('❌ 팀 스탯 저장 중 오류:', error);
      throw error;
    }
  }
  
  private async updateTeamTotalStats(teamStats: TeamStatsData, gameKey: string): Promise<void> {
    const existingStats = await this.teamTotalStatsModel.findOne({ teamName: teamStats.teamName });
    
    if (existingStats) {
      // 기존 스탯에 새 게임 스탯 추가
      existingStats.totalYards = (existingStats.totalYards || 0) + teamStats.totalYards;
      existingStats.passingYards = (existingStats.passingYards || 0) + teamStats.passingYards;
      existingStats.rushingYards = (existingStats.rushingYards || 0) + teamStats.rushingYards;
      existingStats.passAttempts = (existingStats.passAttempts || 0) + teamStats.passingAttempts;
      existingStats.passCompletions = (existingStats.passCompletions || 0) + teamStats.passingCompletions;
      existingStats.passingTouchdowns = (existingStats.passingTouchdowns || 0) + teamStats.passingTouchdowns;
      existingStats.rushingAttempts = (existingStats.rushingAttempts || 0) + teamStats.rushingAttempts;
      existingStats.totalTouchdowns = (existingStats.totalTouchdowns || 0) + teamStats.touchdowns;
      existingStats.rushingTouchdowns = (existingStats.rushingTouchdowns || 0) + teamStats.rushingTouchdowns;
      existingStats.fieldGoalMakes = (existingStats.fieldGoalMakes || 0) + teamStats.fieldGoals;
      existingStats.totalPoints = (existingStats.totalPoints || 0) + teamStats.totalPoints;
      existingStats.interceptions = (existingStats.interceptions || 0) + teamStats.interceptions;
      existingStats.totalPunts = (existingStats.totalPunts || 0) + teamStats.puntAttempts;
      existingStats.totalPuntYards = (existingStats.totalPuntYards || 0) + teamStats.puntYards;
      existingStats.kickReturns = (existingStats.kickReturns || 0) + teamStats.kickReturns;
      existingStats.kickReturnYards = (existingStats.kickReturnYards || 0) + teamStats.kickReturnYards;
      existingStats.puntReturns = (existingStats.puntReturns || 0) + teamStats.puntReturns;
      existingStats.puntReturnYards = (existingStats.puntReturnYards || 0) + teamStats.puntReturnYards;
      existingStats.fumbles = (existingStats.fumbles || 0) + teamStats.fumbles;
      existingStats.fumblesLost = (existingStats.fumblesLost || 0) + teamStats.fumblesLost;
      existingStats.totalTurnovers = (existingStats.totalTurnovers || 0) + teamStats.turnovers;
      existingStats.opponentTurnovers = (existingStats.opponentTurnovers || 0) + teamStats.opponentTurnovers;
      existingStats.penalties = (existingStats.penalties || 0) + teamStats.penalties;
      existingStats.penaltyYards = (existingStats.penaltyYards || 0) + teamStats.penaltyYards;
      
      existingStats.gamesPlayed += 1;
      existingStats.processedGames.push(gameKey);
      
      await existingStats.save();
    } else {
      // 새로운 팀 스탯 생성
      const newTeamStats = new this.teamTotalStatsModel({
        teamName: teamStats.teamName,
        totalYards: teamStats.totalYards,
        passingYards: teamStats.passingYards,
        rushingYards: teamStats.rushingYards,
        passAttempts: teamStats.passingAttempts,
        passCompletions: teamStats.passingCompletions,
        passingTouchdowns: teamStats.passingTouchdowns,
        rushingAttempts: teamStats.rushingAttempts,
        rushingTouchdowns: teamStats.rushingTouchdowns,
        totalTouchdowns: teamStats.touchdowns,
        fieldGoalMakes: teamStats.fieldGoals,
        totalPoints: teamStats.totalPoints,
        interceptions: teamStats.interceptions,
        totalPunts: teamStats.puntAttempts,
        totalPuntYards: teamStats.puntYards,
        kickReturns: teamStats.kickReturns,
        kickReturnYards: teamStats.kickReturnYards,
        puntReturns: teamStats.puntReturns,
        puntReturnYards: teamStats.puntReturnYards,
        fumbles: teamStats.fumbles,
        fumblesLost: teamStats.fumblesLost,
        totalTurnovers: teamStats.turnovers,
        opponentTurnovers: teamStats.opponentTurnovers,
        penalties: teamStats.penalties,
        penaltyYards: teamStats.penaltyYards,
        gamesPlayed: 1,
        wins: 0,
        losses: 0,
        ties: 0,
        processedGames: [gameKey],
        season: new Date().getFullYear().toString(),
      });
      
      await newTeamStats.save();
    }
  }

  async getTeamStatsByGame(gameKey: string): Promise<TeamStatsResult | null> {
    console.log('팀 스탯 조회:', gameKey);
    // TODO: 게임별 팀 스탯 조회 로직 구현
    return null;
  }

  async analyzeGameForDisplay(gameData: any) {
    if (!gameData) {
      throw new Error('경기 데이터가 없습니다');
    }

    console.log('경기 분석 시작:', gameData.gameKey || '키없음');
    console.log('홈팀:', gameData.homeTeam, '어웨이팀:', gameData.awayTeam);

    const homeTeamStats: TeamStatsData = this.createEmptyStats(gameData.homeTeam || 'Home');
    const awayTeamStats: TeamStatsData = this.createEmptyStats(gameData.awayTeam || 'Away');

    // 3rd down 추적을 위한 변수
    const thirdDownData = {
      home: { attempts: 0, conversions: 0 },
      away: { attempts: 0, conversions: 0 }
    };

    // 각 클립 분석
    for (let i = 0; i < (gameData.Clips || []).length; i++) {
      const clip = gameData.Clips[i];
      
      // 3rd down 추적
      if (clip.down === 3) {
        const isHomeOffense = clip.offensiveTeam === 'Home';
        const thirdDownTeam = isHomeOffense ? thirdDownData.home : thirdDownData.away;
        thirdDownTeam.attempts++;
        
        // 다음 클립 확인하여 1st down 획득 여부 확인
        if (i + 1 < gameData.Clips.length) {
          const nextClip = gameData.Clips[i + 1];
          // 같은 팀이 공격권을 유지하고 down이 1이면 성공
          if (nextClip.offensiveTeam === clip.offensiveTeam && nextClip.down === 1) {
            thirdDownTeam.conversions++;
          }
        }
      }
      
      this.analyzeClip(clip, homeTeamStats, awayTeamStats);
    }

    // 총 야드 계산
    homeTeamStats.totalYards = homeTeamStats.passingYards + homeTeamStats.rushingYards;
    awayTeamStats.totalYards = awayTeamStats.passingYards + awayTeamStats.rushingYards;

    console.log('홈팀 스탯:', {
      팀명: homeTeamStats.teamName,
      패싱: homeTeamStats.passingAttempts,
      러싱: homeTeamStats.rushingAttempts,
      총야드: homeTeamStats.totalYards
    });
    console.log('어웨이팀 스탯:', {
      팀명: awayTeamStats.teamName,
      패싱: awayTeamStats.passingAttempts,
      러싱: awayTeamStats.rushingAttempts,
      총야드: awayTeamStats.totalYards
    });

    // 플레이콜 비율 계산
    const calculatePlayCallRatio = (stats: TeamStatsData) => {
      const totalPlays = stats.passingAttempts + stats.rushingAttempts;
      return {
        runPlays: stats.rushingAttempts,
        passPlays: stats.passingAttempts,
        runPercentage: totalPlays > 0 ? Math.round((stats.rushingAttempts / totalPlays) * 100) : 0,
        passPercentage: totalPlays > 0 ? Math.round((stats.passingAttempts / totalPlays) * 100) : 0
      };
    };

    // 3rd down 성공률 계산
    const calculateThirdDownStats = (data: { attempts: number, conversions: number }) => {
      return {
        attempts: data.attempts,
        conversions: data.conversions,
        percentage: data.attempts > 0 ? Math.round((data.conversions / data.attempts) * 100) : 0
      };
    };

    return {
      homeTeam: {
        teamName: homeTeamStats.teamName,
        playCallRatio: calculatePlayCallRatio(homeTeamStats),
        totalYards: homeTeamStats.totalYards,
        passingYards: homeTeamStats.passingYards,
        rushingYards: homeTeamStats.rushingYards,
        thirdDownStats: calculateThirdDownStats(thirdDownData.home),
        turnovers: homeTeamStats.turnovers,
        penaltyYards: homeTeamStats.penaltyYards
      },
      awayTeam: {
        teamName: awayTeamStats.teamName,
        playCallRatio: calculatePlayCallRatio(awayTeamStats),
        totalYards: awayTeamStats.totalYards,
        passingYards: awayTeamStats.passingYards,
        rushingYards: awayTeamStats.rushingYards,
        thirdDownStats: calculateThirdDownStats(thirdDownData.away),
        turnovers: awayTeamStats.turnovers,
        penaltyYards: awayTeamStats.penaltyYards
      }
    };
  }

  async getAllTeamTotalStats() {
    console.log('모든 팀 누적 스탯 조회');
    
    try {
      // team_total_stats 컬렉션 사용
      const teamTotalStats = await this.teamTotalStatsModel.find({});
      
      if (teamTotalStats.length > 0) {
        console.log(`✅ ${teamTotalStats.length}개 팀의 team_total_stats 데이터 조회`);
        const formattedStats = teamTotalStats.map(team => ({
          teamName: team.teamName,
          gamesPlayed: team.gamesPlayed || 0,
          wins: team.wins || 0,
          losses: team.losses || 0,
          totalYards: team.totalYards || 0,
          passingYards: team.passingYards || 0,
          rushingYards: team.rushingYards || 0,
          totalPoints: team.totalPoints || 0,
          touchdowns: team.totalTouchdowns || 0,
          avgYardsPerGame: team.gamesPlayed > 0 ? Math.round((team.totalYards || 0) / team.gamesPlayed) : 0,
          avgPointsPerGame: team.gamesPlayed > 0 ? Math.round((team.totalPoints || 0) / team.gamesPlayed) : 0,
          
          // 러싱 스탯들
          rushingAttempts: team.rushingAttempts || 0,
          rushingTouchdowns: team.rushingTouchdowns || 0,
          avgRushingYardsPerGame: team.gamesPlayed > 0 ? Math.round((team.rushingYards || 0) / team.gamesPlayed) : 0,
          avgRushingYardsPerCarry: (team.rushingAttempts || 0) > 0 ? ((team.rushingYards || 0) / team.rushingAttempts).toFixed(1) : '0.0',
          
          // 패싱 스탯들
          passAttempts: team.passAttempts || 0,
          passCompletions: team.passCompletions || 0,
          passingTouchdowns: team.passingTouchdowns || 0,
          interceptions: team.interceptions || 0,
          passCompletionRate: `${team.passCompletions || 0}-${team.passAttempts || 0}`,
          avgPassingYardsPerGame: team.gamesPlayed > 0 ? Math.round((team.passingYards || 0) / team.gamesPlayed) : 0,
          avgPassingYardsPerAttempt: (team.passAttempts || 0) > 0 ? ((team.passingYards || 0) / team.passAttempts).toFixed(1) : '0.0',
          
          // 스페셜팀 스탯들
          totalPuntYards: team.totalPuntYards || 0,
          totalPunts: team.totalPunts || 0,
          avgPuntYards: (team.totalPunts || 0) > 0 ? ((team.totalPuntYards || 0) / team.totalPunts).toFixed(1) : '0.0',
          touchbackPercentage: (team.totalPunts || 0) > 0 ? (((team.puntTouchbacks || 0) / team.totalPunts) * 100).toFixed(1) : '0.0',
          fieldGoalRate: `${team.fieldGoalMakes || 0}-${team.fieldGoalAttempts || 0}`,
          avgKickReturnYards: (team.kickReturns || 0) > 0 ? ((team.kickReturnYards || 0) / team.kickReturns).toFixed(1) : '0.0',
          avgPuntReturnYards: (team.puntReturns || 0) > 0 ? ((team.puntReturnYards || 0) / team.puntReturns).toFixed(1) : '0.0',
          totalReturnYards: (team.kickReturnYards || 0) + (team.puntReturnYards || 0),
          
          // 기타 스탯들
          fumbles: team.fumbles || 0,
          fumblesLost: team.fumblesLost || 0,
          fumbleRate: `${team.fumbles || 0}-${team.fumblesLost || 0}`,
          totalTurnovers: team.totalTurnovers || 0,
          opponentTurnovers: team.opponentTurnovers || 0,
          avgTurnoversPerGame: team.gamesPlayed > 0 ? ((team.totalTurnovers || 0) / team.gamesPlayed).toFixed(1) : '0.0',
          turnoverDifferential: (team.opponentTurnovers || 0) - (team.totalTurnovers || 0),
          penalties: team.penalties || 0,
          penaltyYards: team.penaltyYards || 0,
          penaltyRate: `${team.penalties || 0}-${team.penaltyYards || 0}`,
          avgPenaltyYardsPerGame: team.gamesPlayed > 0 ? Math.round((team.penaltyYards || 0) / team.gamesPlayed) : 0,
          
          lastUpdated: team.updatedAt || new Date(),
        })).sort((a, b) => b.totalYards - a.totalYards);
          
        console.log(`✅ ${formattedStats.length}개 팀의 누적 스탯 조회 완료`);
        return formattedStats;
      } else {
        console.log('⚠️ team_total_stats 컬렉션에 데이터가 없습니다');
        return [];
      }
    } catch (error) {
      console.error('❌ 팀 누적 스탯 조회 중 오류:', error);
      return [];
    }
  }

  private createEmptyStats(teamName: string): TeamStatsData {
    return {
      teamName,
      totalYards: 0,
      passingYards: 0,
      rushingYards: 0,
      interceptionReturnYards: 0,
      turnovers: 0,
      opponentTurnovers: 0,
      penaltyYards: 0,
      sackYards: 0,
      puntAttempts: 0,
      puntYards: 0,
      fumbles: 0,
      fumblesLost: 0,
      touchdowns: 0,
      fieldGoals: 0,
      patGood: 0,
      twoPtGood: 0,
      safeties: 0,
      totalPoints: 0,
      passingAttempts: 0,
      passingCompletions: 0,
      passingTouchdowns: 0,
      rushingAttempts: 0,
      rushingTouchdowns: 0,
      interceptions: 0,
      sacks: 0,
      kickReturns: 0,
      kickReturnYards: 0,
      puntReturns: 0,
      puntReturnYards: 0,
      totalReturnYards: 0,
      penalties: 0,
      touchbacks: 0,
      fieldGoalAttempts: 0,
    };
  }
}