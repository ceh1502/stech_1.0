import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NewPlayer, NewPlayerSchema } from '../schemas/new-player.schema';
import { NewPlayerController } from './new-player.controller';
import { NewPlayerService } from './new-player.service';
import { NewGameDataProcessorService } from './new-game-data-processor.service';
import { NewQbStatsAnalyzerService } from './new-qb-stats-analyzer.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NewPlayer.name, schema: NewPlayerSchema }
    ])
  ],
  controllers: [NewPlayerController],
  providers: [
    NewPlayerService,
    NewGameDataProcessorService,
    NewQbStatsAnalyzerService
  ],
  exports: [NewPlayerService]
})
export class NewPlayerModule {}