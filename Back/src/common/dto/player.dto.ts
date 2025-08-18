import { IsString, IsNumber, IsOptional, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PlayerStatsDto {
  // Quarterback 스탯
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  passingYards?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  passingTouchdowns?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  passingCompletions?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  passingAttempts?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  passingInterceptions?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  completionPercentage?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  passerRating?: number;

  // Running Back 스탯
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  rushingYards?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  rushingTouchdowns?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  rushingAttempts?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  yardsPerCarry?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  longestRush?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  rushingFirstDowns?: number;

  // Receiver 스탯
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  receivingYards?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  receivingTouchdowns?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  receptions?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  receivingTargets?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  yardsPerReception?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  longestReception?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  receivingFirstDowns?: number;

  // Kicker 스탯
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  fieldGoalsMade?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  fieldGoalsAttempted?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  fieldGoalPercentage?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  longestFieldGoal?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  extraPointsMade?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  extraPointsAttempted?: number;

  // Defensive 스탯
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  tackles?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  sacks?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  interceptions?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  passesDefended?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  forcedFumbles?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  fumbleRecoveries?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  defensiveTouchdowns?: number;

  // 공통 스탯
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  totalYards?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  totalTouchdowns?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  gamesPlayed?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  gamesStarted?: number;
}

export class CreatePlayerDto {
  @ApiProperty({ example: 'QB001' })
  @IsString()
  playerId: string;

  @ApiProperty({ example: 'Ken Lee' })
  @IsString()
  name: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  jerseyNumber: number;

  @ApiProperty({ example: 'QB' })
  @IsString()
  position: string;

  @ApiProperty({ example: '2023001', required: false })
  @IsOptional()
  @IsString()
  studentId?: string;

  @ApiProperty({ example: 'ken@example.com', required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ example: 'Kenny', required: false })
  @IsOptional()
  @IsString()
  nickname?: string;

  @ApiProperty({ example: '1부' })
  @IsEnum(['1부', '2부'])
  league: string;

  @ApiProperty({ example: '2024' })
  @IsString()
  season: string;

  @ApiProperty({ type: PlayerStatsDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => PlayerStatsDto)
  stats?: PlayerStatsDto;
}

export class UpdatePlayerStatsDto {
  @ApiProperty({ type: PlayerStatsDto })
  @ValidateNested()
  @Type(() => PlayerStatsDto)
  stats: PlayerStatsDto;
}

// 클립 데이터 관련 DTO
export class YardDto {
  @ApiProperty({ example: 'own', description: 'own(자진영) 또는 opp(상대진영)' })
  @IsString()
  side: string;

  @ApiProperty({ example: 25, description: '야드 라인 (0-50)' })
  @IsNumber()
  yard: number;
}

export class CarrierDto {
  @ApiProperty({ example: 'QB001', description: '선수 코드' })
  @IsString()
  playercode: string;

  @ApiProperty({ example: 10, description: '등번호' })
  @IsNumber()
  backnumber: number;

  @ApiProperty({ example: 'Away', description: '팀' })
  @IsString()
  team: string;

  @ApiProperty({ example: 'QB', description: '포지션' })
  @IsString()
  position: string;

  @ApiProperty({ example: 'throw', description: '액션' })
  @IsString()
  action: string;
}

export class SignificantPlayDto {
  @ApiProperty({ example: 'TOUCHDOWN', description: '특별한 플레이 키' })
  @IsString()
  key: string;

  @ApiProperty({ example: 'Touchdown', description: '라벨', required: false })
  @IsOptional()
  @IsString()
  label?: string;
}

export class ScoreDto {
  @ApiProperty({ example: 0, description: '홈팀 점수' })
  @IsNumber()
  Home: number;

  @ApiProperty({ example: 7, description: '어웨이팀 점수' })
  @IsNumber()
  Away: number;
}

export class ClipDataDto {
  @ApiProperty({ example: 'GAME_001_PLAY_15', description: '클립 고유 식별자' })
  @IsString()
  ClipKey: string;

  @ApiProperty({ example: 'https://example.com/clip.mp4', description: '클립 URL' })
  @IsString()
  ClipUrl: string;

  @ApiProperty({ example: '1', description: '쿼터' })
  @IsString()
  Quarter: string;

  @ApiProperty({ example: 'Away', description: '공격팀' })
  @IsString()
  OffensiveTeam: string;

  @ApiProperty({ 
    example: 'Pass', 
    description: '플레이 타입 (Pass, NoPass, Run, Sack, PAT, NoPAT, FieldGoal, NoFieldGoal, Punt, Kickoff, None)' 
  })
  @IsString()
  PlayType: string;

  @ApiProperty({ example: false, description: '스페셜팀 여부' })
  @IsOptional()
  SpecialTeam?: boolean;

  @ApiProperty({ example: 1, description: '다운' })
  @IsNumber()
  Down: number;

  @ApiProperty({ example: 10, description: '남은 야드' })
  @IsNumber()
  RemainYard: number;

  @ApiProperty({ type: YardDto, description: '시작 야드' })
  @ValidateNested()
  @Type(() => YardDto)
  StartYard: YardDto;

  @ApiProperty({ type: YardDto, description: '종료 야드' })
  @ValidateNested()
  @Type(() => YardDto)
  EndYard: YardDto;

  @ApiProperty({ type: [CarrierDto], description: '관련 선수들' })
  @ValidateNested({ each: true })
  @Type(() => CarrierDto)
  Carrier: CarrierDto[];

  @ApiProperty({ type: [SignificantPlayDto], description: '특별한 플레이들', required: false })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => SignificantPlayDto)
  SignificantPlays?: SignificantPlayDto[];

  @ApiProperty({ type: ScoreDto, description: '시작 점수' })
  @ValidateNested()
  @Type(() => ScoreDto)
  StartScore: ScoreDto;
}

export class AnalyzeClipsDto {
  @ApiProperty({ 
    type: [ClipDataDto], 
    description: '분석할 클립 데이터 배열',
    example: [{
      ClipKey: 'GAME_001_PLAY_15',
      ClipUrl: 'https://example.com/clip.mp4',
      Quarter: '1',
      OffensiveTeam: 'Away',
      PlayType: 'Pass',
      SpecialTeam: false,
      Down: 1,
      RemainYard: 10,
      StartYard: { side: 'own', yard: 25 },
      EndYard: { side: 'own', yard: 35 },
      Carrier: [{
        playercode: 'QB001',
        backnumber: 10,
        team: 'Away',
        position: 'QB',
        action: 'throw'
      }],
      SignificantPlays: [{ key: 'TOUCHDOWN', label: 'Touchdown' }],
      StartScore: { Home: 0, Away: 0 }
    }]
  })
  @ValidateNested({ each: true })
  @Type(() => ClipDataDto)
  clips: ClipDataDto[];
}

// 응답 DTO들
export class PlayerResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: '선수 조회 성공' })
  message?: string;

  @ApiProperty({ description: '선수 데이터' })
  data: any;
}

export class StatsAnalysisResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'QB 스탯 분석이 완료되었습니다.' })
  message: string;

  @ApiProperty({ description: '분석된 스탯 데이터' })
  analyzedStats: any;

  @ApiProperty({ example: 5 })
  clipCount: number;
}

export class PlayersListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ description: '선수 목록', type: [Object] })
  data: any[];
}