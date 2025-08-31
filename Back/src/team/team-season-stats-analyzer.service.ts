import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  TeamSeasonStats,
  TeamSeasonStatsDocument,
} from '../schemas/team-season-stats.schema';
import { TeamSeasonStatsDto } from './dto/team-season-stats.dto';
import { NewClipDto } from '../common/dto/new-clip.dto';

@Injectable()
export class TeamSeasonStatsAnalyzerService {
  constructor(
    @InjectModel(TeamSeasonStats.name)
    private teamSeasonStatsModel: Model<TeamSeasonStatsDocument>,
  ) {}

  /**
   * JSON 데이터를 분석하여 팀 시즌 스탯 업데이트
   */
  async analyzeAndUpdateTeamStats(
    clips: NewClipDto[],
    gameKey: string,
    homeTeam?: string,
    awayTeam?: string,
    season: string = '2024',
  ): Promise<void> {
    if (!clips || clips.length === 0) {
      return;
    }

    // homeTeam, awayTeam이 제공되지 않은 경우 클립에서 추정
    if (!homeTeam || !awayTeam) {
      console.log(
        '팀 정보가 제공되지 않았습니다. 현재는 팀 스탯을 생략합니다.',
      );
      return;
    }

    // 각 팀의 스탯 분석
    await this.analyzeTeamStats(clips, homeTeam, 'home', gameKey, season);
    await this.analyzeTeamStats(clips, awayTeam, 'away', gameKey, season);
  }

  /**
   * 특정 팀의 스탯 분석 및 업데이트
   */
  private async analyzeTeamStats(
    clips: NewClipDto[],
    teamName: string,
    homeAway: 'home' | 'away',
    gameKey: string,
    season: string,
  ): Promise<void> {
    // 기존 팀 스탯 조회 또는 생성
    let teamStats = await this.teamSeasonStatsModel.findOne({
      teamName,
      season,
    });

    if (!teamStats) {
      teamStats = new this.teamSeasonStatsModel({
        teamName,
        season,
        processedGames: [],
      });
    }

    // 이미 처리된 게임인지 확인
    if (teamStats.processedGames.includes(gameKey)) {
      return; // 이미 처리된 게임이므로 스킵
    }

    // 해당 팀의 클립들만 필터링
    const teamClips = clips.filter((clip) => {
      // 공격 플레이: offensiveTeam이 일치하는 클립
      if (homeAway === 'home' && clip.offensiveTeam === 'Home') return true;
      if (homeAway === 'away' && clip.offensiveTeam === 'Away') return true;

      // 수비 플레이: 상대방 공격일 때 우리 팀의 수비 스탯
      if (homeAway === 'home' && clip.offensiveTeam === 'Away') {
        // 홈팀 수비시 어웨이팀 공격 클립에서 인터셉트 등 추출
        return this.hasDefensivePlay(clip, teamName);
      }
      if (homeAway === 'away' && clip.offensiveTeam === 'Home') {
        // 어웨이팀 수비시 홈팀 공격 클립에서 인터셉트 등 추출
        return this.hasDefensivePlay(clip, teamName);
      }

      return false;
    });

    // 득점 관련 클립들 찾기 (실제 JSON 값 사용)
    const scoringClips = teamClips.filter(
      (clip) =>
        clip.significantPlays &&
        clip.significantPlays.some(
          (play) =>
            play === 'TOUCHDOWN' ||
            play === 'PATGOOD' ||
            play === 'FIELDGOALGOOD' ||
            play === '2PTGOOD' ||
            play === 'SAFETY',
        ),
    );

    console.log(`${teamName} (${homeAway}) 팀 클립 분석:`, {
      전체클립수: clips.length,
      팀클립수: teamClips.length,
      득점클립수: scoringClips.length,
      득점클립예시: scoringClips.slice(0, 3).map((clip) => ({
        playType: clip.playType,
        significantPlays: clip.significantPlays,
        gainYard: clip.gainYard,
      })),
    });

    // 스탯 분석
    const gameStats = this.calculateGameStats(
      teamClips,
      clips,
      teamName,
      homeAway,
    );

    // 스탯 누적 업데이트
    teamStats.totalPoints += gameStats.totalPoints;
    teamStats.totalTouchdowns += gameStats.totalTouchdowns;
    teamStats.totalYards += gameStats.totalYards;
    teamStats.gamesPlayed += 1;

    // 런 스탯
    teamStats.rushingAttempts += gameStats.rushingAttempts;
    teamStats.rushingYards += gameStats.rushingYards;
    teamStats.rushingTouchdowns += gameStats.rushingTouchdowns;

    // 패스 스탯
    teamStats.passAttempts += gameStats.passAttempts;
    teamStats.passCompletions += gameStats.passCompletions;
    teamStats.passingYards += gameStats.passingYards;
    teamStats.passingTouchdowns += gameStats.passingTouchdowns;
    teamStats.interceptions += gameStats.interceptions;

    // 스페셜팀 스탯
    teamStats.totalPuntYards += gameStats.totalPuntYards;
    teamStats.totalPunts += gameStats.totalPunts;
    teamStats.puntTouchbacks += gameStats.puntTouchbacks;
    teamStats.fieldGoalAttempts += gameStats.fieldGoalAttempts;
    teamStats.fieldGoalMakes += gameStats.fieldGoalMakes;
    teamStats.kickReturnYards += gameStats.kickReturnYards;
    teamStats.kickReturns += gameStats.kickReturns;
    teamStats.puntReturnYards += gameStats.puntReturnYards;
    teamStats.puntReturns += gameStats.puntReturns;

    // 기타 스탯
    teamStats.fumbles += gameStats.fumbles;
    teamStats.fumblesLost += gameStats.fumblesLost;
    teamStats.totalTurnovers += gameStats.totalTurnovers;
    teamStats.penalties += gameStats.penalties;
    teamStats.penaltyYards += gameStats.penaltyYards;

    // 처리된 게임 목록에 추가
    teamStats.processedGames.push(gameKey);

    await teamStats.save();
  }

