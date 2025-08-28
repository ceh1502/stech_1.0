import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExtraModels,
} from '@nestjs/swagger';
import {
  SampleGameDataDto,
  SampleSuccessResponseDto,
} from './dto/game-sample.dto';
import {
  GameUploadSuccessDto,
  GameUploadErrorDto,
} from './dto/game-upload.dto';

@ApiTags('🏈 Game Data Upload')
@ApiExtraModels(
  SampleGameDataDto,
  SampleSuccessResponseDto,
  GameUploadSuccessDto,
  GameUploadErrorDto,
)
@Controller('api/game/docs')
export class GameDocsController {
  @Get('sample-json')
  @ApiOperation({
    summary: '📋 업로드용 샘플 JSON 구조',
    description: `
    ## 📝 JSON 파일 구조 가이드

    게임 데이터 업로드 시 사용할 JSON 파일의 정확한 구조입니다.
    
    ### 🎯 필수 필드
    - **gameKey**: 게임 고유 식별자
    - **homeTeam/awayTeam**: 팀 이름
    - **Clips**: 클립 데이터 배열
    
    ### 🏃‍♂️ 클립 내 선수 정보
    - **car**: 주요 선수 (볼 캐리어, 패서 등)
    - **car2**: 보조 선수 (리시버, 러너 등)
    - **tkl**: 태클러
    - **tkl2**: 보조 태클러
    
    ### ⚡ 중요한 플레이
    - **significantPlays**: TOUCHDOWN, FUMBLE, INTERCEPT 등
    - 배열은 정확히 4개 요소여야 함 (null 허용)
    
    ### 🏟️ 필드 포지션
    - **side**: 'OWN' (자진영) 또는 'OPP' (상대진영)
    - **yard**: 0-50 야드 라인
    `,
  })
  @ApiResponse({
    status: 200,
    description: '📄 샘플 JSON 구조',
    type: SampleGameDataDto,
  })
  getSampleJsonStructure(): SampleGameDataDto {
    return {
      gameKey: 'DGKM240908',
      date: '2024-09-08(일) 16:00',
      type: 'League',
      score: { home: 0, away: 36 },
      region: 'Seoul',
      location: '서울대학교 종합운동장',
      homeTeam: 'DGTuskers',
      awayTeam: 'KMRazorbacks',
      Clips: [
        {
          clipKey: '1',
          offensiveTeam: 'Away',
          quarter: 2,
          down: '4',
          toGoYard: 7,
          playType: 'PASS',
          specialTeam: false,
          start: { side: 'OPP', yard: 8 },
          end: { side: 'OPP', yard: 0 },
          gainYard: 8,
          car: { num: 33, pos: 'WR' },
          car2: { num: 15, pos: 'QB' },
          tkl: { num: null, pos: null },
          tkl2: { num: null, pos: null },
          significantPlays: ['TOUCHDOWN', null, null, null],
        },
        {
          clipKey: '2',
          offensiveTeam: 'Away',
          quarter: 2,
          down: 'PAT',
          toGoYard: null,
          playType: 'PAT',
          specialTeam: true,
          start: { side: null, yard: null },
          end: { side: null, yard: null },
          gainYard: 0,
          car: { num: 24, pos: 'K' },
          car2: { num: null, pos: null },
          tkl: { num: null, pos: null },
          tkl2: { num: null, pos: null },
          significantPlays: ['PATNOGOOD', null, null, null],
        },
      ],
    };
  }

