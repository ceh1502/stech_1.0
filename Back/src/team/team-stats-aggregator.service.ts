import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { TeamSeasonStats, TeamSeasonStatsDocument } from '../schemas/team-season-stats.schema';

@Injectable()
export class TeamStatsAggregatorService {
  constructor(
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
    @InjectModel(TeamSeasonStats.name) private teamSeasonStatsModel: Model<TeamSeasonStatsDocument>,
  ) {}

  async aggregateTeamStats(season: string = '2024'): Promise<any> {
    console.log(`🏆 팀 스탯 집계 시작 - 시즌: ${season}`);
    
    // 모든 선수 데이터 가져오기
    const players = await this.playerModel.find({ season }).exec();
    console.log(`📊 총 ${players.length}명의 선수 데이터 처리 중...`);

    // 팀별로 그룹화
    const teamStatsMap = new Map<string, any>();

    for (const player of players) {
      const teamName = player.teamName;
      
      if (!teamStatsMap.has(teamName)) {
        teamStatsMap.set(teamName, {
          teamName,
          season,
          totalPoints: 0,
          totalTouchdowns: 0,
          totalYards: 0,
          gamesPlayed: 0,
          rushingAttempts: 0,
          rushingYards: 0,
          rushingTouchdowns: 0,
          passAttempts: 0,
          passCompletions: 0,
          passingYards: 0,
          passingTouchdowns: 0,
          interceptions: 0,
          totalPuntYards: 0,
          totalPunts: 0,
          puntTouchbacks: 0,
          fieldGoalAttempts: 0,
          fieldGoalMakes: 0,
          kickReturnYards: 0,
          kickReturns: 0,
          puntReturnYards: 0,
          puntReturns: 0,
          fumbles: 0,
          fumblesLost: 0,
          totalTurnovers: 0,
          opponentTurnovers: 0,
          penalties: 0,
          penaltyYards: 0,
          extraPointsMade: 0,
          safeties: 0,
          processedGames: []
        });
      }

      const teamStats = teamStatsMap.get(teamName);

      // 포지션별 스탯 집계
      if (player.stats) {
        // QB 스탯 집계
        if (player.stats.QB) {
          const qb = player.stats.QB;
          teamStats.passAttempts += qb.passingAttempts || 0;
          teamStats.passCompletions += qb.passingCompletions || 0;
          teamStats.passingYards += qb.passingYards || 0;
          teamStats.passingTouchdowns += qb.passingTouchdowns || 0;
          teamStats.interceptions += qb.passingInterceptions || 0;
          teamStats.rushingAttempts += qb.rushingAttempts || 0;
          teamStats.rushingYards += qb.rushingYards || 0;
          teamStats.rushingTouchdowns += qb.rushingTouchdowns || 0;
        }

        // RB 스탯 집계
        if (player.stats.RB) {
          const rb = player.stats.RB;
          teamStats.rushingAttempts += rb.rbRushingAttempts || 0;
          teamStats.rushingYards += rb.rbRushingYards || 0;
          teamStats.rushingTouchdowns += rb.rbRushingTouchdowns || 0;
          teamStats.fumbles += rb.fumbles || 0;
          teamStats.fumblesLost += rb.fumblesLost || 0;
        }

        // WR 스탯 집계
        if (player.stats.WR) {
          const wr = player.stats.WR;
          teamStats.rushingAttempts += wr.wrRushingAttempts || 0;
          teamStats.rushingYards += wr.wrRushingYards || 0;
          teamStats.rushingTouchdowns += wr.wrRushingTouchdowns || 0;
          teamStats.fumbles += wr.fumbles || 0;
          teamStats.fumblesLost += wr.fumblesLost || 0;
          // 리시빙 스탯도 포함
          teamStats.kickReturnYards += wr.kickReturnYards || 0;
          teamStats.kickReturns += wr.kickReturns || 0;
          teamStats.puntReturnYards += wr.puntReturnYards || 0;
          teamStats.puntReturns += wr.puntReturns || 0;
        }

        // TE 스탯 집계
        if (player.stats.TE) {
          const te = player.stats.TE;
          teamStats.rushingAttempts += te.teRushingAttempts || 0;
          teamStats.rushingYards += te.teRushingYards || 0;
          teamStats.rushingTouchdowns += te.teRushingTouchdowns || 0;
          teamStats.fumbles += te.fumbles || 0;
          teamStats.fumblesLost += te.fumblesLost || 0;
        }

        // K 스탯 집계
        if (player.stats.K) {
          const k = player.stats.K;
          teamStats.fieldGoalAttempts += k.fieldGoalsAttempted || 0;
          teamStats.fieldGoalMakes += k.fieldGoalsMade || 0;
          teamStats.extraPointsMade += k.extraPointsMade || 0;
        }

        // P 스탯 집계
        if (player.stats.P) {
          const p = player.stats.P;
          teamStats.totalPunts += p.puntCount || 0;
          teamStats.totalPuntYards += p.puntYards || 0;
          teamStats.puntTouchbacks += p.touchbacks || 0;
        }

        // OL 스탯은 개별 선수 스탯이지만 팀 페널티에 기여할 수 있음
        if (player.stats.OL) {
          const ol = player.stats.OL;
          teamStats.penalties += ol.penalties || 0;
        }

        // 게임 수 계산 (최대값 사용)
        teamStats.gamesPlayed = Math.max(teamStats.gamesPlayed, player.stats.totalGamesPlayed || 0);
      }
    }

    // 각 팀별로 최종 계산 및 저장
    const results = [];
    for (const [teamName, stats] of teamStatsMap) {
      // 총 전진야드 = 패싱야드 + 러싱야드
      stats.totalYards = stats.passingYards + stats.rushingYards;
      
      // 총 터치다운 = 패싱TD + 러싱TD
      stats.totalTouchdowns = stats.passingTouchdowns + stats.rushingTouchdowns;
      
      // 총 득점 = TD*6 + FG*3 + XP*1 + Safety*2
      stats.totalPoints = (stats.totalTouchdowns * 6) + (stats.fieldGoalMakes * 3) + (stats.extraPointsMade * 1) + (stats.safeties * 2);
      
      // 총 턴오버 = 인터셉트 + 펌블 로스트
      stats.totalTurnovers = stats.interceptions + stats.fumblesLost;

      // 데이터베이스에 저장 또는 업데이트
      const savedStats = await this.saveTeamStats(stats);
      results.push(savedStats);

      console.log(`🏆 ${teamName} 팀 스탯 집계 완료:`);
      console.log(`   총 득점: ${stats.totalPoints} (TD: ${stats.totalTouchdowns}, FG: ${stats.fieldGoalMakes}, XP: ${stats.extraPointsMade})`);
      console.log(`   총 야드: ${stats.totalYards} (패싱: ${stats.passingYards}, 러싱: ${stats.rushingYards})`);
      console.log(`   경기 수: ${stats.gamesPlayed}`);
    }

    return {
      success: true,
      message: `${teamStatsMap.size}개 팀의 스탯이 집계되었습니다.`,
      teams: results
    };
  }

  private async saveTeamStats(teamStats: any): Promise<any> {
    try {
      // 기존 팀 스탯 찾기
      let existingTeamStats = await this.teamSeasonStatsModel.findOne({
        teamName: teamStats.teamName,
        season: teamStats.season,
      });

      if (!existingTeamStats) {
        // 새 팀 스탯 생성
        console.log(`🆕 새 팀 스탯 생성: ${teamStats.teamName} (${teamStats.season})`);
        existingTeamStats = new this.teamSeasonStatsModel(teamStats);
      } else {
        // 기존 팀 스탯 업데이트
        console.log(`🔄 기존 팀 스탯 업데이트: ${teamStats.teamName}`);
        Object.assign(existingTeamStats, teamStats);
      }

      await existingTeamStats.save();
      return {
        success: true,
        teamName: teamStats.teamName,
        stats: existingTeamStats.toObject()
      };
    } catch (error) {
      console.error(`❌ ${teamStats.teamName} 팀 스탯 저장 실패:`, error);
      return {
        success: false,
        error: error.message,
        teamName: teamStats.teamName
      };
    }
  }
}