  /**
   * 수비 플레이가 있는지 확인 (인터셉트, 펀트/킥 리턴 등)
   */
  private hasDefensivePlay(clip: NewClipDto, teamName: string): boolean {
    if (!clip.significantPlays) return false;

    const playType = clip.playType?.toUpperCase();
    return clip.significantPlays.some(
      (play) =>
        play === 'Intercept' ||
        play === 'Fumble recovered by def' ||
        playType === 'PUNT' ||
        playType === 'KICKOFF',
    );
  }

  /**
   * 게임별 스탯 계산
   */
  private calculateGameStats(
    teamClips: NewClipDto[],
    allClips: NewClipDto[],
    teamName: string,
    homeAway: 'home' | 'away',
  ) {
    const stats = {
      totalPoints: 0,
      totalTouchdowns: 0,
      totalYards: 0,
      rushingAttempts: 0,
      rushingYards: 0,
      rushingTouchdowns: 0,
      passAttempts: 0,
      passCompletions: 0,
      passingYards: 0,
      passingTouchdowns: 0,
      interceptions: 0,
      totalPuntYards: 0,
      totalPunts: 0,
      puntTouchbacks: 0,
      fieldGoalAttempts: 0,
      fieldGoalMakes: 0,
      kickReturnYards: 0,
      kickReturns: 0,
      puntReturnYards: 0,
      puntReturns: 0,
      fumbles: 0,
      fumblesLost: 0,
      totalTurnovers: 0,
      penalties: 0,
      penaltyYards: 0,
    };

    for (const clip of teamClips) {
      // 기본 플레이 분석
      this.analyzeBasicPlay(clip, stats);

      // SignificantPlays 분석
      this.analyzeSignificantPlays(clip, stats);
    }

    // 상대방 클립에서 우리 팀의 수비 스탯 추출 (인터셉트, 리턴 등)
    const opponentClips = allClips.filter(
      (clip) =>
        (homeAway === 'home' && clip.offensiveTeam === 'Away') ||
        (homeAway === 'away' && clip.offensiveTeam === 'Home'),
    );

    for (const clip of opponentClips) {
      this.analyzeDefensiveStats(clip, stats, teamName);
    }

    return stats;
  }

  /**
   * 기본 플레이 분석 (RUN, PASS 등)
   */
  private analyzeBasicPlay(clip: NewClipDto, stats: any): void {
    const playType = clip.playType?.toUpperCase();

    if (playType === 'RUN' || playType === 'RUNNING') {
      stats.rushingAttempts++;
      if (clip.gainYard && clip.gainYard >= 0) {
        stats.rushingYards += clip.gainYard;
        stats.totalYards += clip.gainYard;
      }
    } else if (playType === 'PASS' || playType === 'PASSCOMPLETE') {
      stats.passAttempts++;
      stats.passCompletions++;
      if (clip.gainYard && clip.gainYard >= 0) {
        stats.passingYards += clip.gainYard;
        stats.totalYards += clip.gainYard;
      }
    } else if (playType === 'PASSINCOMPLETE' || playType === 'NOPASS') {
      stats.passAttempts++;
      // 패스 실패는 야드 획득 없음
    } else if (playType === 'PUNT') {
      stats.totalPunts++;
      if (clip.gainYard && clip.gainYard >= 0) {
        stats.totalPuntYards += clip.gainYard;
      }
    } else if (playType === 'KICKOFF') {
      stats.kickReturns++;
      if (clip.gainYard && clip.gainYard >= 0) {
        stats.kickReturnYards += clip.gainYard;
      }
    } else if (playType === 'PAT') {
      // PAT는 significantPlays에서 처리
    } else if (playType === 'FG' || playType === 'FIELDGOAL') {
      // 필드골은 significantPlays에서 처리
    } else if (playType === '2PT' || playType === 'TPT') {
      // 2점 컨버전은 significantPlays에서 처리
    } else if (playType === 'NONE') {
      // NONE playType은 특별한 처리 없음
    } else if (playType && !['SACK'].includes(playType)) {
      console.log(`❌ 매칭되지 않는 playType: ${playType}`);
    }
  }

