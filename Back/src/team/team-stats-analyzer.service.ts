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
  kickoffReturnYards: number;
  turnovers: number;
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
  rushingAttempts: number;
  interceptions: number;
  sacks: number;
  kickReturns: number;
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
      homeTeamStats.kickoffReturnYards + 
      homeTeamStats.interceptionReturnYards;
      
    awayTeamStats.totalReturnYards = 
      awayTeamStats.puntReturnYards + 
      awayTeamStats.kickoffReturnYards + 
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
    } else if (playType === 'NOPASS' || playType === 'PassIncomplete') {
      offenseStats.passingAttempts += 1;
    }

    // 러싱 스탯
    if (playType === 'RUN' || playType === 'Run') {
      offenseStats.rushingAttempts += 1;
      if (gainYard > 0) {
        offenseStats.rushingYards += gainYard;
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
    }

    // 킥오프 처리
    if (playType === 'KICKOFF' || playType === 'Kickoff') {
      const kickoffYards = Math.abs(gainYard);
      const returningTeam = isHomeOffense ? awayTeamStats : homeTeamStats;
      returningTeam.kickReturns += 1;
      returningTeam.kickoffReturnYards += kickoffYards;
    }

    // 터치다운 처리
    if (significantPlays.includes('TOUCHDOWN')) {
      offenseStats.touchdowns += 1;
    }

    // 인터셉트 처리
    if (PlayAnalysisHelper.hasSignificantPlay(significantPlays, SIGNIFICANT_PLAY.INTERCEPT)) {
      defenseStats.interceptions += 1;
      if (gainYard > 0) {
        defenseStats.interceptionReturnYards += gainYard;
      }
    }

    // 색 처리
    if (PlayAnalysisHelper.hasSignificantPlay(significantPlays, SIGNIFICANT_PLAY.SACK)) {
      defenseStats.sacks += 1;
      if (gainYard < 0) {
        offenseStats.sackYards += Math.abs(gainYard);
      }
    }

    // 펌블 처리
    if (PlayAnalysisHelper.hasSignificantPlay(significantPlays, SIGNIFICANT_PLAY.FUMBLE)) {
      offenseStats.fumbles += 1;
    }

    // 필드골 처리
    if (playType === 'FIELDGOAL' || playType === 'FieldGoal') {
      offenseStats.fieldGoalAttempts += 1;
      if (significantPlays.includes('FIELDGOAL') || significantPlays.includes('FG')) {
        offenseStats.fieldGoals += 1;
      }
    }
  }

  async saveTeamStats(gameKey: string, teamStatsResult: TeamStatsResult, gameData: any): Promise<void> {
    console.log('팀 스탯 저장:', gameKey);
    // TODO: 실제 저장 로직 구현
  }

  async getTeamStatsByGame(gameKey: string): Promise<TeamStatsResult | null> {
    console.log('팀 스탯 조회:', gameKey);
    // TODO: 게임별 팀 스탯 조회 로직 구현
    return null;
  }

  async getAllTeamTotalStats() {
    console.log('모든 팀 누적 스탯 조회');
    // TODO: 모든 팀 누적 스탯 조회 로직 구현
    return [];
  }

  private createEmptyStats(teamName: string): TeamStatsData {
    return {
      teamName,
      totalYards: 0,
      passingYards: 0,
      rushingYards: 0,
      interceptionReturnYards: 0,
      puntReturnYards: 0,
      kickoffReturnYards: 0,
      turnovers: 0,
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
      rushingAttempts: 0,
      interceptions: 0,
      sacks: 0,
      kickReturns: 0,
      puntReturns: 0,
      totalReturnYards: 0,
      penalties: 0,
      touchbacks: 0,
      fieldGoalAttempts: 0,
    };
  }
}