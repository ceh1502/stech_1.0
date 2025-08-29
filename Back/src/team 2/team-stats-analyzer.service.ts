import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TeamStats, TeamStatsDocument } from '../schemas/team-stats.schema';
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
}

@Injectable()
export class TeamStatsAnalyzerService {
  constructor(
    @InjectModel(TeamStats.name)
    private teamStatsModel: Model<TeamStatsDocument>,
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

    // 5. 펀트 리턴 야드
    if (playType === 'PUNT' || playType === 'Punt') {
      // 펀트 리턴이 있는 경우 (리턴팀은 수비팀)
      if (gainYard > 0) {
        defenseStats.puntReturnYards += gainYard;
        console.log(`  ✅ 펀트리턴야드 추가: ${gainYard}야드`);
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

    // 펌블, 인터셉트도 턴오버로 계산
    if (
      PlayAnalysisHelper.hasSignificantPlay(
        significantPlays,
        SIGNIFICANT_PLAY.FUMBLE,
      )
    ) {
      if (
        PlayAnalysisHelper.hasSignificantPlay(
          significantPlays,
          SIGNIFICANT_PLAY.FUMBLERECDEF,
        )
      ) {
        offenseStats.turnovers += 1;
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
   * 데이터베이스에 팀 스탯 저장
   */
  async saveTeamStats(
    gameKey: string,
    teamStatsResult: TeamStatsResult,
  ): Promise<void> {
    // 홈팀 스탯 저장
    await this.saveTeamStatsToDb(
      gameKey,
      'home',
      teamStatsResult.homeTeamStats,
    );

    // 어웨이팀 스탯 저장
    await this.saveTeamStatsToDb(
      gameKey,
      'away',
      teamStatsResult.awayTeamStats,
    );
  }

  /**
   * 개별 팀 스탯을 데이터베이스에 저장
   */
  private async saveTeamStatsToDb(
    gameKey: string,
    homeAway: string,
    teamStats: TeamStatsData,
  ): Promise<void> {
    const existingStats = await this.teamStatsModel.findOne({
      gameKey,
      homeAway,
    });

    if (existingStats) {
      // 기존 기록 업데이트
      await this.teamStatsModel.updateOne(
        { gameKey, homeAway },
        {
          ...teamStats,
          updatedAt: new Date(),
        },
      );
    } else {
      // 새 기록 생성
      await this.teamStatsModel.create({
        gameKey,
        teamName: teamStats.teamName,
        homeAway,
        ...teamStats,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }

  /**
   * 특정 게임의 팀 스탯 조회
   */
  async getTeamStatsByGame(gameKey: string): Promise<TeamStatsResult | null> {
    console.log('🔍 팀 스탯 조회 시작:', gameKey);
    const homeStats = await this.teamStatsModel.findOne({
      gameKey,
      homeAway: 'home',
    });

    const awayStats = await this.teamStatsModel.findOne({
      gameKey,
      homeAway: 'away',
    });

    if (!homeStats || !awayStats) {
      return null;
    }

    return {
      homeTeamStats: this.convertToTeamStatsData(homeStats),
      awayTeamStats: this.convertToTeamStatsData(awayStats),
    };
  }

  /**
   * 데이터베이스 문서를 TeamStatsData로 변환
   */
  private convertToTeamStatsData(stats: TeamStatsDocument): TeamStatsData {
    return {
      teamName: stats.teamName,
      totalYards: stats.totalYards,
      passingYards: stats.passingYards,
      rushingYards: stats.rushingYards,
      interceptionReturnYards: stats.interceptionReturnYards,
      puntReturnYards: stats.puntReturnYards,
      kickoffReturnYards: stats.kickoffReturnYards,
      turnovers: stats.turnovers,
      penaltyYards: stats.penaltyYards,
      sackYards: stats.sackYards,
    };
  }
}
