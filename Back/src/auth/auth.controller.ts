import {
  Controller,
  Post,
  Put,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  SignupDto,
  LoginDto,
  CheckUsernameDto,
  VerifyTeamCodeDto,
  VerifyTokenDto,
  RefreshTokenDto,
  FindUserByEmailDto,
  SendResetCodeDto,
  ResetPasswordDto,
  VerifyPasswordDto,
  CheckUserExistsDto,
} from '../common/dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({
    summary: '회원가입',
    description:
      '인증코드 기반 회원가입. 인증코드로 팀과 역할이 자동 설정됩니다.',
  })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  @ApiResponse({ status: 400, description: '유효하지 않은 인증코드' })
  @ApiResponse({ status: 409, description: '이미 존재하는 아이디' })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '로그인',
    description: '아이디와 비밀번호로 로그인',
  })
  @ApiResponse({ status: 200, description: '로그인 성공' })
  @ApiResponse({ status: 400, description: '존재하지 않는 아이디' })
  @ApiResponse({
    status: 401,
    description: '비밀번호 불일치 또는 비활성화된 계정',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('check-username')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '아이디 중복 확인' })
  @ApiResponse({ status: 200, description: '사용 가능한 아이디' })
  @ApiResponse({ status: 409, description: '중복된 아이디' })
  async checkUsername(@Body() checkUsernameDto: CheckUsernameDto) {
    return this.authService.checkUsername(checkUsernameDto.username);
  }

  @Post('verify-team-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '인증코드 검증' })
  @ApiResponse({ status: 200, description: '유효한 인증코드' })
  @ApiResponse({ status: 400, description: '유효하지 않은 인증코드' })
  async verifyTeamCode(@Body() verifyTeamCodeDto: VerifyTeamCodeDto) {
    return this.authService.verifyTeamCode(verifyTeamCodeDto.authCode);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '프로필 업데이트',
    description: '로그인한 사용자의 프로필 정보를 업데이트합니다.',
  })
  @ApiBody({
    description: '업데이트할 프로필 정보',
    schema: {
      example: {
        avatar: 'https://example.com/avatar.jpg',
        bio: '소개글',
        nickname: '별명',
        email: 'email@example.com',
      },
    },
  })
  @ApiResponse({ status: 200, description: '프로필 업데이트 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async updateProfile(@Request() req, @Body() profileData: any) {
    return this.authService.updateProfile(req.user.id, profileData);
  }

  @Post('verify-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '🔐 JWT 토큰 검증',
    description:
      '제공된 JWT 토큰이 유효한지 확인하고 사용자 정보를 반환합니다.',
  })
  @ApiBody({
    description: '검증할 JWT 토큰',
    type: VerifyTokenDto,
  })
  @ApiResponse({
    status: 200,
    description: '✅ 유효한 토큰',
    schema: {
      example: {
        success: true,
        message: '유효한 토큰입니다.',
        data: {
          user: {
            id: '507f1f77bcf86cd799439011',
            username: 'testuser',
            teamName: 'KKRagingBulls',
            role: 'player',
            region: 'Seoul',
            playerId: '2025_KK_10',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: '❌ 유효하지 않은 토큰' })
  async verifyToken(@Body() verifyTokenDto: VerifyTokenDto) {
    return this.authService.verifyToken(verifyTokenDto);
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '🔄 JWT 토큰 갱신',
    description: '기존 토큰을 검증하고 새로운 토큰을 발급합니다.',
  })
  @ApiBody({
    description: '갱신할 JWT 토큰',
    type: RefreshTokenDto,
  })
  @ApiResponse({
    status: 200,
    description: '✅ 토큰 갱신 성공',
    schema: {
      example: {
        success: true,
        message: '토큰이 갱신되었습니다.',
        data: {
          token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          user: {
            id: '507f1f77bcf86cd799439011',
            username: 'testuser',
            teamName: 'KKRagingBulls',
            role: 'player',
            region: 'Seoul',
            playerId: '2025_KK_10',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: '❌ 토큰 갱신 실패' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '🚪 로그아웃',
    description:
      '사용자 로그아웃 처리. JWT는 stateless이므로 클라이언트에서 토큰을 삭제하세요.',
  })
  @ApiResponse({
    status: 200,
    description: '✅ 로그아웃 성공',
    schema: {
      example: {
        success: true,
        message: '로그아웃되었습니다.',
      },
    },
  })
  async logout() {
    return this.authService.logout();
  }

  @Post('check-user-exists')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '👤 아이디 존재 확인',
    description: '비밀번호 리셋 전 아이디가 존재하는지 확인합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '✅ 아이디 존재 확인',
    schema: {
      example: {
        success: true,
        message: '아이디가 확인되었습니다.',
        data: {
          hasEmail: true,
          teamName: 'KKRagingBulls',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '❌ 존재하지 않는 아이디 또는 이메일 미등록',
  })
  async checkUserExists(@Body() checkUserExistsDto: CheckUserExistsDto) {
    return this.authService.checkUserExists(checkUserExistsDto.username);
  }

  @Post('find-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '📧 이메일로 아이디 찾기',
    description: '등록된 이메일 주소로 해당 계정의 아이디를 찾습니다.',
  })
  @ApiResponse({
    status: 200,
    description: '✅ 계정 찾기 성공',
    schema: {
      example: {
        success: true,
        message: '계정을 찾았습니다.',
        data: {
          username: 'user123',
          teamName: 'KKRagingBulls',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '❌ 해당 이메일로 등록된 계정 없음',
  })
  async findUserByEmail(@Body() findUserByEmailDto: FindUserByEmailDto) {
    return this.authService.findUserByEmail(findUserByEmailDto.email);
  }

  @Post('send-reset-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '📨 패스워드 리셋 코드 전송',
    description:
      '이메일로 6자리 패스워드 리셋 인증코드를 전송합니다. (10분 유효)',
  })
  @ApiResponse({
    status: 200,
    description: '✅ 인증코드 전송 성공',
    schema: {
      example: {
        success: true,
        message: '인증코드가 이메일로 전송되었습니다.',
        data: {
          expiresAt: '2024-09-04T12:10:00.000Z',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '❌ 해당 이메일로 등록된 계정 없음 또는 재시도 횟수 초과',
  })
  async sendResetCode(@Body() sendResetCodeDto: SendResetCodeDto) {
    return this.authService.sendResetCode(sendResetCodeDto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '🔐 비밀번호 재설정',
    description: '인증코드를 확인하고 새로운 비밀번호로 변경합니다.',
  })
  @ApiResponse({
    status: 200,
    description: '✅ 비밀번호 변경 성공',
    schema: {
      example: {
        success: true,
        message: '비밀번호가 성공적으로 변경되었습니다.',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: '❌ 잘못된 인증코드 또는 만료된 코드',
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.resetCode,
      resetPasswordDto.newPassword,
    );
  }

  @Post('verify-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '🔍 패스워드 검증 (마이페이지)',
    description: '마이페이지 접근 시 현재 비밀번호 확인용 API',
  })
  @ApiResponse({
    status: 200,
    description: '✅ 비밀번호 확인됨',
    schema: {
      example: {
        success: true,
        message: '비밀번호가 확인되었습니다.',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: '❌ 비밀번호 불일치 또는 인증 필요',
  })
  async verifyPassword(
    @Request() req,
    @Body() verifyPasswordDto: VerifyPasswordDto,
  ) {
    return this.authService.verifyPassword(
      req.user.id,
      verifyPasswordDto.password,
    );
  }
}
