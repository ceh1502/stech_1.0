import { IsString, IsOptional, IsUrl } from 'class-validator';
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