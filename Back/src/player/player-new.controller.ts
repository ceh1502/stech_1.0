import { Controller, Get, Post, Put, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PlayerNewService } from './player-new.service';
import { CreatePlayerNewDto, UpdatePlayerNewDto } from './dto/player-new.dto';

@ApiTags('Player Management')
@Controller('api/player')
export class PlayerNewController {
  constructor(private readonly playerNewService: PlayerNewService) {}

  @Get('profile/:playerKey')
  @ApiOperation({ summary: '선수 프로필 조회' })
  @ApiParam({ name: 'playerKey', description: '선수 고유 키' })
  @ApiResponse({ status: 200, description: '선수 프로필 정보 반환' })
  async getPlayerProfile(@Param('playerKey') playerKey: string) {
    try {
      const player = await this.playerNewService.getPlayerProfile(playerKey);
      
      if (!player) {
        throw new HttpException(
          {
            success: false,
            error: {
              code: 'PLAYER_NOT_FOUND',
              message: `선수 키 ${playerKey}를 찾을 수 없습니다.`,
              details: { playerKey }
            }
          },
          HttpStatus.NOT_FOUND
        );
      }

      // 비밀번호 제외하고 반환
      const { account, ...playerData } = player.toObject();
      const { password, ...accountData } = account;

      return {
        success: true,
        data: {
          ...playerData,
          account: accountData
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '서버 내부 오류가 발생했습니다.',
            details: { error: error.message }
          }
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('full/:playerKey')
  @ApiOperation({ summary: '선수 전체 정보 조회 (프로필 + 통계)' })
  @ApiParam({ name: 'playerKey', description: '선수 고유 키' })
  @ApiResponse({ status: 200, description: '선수 전체 정보 반환' })
  async getFullPlayerData(@Param('playerKey') playerKey: string) {
    try {
      const player = await this.playerNewService.getPlayerProfile(playerKey);
      
      if (!player) {
        throw new HttpException(
          {
            success: false,
            error: {
              code: 'PLAYER_NOT_FOUND',
              message: `선수 키 ${playerKey}를 찾을 수 없습니다.`,
              details: { playerKey }
            }
          },
          HttpStatus.NOT_FOUND
        );
      }

      // 비밀번호 제외하고 전체 데이터 반환
      const { account, ...playerData } = player.toObject();
      const { password, ...accountData } = account;

      return {
        success: true,
        data: {
          ...playerData,
          account: accountData
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '서버 내부 오류가 발생했습니다.',
            details: { error: error.message }
          }
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('create')
  @ApiOperation({ summary: '새 선수 생성' })
  @ApiResponse({ status: 201, description: '선수 생성 성공' })
  async createPlayer(@Body() createPlayerDto: CreatePlayerNewDto) {
    try {
      const player = await this.playerNewService.createPlayer(createPlayerDto);
      
      return {
        success: true,
        data: {
          playerKey: player.playerKey,
          profile: player.profile,
          team: player.team
        },
        message: '선수가 성공적으로 생성되었습니다.',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error.code === 11000) {
        throw new HttpException(
          {
            success: false,
            error: {
              code: 'DUPLICATE_PLAYER_KEY',
              message: '이미 존재하는 선수 키입니다.',
              details: { playerKey: createPlayerDto.playerKey }
            }
          },
          HttpStatus.CONFLICT
        );
      }
      
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '선수 생성 중 오류가 발생했습니다.',
            details: { error: error.message }
          }
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('update/:playerKey')
  @ApiOperation({ summary: '선수 정보 업데이트' })
  @ApiParam({ name: 'playerKey', description: '선수 고유 키' })
  @ApiResponse({ status: 200, description: '선수 정보 업데이트 성공' })
  async updatePlayer(
    @Param('playerKey') playerKey: string,
    @Body() updatePlayerDto: UpdatePlayerNewDto
  ) {
    try {
      const player = await this.playerNewService.updatePlayer(playerKey, updatePlayerDto);
      
      if (!player) {
        throw new HttpException(
          {
            success: false,
            error: {
              code: 'PLAYER_NOT_FOUND',
              message: `선수 키 ${playerKey}를 찾을 수 없습니다.`,
              details: { playerKey }
            }
          },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        data: {
          playerKey: player.playerKey,
          profile: player.profile,
          updatedAt: player.updatedAt
        },
        message: '선수 정보가 성공적으로 업데이트되었습니다.',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '선수 정보 업데이트 중 오류가 발생했습니다.',
            details: { error: error.message }
          }
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('search/team/:teamId')
  @ApiOperation({ summary: '팀별 선수 목록 조회' })
  @ApiParam({ name: 'teamId', description: '팀 ID' })
  @ApiResponse({ status: 200, description: '팀 선수 목록 반환' })
  async getPlayersByTeam(@Param('teamId') teamId: string) {
    try {
      const players = await this.playerNewService.getPlayersByTeam(teamId);
      
      // 각 선수의 비밀번호 제외
      const sanitizedPlayers = players.map(player => {
        const { account, ...playerData } = player.toObject();
        const { password, ...accountData } = account;
        return {
          ...playerData,
          account: accountData
        };
      });

      return {
        success: true,
        data: {
          teamId,
          playerCount: players.length,
          players: sanitizedPlayers
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '팀 선수 목록 조회 중 오류가 발생했습니다.',
            details: { error: error.message }
          }
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('search/position/:position')
  @ApiOperation({ summary: '포지션별 선수 목록 조회' })
  @ApiParam({ name: 'position', description: '포지션 (예: Quarterback, Running Back)' })
  @ApiResponse({ status: 200, description: '포지션별 선수 목록 반환' })
  async getPlayersByPosition(@Param('position') position: string) {
    try {
      const players = await this.playerNewService.getPlayersByPosition(position);
      
      // 각 선수의 비밀번호 제외
      const sanitizedPlayers = players.map(player => {
        const { account, ...playerData } = player.toObject();
        const { password, ...accountData } = account;
        return {
          ...playerData,
          account: accountData
        };
      });

      return {
        success: true,
        data: {
          position,
          playerCount: players.length,
          players: sanitizedPlayers
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: '포지션별 선수 목록 조회 중 오류가 발생했습니다.',
            details: { error: error.message }
          }
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}