import {
  Controller,
  Get,
  UseGuards,
  Query,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { PlayerGameStats, PlayerGameStatsDocument } from '../schemas/player-game-stats.schema';
import { PlayerSeasonStats, PlayerSeasonStatsDocument } from '../schemas/player-season-stats.schema';
import { GameInfo, GameInfoDocument } from '../schemas/game-info.schema';
import { GameService } from '../game/game.service';
import { PlayerService } from '../player/player.service';

@ApiTags('Admin Dashboard')
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth('JWT-auth')
export class AdminDashboardController {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(PlayerGameStats.name) private playerGameStatsModel: Model<PlayerGameStatsDocument>,
    @InjectModel(PlayerSeasonStats.name) private playerSeasonStatsModel: Model<PlayerSeasonStatsDocument>,
    @InjectModel(GameInfo.name) private gameInfoModel: Model<GameInfoDocument>,
    private readonly gameService: GameService,
    private readonly playerService: PlayerService,
  ) {}

  @Get('dashboard')
  @ApiOperation({
    summary: '📊 Admin 대시보드 - 전체 시스템 통계',
    description: '시스템 전체의 통계 정보를 한눈에 볼 수 있는 대시보드',
  })
  @ApiResponse({
    status: 200,
    description: '✅ 대시보드 데이터 조회 성공',
    schema: {
      example: {
        success: true,
        data: {
          systemOverview: {
            totalUsers: 150,
            totalPlayers: 120,
            totalCoaches: 25,
            totalAdmins: 5,
            totalGames: 48,
            totalTeams: 12,
          },
          teamStatistics: [
            {
              teamName: 'HYLions',
              totalPlayers: 25,
              totalGames: 8,
              wins: 6,
              losses: 2,
            },
          ],
          recentActivity: {
            lastGameUpload: '2025-09-04',
            recentLogins: 45,
            activeToday: 32,
          },
        },
      },
    },
  })
  async getDashboard() {
    // 전체 사용자 통계
    const totalUsers = await this.userModel.countDocuments();
    const usersByRole = await this.userModel.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    // 전체 게임 통계
    const totalGames = await this.gameInfoModel.countDocuments();
    const allGames = await this.gameInfoModel.find();
    
    // 팀별 통계 계산
    const teamStats = new Map();
    allGames.forEach(game => {
      // 홈팀 처리
      if (!teamStats.has(game.homeTeam)) {
        teamStats.set(game.homeTeam, { 
          teamName: game.homeTeam, 
          totalGames: 0, 
          wins: 0, 
          losses: 0 
        });
      }
      teamStats.get(game.homeTeam).totalGames++;
      
      // 어웨이팀 처리
      if (!teamStats.has(game.awayTeam)) {
        teamStats.set(game.awayTeam, { 
          teamName: game.awayTeam, 
          totalGames: 0, 
          wins: 0, 
          losses: 0 
        });
      }
      teamStats.get(game.awayTeam).totalGames++;
    });

    // 팀별 선수 수 계산
    const playersByTeam = await this.userModel.aggregate([
      { $match: { role: 'player', teamName: { $exists: true } } },
      {
        $group: {
          _id: '$teamName',
          playerCount: { $sum: 1 },
        },
      },
    ]);

    // 팀 통계에 선수 수 추가
    playersByTeam.forEach(item => {
      if (teamStats.has(item._id)) {
        teamStats.get(item._id).totalPlayers = item.playerCount;
      }
    });

    const roleStats: any = {};
    usersByRole.forEach(item => {
      roleStats[item._id || 'unknown'] = item.count;
    });

    return {
      success: true,
      message: 'Admin 대시보드 데이터 조회 성공',
      data: {
        systemOverview: {
          totalUsers,
          totalPlayers: roleStats.player || 0,
          totalCoaches: roleStats.coach || 0,
          totalAdmins: roleStats.admin || 0,
          totalGames,
          totalTeams: teamStats.size,
        },
        teamStatistics: Array.from(teamStats.values()),
        userStatistics: roleStats,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('all-users')
  @ApiOperation({
    summary: '👥 모든 사용자 목록 조회',
    description: 'Admin 전용 - 시스템의 모든 사용자 정보를 조회합니다.',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    description: '역할별 필터링 (player, coach, admin)',
    enum: ['player', 'coach', 'admin'],
  })
  @ApiQuery({
    name: 'team',
    required: false,
    description: '팀별 필터링',
  })
  @ApiResponse({
    status: 200,
    description: '✅ 사용자 목록 조회 성공',
  })
  async getAllUsers(
    @Query('role') role?: string,
    @Query('team') team?: string,
  ) {
    const filter: any = {};
    if (role) filter.role = role;
    if (team) filter.teamName = team;

    const users = await this.userModel.find(filter).select('-password');

    return {
      success: true,
      message: '모든 사용자 목록 조회 성공',
      data: users,
      totalCount: users.length,
      filters: { role, team },
    };
  }

  @Get('all-teams-stats')
  @ApiOperation({
    summary: '🏈 모든 팀 통계 조회',
    description: 'Admin 전용 - 모든 팀의 시즌 및 누적 통계를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '✅ 모든 팀 통계 조회 성공',
  })
  async getAllTeamsStats() {
    // 모든 게임에서 팀 목록 추출
    const games = await this.gameInfoModel.find();
    const teams = new Set<string>();
    
    games.forEach(game => {
      if (game.homeTeam) teams.add(game.homeTeam);
      if (game.awayTeam) teams.add(game.awayTeam);
    });

    const teamStatsArray = [];
    
    for (const teamName of teams) {
      // 팀의 모든 게임 찾기
      const teamGames = await this.gameInfoModel.find({
        $or: [
          { homeTeam: teamName },
          { awayTeam: teamName },
        ],
      });

      // 팀의 모든 선수 찾기
      const teamPlayers = await this.userModel.find({
        teamName,
        role: 'player',
      });

      teamStatsArray.push({
        teamName,
        totalGames: teamGames.length,
        totalPlayers: teamPlayers.length,
        gameKeys: teamGames.map(g => g.gameKey),
      });
    }

    return {
      success: true,
      message: '모든 팀 통계 조회 성공',
      data: teamStatsArray,
      totalTeams: teams.size,
    };
  }

  @Get('all-players-stats')
  @ApiOperation({
    summary: '🏃 모든 선수 통계 조회',
    description: 'Admin 전용 - 모든 선수의 개인 통계를 조회합니다.',
  })
  @ApiQuery({
    name: 'team',
    required: false,
    description: '팀별 필터링',
  })
  @ApiQuery({
    name: 'position',
    required: false,
    description: '포지션별 필터링',
  })
  @ApiResponse({
    status: 200,
    description: '✅ 모든 선수 통계 조회 성공',
  })
  async getAllPlayersStats(
    @Query('team') team?: string,
    @Query('position') position?: string,
  ) {
    const filter: any = { role: 'player' };
    if (team) filter.teamName = team;

    const players = await this.userModel.find(filter);
    const playerStatsArray = [];

    for (const player of players) {
      if (!player.playerId) continue;

      try {
        // 각 선수의 시즌 통계 조회
        const seasonStats = await this.playerSeasonStatsModel.findOne({
          playerId: player.playerId,
        });

        // 각 선수의 게임 수 계산
        const gameCount = await this.playerGameStatsModel.countDocuments({
          playerId: player.playerId,
        });

        playerStatsArray.push({
          playerId: player.playerId,
          username: player.username,
          teamName: player.teamName,
          position: seasonStats?.position || 'Unknown',
          gamesPlayed: gameCount,
          seasonStats: seasonStats || null,
        });
      } catch (error) {
        console.error(`Error fetching stats for player ${player.playerId}:`, error);
      }
    }

    // 포지션 필터링
    const filteredStats = position
      ? playerStatsArray.filter(p => p.position === position)
      : playerStatsArray;

    return {
      success: true,
      message: '모든 선수 통계 조회 성공',
      data: filteredStats,
      totalPlayers: filteredStats.length,
      filters: { team, position },
    };
  }

  @Get('system-logs')
  @ApiOperation({
    summary: '📜 시스템 로그 조회',
    description: 'Admin 전용 - 최근 게임 업로드 및 시스템 활동 로그',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: '조회할 로그 수 (기본: 50)',
  })
  @ApiResponse({
    status: 200,
    description: '✅ 시스템 로그 조회 성공',
  })
  async getSystemLogs(@Query('limit') limit: number = 50) {
    // 최근 게임 정보
    const recentGames = await this.gameInfoModel
      .find()
      .sort({ createdAt: -1 })
      .limit(Number(limit));

    // 최근 가입한 사용자
    const recentUsers = await this.userModel
      .find()
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(10);

    return {
      success: true,
      message: '시스템 로그 조회 성공',
      data: {
        recentGames: recentGames.map(game => ({
          gameKey: game.gameKey,
          date: game.date,
          teams: `${game.homeTeam} vs ${game.awayTeam}`,
          uploadedAt: (game as any).createdAt || new Date(),
        })),
        recentUsers: recentUsers.map(user => ({
          username: user.username,
          role: user.role,
          team: user.teamName,
          joinedAt: (user as any).createdAt || new Date(),
        })),
      },
    };
  }
}