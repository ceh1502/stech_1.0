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
}

@Injectable()
export class TeamStatsAnalyzerService {
  constructor(
    @InjectModel(TeamGameStats.name)
    private teamGameStatsModel: Model<TeamGameStatsDocument>,
    @InjectModel(TeamTotalStats.name)
    private teamTotalStatsModel: Model<TeamTotalStatsDocument>,
  ) {}

  /**
   * 게임 클립 데이터에서 양팀 스탯 자동 계산
   */
  async analyzeTeamStats(gameData: any): Promise<TeamStatsResult> {
    console.log('🏈 팀 스탯 분석 시작:', gameData.gameKey);
    console.log('📊 총 클립 수:', gameData.Clips?.length || 0);
    const homeTeamStats: TeamStatsData = {
      teamName: gameData.homeTeam || 'Home',
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
    };

    const awayTeamStats: TeamStatsData = {
      teamName: gameData.awayTeam || 'Away',
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
    };

    // 각 클립 분석
    let clipIndex = 0;
    for (const clip of gameData.Clips || []) {
      clipIndex++;
      console.log(
        `📎 클립 ${clipIndex}/${gameData.Clips.length}: ${clip.playType}, 야드: ${clip.gainYard}, 공격팀: ${clip.offensiveTeam}`,
      );
      await this.analyzeClip(clip, homeTeamStats, awayTeamStats);
    }

    console.log('🏠 홈팀 중간 결과:', homeTeamStats);
    console.log('✈️ 어웨이팀 중간 결과:', awayTeamStats);

    // 총 야드 계산
    homeTeamStats.totalYards =
      homeTeamStats.passingYards +
      homeTeamStats.rushingYards +
      homeTeamStats.interceptionReturnYards +
      homeTeamStats.puntReturnYards +
      homeTeamStats.kickoffReturnYards;

    awayTeamStats.totalYards =
      awayTeamStats.passingYards +
      awayTeamStats.rushingYards +
      awayTeamStats.interceptionReturnYards +
      awayTeamStats.puntReturnYards +
      awayTeamStats.kickoffReturnYards;

    // 러싱야드에서 sack 야드 차감
    homeTeamStats.rushingYards -= homeTeamStats.sackYards;
    awayTeamStats.rushingYards -= awayTeamStats.sackYards;

    return {
      homeTeamStats,
      awayTeamStats,
    };
  }

