import { IsString, IsOptional } from 'class-validator';
// import { IsUrl } from 'class-validator'; // TODO: 사용할 때 주석 해제
import { ApiProperty } from '@nestjs/swagger';

export class CreateTeamDto {
  @ApiProperty({ example: 'Lions' })
  @IsString()
  teamName: string;

  @ApiProperty({ example: '/images/lions.png', required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;
}

export class UpdateTeamDto {
  @ApiProperty({ example: 'Updated Lions', required: false })
  @IsOptional()
  @IsString()
  teamName?: string;

  @ApiProperty({ example: '/images/new-logo.png', required: false })
  @IsOptional()
  @IsString()
  logoUrl?: string;
}
