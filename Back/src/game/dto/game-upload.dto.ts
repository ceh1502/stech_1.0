import { ApiProperty } from '@nestjs/swagger';

/**
 * 게임 업로드 성공 응답 DTO
 */
export class GameUploadSuccessDto {
  @ApiProperty({ example: true, description: '업로드 성공 여부' })
  success: boolean;

  @ApiProperty({ 
    example: '게임 데이터 업로드 및 분석이 완료되었습니다',
    description: '응답 메시지' 
  })
  message: string;

  @ApiProperty({ type: GameUploadDataDto, description: '업로드 결과 데이터' })
  data: GameUploadDataDto;

  @ApiProperty({ 
    example: '2024-12-26T10:30:00.000Z',
    description: '처리 완료 시간' 
  })
  timestamp: string;
}

/**
 * 게임 업로드 실패 응답 DTO
 */
export class GameUploadErrorDto {
  @ApiProperty({ example: false, description: '업로드 성공 여부' })
  success: boolean;

  @ApiProperty({ 
    example: '파일이 업로드되지 않았습니다',
    description: '에러 메시지' 
  })
  message: string;

  @ApiProperty({ 
    example: 'NO_FILE_UPLOADED',
    description: '에러 코드',
    required: false 
  })
  code?: string;

  @ApiProperty({ 
    example: 'Invalid file format',
    description: '에러 상세 정보',
    required: false 
  })
  details?: string;
}

/**
 * 게임 업로드 데이터 DTO
 */
export class GameUploadDataDto {
  @ApiProperty({ type: GameInfoDto, description: '게임 기본 정보' })
  gameInfo: GameInfoDto;

  @ApiProperty({ 
    type: [PlayerResultDto], 
    description: '선수별 분석 결과' 
  })
  playerResults: PlayerResultDto[];

  @ApiProperty({ type: AnalysisSummaryDto, description: '분석 결과 요약' })
  summary: AnalysisSummaryDto;

  @ApiProperty({ type: ErrorDetailsDto, description: '에러 상세 정보' })
  errors: ErrorDetailsDto;
}

/**
 * 게임 정보 DTO
 */
export class GameInfoDto {
  @ApiProperty({ 
    example: 'DGKM240908',
    description: '게임 고유 키' 
  })
  gameKey: string;

  @ApiProperty({ 
    example: '2024-09-08(일) 16:00',
    description: '게임 날짜 및 시간',
    required: false 
  })
  date?: string;

  @ApiProperty({ 
    example: 'DGTuskers',
    description: '홈팀 이름' 
  })
  homeTeam: string;

  @ApiProperty({ 
    example: 'KMRazorbacks',
    description: '어웨이팀 이름' 
  })
  awayTeam: string;

  @ApiProperty({ 
    example: '서울대학교 종합운동장',
    description: '경기 장소',
    required: false 
  })
  location?: string;

  @ApiProperty({ 
    type: FinalScoreDto,
    description: '최종 스코어',
    required: false 
  })
  finalScore?: FinalScoreDto;

  @ApiProperty({ 
    example: 80,
    description: '총 클립 수' 
  })
  totalClips: number;

  @ApiProperty({ 
    example: '2024-12-26T10:30:00.000Z',
    description: '처리 완료 시간' 
  })
  processedAt: string;
}

/**
 * 최종 스코어 DTO
 */
export class FinalScoreDto {
  @ApiProperty({ example: 0, description: '홈팀 점수' })
  home: number;

  @ApiProperty({ example: 36, description: '어웨이팀 점수' })
  away: number;
}

/**
 * 선수 분석 결과 DTO
 */
export class PlayerResultDto {
  @ApiProperty({ example: 15, description: '선수 등번호' })
  playerNumber: number;

  @ApiProperty({ example: true, description: '분석 성공 여부' })
  success: boolean;

  @ApiProperty({ 
    example: 12,
    description: '분석된 클립 수',
    required: false 
  })
  clipsAnalyzed?: number;

  @ApiProperty({ 
    example: 'QB',
    description: '선수 포지션',
    required: false 
  })
  position?: string;

  @ApiProperty({ 
    description: '분석된 통계 데이터',
    required: false,
    example: {
      games: 1,
      passAttempted: 15,
      passCompletion: 12,
      passingYards: 180,
      passingTouchdown: 2
    }
  })
  stats?: any;

  @ApiProperty({ 
    example: '15번 선수 분석 완료',
    description: '분석 결과 메시지' 
  })
  message: string;

  @ApiProperty({ 
    example: '해당 선수는 DB에 존재하지 않습니다',
    description: '에러 메시지 (실패 시)',
    required: false 
  })
  error?: string;
}

/**
 * 분석 요약 DTO
 */
export class AnalysisSummaryDto {
  @ApiProperty({ example: 15, description: '총 참여 선수 수' })
  totalPlayers: number;

  @ApiProperty({ example: 14, description: '분석 성공한 선수 수' })
  successfulPlayers: number;

  @ApiProperty({ example: 1, description: '분석 실패한 선수 수' })
  failedPlayers: number;

  @ApiProperty({ example: 80, description: '처리된 총 클립 수' })
  totalClipsProcessed: number;

  @ApiProperty({ example: 0, description: '유효하지 않은 클립 수' })
  invalidClips: number;

  @ApiProperty({ example: 93, description: '성공률 (%)' })
  successRate: number;
}

/**
 * 에러 상세 정보 DTO
 */
export class ErrorDetailsDto {
  @ApiProperty({ 
    type: [InvalidClipDto],
    description: '유효하지 않은 클립 목록' 
  })
  invalidClips: InvalidClipDto[];

  @ApiProperty({ 
    type: [FailedPlayerDto],
    description: '분석 실패한 선수 목록' 
  })
  failedPlayers: FailedPlayerDto[];
}

/**
 * 유효하지 않은 클립 DTO
 */
export class InvalidClipDto {
  @ApiProperty({ example: 5, description: '클립 인덱스' })
  clipIndex: number;

  @ApiProperty({ example: 'clip_001', description: '클립 키' })
  clipKey: string;

  @ApiProperty({ 
    example: 'Missing player information',
    description: '에러 메시지' 
  })
  error: string;
}

/**
 * 분석 실패한 선수 DTO
 */
export class FailedPlayerDto {
  @ApiProperty({ example: 99, description: '선수 등번호' })
  playerNumber: number;

  @ApiProperty({ 
    example: '해당 선수는 DB에 존재하지 않습니다',
    description: '실패 원인' 
  })
  error: string;
}

/**
 * 파일 업로드 요청 DTO (Swagger용)
 */
export class FileUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'JSON 형식의 게임 데이터 파일 (최대 10MB)',
    example: 'game-data.json'
  })
  gameFile: Express.Multer.File;
}