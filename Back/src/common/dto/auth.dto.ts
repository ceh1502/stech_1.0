import { IsString, MinLength, IsOptional, Matches, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  @Matches(/^[a-zA-Z0-9]+$/, { message: '영어 및 숫자 조합만 입력해주세요.' })
  username: string; // 아이디 (기존 email → username)

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8, { message: '비밀번호를 8글자 이상 입력해주세요.' })
  password: string;

  @ApiProperty({ example: '1802' })
  @IsString()
  authCode: string; // 인증코드

  @ApiProperty({ example: '건국대 레이징불스', required: false })
  @IsOptional()
  @IsString()
  teamName?: string; // 팀명 (인증코드로 자동 설정)

  @ApiProperty({ example: 'player', required: false })
  @IsOptional()
  @IsString()
  role?: string; // 역할 (인증코드로 자동 설정)

  @ApiProperty({ example: '서울권', required: false })
  @IsOptional()
  @IsString()
  region?: string; // 지역 (인증코드로 자동 설정)
}

export class LoginDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  username: string; // 아이디 (기존 email → username)

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}

export class CheckUsernameDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  @Matches(/^[a-zA-Z0-9]+$/, { message: '영어 및 숫자 조합만 입력해주세요.' })
  username: string;
}

export class VerifyTeamCodeDto {
  @ApiProperty({ example: '1802' })
  @IsString()
  authCode: string;
}

export class VerifyTokenDto {
  @ApiProperty({ 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: '검증할 JWT 토큰'
  })
  @IsString()
  token: string;
}

export class RefreshTokenDto {
  @ApiProperty({ 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: '갱신할 JWT 토큰'
  })
  @IsString()
  token: string;
}

export class FindUserByEmailDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: '올바른 이메일 형식을 입력해주세요.' })
  email: string;
}

export class SendResetCodeDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: '올바른 이메일 형식을 입력해주세요.' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: '올바른 이메일 형식을 입력해주세요.' })
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: '6자리 숫자 코드를 입력해주세요.' })
  resetCode: string;

  @ApiProperty({ example: 'newpassword123' })
  @IsString()
  @MinLength(8, { message: '비밀번호를 8글자 이상 입력해주세요.' })
  newPassword: string;
}

export class VerifyPasswordDto {
  @ApiProperty({ example: 'currentpassword123' })
  @IsString()
  password: string;
}

export class CheckUserExistsDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  username: string;
}
