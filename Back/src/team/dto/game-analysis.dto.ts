import { ApiProperty } from '@nestjs/swagger';

export class GameAnalysisRequestDto {
  @ApiProperty({
    description: '분석할 경기의 gameKey',
    example: 'SNUS240908'
  })
  gameKey: string;
}

export class PlayCallRatioDto {
  @ApiProperty({ 
    description: '런 플레이 수',
    example: 25 
  })
  runPlays: number;

  @ApiProperty({ 
    description: '패스 플레이 수',
    example: 35 
  })
  passPlays: number;

  @ApiProperty({ 
    description: '런 비율 (%)',
    example: 42 
  })
  runPercentage: number;

  @ApiProperty({ 
    description: '패스 비율 (%)',
    example: 58 
  })
  passPercentage: number;
}

export class ThirdDownStatsDto {
  @ApiProperty({ 
    description: '3rd down 시도 수',
    example: 12 
  })
  attempts: number;

  @ApiProperty({ 
    description: '3rd down 성공 수',
    example: 5 
  })
  conversions: number;

  @ApiProperty({ 
    description: '3rd down 성공률 (%)',
    example: 42 
  })
  percentage: number;
}

export class TeamGameAnalysisDto {
  @ApiProperty({ 
    description: '팀명',
    example: 'SNGreenTerrors' 
  })
  teamName: string;

  @ApiProperty({ 
    description: '플레이콜 비율',
    type: PlayCallRatioDto 
  })
  playCallRatio: PlayCallRatioDto;

  @ApiProperty({ 
    description: '총 야드',
    example: 325 
  })
  totalYards: number;

  @ApiProperty({ 
    description: '패싱 야드',
    example: 185 
  })
  passingYards: number;

  @ApiProperty({ 
    description: '러싱 야드',
    example: 140 
  })
  rushingYards: number;

  @ApiProperty({ 
    description: '3rd down 스탯',
    type: ThirdDownStatsDto 
  })
  thirdDownStats: ThirdDownStatsDto;

  @ApiProperty({ 
    description: '턴오버',
    example: 2 
  })
  turnovers: number;

  @ApiProperty({ 
    description: '페널티 야드',
    example: 45 
  })
  penaltyYards: number;
}

export class GameAnalysisResponseDto {
  @ApiProperty({ 
    description: '성공 여부',
    example: true 
  })
  success: boolean;

  @ApiProperty({ 
    description: '응답 메시지',
    example: '경기 분석이 완료되었습니다' 
  })
  message: string;

  @ApiProperty({ 
    description: '홈팀 분석 데이터',
    type: TeamGameAnalysisDto 
  })
  homeTeam: TeamGameAnalysisDto;

  @ApiProperty({ 
    description: '어웨이팀 분석 데이터',
    type: TeamGameAnalysisDto 
  })
  awayTeam: TeamGameAnalysisDto;

  @ApiProperty({ 
    description: '응답 시간',
    example: '2024-09-08T10:30:00.000Z' 
  })
  timestamp: string;
}