import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { TeamStatsAnalyzerService } from './team-stats-analyzer.service';
import { TeamSeasonStatsAnalyzerService } from './team-season-stats-analyzer.service';
import { TeamStatsAggregatorService } from './team-stats-aggregator.service';
import { TeamClipAnalyzerService } from './team-clip-analyzer.service';
import { Team, TeamSchema } from '../schemas/team.schema';
import { Player, PlayerSchema } from '../schemas/player.schema';
import { TeamStats, TeamStatsSchema } from '../schemas/team-stats.schema';
import {
  TeamSeasonStats,
  TeamSeasonStatsSchema,
} from '../schemas/team-season-stats.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Team.name, schema: TeamSchema },
      { name: Player.name, schema: PlayerSchema },
      { name: TeamStats.name, schema: TeamStatsSchema },
      { name: TeamSeasonStats.name, schema: TeamSeasonStatsSchema },
    ]),
  ],
  controllers: [TeamController],
  providers: [
    TeamService,
    TeamStatsAnalyzerService,
    TeamSeasonStatsAnalyzerService,
    TeamStatsAggregatorService,
    TeamClipAnalyzerService,
  ],
  exports: [
    TeamService,
    TeamStatsAnalyzerService,
    TeamSeasonStatsAnalyzerService,
    TeamStatsAggregatorService,
    TeamClipAnalyzerService,
  ],
})
export class TeamModule {}
