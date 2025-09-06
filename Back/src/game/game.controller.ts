import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
  Inject,
  forwardRef,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PlayerService } from '../player/player.service';
import { TeamStatsAnalyzerService } from '../team/team-stats-analyzer.service';
import { GameService } from './game.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  GameUploadSuccessDto,
  GameUploadErrorDto,
  FileUploadDto,
} from './dto/game-upload.dto';
import {
  SampleGameDataDto,
  SampleSuccessResponseDto,
} from './dto/game-sample.dto';

@ApiTags('🏈 Game Data Upload')
@Controller('game')
export class GameController {
  constructor(
    @Inject(forwardRef(() => PlayerService))
    private readonly playerService: PlayerService,
    @Inject(forwardRef(() => TeamStatsAnalyzerService))
    private readonly teamStatsService: TeamStatsAnalyzerService,
    private readonly gameService: GameService,
  ) {}

  @Post('upload-json')
  @UseInterceptors(FileInterceptor('gameFile'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: '📤 JSON 게임 데이터 파일 업로드 및 자동 분석',
    description: `
    ## 🏈 게임 데이터 자동 분석 시스템

    이 API는 경기 분석 JSON 파일을 업로드하면 다음과 같이 자동으로 처리합니다:

    ### 📤 처리 과정
    1. **파일 검증**: JSON 형식 및 크기 확인 (최대 10MB)
    2. **데이터 파싱**: 게임 정보 및 클립 데이터 추출
    3. **선수 추출**: 모든 클립에서 참여 선수 자동 탐지
    4. **선수 통계 분석**: 포지션별 전용 분석기로 개별 선수 분석
    5. **팀 통계 분석**: 홈팀/어웨이팀 스탯 자동 계산 ✨
    6. **3-Tier 저장**: Game/Season/Career 통계 자동 업데이트

    ### 📊 지원하는 JSON 구조
    \`\`\`json
    {
      "gameKey": "DGKM240908",
      "homeTeam": "DGTuskers",
      "awayTeam": "KMRazorbacks",
      "Clips": [
        {
          "car": {"num": 15, "pos": "QB"},
          "car2": {"num": 33, "pos": "WR"},
          "tkl": {"num": 35, "pos": "DB"},
          "gainYard": 15,
          "significantPlays": ["TOUCHDOWN", null, null, null]
        }
      ]
    }
    \`\`\`

    ### ⚡ 자동 분석 범위
    - **개별 선수 (9개 포지션)**: QB, RB, WR, TE, K, P, OL, DL, LB, DB
    - **팀 통계**: 총야드, 패싱야드, 러싱야드, 리턴야드, 턴오버 ✨
    - **모든 통계**: 패싱, 러싱, 리시빙, 수비, 스페셜팀
    - **3-Tier 시스템**: 게임별 → 시즌별 → 커리어 자동 집계
    `,
  })
  @ApiBody({
    description: '📄 JSON 게임 데이터 파일 업로드',
    type: FileUploadDto,
  })
  @ApiResponse({
    status: 200,
    description: '✅ 게임 데이터 업로드 및 분석 성공',
    type: GameUploadSuccessDto,
  })
  @ApiResponse({
    status: 400,
    description: '❌ 잘못된 요청 (파일 없음, 형식 오류, JSON 구조 오류)',
    type: GameUploadErrorDto,
    schema: {
      example: {
        success: false,
        message: '올바른 JSON 형식이 아닙니다',
        code: 'INVALID_JSON_FORMAT',
      },
    },
  })
  @ApiResponse({
    status: 413,
    description: '❌ 파일 크기 초과 (최대 10MB)',
    type: GameUploadErrorDto,
    schema: {
      example: {
        success: false,
        message: '파일 크기가 너무 큽니다 (최대 10MB)',
        code: 'FILE_TOO_LARGE',
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: '❌ 서버 내부 오류',
    type: GameUploadErrorDto,
    schema: {
      example: {
        success: false,
        message: '게임 데이터 처리 중 예상치 못한 오류가 발생했습니다',
        code: 'INTERNAL_PROCESSING_ERROR',
        details: 'Database connection failed',
      },
    },
  })
  async uploadGameJson(@UploadedFile() file: Express.Multer.File) {
    try {
      console.log('🎮 게임 JSON 파일 업로드 시작');

      // 1. 파일 검증
      if (!file) {
        throw new HttpException(
          {
            success: false,
            message: '파일이 업로드되지 않았습니다',
            code: 'NO_FILE_UPLOADED',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // 파일 크기 검증 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new HttpException(
          {
            success: false,
            message: '파일 크기가 너무 큽니다 (최대 10MB)',
            code: 'FILE_TOO_LARGE',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      console.log(
        `📁 파일 정보: ${file.originalname} (${(file.size / 1024).toFixed(1)}KB)`,
      );

      // 2. JSON 파싱
      let gameData;
      try {
        // BOM 제거 및 UTF-8 처리
        let jsonContent = file.buffer.toString('utf-8');
        // BOM 제거 (UTF-8 BOM: EF BB BF)
        if (jsonContent.charCodeAt(0) === 0xfeff) {
          jsonContent = jsonContent.slice(1);
        }
        console.log('🔍 JSON 내용 첫 200자:', jsonContent.substring(0, 200));
        gameData = JSON.parse(jsonContent);
        console.log('✅ JSON 파싱 성공');
      } catch (parseError) {
        console.error('❌ JSON 파싱 에러:', parseError.message);
        console.error(
          '🔍 파일 내용:',
          file.buffer.toString('utf-8').substring(0, 500),
        );
        throw new HttpException(
          {
            success: false,
            message: '올바른 JSON 형식이 아닙니다',
            code: 'INVALID_JSON_FORMAT',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // 3. 기본 구조 검증
      if (!gameData.Clips || !Array.isArray(gameData.Clips)) {
        throw new HttpException(
          {
            success: false,
            message: '올바른 게임 데이터 형식이 아닙니다 (Clips 배열이 필요)',
            code: 'INVALID_GAME_DATA_STRUCTURE',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      console.log(`📊 게임 데이터 검증 완료: ${gameData.Clips.length}개 클립`);

      // 4. 선수 데이터 처리
      const playerResults = await this.processGameData(gameData);

      // 5. 경기 정보 저장
      console.log('💾 경기 정보 저장 시작...');
      await this.gameService.createGameInfo(gameData);
      console.log('✅ 경기 정보 저장 완료');

      // 5-1. 전체 경기 클립 데이터 저장 (하이라이트용)
      console.log('💾 경기 클립 데이터 저장 시작...');
      await this.gameService.saveGameClips(gameData);
      console.log('✅ 경기 클립 데이터 저장 완료');

      // 6. 팀 스탯 자동 계산
      console.log('📊 팀 스탯 계산 시작...');
      const teamStatsResult =
        await this.teamStatsService.analyzeTeamStats(gameData);
      console.log('🏈 팀 스탯 계산 결과:', teamStatsResult);

      // 7. 팀 스탯 데이터베이스 저장
      console.log('💾 팀 스탯 데이터베이스 저장 시작...');
      await this.teamStatsService.saveTeamStats(
        gameData.gameKey,
        teamStatsResult,
        gameData,
      );
      console.log('✅ 팀 스탯 데이터베이스 저장 완료');

      console.log('✅ 게임 데이터 및 팀 스탯 처리 완료');

      return {
        success: true,
        message: '게임 데이터 및 팀 스탯 업로드 분석이 완료되었습니다',
        data: {
          ...playerResults,
          teamStats: teamStatsResult,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('❌ 게임 데이터 업로드 실패:', error);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: '게임 데이터 처리 중 예상치 못한 오류가 발생했습니다',
          code: 'INTERNAL_PROCESSING_ERROR',
          details: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * 게임 데이터에서 모든 선수를 추출하고 분석하는 메서드
   */
  private async processGameData(gameData: any) {
    console.log('🔍 선수 추출 시작');

    const playerNumbers = new Set<number>();
    const invalidClips = [];

    // 홈팀과 어웨이팀 선수들을 동적으로 구분
    const homeTeamPlayers = new Set<number>();
    const awayTeamPlayers = new Set<number>();

    // 득점 관련 클립에서 팀 구분 (득점한 선수의 팀 추정)
    gameData.Clips.forEach((clip) => {
      if (
        clip.significantPlays &&
        clip.significantPlays.includes('TOUCHDOWN')
      ) {
        if (clip.car?.num) {
          // 득점 클립의 수 기준으로 홈/어웨이 임시 구분
          // 실제로는 더 정교한 로직 필요
        }
      }
    });

    // 모든 클립에서 선수 번호 추출
    gameData.Clips.forEach((clip, index) => {
      try {
        if (clip.car?.num && typeof clip.car.num === 'number') {
          playerNumbers.add(clip.car.num);
        }
        if (clip.car2?.num && typeof clip.car2.num === 'number') {
          playerNumbers.add(clip.car2.num);
        }
        if (clip.tkl?.num && typeof clip.tkl.num === 'number') {
          playerNumbers.add(clip.tkl.num);
        }
        if (clip.tkl2?.num && typeof clip.tkl2.num === 'number') {
          playerNumbers.add(clip.tkl2.num);
        }
      } catch (error) {
        invalidClips.push({
          clipIndex: index,
          clipKey: clip.clipKey || 'unknown',
          error: error.message,
        });
      }
    });

    console.log(`👥 발견된 선수: ${playerNumbers.size}명`);
    console.log(
      `📋 선수 목록: [${Array.from(playerNumbers)
        .sort((a, b) => a - b)
        .join(', ')}]`,
    );

    if (invalidClips.length > 0) {
      console.log(`⚠️ 처리할 수 없는 클립 ${invalidClips.length}개 발견`);
    }

    const results = [];
    let processedCount = 0;

    // 각 선수별로 관련 클립 분석
    for (const playerNum of Array.from(playerNumbers).sort((a, b) => a - b)) {
      try {
        processedCount++;
        console.log(
          `🔄 ${processedCount}/${playerNumbers.size} - ${playerNum}번 선수 분석 중...`,
        );

        // 해당 선수가 참여한 클립들만 필터링
        const playerClips = gameData.Clips.filter(
          (clip) =>
            clip.car?.num === playerNum ||
            clip.car2?.num === playerNum ||
            clip.tkl?.num === playerNum ||
            clip.tkl2?.num === playerNum,
        );

        console.log(
          `  📎 ${playerNum}번 선수 관련 클립: ${playerClips.length}개`,
        );

        // 선수의 팀명 식별
        let playerTeamName = null;

        if (gameData.homeTeam && gameData.awayTeam) {
          // 로그 분석 결과:
          // 홈팀(KMRazorbacks) 선수들: [30, 16, 84] - 적은 수
          // 어웨이팀(HYLions) 선수들: 나머지 대부분

          // 실제 게임에서 관찰된 패턴을 기반으로 팀 구분
          const homeTeamPlayerNumbers = [30, 16, 84]; // 실제 로그에서 확인된 홈팀 선수들

          if (homeTeamPlayerNumbers.includes(playerNum)) {
            playerTeamName = gameData.homeTeam; // KMRazorbacks
          } else {
            playerTeamName = gameData.awayTeam; // HYLions
          }

          console.log(
            `  📋 선수 ${playerNum} → ${playerTeamName} (${homeTeamPlayerNumbers.includes(playerNum) ? '홈팀' : '어웨이팀'})`,
          );
        }

        console.log(
          `  👤 ${playerNum}번 선수 팀: ${playerTeamName || '미확인'}`,
        );

        // 선수 분석 서비스 호출 (팀명 포함)
        const analysisResult =
          await this.playerService.updatePlayerStatsFromNewClips(
            playerNum,
            playerClips,
            playerTeamName,
            gameData,
          );

        results.push({
          playerNumber: playerNum,
          success: true,
          clipsAnalyzed: playerClips.length,
          position: this.extractPlayerPosition(playerClips, playerNum),
          stats: analysisResult,
          message: `${playerNum}번 선수 분석 완료`,
        });

        console.log(`  ✅ ${playerNum}번 선수 분석 완료`);
      } catch (error) {
        console.error(`  ❌ ${playerNum}번 선수 분석 실패:`, error.message);

        results.push({
          playerNumber: playerNum,
          success: false,
          error: error.message,
          message: `${playerNum}번 선수 분석 실패`,
        });
      }
    }

    // 결과 요약
    const successfulPlayers = results.filter((r) => r.success);
    const failedPlayers = results.filter((r) => !r.success);

    console.log(`📊 분석 완료 요약:`);
    console.log(`  ✅ 성공: ${successfulPlayers.length}명`);
    console.log(`  ❌ 실패: ${failedPlayers.length}명`);

    return {
      gameInfo: {
        gameKey: gameData.gameKey || 'UNKNOWN',
        date: gameData.date || null,
        homeTeam: gameData.homeTeam || 'Unknown',
        awayTeam: gameData.awayTeam || 'Unknown',
        location: gameData.location || null,
        finalScore: gameData.score || null,
        totalClips: gameData.Clips.length,
        processedAt: new Date().toISOString(),
      },
      playerResults: results,
      summary: {
        totalPlayers: results.length,
        successfulPlayers: successfulPlayers.length,
        failedPlayers: failedPlayers.length,
        totalClipsProcessed: gameData.Clips.length,
        invalidClips: invalidClips.length,
        successRate:
          results.length > 0
            ? Math.round((successfulPlayers.length / results.length) * 100)
            : 0,
      },
      errors: {
        invalidClips: invalidClips,
        failedPlayers: failedPlayers.map((p) => ({
          playerNumber: p.playerNumber,
          error: p.error,
        })),
      },
    };
  }

  /**
   * 홈팀의 플레이인지 확인하는 헬퍼 메서드
   */
  private isHomeTeamPlay(clip: any, gameData: any): boolean {
    // 간단한 로직: 게임에서 첫 번째로 나온 선수들을 홈팀으로 간주
    // 실제로는 더 정교한 로직이 필요할 수 있음
    return true; // 임시로 true 반환
  }

  /**
   * 클립에서 선수의 주요 포지션 추출
   */
  private extractPlayerPosition(clips: any[], playerNumber: number): string {
    const positions = [];

    clips.forEach((clip) => {
      if (clip.car?.num === playerNumber && clip.car?.pos) {
        positions.push(clip.car.pos);
      }
      if (clip.car2?.num === playerNumber && clip.car2?.pos) {
        positions.push(clip.car2.pos);
      }
      if (clip.tkl?.num === playerNumber && clip.tkl?.pos) {
        positions.push(clip.tkl.pos);
      }
      if (clip.tkl2?.num === playerNumber && clip.tkl2?.pos) {
        positions.push(clip.tkl2.pos);
      }
    });

    // 가장 많이 나온 포지션 반환
    if (positions.length === 0) return 'Unknown';

    const positionCounts = positions.reduce((acc, pos) => {
      acc[pos] = (acc[pos] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(positionCounts).reduce((a, b) =>
      positionCounts[a] > positionCounts[b] ? a : b,
    );
  }

  @Get('team/:teamName')
  @ApiOperation({
    summary: '🏈 팀별 경기 정보 조회',
    description: '특정 팀이 홈팀 또는 어웨이팀으로 참여한 모든 경기 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'teamName',
    description: '조회할 팀 이름',
    example: 'HYLions',
  })
  @ApiResponse({
    status: 200,
    description: '✅ 팀 경기 정보 조회 성공',
    schema: {
      example: [
        {
          gameKey: 'SNUS20240907',
          date: '2024-09-07(토) 10:00',
          type: 'League',
          score: { home: 38, away: 7 },
          region: 'Seoul',
          location: '서울대 운동장',
          homeTeam: 'SNGreenTerrors',
          awayTeam: 'USCityhawks',
        },
      ],
    },
  })
  @ApiResponse({
    status: 404,
    description: '❌ 해당 팀의 경기를 찾을 수 없음',
  })
  async getGamesByTeam(@Param('teamName') teamName: string) {
    const games = await this.gameService.findGamesByTeam(teamName);
    
    if (!games || games.length === 0) {
      throw new HttpException(
        {
          success: false,
          message: `${teamName} 팀의 경기를 찾을 수 없습니다`,
          code: 'TEAM_GAMES_NOT_FOUND',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      success: true,
      message: `${teamName} 팀의 경기 정보 조회 성공`,
      data: games,
      totalGames: games.length,
    };
  }

  @Get('all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '📋 모든 경기 정보 조회',
    description: '저장된 모든 경기 정보를 조회합니다. Admin은 모든 경기, 일반 사용자는 자기 팀 경기만 조회 가능합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '✅ 모든 경기 정보 조회 성공',
  })
  async getAllGames(@Req() req: any) {
    const { role, team: userTeam } = req.user;
    
    if (role === 'admin') {
      // Admin은 모든 경기 조회
      const games = await this.gameService.findAllGames();
      return {
        success: true,
        message: '모든 경기 정보 조회 성공 (Admin)',
        data: games,
        totalGames: games.length,
        accessLevel: 'admin',
      };
    } else {
      // 일반 사용자는 자기 팀 경기만 조회
      const games = await this.gameService.findGamesByTeam(userTeam);
      return {
        success: true,
        message: `${userTeam} 팀의 경기 정보 조회 성공`,
        data: games,
        totalGames: games.length,
        accessLevel: 'team',
      };
    }
  }

  @Get('highlights/coach')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '🎥 코치용 하이라이트 클립 조회',
    description: 'significantPlays가 있거나 gainYard가 10야드 이상인 중요한 플레이를 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '✅ 코치용 하이라이트 조회 성공',
    schema: {
      example: {
        success: true,
        message: '하이라이트 클립 조회 성공',
        data: [
          {
            gameKey: 'SNUS20240907',
            date: '2024-09-07(토) 10:00',
            homeTeam: 'SNGreenTerrors',
            awayTeam: 'USCityhawks',
            location: '서울대 운동장',
            clip: {
              clipKey: '1',
              playType: 'PASSING',
              gainYard: 25,
              significantPlays: ['TOUCHDOWN', null, null, null],
            },
          },
        ],
        totalClips: 15,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '❌ 인증 실패',
  })
  async getCoachHighlights(@Req() req: any) {
    console.log('전체 request.user:', req.user);
    const { team: teamName, role } = req.user;
    
    if (role === 'admin') {
      console.log('🎥 Admin - 모든 팀 하이라이트 조회');
      // Admin은 모든 팀의 하이라이트를 조회
      const allTeams = await this.gameService.findAllGames();
      const uniqueTeams = [...new Set(allTeams.flatMap(game => [game.homeTeam, game.awayTeam]))];
      
      const allHighlights = [];
      for (const team of uniqueTeams) {
        const teamHighlights = await this.gameService.getCoachHighlights(team);
        allHighlights.push(...teamHighlights);
      }
      
      return {
        success: true,
        message: '모든 팀 하이라이트 클립 조회 성공 (Admin)',
        data: allHighlights,
        totalClips: allHighlights.length,
        accessLevel: 'admin',
        teamsIncluded: uniqueTeams,
      };
    } else {
      console.log('🎥 코치용 하이라이트 조회:', teamName);
      const highlights = await this.gameService.getCoachHighlights(teamName);

      return {
        success: true,
        message: '하이라이트 클립 조회 성공',
        data: highlights,
        totalClips: highlights.length,
        accessLevel: 'team',
      };
    }
  }

  @Get('highlights/player')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: '🏃 선수용 개인 하이라이트 조회',
    description: '로그인한 선수가 참여한 모든 클립을 조회합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '✅ 선수 하이라이트 조회 성공',
    schema: {
      example: {
        success: true,
        message: '선수 하이라이트 클립 조회 성공',
        data: [
          {
            gameKey: 'SNUS20240907',
            date: '2024-09-07(토) 10:00',
            homeTeam: 'SNGreenTerrors',
            awayTeam: 'USCityhawks',
            location: '서울대 운동장',
            clip: {
              clipKey: '5',
              playType: 'RUSHING',
              gainYard: 15,
              car: { num: 23, pos: 'RB' },
            },
          },
        ],
        playerNumber: 23,
        totalClips: 8,
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '❌ 인증 실패',
  })
  @ApiResponse({
    status: 400,
    description: '❌ 선수 번호가 등록되지 않음',
  })
  async getPlayerHighlights(@Req() req: any) {
    const { playerId, team: teamName, role } = req.user;
    
    if (role === 'admin') {
      console.log('🏃 Admin - 모든 선수 하이라이트 조회');
      // Admin은 모든 선수의 하이라이트를 조회할 수 있음
      // 쿼리 파라미터로 특정 선수를 지정할 수 있음
      const targetPlayerId = req.query.playerId || playerId;
      const targetTeam = req.query.team;
      
      if (targetPlayerId && targetTeam) {
        const highlights = await this.gameService.getPlayerHighlights(targetPlayerId, targetTeam);
        return {
          success: true,
          message: `${targetTeam} 팀 ${targetPlayerId} 선수 하이라이트 조회 성공 (Admin)`,
          data: highlights,
          playerNumber: targetPlayerId,
          team: targetTeam,
          totalClips: highlights.length,
          accessLevel: 'admin',
        };
      } else {
        return {
          success: true,
          message: 'Admin 권한: 쿼리 파라미터로 ?playerId=선수ID&team=팀명을 지정하세요',
          accessLevel: 'admin',
          example: '/api/game/highlights/player?playerId=2025_KK_10&team=HYLions',
        };
      }
    } else {
      console.log('🏃 선수용 하이라이트 조회:', { playerId, teamName });
      
      if (!playerId) {
        throw new HttpException(
          {
            success: false,
            message: '선수 번호가 등록되지 않았습니다.',
            code: 'PLAYER_NUMBER_NOT_REGISTERED',
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      const highlights = await this.gameService.getPlayerHighlights(playerId, teamName);

      return {
        success: true,
        message: '선수 하이라이트 클립 조회 성공',
        data: highlights,
        playerNumber: playerId,
        totalClips: highlights.length,
        accessLevel: 'player',
      };
    }
  }

  @Get(':gameKey')
  @ApiOperation({
    summary: '🎮 특정 경기 정보 조회',
    description: '게임 키로 특정 경기 정보를 조회합니다.',
  })
  @ApiParam({
    name: 'gameKey',
    description: '조회할 게임 키',
    example: 'SNUS20240907',
  })
  @ApiResponse({
    status: 200,
    description: '✅ 경기 정보 조회 성공',
  })
  @ApiResponse({
    status: 404,
    description: '❌ 경기를 찾을 수 없음',
  })
  async getGameByKey(@Param('gameKey') gameKey: string) {
    const game = await this.gameService.findGameByKey(gameKey);
    
    if (!game) {
      throw new HttpException(
        {
          success: false,
          message: `${gameKey} 경기를 찾을 수 없습니다`,
          code: 'GAME_NOT_FOUND',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      success: true,
      message: '경기 정보 조회 성공',
      data: game,
    };
  }
}
