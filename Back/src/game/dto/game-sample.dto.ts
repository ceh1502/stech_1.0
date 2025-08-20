import { ApiProperty } from '@nestjs/swagger';

/**
 * 샘플 JSON 구조 - Swagger 문서용
 */
export class SampleGameDataDto {
  @ApiProperty({
    example: 'DGKM240908',
    description: '게임 고유 식별자'
  })
  gameKey: string;

  @ApiProperty({
    example: '2024-09-08(일) 16:00',
    description: '경기 날짜 및 시간'
  })
  date: string;

  @ApiProperty({
    example: 'League',
    description: '경기 타입'
  })
  type: string;

  @ApiProperty({
    example: { home: 0, away: 36 },
    description: '최종 점수'
  })
  score: {
    home: number;
    away: number;
  };

  @ApiProperty({
    example: 'Seoul',
    description: '경기 지역'
  })
  region: string;

  @ApiProperty({
    example: '서울대학교 종합운동장',
    description: '경기 장소'
  })
  location: string;

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
    type: [SampleClipDto],
    description: '경기 클립 데이터 배열'
  })
  Clips: SampleClipDto[];
}

/**
 * 샘플 클립 구조 - Swagger 문서용
 */
export class SampleClipDto {
  @ApiProperty({
    example: '1',
    description: '클립 고유 키'
  })
  clipKey: string;

  @ApiProperty({
    example: 'Away',
    description: '공격팀 (Home/Away)'
  })
  offensiveTeam: string;

  @ApiProperty({
    example: 2,
    description: '쿼터'
  })
  quarter: number;

  @ApiProperty({
    example: '4',
    description: '다운'
  })
  down: string;

  @ApiProperty({
    example: 7,
    description: '남은 야드'
  })
  toGoYard: number;

  @ApiProperty({
    example: 'PASS',
    description: '플레이 타입 (PASS, RUN, KICKOFF, PUNT, FG, PAT 등)'
  })
  playType: string;

  @ApiProperty({
    example: false,
    description: '스페셜팀 플레이 여부'
  })
  specialTeam: boolean;

  @ApiProperty({
    example: { side: 'OPP', yard: 8 },
    description: '시작 위치'
  })
  start: {
    side: string;
    yard: number;
  };

  @ApiProperty({
    example: { side: 'OPP', yard: 0 },
    description: '종료 위치'
  })
  end: {
    side: string;
    yard: number;
  };

  @ApiProperty({
    example: 8,
    description: '획득 야드'
  })
  gainYard: number;

  @ApiProperty({
    example: { num: 33, pos: 'WR' },
    description: '첫 번째 선수 (볼 캐리어)'
  })
  car: {
    num: number;
    pos: string;
  };

  @ApiProperty({
    example: { num: 15, pos: 'QB' },
    description: '두 번째 선수 (QB, 리시버 등)',
    required: false
  })
  car2?: {
    num: number;
    pos: string;
  };

  @ApiProperty({
    example: { num: null, pos: null },
    description: '첫 번째 태클러',
    required: false
  })
  tkl?: {
    num: number | null;
    pos: string | null;
  };

  @ApiProperty({
    example: { num: null, pos: null },
    description: '두 번째 태클러',
    required: false
  })
  tkl2?: {
    num: number | null;
    pos: string | null;
  };

  @ApiProperty({
    example: ['TOUCHDOWN', null, null, null],
    description: '특별한 플레이 배열 (4개 고정)',
    type: [String],
    minItems: 4,
    maxItems: 4
  })
  significantPlays: (string | null)[];
}

/**
 * 성공 응답 예시 - Swagger 문서용
 */
export class SampleSuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: '게임 데이터 업로드 및 분석이 완료되었습니다' })
  message: string;

  @ApiProperty({
    example: {
      gameInfo: {
        gameKey: 'DGKM240908',
        date: '2024-09-08(일) 16:00',
        homeTeam: 'DGTuskers',
        awayTeam: 'KMRazorbacks',
        location: '서울대학교 종합운동장',
        finalScore: { home: 0, away: 36 },
        totalClips: 80,
        processedAt: '2024-12-26T10:30:00.000Z'
      },
      playerResults: [
        {
          playerNumber: 15,
          success: true,
          clipsAnalyzed: 12,
          position: 'QB',
          stats: {
            games: 1,
            passAttempted: 15,
            passCompletion: 12,
            passingYards: 180,
            passingTouchdown: 2
          },
          message: '15번 선수 분석 완료'
        },
        {
          playerNumber: 33,
          success: true,
          clipsAnalyzed: 8,
          position: 'WR',
          stats: {
            games: 1,
            target: 6,
            reception: 5,
            receivingYards: 85,
            receivingTouchdown: 1
          },
          message: '33번 선수 분석 완료'
        }
      ],
      summary: {
        totalPlayers: 15,
        successfulPlayers: 14,
        failedPlayers: 1,
        totalClipsProcessed: 80,
        invalidClips: 0,
        successRate: 93
      },
      errors: {
        invalidClips: [],
        failedPlayers: [
          {
            playerNumber: 99,
            error: '해당 선수는 DB에 존재하지 않습니다'
          }
        ]
      }
    }
  })
  data: any;

  @ApiProperty({ example: '2024-12-26T10:30:00.000Z' })
  timestamp: string;
}