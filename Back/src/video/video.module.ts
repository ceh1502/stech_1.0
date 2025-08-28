import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';
import { Video, VideoSchema } from '../schemas/video.schema';
import { Game, GameSchema } from '../schemas/game.schema';
import { Team, TeamSchema } from '../schemas/team.schema';
import { Player, PlayerSchema } from '../schemas/player.schema';
import { S3UploadService } from '../utils/s3-upload.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Video.name, schema: VideoSchema },
      { name: Game.name, schema: GameSchema },
      { name: Team.name, schema: TeamSchema },
      { name: Player.name, schema: PlayerSchema },
    ]),
  ],
  controllers: [VideoController],
  providers: [VideoService, S3UploadService],
  exports: [VideoService],
})
export class VideoModule {}
