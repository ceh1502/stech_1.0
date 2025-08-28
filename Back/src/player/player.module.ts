import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';
// import { PlayerNewController } from './player-new.controller';
// import { PlayerNewService } from './player-new.service';
import { ClipAnalyzerService } from './clip-analyzer.service';
import { QbAnalyzerController } from './qb-analyzer.controller';
import { QbAnalyzerService } from './qb-analyzer.service';
import { StatsManagementService } from '../common/services/stats-management.service';
import { TeamModule } from '../team/team.module';
import { Player, PlayerSchema } from '../schemas/player.schema';
import { Team, TeamSchema } from '../schemas/team.schema';
import { GameStats, GameStatsSchema } from '../schemas/game-stats.schema';
import { SeasonStats, SeasonStatsSchema } from '../schemas/season-stats.schema';
import { CareerStats, CareerStatsSchema } from '../schemas/career-stats.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Player.name, schema: PlayerSchema },
      { name: Team.name, schema: TeamSchema },
      { name: GameStats.name, schema: GameStatsSchema },
      { name: SeasonStats.name, schema: SeasonStatsSchema },
      { name: CareerStats.name, schema: CareerStatsSchema },
    ]),
    TeamModule,
  ],
  controllers: [PlayerController, /* PlayerNewController, */ QbAnalyzerController],
  providers: [
    PlayerService,
    // PlayerNewService,
    ClipAnalyzerService,
    QbAnalyzerService,
    StatsManagementService,
  ],
  exports: [PlayerService /*, PlayerNewService*/],
})
export class PlayerModule {}
