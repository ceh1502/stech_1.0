import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';
// import { PlayerNewController } from './player-new.controller';
// import { PlayerNewService } from './player-new.service';
import { ClipAnalyzerService } from './clip-analyzer.service';
import { QbAnalyzerController } from './qb-analyzer.controller';
import { QbAnalyzerService } from './analyzers/qb-analyzer.service';
import { QbAnalyzerService as OldQbAnalyzerService } from './qb-analyzer.service';
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
import { Player, PlayerSchema } from '../schemas/player.schema';
import { Team, TeamSchema } from '../schemas/team.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { PlayerGameStats, PlayerGameStatsSchema } from '../schemas/player-game-stats.schema';
import { PlayerSeasonStats, PlayerSeasonStatsSchema } from '../schemas/player-season-stats.schema';
import { PlayerTotalStats, PlayerTotalStatsSchema } from '../schemas/player-total-stats.schema';
import { TeamGameStats, TeamGameStatsSchema } from '../schemas/team-game-stats.schema';
import { TeamTotalStats, TeamTotalStatsSchema } from '../schemas/team-total-stats.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Player.name, schema: PlayerSchema },
      { name: Team.name, schema: TeamSchema },
      { name: User.name, schema: UserSchema },
      { name: PlayerGameStats.name, schema: PlayerGameStatsSchema },
      { name: PlayerSeasonStats.name, schema: PlayerSeasonStatsSchema },
      { name: PlayerTotalStats.name, schema: PlayerTotalStatsSchema },
      { name: TeamGameStats.name, schema: TeamGameStatsSchema },
      { name: TeamTotalStats.name, schema: TeamTotalStatsSchema },
    ]),
    forwardRef(() => TeamModule),
  ],
  controllers: [PlayerController, /* PlayerNewController, */ QbAnalyzerController],
  providers: [
    PlayerService,
    // PlayerNewService,
    ClipAnalyzerService,
    QbAnalyzerService,
    OldQbAnalyzerService,
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
  ],
  exports: [PlayerService /*, PlayerNewService*/],
})
export class PlayerModule {}
