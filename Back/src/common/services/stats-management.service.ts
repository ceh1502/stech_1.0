import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PlayerGameStats, PlayerGameStatsDocument } from '../../schemas/player-game-stats.schema';
import {
  PlayerSeasonStats,
  PlayerSeasonStatsDocument,
} from '../../schemas/player-season-stats.schema';
import {
  PlayerTotalStats,
  PlayerTotalStatsDocument,
} from '../../schemas/player-total-stats.schema';
import { Player, PlayerDocument } from '../../schemas/player.schema';
import { TeamTotalStats, TeamTotalStatsDocument } from '../../schemas/team-total-stats.schema';
import { NewClipDto } from '../dto/new-clip.dto';

@Injectable()
export class StatsManagementService {
  constructor(
    @InjectModel(PlayerGameStats.name)
    private playerGameStatsModel: Model<PlayerGameStatsDocument>,
    @InjectModel(PlayerSeasonStats.name)
    private playerSeasonStatsModel: Model<PlayerSeasonStatsDocument>,
    @InjectModel(PlayerTotalStats.name)
    private playerTotalStatsModel: Model<PlayerTotalStatsDocument>,
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
    @InjectModel(TeamTotalStats.name)
    private teamTotalStatsModel: Model<TeamTotalStatsDocument>,
  ) {}