  /**
   * SignificantPlays 분석
   */
  private analyzeSignificantPlays(clip: NewClipDto, stats: any): void {
    if (!clip.significantPlays) return;

    // TURNOVER가 있는지 먼저 체크
    const hasTurnover = clip.significantPlays.includes('Turn Over');

    // 득점 관련 플레이가 있으면 로그
    const hasScoring = clip.significantPlays.some(
      (play) =>
        play &&
        (play.includes('TOUCHDOWN') ||
          play.includes('PAT') ||
          play.includes('FIELDGOAL') ||
          play.includes('2PT')),
    );

    if (hasScoring) {
      console.log('🏈 득점 클립 발견:', {
        playType: clip.playType,
        significantPlays: clip.significantPlays.filter((p) => p !== null),
        gainYard: clip.gainYard,
      });
    }

    clip.significantPlays.forEach((play) => {
      switch (play) {
        case 'TOUCHDOWN':
          stats.totalTouchdowns++;
          stats.totalPoints += 6; // 터치다운 6점

          const playType = clip.playType?.toUpperCase();
          if (playType === 'RUN' || playType === 'RUNNING') {
            stats.rushingTouchdowns++;
          } else if (playType === 'PASS' || playType === 'PASSCOMPLETE') {
            stats.passingTouchdowns++;
          } else if (playType === 'KICKOFF' || playType === 'PUNT') {
            // 리턴 터치다운은 별도 카운팅하지 않고 totalTouchdowns에만 포함
          }
          break;

        case 'FIELDGOALGOOD':
          stats.fieldGoalAttempts++;
          stats.fieldGoalMakes++;
          stats.totalPoints += 3; // 필드골 3점
          break;

        case 'FIELDGOALMISS':
          stats.fieldGoalAttempts++;
          break;

        case 'PATGOOD':
          stats.totalPoints += 1; // PAT 1점
          break;

        case 'PATMISS':
          // 실패한 PAT는 점수 없음
          break;

        case '2PTGOOD':
          stats.totalPoints += 2; // 2점 컨버전 2점
          break;

        case '2PTMISS':
          // 실패한 2점 컨버전는 점수 없음
          break;

        case 'SAFETY':
          stats.totalPoints += 2; // Safety 2점
          break;

        case 'Fumble recovered by off':
          // 공격팀이 펌블했지만 다시 회수한 경우
          stats.fumbles++;
          break;

        case 'Fumble recovered by def':
          // 공격팀이 펌블하고 수비팀이 회수한 경우
          stats.fumbles++;
          stats.fumblesLost++;
          stats.totalTurnovers++;
          break;

        case 'Intercept':
          // 공격팀 클립에서 Intercept가 있으면 공격팀이 인터셉트를 당한 것
          // 인터셉트를 당한 팀의 인터셉트 수는 증가하지 않음 (상대팀이 인터셉트를 한 것)
          if (hasTurnover) {
            stats.totalTurnovers++; // 턴오버만 증가
          }
          break;

        case 'Turn Over':
          // INTERCEPT나 FUMBLE이 없는 단독 TURNOVER (4th down 실패 등)
          if (
            !clip.significantPlays.includes('Intercept') &&
            !clip.significantPlays.includes('Fumble recovered by def')
          ) {
            stats.totalTurnovers++;
          }
          break;

        case 'Touchback':
          if (clip.playType?.toUpperCase() === 'PUNT') {
            stats.puntTouchbacks++;
          }
          break;
          
        case 'PENALTY.HOME':
          // NONE 플레이타입일 때만 페널티 처리
          if (clip.playType?.toUpperCase() === 'NONE') {
            // 공격팀이 홈이고 페널티가 홈이면 공격팀 페널티
            if (clip.offensiveTeam === 'Home') {
              stats.penalties++;
              stats.penaltyYards += clip.start?.yard || 0;
            }
          }
          break;
          
        case 'PENALTY.AWAY':
          // NONE 플레이타입일 때만 페널티 처리  
          if (clip.playType?.toUpperCase() === 'NONE') {
            // 공격팀이 어웨이고 페널티가 어웨이면 공격팀 페널티
            if (clip.offensiveTeam === 'Away') {
              stats.penalties++;
              stats.penaltyYards += clip.start?.yard || 0;
            }
          }
          break;
      }
    });
  }

