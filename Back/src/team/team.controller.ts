import { 
  Controller, 
  Post, 
  Get, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { TeamService } from './team.service';
import { CreateTeamDto, UpdateTeamDto } from '../common/dto/team.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';

@ApiTags('Team')
@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '팀 생성' })
  @ApiResponse({ status: 201, description: '팀 생성 성공' })
  async createTeam(@Body() createTeamDto: CreateTeamDto, @User() user: any) {
    return this.teamService.createTeam(createTeamDto, user._id);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '내 팀 목록 조회' })
  @ApiResponse({ status: 200, description: '내 팀 목록 조회 성공' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async getMyTeams(@User() user: any) {
    return this.teamService.getMyTeams(user._id);
  }

  @Get(':teamId')
  @ApiOperation({ summary: '팀 조회' })
  @ApiResponse({ status: 200, description: '팀 조회 성공' })
  @ApiResponse({ status: 404, description: '팀을 찾을 수 없음' })
  async getTeam(@Param('teamId') teamId: string) {
    return this.teamService.getTeam(teamId);
  }

  @Put(':teamId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '팀 정보 수정' })
  @ApiResponse({ status: 200, description: '팀 정보 수정 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '팀을 찾을 수 없음' })
  async updateTeam(
    @Param('teamId') teamId: string,
    @Body() updateTeamDto: UpdateTeamDto,
    @User() user: any
  ) {
    return this.teamService.updateTeam(teamId, updateTeamDto, user._id);
  }

  @Delete(':teamId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '팀 삭제' })
  @ApiResponse({ status: 200, description: '팀 삭제 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '팀을 찾을 수 없음' })
  async deleteTeam(@Param('teamId') teamId: string, @User() user: any) {
    return this.teamService.deleteTeam(teamId, user._id);
  }
}