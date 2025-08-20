import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';
import { QbStatsAnalyzerService } from './qb-stats-analyzer.service';
import { RbStatsAnalyzerService } from './rb-stats-analyzer.service';
import { WrStatsAnalyzerService } from './wr-stats-analyzer.service';
import { TeStatsAnalyzerService } from './te-stats-analyzer.service';
import { KickerStatsAnalyzerService } from './kicker-stats-analyzer.service';
import { PunterStatsAnalyzerService } from './punter-stats-analyzer.service';
import { OLStatsAnalyzerService } from './ol-stats-analyzer.service';
import { DLStatsAnalyzerService } from './dl-stats-analyzer.service';
import { LBStatsAnalyzerService } from './lb-stats-analyzer.service';
import { DBStatsAnalyzerService } from './db-stats-analyzer.service';
import { ClipAdapterService } from '../common/adapters/clip-adapter.service';
import { StatsManagementService } from '../common/services/stats-management.service';
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
  ],
  controllers: [PlayerController],
  providers: [
    PlayerService, 
    QbStatsAnalyzerService, 
    RbStatsAnalyzerService, 
    WrStatsAnalyzerService, 
    TeStatsAnalyzerService,
    KickerStatsAnalyzerService,
    PunterStatsAnalyzerService,
    OLStatsAnalyzerService,
    DLStatsAnalyzerService,
    LBStatsAnalyzerService,
    DBStatsAnalyzerService,
    ClipAdapterService,
    StatsManagementService
  ],
  exports: [PlayerService],
})
export class PlayerModule {}