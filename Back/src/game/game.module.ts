import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { GameController } from './game.controller';
import { GameDocsController } from './game-docs.controller';
import { GameService } from './game.service';
import { PlayerModule } from '../player/player.module';
import { TeamModule } from '../team/team.module';
import { GameInfo, GameInfoSchema } from '../schemas/game-info.schema';
import { GameClips, GameClipsSchema } from '../schemas/game-clips.schema';

@Module({
  imports: [
    // Mongoose 스키마 등록
    MongooseModule.forFeature([
      { name: GameInfo.name, schema: GameInfoSchema },
      { name: GameClips.name, schema: GameClipsSchema },
    ]),
    // Multer 설정 - 파일 업로드 처리
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB 제한
        files: 1, // 한 번에 하나의 파일만
      },
      fileFilter: (req, file, cb) => {
        // JSON 파일만 허용
        if (
          file.mimetype === 'application/json' ||
          file.originalname.toLowerCase().endsWith('.json')
        ) {
          cb(null, true);
        } else {
          cb(new Error('JSON 파일만 업로드 가능합니다'), false);
        }
      },
    }),
    // PlayerModule을 import하여 PlayerService 사용
    forwardRef(() => PlayerModule),
    // TeamModule을 import하여 TeamStatsAnalyzerService 사용
    forwardRef(() => TeamModule),
  ],
  controllers: [GameController, GameDocsController],
  providers: [GameService],
  exports: [GameService],
})
export class GameModule {}