  /**
   * 개별 클립 분석
   */
  private async analyzeClip(
    clip: any,
    homeTeamStats: TeamStatsData,
    awayTeamStats: TeamStatsData,
  ): Promise<void> {
    const gainYard = clip.gainYard || 0;
    const playType = clip.playType;
    const significantPlays = clip.significantPlays || [];
    const offensiveTeam = clip.offensiveTeam;

    // 공격팀과 수비팀 결정
    const isHomeOffense = offensiveTeam === 'Home';
    const offenseStats = isHomeOffense ? homeTeamStats : awayTeamStats;
    const defenseStats = isHomeOffense ? awayTeamStats : homeTeamStats;

    // 1. 패싱 야드 계산
    if (playType === 'PASS' || playType === 'PassComplete') {
      if (gainYard > 0) {
        offenseStats.passingYards += gainYard;
        console.log(`  ✅ 패싱야드 추가: ${gainYard}야드 (${offensiveTeam})`);
      }
    }

    // 2. 러싱 야드 계산
    else if (playType === 'RUN' || playType === 'Run') {
      if (gainYard > 0) {
        offenseStats.rushingYards += gainYard;
        console.log(`  ✅ 러싱야드 추가: ${gainYard}야드 (${offensiveTeam})`);
      }
    }

    // 3. Sack 야드 계산 (러싱야드에서 차감할 용도)
    if (
      PlayAnalysisHelper.hasSignificantPlay(
        significantPlays,
        SIGNIFICANT_PLAY.SACK,
      )
    ) {
      if (gainYard < 0) {
        offenseStats.sackYards += Math.abs(gainYard);
      }
    }

    // 4. 인터셉트 리턴 야드
    if (
      PlayAnalysisHelper.hasSignificantPlay(
        significantPlays,
        SIGNIFICANT_PLAY.INTERCEPT,
      )
    ) {
      // 인터셉트 후 리턴한 야드는 수비팀에게
      if (gainYard > 0) {
        defenseStats.interceptionReturnYards += gainYard;
      }
    }

    // 5. 펀트 관련 처리
    if (playType === 'PUNT' || playType === 'Punt') {
      // 펀트 시도는 항상 +1
      offenseStats.puntAttempts += 1;
      
      // tkl이 있으면 블록당한 것 → 펀트 야드 +0
      const isBlocked = clip.tkl || clip.tkl2;
      
      if (isBlocked) {
        console.log(`  🚫 펀트 블록당함: 펀터 스탯 변동없음, 팀 펀트시도 +1, 야드 +0`);
        // 펀트 야드는 0 추가 (블록당했으므로)
        offenseStats.puntYards += 0;
      } else {
        // 정상 펀트
        const puntYards = Math.abs(gainYard); // 펀트는 항상 양수로 계산
        offenseStats.puntYards += puntYards;
        console.log(`  ✅ 정상 펀트: ${puntYards}야드`);
        
        // 펀트 리턴이 있는 경우 (리턴팀은 수비팀)
        if (gainYard > 0) {
          defenseStats.puntReturnYards += gainYard;
          console.log(`  ✅ 펀트리턴야드 추가: ${gainYard}야드`);
        }
      }
    }

    // 6. 킥오프 리턴 야드
    if (playType === 'KICKOFF' || playType === 'Kickoff') {
      // 킥오프 리턴 (리턴팀은 수비팀)
      if (gainYard > 0) {
        defenseStats.kickoffReturnYards += gainYard;
        console.log(`  ✅ 킥오프리턴야드 추가: ${gainYard}야드`);
      }
    }

    // 7. 턴오버 계산
    if (
      PlayAnalysisHelper.hasSignificantPlay(
        significantPlays,
        SIGNIFICANT_PLAY.TURNOVER,
      )
    ) {
      offenseStats.turnovers += 1;
    }

    // 펌블 처리 (모든 포지션에서 팀 스탯에 반영)
    if (
      PlayAnalysisHelper.hasSignificantPlay(
        significantPlays,
        SIGNIFICANT_PLAY.FUMBLE,
      )
    ) {
      // 펌블 발생은 항상 팀 스탯에 +1
      offenseStats.fumbles += 1;
      console.log(`  🏈 펌블 발생: ${offensiveTeam} 팀`);
      
      // 펌블을 잃었으면 턴오버 추가
      if (
        PlayAnalysisHelper.hasSignificantPlay(
          significantPlays,
          SIGNIFICANT_PLAY.FUMBLERECDEF,
        )
      ) {
        offenseStats.turnovers += 1;
        offenseStats.fumblesLost += 1;
        console.log(`  💔 펌블 턴오버: ${offensiveTeam} 팀`);
      }
    }

    if (
      PlayAnalysisHelper.hasSignificantPlay(
        significantPlays,
        SIGNIFICANT_PLAY.INTERCEPT,
      )
    ) {
      offenseStats.turnovers += 1;
    }

    // 8. 페널티 야드 (나중에 구현 예정)
    // TODO: penalty 정보가 JSON에 포함되면 구현
  }

  /**
   * 데이터베이스에 팀 스탯 저장 (경기별 + 누적)
   */
  async saveTeamStats(
    gameKey: string,
    teamStatsResult: TeamStatsResult,
    gameData: any,
  ): Promise<void> {
    // 홈팀 스탯 저장
    await this.saveTeamGameStats(
      gameKey,
      teamStatsResult.homeTeamStats,
      teamStatsResult.awayTeamStats.teamName,
      true,
      gameData,
    );
    await this.updateTeamTotalStats(teamStatsResult.homeTeamStats);

    // 어웨이팀 스탯 저장
    await this.saveTeamGameStats(
      gameKey,
      teamStatsResult.awayTeamStats,
      teamStatsResult.homeTeamStats.teamName,
      false,
      gameData,
    );
    await this.updateTeamTotalStats(teamStatsResult.awayTeamStats);
  }

  /**
   * 경기별 팀 스탯 저장
   */
  private async saveTeamGameStats(
    gameKey: string,
    teamStats: TeamStatsData,
    opponent: string,
    isHomeGame: boolean,
    gameData: any,
  ): Promise<void> {
    const gameStats = {
      teamName: teamStats.teamName,
      gameKey,
      date: gameData.date || new Date().toISOString(),
      season: gameData.date ? gameData.date.substring(0, 4) : new Date().getFullYear().toString(),
      opponent,
      isHomeGame,
      gameResult: null, // 추후 점수 계산 로직 추가
      stats: {
        totalYards: teamStats.totalYards,
        passingYards: teamStats.passingYards,
        rushingYards: teamStats.rushingYards,
        turnovers: teamStats.turnovers,
        puntAttempts: teamStats.puntAttempts,
        puntYards: teamStats.puntYards,
        fumbles: teamStats.fumbles,
        fumblesLost: teamStats.fumblesLost,
      },
      finalScore: gameData.finalScore || { own: 0, opponent: 0 },
    };

    await this.teamGameStatsModel.findOneAndUpdate(
      { teamName: teamStats.teamName, gameKey },
      gameStats,
      { upsert: true, new: true }
    );
    
    console.log(`✅ ${teamStats.teamName} 경기별 스탯 저장 완료`);
  }

