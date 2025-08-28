import {
  IsString,
  IsNumber,
  IsEmail,
  IsOptional,
  IsDateString,
  ValidateNested,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, PartialType } from '@nestjs/swagger';

// Account DTO
export class AccountDto {
  @ApiProperty({ description: '계정 ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: '비밀번호' })
  @IsString()
  password: string;
}

// Team DTO
export class TeamDto {
  @ApiProperty({ description: '팀 ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: '팀 이름' })
  @IsString()
  name: string;

  @ApiProperty({ description: '팀 약어' })
  @IsString()
  abbr: string;

  @ApiProperty({ description: '팀 로고 URL', required: false })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({ description: '팀 컬러', required: false })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiProperty({ description: '팀 소재지', required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: '감독 이름', required: false })
  @IsOptional()
  @IsString()
  coach?: string;

  @ApiProperty({ description: '창단일', required: false })
  @IsOptional()
  @IsDateString()
  founded?: string;

  @ApiProperty({ description: '팀 웹사이트', required: false })
  @IsOptional()
  @IsString()
  website?: string;
}

// Profile DTO
export class ProfileDto {
  @ApiProperty({ description: '선수 이름' })
  @IsString()
  name: string;

  @ApiProperty({ description: '등번호' })
  @IsNumber()
  number: number;

  @ApiProperty({ description: '포지션' })
  @IsString()
  position: string;

  @ApiProperty({ description: '생년월일', required: false })
  @IsOptional()
  @IsDateString()
  birth?: string;

  @ApiProperty({ description: '나이', required: false })
  @IsOptional()
  @IsNumber()
  age?: number;

  @ApiProperty({ description: '학년', required: false })
  @IsOptional()
  @IsNumber()
  grade?: number;

  @ApiProperty({ description: '경력', required: false })
  @IsOptional()
  @IsNumber()
  career?: number;

  @ApiProperty({ description: '키 (cm)', required: false })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiProperty({ description: '몸무게 (kg)', required: false })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiProperty({ description: '이메일', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: '전화번호', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: '프로필 이미지 URL', required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ description: '상태', required: false, default: 'Active' })
  @IsOptional()
  @IsString()
  status?: string;
}

// Field Goal Distance DTO
export class FieldGoalDistanceDto {
  @ApiProperty({ description: '성공 횟수' })
  @IsNumber()
  made: number;

  @ApiProperty({ description: '시도 횟수' })
  @IsNumber()
  attempt: number;
}

// Field Goals By Distance DTO
export class FieldGoalsByDistanceDto {
  @ApiProperty({ description: '0-19야드' })
  @ValidateNested()
  @Type(() => FieldGoalDistanceDto)
  '0_19': FieldGoalDistanceDto;

  @ApiProperty({ description: '20-29야드' })
  @ValidateNested()
  @Type(() => FieldGoalDistanceDto)
  '20_29': FieldGoalDistanceDto;

  @ApiProperty({ description: '30-39야드' })
  @ValidateNested()
  @Type(() => FieldGoalDistanceDto)
  '30_39': FieldGoalDistanceDto;

  @ApiProperty({ description: '40-49야드' })
  @ValidateNested()
  @Type(() => FieldGoalDistanceDto)
  '40_49': FieldGoalDistanceDto;

  @ApiProperty({ description: '50야드 이상' })
  @ValidateNested()
  @Type(() => FieldGoalDistanceDto)
  '50_plus': FieldGoalDistanceDto;
}

// Game Stats DTO
export class GameStatsDto {
  @ApiProperty({ description: '출전 경기 수', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  GamesPlayed?: number;

  // Passing Stats
  @ApiProperty({ description: '패싱 야드', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  PassYards?: number;

  @ApiProperty({ description: '패스 시도', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  PassATT?: number;

  @ApiProperty({ description: '패스 성공', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  PassCmp?: number;

  @ApiProperty({ description: '패싱 터치다운', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  PassTD?: number;

  @ApiProperty({ description: '인터셉션', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  Interceptions?: number;

  @ApiProperty({ description: '최장 패스', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  LongPass?: number;

  // Rushing Stats
  @ApiProperty({ description: '러싱 야드', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  RushYards?: number;

  @ApiProperty({ description: '러싱 시도', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  RushAtt?: number;

  @ApiProperty({ description: '러싱 터치다운', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  RushTD?: number;

  @ApiProperty({ description: '최장 러싱', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  LongRush?: number;

  // Receiving Stats
  @ApiProperty({ description: '리셉션', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  Receptions?: number;

  @ApiProperty({ description: '타겟', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  Target?: number;

  @ApiProperty({ description: '리시빙 야드', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  ReceivingYards?: number;

  @ApiProperty({ description: '리시빙 터치다운', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  ReceivingTD?: number;

  @ApiProperty({ description: '최장 리셉션', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  LongReception?: number;

  @ApiProperty({
    description: '리시빙 퍼스트다운',
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  ReceivingFD?: number;

  // 기타 모든 스탯들... (필요에 따라 추가)

  @ApiProperty({ description: '거리별 필드골 통계', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => FieldGoalsByDistanceDto)
  FieldGoalsByDistance?: FieldGoalsByDistanceDto;
}

// Season Stats DTO
export class SeasonStatsDto extends GameStatsDto {
  @ApiProperty({ description: '시즌 연도' })
  @IsNumber()
  year: number;
}

// Career Stats DTO
export class CareerStatsDto {
  @ApiProperty({ description: '총 출전 경기', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  GamesPlayed?: number;

  @ApiProperty({ description: '총 패싱 야드', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  PassYards?: number;

  @ApiProperty({ description: '총 패스 시도', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  PassATT?: number;

  @ApiProperty({ description: '총 패스 성공', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  PassCmp?: number;

  @ApiProperty({ description: '총 패싱 터치다운', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  PassTD?: number;

  @ApiProperty({ description: '총 인터셉션', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  Interceptions?: number;

  @ApiProperty({ description: '총 러싱 야드', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  RushYards?: number;

  @ApiProperty({ description: '총 러싱 터치다운', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  RushTD?: number;

  @ApiProperty({ description: '총 리시빙 야드', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  ReceivingYards?: number;

  @ApiProperty({
    description: '총 리시빙 터치다운',
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  ReceivingTD?: number;

  @ApiProperty({ description: '총 태클', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  Tackles?: number;

  @ApiProperty({ description: '총 색', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  Sacks?: number;

  @ApiProperty({ description: '총 수비 터치다운', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  DefTD?: number;

  @ApiProperty({ description: '총 펀트', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  Punts?: number;

  @ApiProperty({ description: '총 펀트 야드', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  PuntYards?: number;

  @ApiProperty({ description: '총 필드골 성공', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  FieldGoalMade?: number;

  @ApiProperty({ description: '총 필드골 시도', required: false, default: 0 })
  @IsOptional()
  @IsNumber()
  FieldGoalAttempt?: number;
}

// Stats DTO
export class StatsDto {
  @ApiProperty({ description: '경기 통계', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => GameStatsDto)
  game?: GameStatsDto;

  @ApiProperty({ description: '시즌 통계', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => SeasonStatsDto)
  season?: SeasonStatsDto;

  @ApiProperty({ description: '커리어 통계', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => CareerStatsDto)
  career?: CareerStatsDto;
}

// Achievement DTO
export class AchievementDto {
  @ApiProperty({ description: '연도' })
  @IsNumber()
  year: number;

  @ApiProperty({ description: '성취 제목' })
  @IsString()
  title: string;

  @ApiProperty({ description: '성취 설명', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

// Create Player DTO
export class CreatePlayerNewDto {
  @ApiProperty({ description: '선수 고유 키' })
  @IsString()
  playerKey: string;

  @ApiProperty({ description: '역할', required: false, default: 'Player' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ description: '계정 정보' })
  @ValidateNested()
  @Type(() => AccountDto)
  account: AccountDto;

  @ApiProperty({ description: '팀 정보' })
  @ValidateNested()
  @Type(() => TeamDto)
  team: TeamDto;

  @ApiProperty({ description: '프로필 정보' })
  @ValidateNested()
  @Type(() => ProfileDto)
  profile: ProfileDto;

  @ApiProperty({ description: '통계 정보', required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => StatsDto)
  stats?: StatsDto;

  @ApiProperty({ description: '성취 목록', required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AchievementDto)
  achievements?: AchievementDto[];
}

// Update Player DTO
export class UpdatePlayerNewDto extends PartialType(CreatePlayerNewDto) {}
