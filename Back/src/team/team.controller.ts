import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TeamService } from './team.service';
import { TeamStatsAnalyzerService } from './team-stats-analyzer.service';
import { CreateTeamDto, UpdateTeamDto } from '../common/dto/team.dto';
import { TeamStatsSuccessDto, TeamStatsErrorDto } from './dto/team-stats.dto';
import { TeamRankingResponseDto } from './dto/team-season-stats.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';

@ApiTags('Team')
@Controller('team')
export class TeamController {
  constructor(
    private readonly teamService: TeamService,
    private readonly teamStatsService: TeamStatsAnalyzerService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '팀 생성' })
  @ApiResponse({ status: 201, description: '팀 생성 성공' })
  async createTeam(@Body() createTeamDto: CreateTeamDto, @User() user: any) {
    return this.teamService.createTeam(createTeamDto, user._id);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 팀 목록 조회' })
  @ApiResponse({ status: 200, description: '내 팀 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async getMyTeams(@User() user: any) {
    return this.teamService.getMyTeams(user._id);
  }

  @Get('total-stats')
  @ApiOperation({
    summary: '🏆 팀 누적 스탯 순위 조회',
    description: '모든 팀의 누적 스탯을 totalYards 기준으로 정렬하여 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '✅ 팀 누적 스탯 조회 성공',
  })
  async getAllTeamTotalStats() {
    try {
      const teamStats = await this.teamStatsService.getAllTeamTotalStats();

      if (!teamStats || teamStats.length === 0) {
        return {
          success: false,
          message: '팀 누적 스탯을 찾을 수 없습니다',
          data: [],
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        message: '팀 누적 스탯 조회가 완료되었습니다',
        data: teamStats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: '팀 누적 스탯 조회 중 오류가 발생했습니다',
        data: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get(':teamId')
  @ApiOperation({ summary: '팀 조회' })
  @ApiResponse({ status: 200, description: '팀 조회 성공' })
  @ApiResponse({ status: 404, description: '팀을 찾을 수 없음' })
  async getTeam(@Param('teamId') teamId: string) {
    return this.teamService.getTeam(teamId);
  }

  @Put(':teamId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '팀 정보 수정' })
  @ApiResponse({ status: 200, description: '팀 정보 수정 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '팀을 찾을 수 없음' })
  async updateTeam(
    @Param('teamId') teamId: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @User() user: any,
  ) {
    return this.teamService.updateTeam(teamId, updateTeamDto, user._id);
  }

  @Delete(':teamId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '팀 삭제' })
  @ApiResponse({ status: 200, description: '팀 삭제 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '팀을 찾을 수 없음' })
  async deleteTeam(@Param('teamId') teamId: string, @User() user: any) {
    return this.teamService.deleteTeam(teamId, user._id);
  }

  @Get('stats/:gameKey')
  @ApiOperation({
    summary: '🏈 게임별 팀 스탯 조회',
    description: `
    ## 📊 팀 스탯 조회 API
    
    특정 게임의 홈팀/어웨이팀 스탯을 조회합니다.
    
    ### 📈 포함된 스탯
    - **총 야드**: 패싱+러싱+리턴야드 합계
    - **패싱 야드**: 완성된 패스 야드 총합
    - **러싱 야드**: 러싱 야드 (sack 야드 차감)
    - **리턴 야드들**: 인터셉트/펀트/킥오프 리턴 야드
    - **턴오버**: 펌블(디펜스 리커버리) + 인터셉트 + 기타 턴오버
    - **페널티 야드**: 총 페널티 야드 (추후 구현)
    
    ### 🎯 사용 예시
    - 게임키: "DGKM240908"
    - 응답: 홈팀/어웨이팀 각각의 상세 스탯
    `,
  })
  @ApiResponse({
    status: 200,
    description: '✅ 팀 스탯 조회 성공',
    type: TeamStatsSuccessDto,
    schema: {
      example: {
        success: true,
        message: '팀 스탯 조회가 완료되었습니다',
        data: {
          homeTeamStats: {
            teamName: 'DGTuskers',
            totalYards: 425,
            passingYards: 280,
            rushingYards: 145,
            interceptionReturnYards: 0,
            puntReturnYards: 25,
            kickoffReturnYards: 35,
            turnovers: 2,
            penaltyYards: 45,
            sackYards: 15,
          },
          awayTeamStats: {
            teamName: 'KMRazorbacks',
            totalYards: 380,
            passingYards: 220,
            rushingYards: 160,
            interceptionReturnYards: 35,
            puntReturnYards: 15,
            kickoffReturnYards: 25,
            turnovers: 1,
            penaltyYards: 30,
            sackYards: 8,
          },
        },
        timestamp: '2024-12-26T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '❌ 팀 스탯을 찾을 수 없음',
    type: TeamStatsErrorDto,
    schema: {
      example: {
        success: false,
        message: '해당 게임의 팀 스탯을 찾을 수 없습니다',
        code: 'TEAM_STATS_NOT_FOUND',
      },
    },
  })
  async getTeamStatsByGame(@Param('gameKey') gameKey: string) {
    try {
      const teamStatsResult =
        await this.teamStatsService.getTeamStatsByGame(gameKey);

      if (!teamStatsResult) {
        return {
          success: false,
          message: '해당 게임의 팀 스탯을 찾을 수 없습니다',
          code: 'TEAM_STATS_NOT_FOUND',
        };
      }

      return {
        success: true,
        message: '팀 스탯 조회가 완료되었습니다',
        data: teamStatsResult,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: '팀 스탯 조회 중 오류가 발생했습니다',
        code: 'TEAM_STATS_ERROR',
      };
    }
  }

  /* 시즌별 스탯 제거로 임시 비활성화
  @Get('season-stats/:season')
  @ApiOperation({
    summary: '🏆 팀 시즌 스탯 순위 조회',
    description: `
    ## 📊 팀 시즌 스탯 순위 API
    
    시즌별 모든 팀의 종합 스탯을 조회합니다.
    
    ### 📈 포함된 스탯 카테고리
    
    **1. 득점**
    - 경기당 평균 득점 (총 득점/경기 수)
    - 총 득점 (시즌 기준)
    - 총 터치다운 (시즌 기준)
    - 총 전진야드
    - 경기 당 전진야드
    
    **2. 런**
    - 러싱 시도
    - 러싱 야드
    - 볼 캐리 당 러싱 야드
    - 경기당 러싱 야드
    - 러싱 터치다운
    
    **3. 패스**
    - 패스 성공-패스 시도
    - 패싱 야드
    - 패스 시도 당 패스 야드
    - 경기 당 패싱 야드
    - 패싱 터치다운
    - 인터셉트
    
    **4. 스페셜팀**
    - 총 펀트 야드
    - 평균 펀트 야드
    - 터치백 퍼센티지(펀트)
    - 필드골 성공-총 시도
    - 평균 킥 리턴 야드
    - 평균 펀트 리턴 야드
    
    **5. 기타**
    - 펌블 수-펌블 턴오버 수
    - 경기 당 턴오버 수
    - 턴오버 비율 (우리 팀 - 상대 팀)
    - 총 페널티 수-총 페널티 야드
    - 경기 당 페널티 야드
    `,
  })
  @ApiResponse({
    status: 200,
    description: '✅ 팀 시즌 스탯 조회 성공',
    type: TeamRankingResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: '❌ 해당 시즌 데이터를 찾을 수 없음',
  })
  async getTeamSeasonStats(@Param('season') season: string) {
    try {
      const teamStats =
        await this.teamSeasonStatsService.getAllTeamSeasonStats(season);

      if (!teamStats || teamStats.length === 0) {
        return {
          success: false,
          message: `${season} 시즌의 팀 스탯을 찾을 수 없습니다`,
          data: [],
          timestamp: new Date().toISOString(),
        };
      }

      // 총 득점 기준으로 내림차순 정렬
      teamStats.sort((a, b) => b.totalPoints - a.totalPoints);

      return {
        success: true,
        message: `${season} 시즌 팀 순위 조회가 완료되었습니다`,
        data: teamStats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: '팀 시즌 스탯 조회 중 오류가 발생했습니다',
        data: [],
        timestamp: new Date().toISOString(),
      };
    }
  }
  */

  /* 시즌별 스탯 제거로 임시 비활성화 
  @Get('season-stats/:teamName/:season')
  @ApiOperation({
    summary: '🎯 특정 팀 시즌 스탯 조회',
    description: '특정 팀의 시즌 스탯을 상세하게 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '✅ 팀 시즌 스탯 조회 성공',
  })
  @ApiResponse({
    status: 404,
    description: '❌ 해당 팀 또는 시즌 데이터를 찾을 수 없음',
  })
  async getSpecificTeamSeasonStats(
    @Param('teamName') teamName: string,
    @Param('season') season: string,
  ) {
    try {
      const teamStats = await this.teamSeasonStatsService.getTeamSeasonStats(
        teamName,
        season,
      );

      if (!teamStats) {
        return {
          success: false,
          message: `${teamName} 팀의 ${season} 시즌 스탯을 찾을 수 없습니다`,
          data: null,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        success: true,
        message: `${teamName} 팀의 ${season} 시즌 스탯 조회가 완료되었습니다`,
        data: teamStats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: '팀 시즌 스탯 조회 중 오류가 발생했습니다',
        data: null,
        timestamp: new Date().toISOString(),
      };
    }
  }
  */

  /* 시즌별 스탯 제거로 임시 비활성화
  @Post('season-stats/aggregate/:season')
  @ApiOperation({
    summary: '🏆 팀 시즌 스탯 집계',
    description: '선수별 스탯을 팀별로 집계하여 팀 시즌 스탯을 업데이트합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '✅ 팀 시즌 스탯 집계 성공',
  })
  async aggregateTeamStats(@Param('season') season: string) {
    try {
      const result = await this.teamStatsAggregatorService.aggregateTeamStats(season);
      return {
        ...result,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        message: '팀 시즌 스탯 집계 중 오류가 발생했습니다',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
  */

}