  @Get('sample-response')
  @ApiOperation({
    summary: '📊 성공 응답 예시',
    description: `
    ## ✅ 성공적인 업로드 후 응답 형식

    게임 데이터 업로드가 성공하면 다음과 같은 상세한 분석 결과를 받을 수 있습니다.
    
    ### 📈 포함된 정보
    - **gameInfo**: 게임 기본 정보 및 처리 통계
    - **playerResults**: 각 선수별 분석 결과
    - **summary**: 전체 분석 요약
    - **errors**: 실패한 항목들의 상세 정보
    
    ### 🎯 선수별 결과
    각 선수마다 다음 정보가 제공됩니다:
    - 분석된 클립 수
    - 포지션 정보
    - 상세 통계 데이터
    - 성공/실패 여부
    `,
  })
  @ApiResponse({
    status: 200,
    description: '📊 성공 응답 예시',
    type: SampleSuccessResponseDto,
  })
  getSampleResponse(): SampleSuccessResponseDto {
    return {
      success: true,
      message: '게임 데이터 업로드 및 분석이 완료되었습니다',
      data: {
        gameInfo: {
          gameKey: 'DGKM240908',
          date: '2024-09-08(일) 16:00',
          homeTeam: 'DGTuskers',
          awayTeam: 'KMRazorbacks',
          location: '서울대학교 종합운동장',
          finalScore: { home: 0, away: 36 },
          totalClips: 80,
          processedAt: '2024-12-26T10:30:00.000Z',
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
              passingTouchdown: 2,
            },
            message: '15번 선수 분석 완료',
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
              receivingTouchdown: 1,
            },
            message: '33번 선수 분석 완료',
          },
        ],
        summary: {
          totalPlayers: 15,
          successfulPlayers: 14,
          failedPlayers: 1,
          totalClipsProcessed: 80,
          invalidClips: 0,
          successRate: 93,
        },
        errors: {
          invalidClips: [],
          failedPlayers: [
            {
              playerNumber: 99,
              error: '해당 선수는 DB에 존재하지 않습니다',
            },
          ],
        },
      },
      timestamp: '2024-12-26T10:30:00.000Z',
    };
  }

  @Get('error-codes')
  @ApiOperation({
    summary: '⚠️ 에러 코드 및 해결 방법',
    description: `
    ## 🚨 가능한 에러 코드 및 해결 방법

    ### 📤 파일 업로드 관련
    - **NO_FILE_UPLOADED**: 파일이 선택되지 않음
    - **FILE_TOO_LARGE**: 파일 크기 10MB 초과
    - **INVALID_JSON_FORMAT**: JSON 구문 오류

    ### 📊 데이터 구조 관련  
    - **INVALID_GAME_DATA_STRUCTURE**: Clips 배열 누락
    - **MISSING_PLAYER_DATA**: 선수 정보 부족

    ### 🏃‍♂️ 분석 처리 관련
    - **PLAYER_NOT_FOUND**: DB에 선수 없음
    - **POSITION_ANALYZER_ERROR**: 포지션 분석기 오류
    - **INTERNAL_PROCESSING_ERROR**: 서버 내부 오류

    ### 💡 해결 방법
    1. JSON 형식 검증 도구 사용
    2. 파일 크기 확인 (최대 10MB)
    3. 필수 필드 누락 여부 확인
    4. 선수 등번호 정확성 확인
    `,
  })
  @ApiResponse({
    status: 200,
    description: '📝 에러 코드 가이드',
    schema: {
      example: {
        '파일 업로드 에러': {
          NO_FILE_UPLOADED: '파일이 업로드되지 않았습니다',
          FILE_TOO_LARGE: '파일 크기가 너무 큽니다 (최대 10MB)',
          INVALID_JSON_FORMAT: '올바른 JSON 형식이 아닙니다',
        },
        '데이터 구조 에러': {
          INVALID_GAME_DATA_STRUCTURE:
            '올바른 게임 데이터 형식이 아닙니다 (Clips 배열이 필요)',
        },
        '처리 에러': {
          INTERNAL_PROCESSING_ERROR:
            '게임 데이터 처리 중 예상치 못한 오류가 발생했습니다',
        },
      },
    },
  })
  getErrorCodes() {
    return {
      '파일 업로드 에러': {
        NO_FILE_UPLOADED: '파일이 업로드되지 않았습니다',
        FILE_TOO_LARGE: '파일 크기가 너무 큽니다 (최대 10MB)',
        INVALID_JSON_FORMAT: '올바른 JSON 형식이 아닙니다',
      },
      '데이터 구조 에러': {
        INVALID_GAME_DATA_STRUCTURE:
          '올바른 게임 데이터 형식이 아닙니다 (Clips 배열이 필요)',
      },
      '처리 에러': {
        INTERNAL_PROCESSING_ERROR:
          '게임 데이터 처리 중 예상치 못한 오류가 발생했습니다',
      },
    };
  }
}
