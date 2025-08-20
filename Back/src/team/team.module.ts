import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { TeamStatsAnalyzerService } from './team-stats-analyzer.service';
import { Team, TeamSchema } from '../schemas/team.schema';
import { Player, PlayerSchema } from '../schemas/player.schema';
import { TeamStats, TeamStatsSchema } from '../schemas/team-stats.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Team.name, schema: TeamSchema },
      { name: Player.name, schema: PlayerSchema },
      { name: TeamStats.name, schema: TeamStatsSchema },
    ]),
  ],
  controllers: [TeamController],
  providers: [TeamService, TeamStatsAnalyzerService],
  exports: [TeamService, TeamStatsAnalyzerService],
})
export class TeamModule {}