  /**
   * 상대방 공격 시 우리 팀의 수비 스탯 분석
   */
  private analyzeDefensiveStats(
    clip: NewClipDto,
    stats: any,
    teamName: string,
  ): void {
    if (!clip.significantPlays) return;

    // SignificantPlays에서 수비 스탯 확인
    clip.significantPlays.forEach((play) => {
      switch (play) {
        case 'Fumble recovered by def': // 우리가 상대방 펌블을 회수
          // 수비팀 입장에서 상대방 턴오버 획득
          stats.opponentTurnovers++;
          break;

        case 'Intercept':
          // 상대방 공격 클립에서 Intercept가 있으면 우리 팀이 인터셉트를 한 것
          stats.interceptions++;
          stats.opponentTurnovers++;
          break;
          
        case 'Turn Over':
          // 단독 TURNOVER (4th down 실패 등) - 상대팀이 공격 중 턴오버를 당함
          if (
            !clip.significantPlays.includes('Intercept') &&
            !clip.significantPlays.includes('Fumble recovered by def')
          ) {
            stats.opponentTurnovers++;
          }
          break;
          
        case 'PENALTY.HOME':
          // 수비 중 상대팀 페널티 (우리팀이 수비일 때 상대팀 페널티는 우리 스탯에 영향 없음)
          break;
          
        case 'PENALTY.AWAY': 
          // 수비 중 상대팀 페널티 (우리팀이 수비일 때 상대팀 페널티는 우리 스탯에 영향 없음)
          break;
      }
    });

    // 리턴 플레이 처리
    const playType = clip.playType?.toUpperCase();
    if (playType === 'PUNT') {
      stats.puntReturns++;
      if (clip.gainYard && clip.gainYard >= 0) {
        stats.puntReturnYards += clip.gainYard;
        stats.totalYards += clip.gainYard;
      }
    } else if (playType === 'KICKOFF') {
      stats.kickReturns++;
      if (clip.gainYard && clip.gainYard >= 0) {
        stats.kickReturnYards += clip.gainYard;
        stats.totalYards += clip.gainYard;
      }
    }
  }

  /**
   * 모든 팀의 시즌 스탯 조회 (순위표용)
   */
  async getAllTeamSeasonStats(
    season: string = '2024',
  ): Promise<TeamSeasonStatsDto[]> {
    const teamStats = await this.teamSeasonStatsModel.find({ season }).exec();

    return teamStats.map((stats) => this.convertToDto(stats));
  }

  /**
   * 특정 팀의 시즌 스탯 조회
   */
  async getTeamSeasonStats(
    teamName: string,
    season: string = '2024',
  ): Promise<TeamSeasonStatsDto | null> {
    const stats = await this.teamSeasonStatsModel
      .findOne({ teamName, season })
      .exec();

    return stats ? this.convertToDto(stats) : null;
  }

  /**
   * 팀 스탯 초기화
   */
  async resetTeamSeasonStats(
    season: string = '2024',
  ): Promise<{ success: boolean; message: string }> {
    await this.teamSeasonStatsModel.deleteMany({ season });

    return {
      success: true,
      message: `${season} 시즌의 모든 팀 스탯이 초기화되었습니다.`,
    };
  }

  /**
   * 상대방 턴오버 수 업데이트 (게임 종료 후 호출)
   */
  async updateOpponentTurnovers(
    gameKey: string,
    homeTeam: string,
    awayTeam: string,
    season: string = '2024',
  ): Promise<void> {
    const homeStats = await this.teamSeasonStatsModel.findOne({
      teamName: homeTeam,
      season,
    });
    const awayStats = await this.teamSeasonStatsModel.findOne({
      teamName: awayTeam,
      season,
    });

    if (homeStats && awayStats) {
      // 홈팀의 상대 턴오버는 어웨이팀의 턴오버
      homeStats.opponentTurnovers += awayStats.totalTurnovers;

      // 어웨이팀의 상대 턴오버는 홈팀의 턴오버
      awayStats.opponentTurnovers += homeStats.totalTurnovers;

      await homeStats.save();
      await awayStats.save();
    }
  }

