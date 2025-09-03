import { Controller, Post, Put, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto, CheckUsernameDto, VerifyTeamCodeDto } from '../common/dto/auth.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: '회원가입', description: '인증코드 기반 회원가입. 인증코드로 팀과 역할이 자동 설정됩니다.' })
  @ApiResponse({ status: 201, description: '회원가입 성공' })
  @ApiResponse({ status: 400, description: '유효하지 않은 인증코드' })
  @ApiResponse({ status: 409, description: '이미 존재하는 아이디' })
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그인', description: '아이디와 비밀번호로 로그인' })
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
    description: '로그인한 사용자의 프로필 정보를 업데이트합니다.' 
  })
  @ApiBody({
    description: '업데이트할 프로필 정보',
    schema: {
      example: {
        avatar: 'https://example.com/avatar.jpg',
        bio: '소개글',
        nickname: '별명',
        email: 'email@example.com'
      }
    }
  })
  @ApiResponse({ status: 200, description: '프로필 업데이트 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async updateProfile(@Request() req, @Body() profileData: any) {
    return this.authService.updateProfile(req.user.id, profileData);
  }
}
