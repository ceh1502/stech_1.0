import { ApiProperty } from '@nestjs/swagger';

/**
 * 팀 시즌 스탯 DTO
 */
export class TeamSeasonStatsDto {
  @ApiProperty({ example: 'DGTuskers', description: '팀 이름' })
  teamName: string;

  @ApiProperty({ example: '2024', description: '시즌' })
  season: string;

  // 1. 득점
  @ApiProperty({ example: 280, description: '총 득점 (시즌 기준)' })
  totalPoints: number;

  @ApiProperty({ example: 14.0, description: '경기당 평균 득점' })
  pointsPerGame: number;

  @ApiProperty({ example: 35, description: '총 터치다운 (시즌 기준)' })
  totalTouchdowns: number;

  @ApiProperty({ example: 4200, description: '총 전진야드' })
  totalYards: number;

  @ApiProperty({ example: 350.0, description: '경기 당 전진야드' })
  yardsPerGame: number;

  @ApiProperty({ example: 12, description: '경기 수' })
  gamesPlayed: number;

  // 2. 런
  @ApiProperty({ example: 320, description: '러싱 시도' })
  rushingAttempts: number;

  @ApiProperty({ example: 1450, description: '러싱 야드' })
  rushingYards: number;

  @ApiProperty({ example: 4.5, description: '볼 캐리 당 러싱 야드' })
  yardsPerCarry: number;

  @ApiProperty({ example: 120.8, description: '경기당 러싱 야드' })
  rushingYardsPerGame: number;

  @ApiProperty({ example: 18, description: '러싱 터치다운' })
  rushingTouchdowns: number;

  // 3. 패스
  @ApiProperty({ example: '245-380', description: '패스 성공-패스 시도' })
  passCompletionAttempts: string;

  @ApiProperty({ example: 2750, description: '패싱 야드' })
  passingYards: number;

  @ApiProperty({ example: 7.2, description: '패스 시도 당 패스 야드' })
  yardsPerPassAttempt: number;

  @ApiProperty({ example: 229.2, description: '경기 당 패싱 야드' })
  passingYardsPerGame: number;

  @ApiProperty({ example: 17, description: '패싱 터치다운' })
  passingTouchdowns: number;

  @ApiProperty({ example: 8, description: '인터셉트' })
  interceptions: number;

  // 4. 스페셜팀
  @ApiProperty({ example: 2100, description: '총 펀트 야드' })
  totalPuntYards: number;

  @ApiProperty({ example: 42.5, description: '평균 펀트 야드' })
  averagePuntYards: number;

  @ApiProperty({ example: 25.0, description: '터치백 퍼센티지(펀트)' })
  puntTouchbackPercentage: number;

  @ApiProperty({ example: '18-22', description: '필드골 성공-총 시도' })
  fieldGoalStats: string;

  @ApiProperty({ example: 22.5, description: '평균 킥 리턴 야드' })
  averageKickReturnYards: number;

  @ApiProperty({ example: 8.3, description: '평균 펀트 리턴 야드' })
  averagePuntReturnYards: number;

  @ApiProperty({ example: 450, description: '총 리턴 야드 (킥 리턴 + 펀트 리턴)' })
  totalReturnYards: number;

  // 5. 기타
  @ApiProperty({ example: '12-8', description: '펌블 수-펌블 턴오버 수' })
  fumbleStats: string;

  @ApiProperty({ example: 1.3, description: '경기 당 턴오버 수' })
  turnoversPerGame: number;

  @ApiProperty({ example: '+2', description: '턴오버 비율 (우리 팀 - 상대 팀)' })
  turnoverDifferential: string;

  @ApiProperty({ example: '85-650', description: '총 페널티 수-총 페널티 야드' })
  penaltyStats: string;

  @ApiProperty({ example: 54.2, description: '경기 당 페널티 야드' })
  penaltyYardsPerGame: number;
}

/**
 * 팀 순위 응답 DTO
 */
export class TeamRankingResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: '팀 순위 조회가 완료되었습니다' })
  message: string;

  @ApiProperty({ type: [TeamSeasonStatsDto], description: '팀 시즌 스탯 목록' })
  data: TeamSeasonStatsDto[];

  @ApiProperty({ example: '2024-12-26T10:30:00.000Z' })
  timestamp: string;
}