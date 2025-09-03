import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  HttpException,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiProperty } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class AssignPlayerDto {
  @ApiProperty({
    description: 'PlayerId (형식: 시즌_학교코드_등번호)',
    example: '2025_KK_10'
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{4}_[A-Z]{2,3}_\d+$/, {
    message: 'playerId는 "년도_학교코드_번호" 형식이어야 합니다 (예: 2025_KK_10)'
  })
  playerId: string;
}

export class UnassignedUserDto {
  _id: string;
  username: string;
  teamName: string;
  role: string;
  authCode: string;
  createdAt: Date;
  profile?: {
    nickname?: string;
    email?: string;
    studentId?: string;
  };
}

@ApiTags('👑 Admin Management')
@Controller('api/admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users/unassigned')
  @ApiOperation({
    summary: '🔍 PlayerId 미배정 유저 목록 조회',
    description: `
    ## 👑 관리자 전용 API

    playerId가 배정되지 않은 신규 가입자들을 조회합니다.
    
    ### 🎯 사용 목적
    - 신규 회원가입자 확인
    - 실제 명단과 대조 후 playerId 배정 준비
    - 팀별, 역할별 필터링 가능

    ### 📋 반환 정보
    - 사용자 기본 정보 (username, teamName, role)
    - 가입 시 사용한 인증코드
    - 프로필 정보 (이름, 학번, 이메일 등)
    - 가입 일시

    ### ⚠️ 주의사항
    - 관리자 권한 필요
    - playerId가 null인 사용자만 조회
    `,
  })
  @ApiResponse({
    status: 200,
    description: '✅ 미배정 유저 목록 조회 성공',
    schema: {
      example: {
        success: true,
        message: 'playerId 미배정 유저 3명을 조회했습니다.',
        data: [
          {
            _id: '507f1f77bcf86cd799439011',
            username: 'kim_chulsu',
            teamName: '건국대 레이징불스',
            role: 'player',
            authCode: '1802',
            createdAt: '2025-01-15T09:30:00.000Z',
            profile: {
              nickname: '김철수',
              email: 'kim@hanyang.ac.kr',
              studentId: '2021001234'
            }
          }
        ],
        count: 3,
        filters: {
          teamName: null,
          role: null
        }
      }
    }
  })
  async getUnassignedUsers(
    @Query('teamName') teamName?: string,
    @Query('role') role?: string,
  ) {
    try {
      const result = await this.adminService.getUnassignedUsers(teamName, role);
      return {
        success: true,
        message: `playerId 미배정 유저 ${result.length}명을 조회했습니다.`,
        data: result,
        count: result.length,
        filters: {
          teamName: teamName || null,
          role: role || null,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: '미배정 유저 조회 중 오류가 발생했습니다.',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('users/:userId/assign-player')
  @ApiOperation({
    summary: '🎯 유저에게 PlayerId 배정',
    description: `
    ## 👑 관리자 전용 API

    특정 유저에게 playerId를 배정합니다.
    
    ### 🎯 사용 목적
    - 신규 회원의 신원 확인 후 playerId 배정
    - 해당 playerId로 스탯 데이터 연결
    - 선수의 마이페이지 활성화

    ### 📋 PlayerId 형식
    - 형식: \`시즌_학교코드_등번호\`
    - 예시: \`2025_KK_10\` (2025년 건국대 10번)

    ### 🏫 학교 코드
    - KK: 건국대, HY: 한양대, YS: 연세대
    - KU: 고려대, KH: 경희대, SN: 서울대 등

    ### ⚠️ 주의사항
    - 관리자 권한 필요
    - 중복 playerId 배정 불가
    - 배정 후 JWT 토큰 재발급 권장
    `,
  })
  @ApiParam({
    name: 'userId',
    description: '대상 유저의 MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({
    description: 'PlayerId 배정 정보',
    schema: {
      example: {
        playerId: '2025_KK_10'
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: '✅ PlayerId 배정 성공',
    schema: {
      example: {
        success: true,
        message: 'kim_chulsu 사용자에게 playerId "2025_KK_10"가 성공적으로 배정되었습니다.',
        data: {
          userId: '507f1f77bcf86cd799439011',
          username: 'kim_chulsu',
          playerId: '2025_KK_10',
          teamName: '건국대 레이징불스',
          role: 'player',
          assignedAt: '2025-01-15T10:30:00.000Z'
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: '❌ 잘못된 요청 (이미 배정됨, 중복 playerId 등)',
    schema: {
      example: {
        success: false,
        message: 'playerId "2025_KK_10"는 이미 다른 사용자에게 배정되었습니다.',
        code: 'PLAYER_ID_ALREADY_ASSIGNED'
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: '❌ 사용자를 찾을 수 없음',
    schema: {
      example: {
        success: false,
        message: '해당 사용자를 찾을 수 없습니다.',
        code: 'USER_NOT_FOUND'
      }
    }
  })
  async assignPlayerId(
    @Param('userId') userId: string,
    @Body() assignPlayerDto: AssignPlayerDto,
  ) {
    try {
      const result = await this.adminService.assignPlayerId(userId, assignPlayerDto.playerId);
      return {
        success: true,
        message: `${result.username} 사용자에게 playerId "${result.playerId}"가 성공적으로 배정되었습니다.`,
        data: result,
      };
    } catch (error) {
      if (error.message.includes('이미 배정')) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
            code: 'PLAYER_ID_ALREADY_ASSIGNED',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      
      if (error.message.includes('찾을 수 없습니다')) {
        throw new HttpException(
          {
            success: false,
            message: error.message,
            code: 'USER_NOT_FOUND',
          },
          HttpStatus.NOT_FOUND,
        );
      }

      throw new HttpException(
        {
          success: false,
          message: 'PlayerId 배정 중 오류가 발생했습니다.',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('users/assigned')
  @ApiOperation({
    summary: '✅ PlayerId 배정된 유저 목록 조회',
    description: `
    ## 👑 관리자 전용 API

    playerId가 배정된 유저들을 조회합니다.
    
    ### 🎯 사용 목적
    - 배정 완료된 유저 확인
    - playerId와 사용자 매핑 현황 파악
    - 중복 배정 방지를 위한 확인
    `,
  })
  @ApiResponse({
    status: 200,
    description: '✅ 배정된 유저 목록 조회 성공',
  })
  async getAssignedUsers(
    @Query('teamName') teamName?: string,
    @Query('role') role?: string,
  ) {
    try {
      const result = await this.adminService.getAssignedUsers(teamName, role);
      return {
        success: true,
        message: `playerId 배정된 유저 ${result.length}명을 조회했습니다.`,
        data: result,
        count: result.length,
        filters: {
          teamName: teamName || null,
          role: role || null,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: '배정된 유저 조회 중 오류가 발생했습니다.',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}