import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminService } from './admin.service';
import { User, UserSchema } from '../schemas/user.schema';
import { PlayerGameStats, PlayerGameStatsSchema } from '../schemas/player-game-stats.schema';
import { PlayerSeasonStats, PlayerSeasonStatsSchema } from '../schemas/player-season-stats.schema';
import { GameInfo, GameInfoSchema } from '../schemas/game-info.schema';
import { GameModule } from '../game/game.module';
import { PlayerModule } from '../player/player.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: PlayerGameStats.name, schema: PlayerGameStatsSchema },
      { name: PlayerSeasonStats.name, schema: PlayerSeasonStatsSchema },
      { name: GameInfo.name, schema: GameInfoSchema },
    ]),
    GameModule,
    PlayerModule,
  ],
  controllers: [AdminController, AdminDashboardController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}