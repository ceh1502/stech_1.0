import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { TeamStatsAnalyzerService } from './team-stats-analyzer.service';
import { Team, TeamSchema } from '../schemas/team.schema';
import { Player, PlayerSchema } from '../schemas/player.schema';
import { TeamGameStats, TeamGameStatsSchema } from '../schemas/team-game-stats.schema';
import { TeamTotalStats, TeamTotalStatsSchema } from '../schemas/team-total-stats.schema';
import { GameModule } from '../game/game.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Team.name, schema: TeamSchema },
      { name: Player.name, schema: PlayerSchema },
      { name: TeamGameStats.name, schema: TeamGameStatsSchema },
      { name: TeamTotalStats.name, schema: TeamTotalStatsSchema },
    ]),
    GameModule,
  ],
  controllers: [TeamController],
  providers: [
    TeamService,
    TeamStatsAnalyzerService,
  ],
  exports: [
    TeamService,
    TeamStatsAnalyzerService,
  ],
})
export class TeamModule {}
