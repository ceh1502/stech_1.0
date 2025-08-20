import { ApiProperty } from '@nestjs/swagger';

/**
 * 팀 스탯 데이터 DTO
 */
export class TeamStatsDataDto {
  @ApiProperty({
    example: 'DGTuskers',
    description: '팀 이름'
  })
  teamName: string;

  @ApiProperty({
    example: 425,
    description: '총 야드 (패싱+러싱+리턴야드 합계)'
  })
  totalYards: number;

  @ApiProperty({
    example: 280,
    description: '패싱 야드'
  })
  passingYards: number;

  @ApiProperty({
    example: 145,
    description: '러싱 야드 (sack 야드 차감)'
  })
  rushingYards: number;

  @ApiProperty({
    example: 45,
    description: '인터셉트 리턴 야드'
  })
  interceptionReturnYards: number;

  @ApiProperty({
    example: 25,
    description: '펀트 리턴 야드'
  })
  puntReturnYards: number;

  @ApiProperty({
    example: 35,
    description: '킥오프 리턴 야드'
  })
  kickoffReturnYards: number;

  @ApiProperty({
    example: 2,
    description: '턴오버 횟수'
  })
  turnovers: number;

  @ApiProperty({
    example: 45,
    description: '페널티 야드 (추후 구현)'
  })
  penaltyYards: number;

  @ApiProperty({
    example: 15,
    description: 'Sack 야드 (러싱야드 차감용)'
  })
  sackYards: number;
}

/**
 * 팀 스탯 결과 DTO
 */
export class TeamStatsResultDto {
  @ApiProperty({
    type: TeamStatsDataDto,
    description: '홈팀 스탯'
  })
  homeTeamStats: TeamStatsDataDto;

  @ApiProperty({
    type: TeamStatsDataDto,
    description: '어웨이팀 스탯'
  })
  awayTeamStats: TeamStatsDataDto;
}

/**
 * 팀 스탯 조회 성공 응답 DTO
 */
export class TeamStatsSuccessDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: '팀 스탯 조회가 완료되었습니다' })
  message: string;

  @ApiProperty({
    type: TeamStatsResultDto,
    description: '팀 스탯 데이터'
  })
  data: TeamStatsResultDto;

  @ApiProperty({ example: '2024-12-26T10:30:00.000Z' })
  timestamp: string;
}

/**
 * 팀 스탯 에러 응답 DTO
 */
export class TeamStatsErrorDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ 
    example: '해당 게임의 팀 스탯을 찾을 수 없습니다',
    description: '에러 메시지'
  })
  message: string;

  @ApiProperty({ 
    example: 'TEAM_STATS_NOT_FOUND',
    description: '에러 코드'
  })
  code: string;
}