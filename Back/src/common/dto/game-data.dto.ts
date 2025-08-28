import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  // IsObject, // TODO: 사용할 때 주석 해제
  IsArray,
  ValidateNested,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { NewClipDto } from './new-clip.dto';

/**
 * 게임 스코어 정보 DTO
 */
export class GameScoreDto {
  @ApiProperty({ example: 6, description: '홈팀 점수' })
  @IsOptional()
  home?: number;

  @ApiProperty({ example: 27, description: '어웨이팀 점수' })
  @IsOptional()
  away?: number;
}

/**
 * 전체 게임 데이터 DTO - JSON의 전체 구조를 반영
 */
export class GameDataDto {
  @ApiProperty({ example: 'HFHY20240907', description: '게임 키' })
  @IsString()
  gameKey: string;

  @ApiProperty({
    example: '2024-09-07(토) 16:00',
    description: '경기 날짜 및 시간',
  })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({ example: 'League', description: '경기 타입' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({ type: GameScoreDto, description: '게임 스코어' })
  @IsOptional()
  @ValidateNested()
  @Type(() => GameScoreDto)
  score?: GameScoreDto;

  @ApiProperty({ example: 'Seoul', description: '지역' })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ example: '서울대 운동장', description: '경기장' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ example: 'HFBlackKnights', description: '홈팀명' })
  @IsString()
  homeTeam: string;

  @ApiProperty({ example: 'HYLions', description: '어웨이팀명' })
  @IsString()
  awayTeam: string;

  @ApiProperty({
    type: [NewClipDto],
    description: '클립 데이터 배열 (Clips 또는 clips 필드명 모두 지원)',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NewClipDto)
  Clips: NewClipDto[];
}
