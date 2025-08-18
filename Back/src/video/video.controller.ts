import { 
  Controller, 
  Post, 
  Get, 
  Delete, 
  Param, 
  Body,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { VideoService } from './video.service';

@ApiTags('Video')
@Controller('video')
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('video'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '영상 업로드' })
  @ApiResponse({ status: 201, description: '영상 업로드 성공' })
  async uploadVideo(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { title?: string; description?: string }
  ) {
    // S3 업로드 로직은 나중에 구현
    const uploadResult = { success: true, url: `http://localhost:3000/uploads/${file.filename}` };
    
    return this.videoService.uploadVideo(file, uploadResult, body.title, body.description);
  }

  @Get(':videoId')
  @ApiOperation({ summary: '영상 조회' })
  @ApiResponse({ status: 200, description: '영상 조회 성공' })
  @ApiResponse({ status: 404, description: '영상을 찾을 수 없음' })
  async getVideo(@Param('videoId') videoId: string) {
    return this.videoService.getVideo(videoId);
  }

  @Get('game/:gameId')
  @ApiOperation({ summary: '특정 경기의 영상들 조회' })
  @ApiResponse({ status: 200, description: '경기 영상 조회 성공' })
  async getGameVideos(@Param('gameId') gameId: string) {
    return this.videoService.getGameVideos(gameId);
  }

  @Delete(':videoId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '영상 삭제' })
  @ApiResponse({ status: 200, description: '영상 삭제 성공' })
  @ApiResponse({ status: 404, description: '영상을 찾을 수 없음' })
  async deleteVideo(@Param('videoId') videoId: string) {
    return this.videoService.deleteVideo(videoId);
  }

  @Get('team/:teamId/complete')
  @ApiOperation({ summary: '팀의 전체 데이터 조회' })
  @ApiResponse({ status: 200, description: '팀 데이터 조회 성공' })
  @ApiResponse({ status: 404, description: '팀을 찾을 수 없음' })
  async getTeamCompleteData(@Param('teamId') teamId: string) {
    return this.videoService.getTeamCompleteData(teamId);
  }
}