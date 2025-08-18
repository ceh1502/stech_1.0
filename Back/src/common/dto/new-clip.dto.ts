import { IsString, IsNumber, IsBoolean, IsOptional, ValidateNested, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// 새로운 클립 데이터 구조 DTO

export class NewSideYardDto {
  @ApiProperty({ example: 'OWN', description: 'OWN(자진영) 또는 OPP(상대진영)' })
  @IsString()
  side: string;

  @ApiProperty({ example: 20, description: '야드 라인 (0-50)' })
  @IsNumber()
  yard: number;
}

export class NumPosDto {
  @ApiProperty({ example: 88, description: '선수 등번호', nullable: true })
  @IsOptional()
  @IsNumber()
  num: number | null;

  @ApiProperty({ example: 'QB', description: '포지션', nullable: true })
  @IsOptional()
  @IsString()
  pos: string | null;
}

export class NewScoreDto {
  @ApiProperty({ example: 0, description: '홈팀 점수', nullable: true })
  @IsOptional()
  @IsNumber()
  home: number | null;

  @ApiProperty({ example: 7, description: '어웨이팀 점수', nullable: true })
  @IsOptional()
  @IsNumber()
  away: number | null;
}

export class NewClipDto {
  @ApiProperty({ example: '12845', description: '클립 고유 식별자', nullable: true })
  @IsOptional()
  @IsString()
  clipKey?: string | null;

  @ApiProperty({ example: 'Home', description: '공격팀', nullable: true })
  @IsOptional()
  @IsString()
  offensiveTeam?: string | null;

  @ApiProperty({ example: 1, description: '쿼터', nullable: true })
  @IsOptional()
  @IsNumber()
  quarter?: number | null;

  @ApiProperty({ example: '1', description: '다운', nullable: true })
  @IsOptional()
  @IsString()
  down?: string | null;

  @ApiProperty({ example: 10, description: '남은 야드', nullable: true })
  @IsOptional()
  @IsNumber()
  toGoYard?: number | null;

  @ApiProperty({ 
    example: 'Kickoff', 
    description: '플레이 타입', 
    nullable: true 
  })
  @IsOptional()
  @IsString()
  playType?: string | null;

  @ApiProperty({ example: true, description: '스페셜팀 여부', nullable: true })
  @IsOptional()
  @IsBoolean()
  specialTeam?: boolean | null;

  @ApiProperty({ type: NewSideYardDto, description: '시작 야드' })
  @ValidateNested()
  @Type(() => NewSideYardDto)
  start: NewSideYardDto;

  @ApiProperty({ type: NewSideYardDto, description: '종료 야드' })
  @ValidateNested()
  @Type(() => NewSideYardDto)
  end: NewSideYardDto;

  @ApiProperty({ example: 10, description: '획득 야드 (미리 계산됨)', nullable: true })
  @IsOptional()
  @IsNumber()
  gainYard?: number | null;

  @ApiProperty({ type: NumPosDto, description: '첫 번째 선수' })
  @ValidateNested()
  @Type(() => NumPosDto)
  car: NumPosDto;

  @ApiProperty({ type: NumPosDto, description: '두 번째 선수' })
  @ValidateNested()
  @Type(() => NumPosDto)
  car2: NumPosDto;

  @ApiProperty({ type: NumPosDto, description: '첫 번째 태클러' })
  @ValidateNested()
  @Type(() => NumPosDto)
  tkl: NumPosDto;

  @ApiProperty({ type: NumPosDto, description: '두 번째 태클러' })
  @ValidateNested()
  @Type(() => NumPosDto)
  tkl2: NumPosDto;

  @ApiProperty({
    type: [String],
    description: '특별한 플레이들 (고정 4개 배열)',
    example: ['TOUCHDOWN', null, null, null],
    minItems: 4,
    maxItems: 4
  })
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  significantPlays: (string | null)[];
}

export class NewGameDto {
  @ApiProperty({ example: 'KMHY241110', description: '게임 키', nullable: true })
  @IsOptional()
  @IsString()
  gameKey?: string | null;

  @ApiProperty({ example: '2024-11-10(수) 10:00', description: '날짜 및 시간', nullable: true })
  @IsOptional()
  @IsString()
  date?: string | null;

  @ApiProperty({ example: 'League', description: '게임 타입', nullable: true })
  @IsOptional()
  @IsString()
  type?: string | null;

  @ApiProperty({ type: NewScoreDto, description: '최종 점수' })
  @ValidateNested()
  @Type(() => NewScoreDto)
  score: NewScoreDto;

  @ApiProperty({ example: 'Seoul', description: '지역', nullable: true })
  @IsOptional()
  @IsString()
  region?: string | null;

  @ApiProperty({ example: 'Hyochang Field', description: '장소', nullable: true })
  @IsOptional()
  @IsString()
  location?: string | null;

  @ApiProperty({ example: 'Kookmin Razorbacks', description: '홈팀', nullable: true })
  @IsOptional()
  @IsString()
  homeTeam?: string | null;

  @ApiProperty({ example: 'Hanyang Lions', description: '어웨이팀', nullable: true })
  @IsOptional()
  @IsString()
  awayTeam?: string | null;

  @ApiProperty({ 
    type: [NewClipDto], 
    description: '클립 데이터 배열' 
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NewClipDto)
  Clips: NewClipDto[];
}

// 분석 요청 DTO
export class AnalyzeNewClipsDto {
  @ApiProperty({ 
    type: [NewClipDto], 
    description: '새로운 형식의 클립 데이터 배열',
    example: [{
      clipKey: '12845',
      offensiveTeam: 'Home',
      quarter: 1,
      down: '1',
      toGoYard: 10,
      playType: 'Kickoff',
      specialTeam: true,
      start: { side: 'OWN', yard: 20 },
      end: { side: 'OPP', yard: 30 },
      gainYard: 10,
      car: { num: 88, pos: 'QB' },
      car2: { num: null, pos: null },
      tkl: { num: 34, pos: 'WR' },
      tkl2: { num: 11, pos: 'DB' },
      significantPlays: ['TOUCHDOWN', null, null, null]
    }]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NewClipDto)
  clips: NewClipDto[];
}