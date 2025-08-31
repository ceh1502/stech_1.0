import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';
// import { PlayerNewController } from './player-new.controller';
// import { PlayerNewService } from './player-new.service';
import { ClipAnalyzerService } from './clip-analyzer.service';
import { QbAnalyzerController } from './qb-analyzer.controller';
import { QbAnalyzerService } from './qb-analyzer.service';
import { RbAnalyzerService } from './analyzers/rb-analyzer.service';
import { WrAnalyzerService } from './analyzers/wr-analyzer.service';
import { TeAnalyzerService } from './analyzers/te-analyzer.service';
import { KAnalyzerService } from './analyzers/k-analyzer.service';
import { PAnalyzerService } from './analyzers/p-analyzer.service';
import { OlAnalyzerService } from './analyzers/ol-analyzer.service';
import { DlAnalyzerService } from './analyzers/dl-analyzer.service';
import { LbAnalyzerService } from './analyzers/lb-analyzer.service';
import { DbAnalyzerService } from './analyzers/db-analyzer.service';
import { StatsManagementService } from '../common/services/stats-management.service';
import { TeamModule } from '../team/team.module';
import { TeamStatsAggregatorService } from '../team/team-stats-aggregator.service';
import { TeamClipAnalyzerService } from '../team/team-clip-analyzer.service';
import { Player, PlayerSchema } from '../schemas/player.schema';
import { NewPlayer, NewPlayerSchema } from '../schemas/new-player.schema';
import { Team, TeamSchema } from '../schemas/team.schema';
import { GameStats, GameStatsSchema } from '../schemas/game-stats.schema';
import { SeasonStats, SeasonStatsSchema } from '../schemas/season-stats.schema';
import { CareerStats, CareerStatsSchema } from '../schemas/career-stats.schema';
import { TeamSeasonStats, TeamSeasonStatsSchema } from '../schemas/team-season-stats.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Player.name, schema: PlayerSchema },
      { name: NewPlayer.name, schema: NewPlayerSchema },
      { name: Team.name, schema: TeamSchema },
      { name: GameStats.name, schema: GameStatsSchema },
      { name: SeasonStats.name, schema: SeasonStatsSchema },
      { name: CareerStats.name, schema: CareerStatsSchema },
      { name: TeamSeasonStats.name, schema: TeamSeasonStatsSchema },
    ]),
    TeamModule,
  ],
  controllers: [PlayerController, /* PlayerNewController, */ QbAnalyzerController],
  providers: [
    PlayerService,
    // PlayerNewService,
    ClipAnalyzerService,
    QbAnalyzerService,
    RbAnalyzerService,
    WrAnalyzerService,
    TeAnalyzerService,
    KAnalyzerService,
    PAnalyzerService,
    OlAnalyzerService,
    DlAnalyzerService,
    LbAnalyzerService,
    DbAnalyzerService,
    StatsManagementService,
    TeamStatsAggregatorService,
    TeamClipAnalyzerService,
  ],
  exports: [PlayerService /*, PlayerNewService*/],
})
export class PlayerModule {}