  /**
   * 누적 팀 스탯 업데이트
   */
  private async updateTeamTotalStats(teamStats: TeamStatsData): Promise<void> {
    const totalStats = await this.teamTotalStatsModel.findOne({
      teamName: teamStats.teamName,
    });

    if (totalStats) {
      // 기존 누적 스탯 업데이트
      totalStats.stats.totalYards = (totalStats.stats.totalYards || 0) + teamStats.totalYards;
      totalStats.stats.passingYards = (totalStats.stats.passingYards || 0) + teamStats.passingYards;
      totalStats.stats.rushingYards = (totalStats.stats.rushingYards || 0) + teamStats.rushingYards;
      totalStats.stats.turnovers = (totalStats.stats.turnovers || 0) + teamStats.turnovers;
      totalStats.stats.fumbles = (totalStats.stats.fumbles || 0) + teamStats.fumbles;
      totalStats.stats.fumblesLost = (totalStats.stats.fumblesLost || 0) + teamStats.fumblesLost;
      
      // 펀트 관련
      const newPuntAttempts = (totalStats.stats.puntAttempts || 0) + teamStats.puntAttempts;
      const newPuntYards = (totalStats.stats.puntYards || 0) + teamStats.puntYards;
      totalStats.stats.puntAttempts = newPuntAttempts;
      totalStats.stats.puntYards = newPuntYards;
      totalStats.stats.avgPuntYards = newPuntAttempts > 0 ? newPuntYards / newPuntAttempts : 0;
      
      totalStats.gamesPlayed += 1;
      totalStats.lastUpdated = new Date();
      
      await totalStats.save();
    } else {
      // 새로운 팀 누적 스탯 생성
      await this.teamTotalStatsModel.create({
        teamName: teamStats.teamName,
        stats: {
          totalYards: teamStats.totalYards,
          passingYards: teamStats.passingYards,
          rushingYards: teamStats.rushingYards,
          turnovers: teamStats.turnovers,
          fumbles: teamStats.fumbles,
          fumblesLost: teamStats.fumblesLost,
          puntAttempts: teamStats.puntAttempts,
          puntYards: teamStats.puntYards,
          avgPuntYards: teamStats.puntAttempts > 0 ? teamStats.puntYards / teamStats.puntAttempts : 0,
        },
        gamesPlayed: 1,
        wins: 0,
        losses: 0,
        ties: 0,
        seasons: [teamStats.teamName.includes('2024') ? '2024' : new Date().getFullYear().toString()],
        gameKeys: [],
        lastUpdated: new Date(),
      });
    }
    
    console.log(`✅ ${teamStats.teamName} 누적 스탯 업데이트 완료`);
  }

  /**
   * 특정 게임의 팀 스탯 조회
   */
  async getTeamStatsByGame(gameKey: string): Promise<TeamStatsResult | null> {
    console.log('🔍 팀 스탯 조회 시작:', gameKey);
    const gameStats = await this.teamGameStatsModel.find({ gameKey });

    if (gameStats.length !== 2) {
      return null;
    }

    const homeStats = gameStats.find(stat => stat.isHomeGame);
    const awayStats = gameStats.find(stat => !stat.isHomeGame);

    if (!homeStats || !awayStats) {
      return null;
    }

    return {
      homeTeamStats: this.convertToTeamStatsData(homeStats),
      awayTeamStats: this.convertToTeamStatsData(awayStats),
    };
  }

  /**
   * 팀 누적 스탯 조회
   */
  async getTeamTotalStats(teamName: string) {
    return this.teamTotalStatsModel.findOne({ teamName });
  }

  /**
   * 데이터베이스 문서를 TeamStatsData로 변환
   */
  private convertToTeamStatsData(stats: TeamGameStatsDocument): TeamStatsData {
    return {
      teamName: stats.teamName,
      totalYards: stats.stats.totalYards || 0,
      passingYards: stats.stats.passingYards || 0,
      rushingYards: stats.stats.rushingYards || 0,
      interceptionReturnYards: 0, // team-game-stats 스키마에 추가 필요시
      puntReturnYards: 0, // team-game-stats 스키마에 추가 필요시
      kickoffReturnYards: 0, // team-game-stats 스키마에 추가 필요시
      turnovers: stats.stats.turnovers || 0,
      penaltyYards: 0, // team-game-stats 스키마에 추가 필요시
      sackYards: 0, // team-game-stats 스키마에 추가 필요시
      puntAttempts: stats.stats.puntAttempts || 0,
      puntYards: stats.stats.puntYards || 0,
      fumbles: stats.stats.fumbles || 0,
      fumblesLost: stats.stats.fumblesLost || 0,
    };
  }
}