  /**
   * 게임 스탯 업데이트 (가장 기본 단위)
   */
  async updateGameStats(
    playerNumber: number,
    gameKey: string,
    gameDate: Date,
    homeTeam: string,
    awayTeam: string,
    analyzedStats: any,
  ) {
    const player = await this.playerModel.findOne({
      jerseyNumber: playerNumber,
    });
    if (!player) {
      throw new Error(`등번호 ${playerNumber}번 선수를 찾을 수 없습니다.`);
    }

    // 게임 스탯 업데이트 또는 생성
    const gameStats = await this.playerGameStatsModel.findOneAndUpdate(
      {
        playerId: player._id,
        gameKey: gameKey,
      },
      {
        $set: {
          playerNumber: playerNumber,
          gameDate: gameDate,
          homeTeam: homeTeam,
          awayTeam: awayTeam,
          position: player.primaryPosition || player.positions?.[0] || 'Unknown',
          gamesPlayed: 1,
          ...analyzedStats,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    // 시즌 스탯 업데이트
    await this.updateSeasonStats(
      player._id as Types.ObjectId,
      player.primaryPosition || player.positions?.[0] || 'Unknown',
      player.league,
      player.season,
      analyzedStats,
      gameKey,
    );

    // 커리어 스탯 업데이트
    await this.updateCareerStats(
      player._id as Types.ObjectId,
      player.primaryPosition || player.positions?.[0] || 'Unknown',
      player.season,
      analyzedStats,
    );

    return gameStats;
  }

  /**
   * 시즌 스탯 업데이트 (게임 스탯들의 집계)
   */
  private async updateSeasonStats(
    playerId: Types.ObjectId,
    position: string,
    league: string,
    season: string,
    newStats: any,
    gameKey: string,
  ) {
    const seasonStats = await this.playerSeasonStatsModel.findOne({
      playerId: playerId,
      season: season,
    });

    if (!seasonStats) {
      // 새로운 시즌 스탯 생성
      const newSeasonStats = new this.playerSeasonStatsModel({
        playerId: playerId,
        playerNumber: await this.getPlayerNumber(playerId),
        season: season,
        position: position,
        league: league,
        gamesPlayed: 1,
        gameKeys: [gameKey],
        ...newStats,
      });
      await newSeasonStats.save();
    } else {
      // 기존 시즌 스탯 업데이트
      const updateData: any = {};

      // 게임 키 추가 (중복 제거)
      if (!seasonStats.gameKeys.includes(gameKey)) {
        updateData.gameKeys = [...seasonStats.gameKeys, gameKey];
        updateData.gamesPlayed = seasonStats.gamesPlayed + 1;
      }

      // 누적 스탯 업데이트
      this.accumulateStats(updateData, seasonStats, newStats);

      await this.playerSeasonStatsModel.findByIdAndUpdate(seasonStats._id, {
        $set: updateData,
      });
    }
  }

  /**
   * 커리어 스탯 업데이트 (모든 시즌들의 집계)
   */
  private async updateCareerStats(
    playerId: Types.ObjectId,
    position: string,
    season: string,
    newStats: any,
  ) {
    const careerStats = await this.playerTotalStatsModel.findOne({
      playerId: playerId,
    });

    if (!careerStats) {
      // 새로운 커리어 스탯 생성
      const newCareerStats = new this.playerTotalStatsModel({
        playerId: playerId,
        playerNumber: await this.getPlayerNumber(playerId),
        position: position,
        seasonsPlayed: [season],
        totalGamesPlayed: 1,
        totalSeasons: 1,
        ...newStats,
      });
      await newCareerStats.save();
    } else {
      // 기존 커리어 스탯 업데이트
      const updateData: any = {};

      // 시즌 추가 (중복 제거)
      if (!careerStats.seasonsPlayed.includes(season)) {
        updateData.seasonsPlayed = [...careerStats.seasonsPlayed, season];
        updateData.totalSeasons = careerStats.totalSeasons + 1;
      }

      updateData.totalGamesPlayed = careerStats.totalGamesPlayed + 1;

      // 누적 스탯 업데이트
      this.accumulateStats(updateData, careerStats, newStats);

      // 최고 기록 업데이트
      this.updateCareerRecords(updateData, careerStats, newStats, season);

      await this.playerTotalStatsModel.findByIdAndUpdate(careerStats._id, {
        $set: updateData,
      });
    }
  }

  /**
   * 스탯 누적 계산
   */
  private accumulateStats(updateData: any, existingStats: any, newStats: any) {
    // 누적 가능한 스탯들
    const accumulativeStats = [
      'passingYards',
      'passingTouchdowns',
      'passingInterceptions',
      'completions',
      'passingAttempts',
      'rushingYards',
      'rushingTouchdowns',
      'rushingAttempts',
      'rushingFirstDowns',
      'receivingYards',
      'receivingTouchdowns',
      'receptions',
      'receivingTargets',
      'receivingFirstDowns',
      'kickoffReturnYards',
      'kickoffReturns',
      'kickoffReturnTouchdowns',
      'puntReturnYards',
      'puntReturns',
      'puntReturnTouchdowns',
      'totalYards',
      'totalTouchdowns',
      'fieldGoalsMade',
      'fieldGoalAttempts',
      'extraPointsMade',
      'extraPointAttempts',
      'kickoffYards',
      'kickoffs',
      'kickoffTouchbacks',
      'inside20Kicks',
      'inside10Kicks',
      'fieldGoals0_29',
      'fieldGoals30_39',
      'fieldGoals40_49',
      'fieldGoals50Plus',
      'totalKickingPoints',
      'puntingYards',
      'punts',
      'puntsInside20',
      'puntTouchbacks',
      'blockedPunts',
      'pancakeBlocks',
      'penalties',
      'tackles',
      'assistedTackles',
      'totalTackles',
      'tacklesForLoss',
      'quarterbackSacks',
      'interceptions',
      'passesDefended',
      'forcedFumbles',
      'fumbleRecoveries',
      'defensiveTouchdowns',
      'sacks',
      'rushing20Plus',
      'fumbles',
      'redZoneAttempts',
      'redZoneCompletions',
      'thirdDownAttempts',
      'thirdDownCompletions',
      'rushes20Plus',
      'catches20Plus',
    ];

    accumulativeStats.forEach((stat) => {
      if (newStats[stat] !== undefined) {
        updateData[stat] = (existingStats[stat] || 0) + newStats[stat];
      }
    });

    // 평균 계산이 필요한 스탯들
    if (
      updateData.passingAttempts > 0 &&
      updateData.completions !== undefined
    ) {
      updateData.completionPercentage =
        Math.round(
          (updateData.completions / updateData.passingAttempts) * 100 * 10,
        ) / 10;
    }

    if (
      updateData.rushingAttempts > 0 &&
      updateData.rushingYards !== undefined
    ) {
      updateData.yardsPerCarry =
        Math.round(
          (updateData.rushingYards / updateData.rushingAttempts) * 10,
        ) / 10;
    }

    if (updateData.receptions > 0 && updateData.receivingYards !== undefined) {
      updateData.yardsPerReception =
        Math.round((updateData.receivingYards / updateData.receptions) * 10) /
        10;
    }

    if (
      updateData.fieldGoalAttempts > 0 &&
      updateData.fieldGoalsMade !== undefined
    ) {
      updateData.fieldGoalPercentage =
        Math.round(
          (updateData.fieldGoalsMade / updateData.fieldGoalAttempts) * 100 * 10,
        ) / 10;
    }

    if (
      updateData.extraPointAttempts > 0 &&
      updateData.extraPointsMade !== undefined
    ) {
      updateData.extraPointPercentage =
        Math.round(
          (updateData.extraPointsMade / updateData.extraPointAttempts) *
            100 *
            10,
        ) / 10;
    }

    if (updateData.punts > 0 && updateData.puntingYards !== undefined) {
      updateData.puntAverage =
        Math.round((updateData.puntingYards / updateData.punts) * 10) / 10;
    }

    // 최대값 업데이트
    const maxStats = [
      'longestPass',
      'longestRush',
      'longestReception',
      'longestFieldGoal',
      'longestPunt',
    ];
    maxStats.forEach((stat) => {
      if (newStats[stat] !== undefined) {
        updateData[stat] = Math.max(existingStats[stat] || 0, newStats[stat]);
      }
    });
  }

  /**
   * 커리어 기록 업데이트
   */
  private updateCareerRecords(
    updateData: any,
    careerStats: any,
    newStats: any,
    season: string,
  ) {
    // 시즌 최고 야드 기록 체크
    if (
      newStats.totalYards &&
      newStats.totalYards > (careerStats.bestSeasonYards || 0)
    ) {
      updateData.bestSeasonYards = newStats.totalYards;
      updateData.bestSeasonYear = season;
    }

    // 시즌 최다 터치다운 기록 체크
    if (
      newStats.totalTouchdowns &&
      newStats.totalTouchdowns > (careerStats.mostTouchdownsInSeason || 0)
    ) {
      updateData.mostTouchdownsInSeason = newStats.totalTouchdowns;
    }
  }

  /**
   * 특정 선수의 게임별 스탯 조회
   */
  async getPlayerGameStats(playerNumber: number, season?: string) {
    const player = await this.playerModel.findOne({
      jerseyNumber: playerNumber,
    });
    if (!player) {
      throw new Error(`등번호 ${playerNumber}번 선수를 찾을 수 없습니다.`);
    }

    const query: any = { playerId: player._id };
    if (season) {
      // 시즌으로 필터링하려면 gameKey에 시즌 정보가 포함되어 있다고 가정
      query.gameKey = { $regex: season };
    }

    return await this.playerGameStatsModel.find(query).sort({ gameDate: -1 });
  }

  /**
   * 특정 선수의 시즌 스탯 조회
   */
  async getPlayerSeasonStats(playerNumber: number, season?: string) {
    const player = await this.playerModel.findOne({
      jerseyNumber: playerNumber,
    });
    if (!player) {
      throw new Error(`등번호 ${playerNumber}번 선수를 찾을 수 없습니다.`);
    }

    const query: any = { playerId: player._id };
    if (season) {
      query.season = season;
    }

    return await this.playerSeasonStatsModel.find(query).sort({ season: -1 });
  }

  /**
   * 특정 선수의 커리어 스탯 조회
   */
  async getPlayerCareerStats(playerNumber: number) {
    const player = await this.playerModel.findOne({
      jerseyNumber: playerNumber,
    });
    if (!player) {
      throw new Error(`등번호 ${playerNumber}번 선수를 찾을 수 없습니다.`);
    }

    return await this.playerTotalStatsModel.findOne({ playerId: player._id });
  }

  /**
   * 리그별 랭킹 조회 (시즌 기준)
   */
  async getSeasonRankings(
    season: string,
    league: string,
    position?: string,
    sortBy: string = 'totalYards',
  ) {
    const query: any = { season, league };
    if (position) {
      query.position = position;
    }

    const sort: any = {};
    sort[sortBy] = -1; // 내림차순

    return await this.playerSeasonStatsModel
      .find(query)
      .sort(sort)
      .limit(50)
      .populate('playerId', 'name jerseyNumber teamId');
  }

  /**
   * 커리어 랭킹 조회
   */
  async getCareerRankings(position?: string, sortBy: string = 'totalYards') {
    const query: any = { isActive: true };
    if (position) {
      query.position = position;
    }

    const sort: any = {};
    sort[sortBy] = -1;

    return await this.playerTotalStatsModel
      .find(query)
      .sort(sort)
      .limit(50)
      .populate('playerId', 'name jerseyNumber teamId');
  }

  /**
   * 유틸리티: 선수 번호 가져오기
   */
  private async getPlayerNumber(playerId: Types.ObjectId): Promise<number> {
    const player = await this.playerModel.findById(playerId);
    return player ? player.jerseyNumber : 0;
  }

  /**
   * 특정 게임의 모든 선수 스탯 업데이트
   */
  async updateMultiplePlayersGameStats(
    gameKey: string,
    gameDate: Date,
    homeTeam: string,
    awayTeam: string,
    playersStats: Array<{ playerNumber: number; analyzedStats: any }>,
  ) {
    const results: Array<{
      success: boolean;
      playerNumber: number;
      data?: any;
      error?: string;
    }> = [];

    for (const playerStat of playersStats) {
      try {
        const result = await this.updateGameStats(
          playerStat.playerNumber,
          gameKey,
          gameDate,
          homeTeam,
          awayTeam,
          playerStat.analyzedStats,
        );
        results.push({
          success: true,
          playerNumber: playerStat.playerNumber,
          data: result,
        });
      } catch (error) {
        results.push({
          success: false,
          playerNumber: playerStat.playerNumber,
          error: error.message,
        });
      }
    }

    return results;
  }

  /**
   * 팀 누적 스탯 초기화
   */
  async resetTeamTotalStats() {
    const result = await this.teamTotalStatsModel.deleteMany({});
    console.log(`🗑️ ${result.deletedCount}개 팀의 누적 스탯이 삭제되었습니다`);
    return { deletedCount: result.deletedCount };
  }
}
