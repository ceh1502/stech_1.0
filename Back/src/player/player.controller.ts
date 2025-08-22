import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Body, 
  Param, 
  Query,
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PlayerService } from './player.service';
import { 
  CreatePlayerDto, 
  UpdatePlayerStatsDto,
  PlayerResponseDto,
  PlayersListResponseDto 
} from '../common/dto/player.dto';
import { AnalyzeNewClipsDto } from '../common/dto/new-clip.dto';
import { StatsManagementService } from '../common/services/stats-management.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';

@ApiTags('Player')
@Controller('player')
export class PlayerController {
  constructor(
    private readonly playerService: PlayerService,
    private readonly statsManagementService: StatsManagementService
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '선수 생성' })
  @ApiResponse({ status: 201, description: '선수 생성 성공' })
  async createPlayer(@Body() createPlayerDto: CreatePlayerDto, @User() user: any) {
    // 임시로 첫 번째 팀 ID 사용 (실제로는 요청에서 받아야 함)
    const teamId = '507f1f77bcf86cd799439011'; // 임시 ObjectId
    return this.playerService.createPlayer(createPlayerDto, teamId);
  }

  @Get('code/:playerId')
  @ApiOperation({ summary: 'PlayerCode로 개별 선수 조회' })
  @ApiResponse({ status: 200, description: '선수 조회 성공', type: PlayerResponseDto })
  @ApiResponse({ status: 404, description: '선수를 찾을 수 없음' })
  async getPlayerByCode(@Param('playerId') playerId: string) {
    return this.playerService.getPlayerByCode(playerId);
  }

  @Get('position/:position')
  @ApiOperation({ summary: '포지션별 선수 목록 조회' })
  @ApiQuery({ name: 'league', required: false, enum: ['1부', '2부'] })
  @ApiResponse({ status: 200, description: '포지션별 선수 목록 조회 성공', type: PlayersListResponseDto })
  async getPlayersByPosition(
    @Param('position') position: string,
    @Query('league') league?: string
  ) {
    return this.playerService.getPlayersByPosition(position, league);
  }

  @Get('rankings')
  @ApiOperation({ summary: '전체 선수 스탯 랭킹 조회' })
  @ApiQuery({ name: 'league', required: false, enum: ['1부', '2부'] })
  @ApiQuery({ name: 'sortBy', required: false, example: 'passingYards' })
  @ApiResponse({ status: 200, description: '선수 랭킹 조회 성공' })
  async getAllPlayersRanking(
    @Query('league') league?: string,
    @Query('sortBy') sortBy?: string
  ) {
    return this.playerService.getAllPlayersRanking(league, sortBy);
  }

  @Put(':playerId/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '선수 스탯 업데이트' })
  @ApiResponse({ status: 200, description: '스탯 업데이트 성공' })
  @ApiResponse({ status: 404, description: '선수를 찾을 수 없음' })
  async updatePlayerStats(
    @Param('playerId') playerId: string,
    @Body() updateStatsDto: UpdatePlayerStatsDto
  ) {
    return this.playerService.updatePlayerStats(playerId, updateStatsDto);
  }

  @Get('team/:teamId')
  @ApiOperation({ summary: '팀별 선수 목록 조회' })
  @ApiResponse({ status: 200, description: '팀 선수 목록 조회 성공' })
  async getPlayersByTeam(@Param('teamId') teamId: string) {
    return this.playerService.getPlayersByTeam(teamId);
  }

  // 테스트용: 샘플 데이터 생성
  @Post('sample')
  @ApiOperation({ summary: '샘플 선수 데이터 생성 (테스트용)' })
  @ApiResponse({ status: 201, description: '샘플 데이터 생성 성공' })
  async createSamplePlayer() {
    const samplePlayer: CreatePlayerDto = {
      playerId: 'QB001',
      name: 'Ken Lee',
      jerseyNumber: 10,
      position: 'QB',
      league: '1부',
      season: '2024',
      stats: {
        passingYards: 200,
        passingTouchdowns: 5,
        completionPercentage: 60,
        passerRating: 85.5,
        gamesPlayed: 8,
        totalYards: 200,
        totalTouchdowns: 5
      }
    };

    const teamId = '507f1f77bcf86cd799439011';
    return this.playerService.createPlayer(samplePlayer, teamId);
  }




  // === 새로운 클립 구조 관련 엔드포인트 ===

  @Post('jersey/:jerseyNumber/analyze-new-clips')
  @ApiOperation({ 
    summary: '새로운 형식의 클립 데이터 분석 및 스탯 업데이트',
    description: '새로운 car/tkl 형식의 클립 데이터를 받아서 선수 스탯을 자동으로 분석하고 업데이트합니다.'
  })
  @ApiResponse({ status: 200, description: '새 클립 스탯 분석 및 업데이트 성공' })
  @ApiResponse({ status: 404, description: '선수를 찾을 수 없음' })
  async updatePlayerStatsFromNewClips(
    @Param('jerseyNumber') jerseyNumber: string,
    @Body() analyzeNewClipsDto: AnalyzeNewClipsDto
  ) {
    const jerseyNum = parseInt(jerseyNumber);
    return this.playerService.updatePlayerStatsFromNewClips(jerseyNum, analyzeNewClipsDto.clips);
  }

  @Post('jersey/:jerseyNumber/analyze-new-clips-only')
  @ApiOperation({ 
    summary: '새로운 형식의 클립 데이터 분석만 (DB 업데이트 안함)',
    description: '새로운 car/tkl 형식의 클립 데이터를 분석하여 예상 스탯을 반환하지만 DB에는 저장하지 않습니다.'
  })
  @ApiResponse({ status: 200, description: '새 클립 스탯 분석 성공' })
  @ApiResponse({ status: 404, description: '선수를 찾을 수 없음' })
  async analyzeNewClipsOnly(
    @Param('jerseyNumber') jerseyNumber: string,
    @Body() analyzeNewClipsDto: AnalyzeNewClipsDto
  ) {
    const jerseyNum = parseInt(jerseyNumber);
    // analyzeNewClipsOnly 메서드는 제거됨 - updatePlayerStatsFromNewClips 사용
    return this.playerService.updatePlayerStatsFromNewClips(jerseyNum, analyzeNewClipsDto.clips);
  }

  @Post('update-game-stats')
  @ApiOperation({ 
    summary: '게임별 스탯 업데이트',
    description: '새로운 형식의 클립 데이터로 게임의 모든 선수 스탯을 업데이트합니다.'
  })
  @ApiResponse({ status: 200, description: '게임 스탯 업데이트 성공' })
  async updateGameStats(
    @Body() gameData: any
  ) {
    console.log('받은 데이터 구조:', JSON.stringify(gameData, null, 2));
    return this.playerService.updateGameStats(gameData);
  }

  // === 3단계 스탯 관리 시스템 엔드포인트 ===

  @Get('jersey/:jerseyNumber/game-stats')
  @ApiOperation({ 
    summary: '선수의 게임별 스탯 조회',
    description: '특정 선수의 모든 게임별 개별 스탯을 조회합니다.'
  })
  @ApiQuery({ name: 'season', required: false, description: '특정 시즌 필터링' })
  @ApiResponse({ status: 200, description: '게임별 스탯 조회 성공' })
  async getPlayerGameStats(
    @Param('jerseyNumber') jerseyNumber: string,
    @Query('season') season?: string
  ) {
    const jerseyNum = parseInt(jerseyNumber);
    return this.statsManagementService.getPlayerGameStats(jerseyNum, season);
  }

  @Get('jersey/:jerseyNumber/season-stats')
  @ApiOperation({ 
    summary: '선수의 시즌별 스탯 조회',
    description: '특정 선수의 시즌별 누적 스탯을 조회합니다.'
  })
  @ApiQuery({ name: 'season', required: false, description: '특정 시즌 필터링' })
  @ApiResponse({ status: 200, description: '시즌별 스탯 조회 성공' })
  async getPlayerSeasonStats(
    @Param('jerseyNumber') jerseyNumber: string,
    @Query('season') season?: string
  ) {
    const jerseyNum = parseInt(jerseyNumber);
    return this.statsManagementService.getPlayerSeasonStats(jerseyNum, season);
  }

  @Get('jersey/:jerseyNumber/career-stats')
  @ApiOperation({ 
    summary: '선수의 커리어 스탯 조회',
    description: '특정 선수의 전체 커리어 누적 스탯을 조회합니다.'
  })
  @ApiResponse({ status: 200, description: '커리어 스탯 조회 성공' })
  async getPlayerCareerStats(@Param('jerseyNumber') jerseyNumber: string) {
    const jerseyNum = parseInt(jerseyNumber);
    return this.statsManagementService.getPlayerCareerStats(jerseyNum);
  }

  @Get('season-rankings/:season/:league')
  @ApiOperation({ 
    summary: '시즌 리그별 랭킹 조회',
    description: '특정 시즌 및 리그에서의 선수 랭킹을 조회합니다.'
  })
  @ApiQuery({ name: 'position', required: false, description: '포지션 필터링' })
  @ApiQuery({ name: 'sortBy', required: false, description: '정렬 기준 스탯' })
  @ApiResponse({ status: 200, description: '시즌 랭킹 조회 성공' })
  async getSeasonRankings(
    @Param('season') season: string,
    @Param('league') league: string,
    @Query('position') position?: string,
    @Query('sortBy') sortBy?: string
  ) {
    return this.statsManagementService.getSeasonRankings(season, league, position, sortBy);
  }

  @Get('career-rankings')
  @ApiOperation({ 
    summary: '커리어 랭킹 조회',
    description: '활성 선수들의 커리어 전체 랭킹을 조회합니다.'
  })
  @ApiQuery({ name: 'position', required: false, description: '포지션 필터링' })
  @ApiQuery({ name: 'sortBy', required: false, description: '정렬 기준 스탯' })
  @ApiResponse({ status: 200, description: '커리어 랭킹 조회 성공' })
  async getCareerRankings(
    @Query('position') position?: string,
    @Query('sortBy') sortBy?: string
  ) {
    return this.statsManagementService.getCareerRankings(position, sortBy);
  }

  @Post('game-stats-batch')
  @ApiOperation({ 
    summary: '게임 전체 선수 스탯 일괄 업데이트',
    description: '한 게임의 모든 참여 선수들의 스탯을 일괄 업데이트합니다.'
  })
  @ApiResponse({ status: 200, description: '게임 스탯 일괄 업데이트 성공' })
  async updateGameStatsBatch(
    @Body() batchData: {
      gameKey: string;
      gameDate: string;
      homeTeam: string;
      awayTeam: string;
      playersStats: Array<{
        playerNumber: number;
        analyzedStats: any;
      }>;
    }
  ) {
    const gameDate = new Date(batchData.gameDate);
    return this.statsManagementService.updateMultiplePlayersGameStats(
      batchData.gameKey,
      gameDate,
      batchData.homeTeam,
      batchData.awayTeam,
      batchData.playersStats
    );
  }
}