  /**
   * 모델 데이터를 DTO로 변환
   */
  private convertToDto(stats: TeamSeasonStatsDocument): TeamSeasonStatsDto {
    const gamesPlayed = stats.gamesPlayed || 1; // 0으로 나누기 방지

    return {
      teamName: stats.teamName,
      season: stats.season,

      // 1. 득점
      totalPoints: stats.totalPoints,
      pointsPerGame: Math.round((stats.totalPoints / gamesPlayed) * 10) / 10,
      totalTouchdowns: stats.totalTouchdowns,
      totalYards: stats.totalYards,
      yardsPerGame: Math.round((stats.totalYards / gamesPlayed) * 10) / 10,
      gamesPlayed: stats.gamesPlayed,

      // 2. 런
      rushingAttempts: stats.rushingAttempts,
      rushingYards: stats.rushingYards,
      yardsPerCarry:
        stats.rushingAttempts > 0
          ? Math.round((stats.rushingYards / stats.rushingAttempts) * 10) / 10
          : 0,
      rushingYardsPerGame:
        Math.round((stats.rushingYards / gamesPlayed) * 10) / 10,
      rushingTouchdowns: stats.rushingTouchdowns,

      // 3. 패스
      passCompletionAttempts: `${stats.passCompletions}-${stats.passAttempts}`,
      passingYards: stats.passingYards,
      yardsPerPassAttempt:
        stats.passAttempts > 0
          ? Math.round((stats.passingYards / stats.passAttempts) * 10) / 10
          : 0,
      passingYardsPerGame:
        Math.round((stats.passingYards / gamesPlayed) * 10) / 10,
      passingTouchdowns: stats.passingTouchdowns,
      interceptions: stats.interceptions,

      // 4. 스페셜팀
      totalPuntYards: stats.totalPuntYards,
      averagePuntYards:
        stats.totalPunts > 0
          ? Math.round((stats.totalPuntYards / stats.totalPunts) * 10) / 10
          : 0,
      puntTouchbackPercentage:
        stats.totalPunts > 0
          ? Math.round((stats.puntTouchbacks / stats.totalPunts) * 100 * 10) /
            10
          : 0,
      fieldGoalStats: `${stats.fieldGoalMakes}-${stats.fieldGoalAttempts}`,
      averageKickReturnYards:
        stats.kickReturns > 0
          ? Math.round((stats.kickReturnYards / stats.kickReturns) * 10) / 10
          : 0,
      averagePuntReturnYards:
        stats.puntReturns > 0
          ? Math.round((stats.puntReturnYards / stats.puntReturns) * 10) / 10
          : 0,
      totalReturnYards: stats.kickReturnYards + stats.puntReturnYards,

      // 5. 기타
      fumbleStats: `${stats.fumbles}-${stats.fumblesLost}`,
      turnoversPerGame:
        Math.round((stats.totalTurnovers / gamesPlayed) * 10) / 10,
      turnoverRate: (() => {
        const opponentTurnovers = stats.opponentTurnovers || 0;
        const totalTurnovers = stats.totalTurnovers || 0;
        const result = opponentTurnovers - totalTurnovers;
        console.log(`🔍 turnoverRate 계산: opponent(${opponentTurnovers}) - our(${totalTurnovers}) = ${result}`);
        return result;
      })(),
      turnoverDifferential: this.calculateTurnoverDifferential(
        stats.totalTurnovers,
        stats.opponentTurnovers,
      ),
      penaltyStats: `${stats.penalties}-${stats.penaltyYards}`,
      penaltyYardsPerGame:
        Math.round((stats.penaltyYards / gamesPlayed) * 10) / 10,
    };
  }

  /**
   * 턴오버 비율 계산 (상대방 턴오버 - 우리 턴오버)
   */
  private calculateTurnoverRate(
    turnovers: number,
    passAttempts: number,
    rushAttempts: number,
    punts: number,
    kicks: number,
  ): number {
    console.log('⚠️ calculateTurnoverRate 메서드가 여전히 호출되고 있습니다! 이는 사용되지 말아야 합니다.');
    // 이 메서드는 이제 사용하지 않음 - convertToDto에서 직접 계산
    return 0;
  }

  /**
   * 턴오버 차이 계산
   */
  private calculateTurnoverDifferential(
    ourTurnovers: number,
    opponentTurnovers: number,
  ): string {
    const differential = opponentTurnovers - ourTurnovers;
    return differential >= 0 ? `+${differential}` : differential.toString();
  }
}
