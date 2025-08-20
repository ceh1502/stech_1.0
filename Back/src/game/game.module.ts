import { Module, forwardRef } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { GameController } from './game.controller';
import { GameDocsController } from './game-docs.controller';
import { PlayerModule } from '../player/player.module';

@Module({
  imports: [
    // Multer 설정 - 파일 업로드 처리
    MulterModule.register({
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB 제한
        files: 1, // 한 번에 하나의 파일만
      },
      fileFilter: (req, file, cb) => {
        // JSON 파일만 허용
        if (file.mimetype === 'application/json' || file.originalname.toLowerCase().endsWith('.json')) {
          cb(null, true);
        } else {
          cb(new Error('JSON 파일만 업로드 가능합니다'), false);
        }
      },
    }),
    // PlayerModule을 import하여 PlayerService 사용
    forwardRef(() => PlayerModule),
  ],
  controllers: [GameController, GameDocsController],
  providers: [],
  exports: [],
})
export class GameModule {}