import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { Team, TeamDocument } from '../schemas/team.schema';
import {
  CreatePlayerDto,
  UpdatePlayerStatsDto,
} from '../common/dto/player.dto';
import { NewClipDto } from '../common/dto/new-clip.dto';
import { ClipAnalyzerService } from './clip-analyzer.service';
import { StatsManagementService } from '../common/services/stats-management.service';

@Injectable()
export class PlayerService {
  constructor(
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
    private clipAnalyzer: ClipAnalyzerService,
    private statsManagement: StatsManagementService,
  ) {}

  // JSON 게임 데이터의 팀명을 데이터베이스 팀명으로 매핑
  private mapJsonTeamNameToDbTeamName(jsonTeamName: string): string {
    const teamMapping = {
      // 기존 매핑 (정확히 일치하는 팀들)
      KKRagingBulls: 'KKRagingBulls',
      KHCommanders: 'KHCommanders',
      SNGreenTerrors: 'SNGreenTerrors',
      USCityhawks: 'USCityhawks',
      DGTuskers: 'DGTuskers',
      KMRazorbacks: 'KMRazorbacks',
      YSEagles: 'YSEagles',
      KUTigers: 'KUTigers',
      HICowboys: 'HICowboys',
      SSCrusaders: 'SSCrusaders',
      HYLions: 'HYLions', // 한양대 라이온스 -> 그대로 유지 (데이터베이스에 존재)
      // HFBlackKnights: 'HFBlackKnights', // 한국외대 -> 데이터베이스에 존재하지 않음 (주석 처리)
    };

    const mappedName = teamMapping[jsonTeamName];
    if (!mappedName) {
      console.log(`⚠️ 알 수 없는 팀명: ${jsonTeamName}, 원본 팀명 사용`);
      return jsonTeamName;
    }

    console.log(`🔄 팀명 매핑: ${jsonTeamName} -> ${mappedName}`);
    return mappedName;
  }

  // 포지션별 기본 스탯 반환 (임시)
  private getDefaultStatsForPosition(position: string): any {
    const baseStats = {
      games: 0,
    };

    switch (position) {
      case 'RB':
        return {
          ...baseStats,
          rushingAttempted: 0,
          rushingYards: 0,
          yardsPerCarry: 0,
          rushingTouchdown: 0,
          longestRushing: 0,
          target: 0,
          reception: 0,
          receivingYards: 0,
          yardsPerCatch: 0,
          receivingTouchdown: 0,
          longestReception: 0,
          receivingFirstDowns: 0,
          fumbles: 0,
          fumblesLost: 0,
          kickReturn: 0,
          kickReturnYards: 0,
          yardsPerKickReturn: 0,
          puntReturn: 0,
          puntReturnYards: 0,
          yardsPerPuntReturn: 0,
          returnTouchdown: 0,
        };
      case 'WR':
      case 'TE':
        return {
          ...baseStats,
          target: 0,
          reception: 0,
          receivingYards: 0,
          yardsPerCatch: 0,
          receivingTouchdown: 0,
          longestReception: 0,
          receivingFirstDowns: 0,
          fumbles: 0,
          fumblesLost: 0,
          rushingAttempted: 0,
          rushingYards: 0,
          yardsPerCarry: 0,
          rushingTouchdown: 0,
          longestRushing: 0,
          kickReturn: 0,
          kickReturnYards: 0,
          yardsPerKickReturn: 0,
          puntReturn: 0,
          puntReturnYards: 0,
          yardsPerPuntReturn: 0,
          returnTouchdown: 0,
        };
      case 'DB':
      case 'LB':
      case 'DL':
        return {
          ...baseStats,
          tackles: 0,
          sacks: 0,
          tacklesForLoss: 0,
          forcedFumbles: 0,
          fumbleRecovery: 0,
          fumbleRecoveredYards: 0,
          passDefended: 0,
          interception: 0,
          interceptionYards: 0,
          touchdown: 0,
        };
      default:
        return baseStats;
    }
  }

  // PlayerCode로 선수 생성
  async createPlayer(createPlayerDto: CreatePlayerDto, teamId: string) {
    const newPlayer = new this.playerModel({
      ...createPlayerDto,
      teamId,
    });
    await newPlayer.save();

    return {
      success: true,
      message: '선수가 성공적으로 생성되었습니다.',
      data: newPlayer,
    };
  }

  // PlayerCode로 개별 선수 조회
  async getPlayerByCode(playerId: string) {
    const player = await this.playerModel
      .findOne({ playerId })
      .populate('teamId', 'teamName');
    if (!player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    return {
      success: true,
      data: player,
    };
  }

  // 포지션별 선수 목록 조회
  async getPlayersByPosition(position: string, league?: string) {
    const query: any = { position };
    if (league) {
      query.league = league;
    }

    const players = await this.playerModel
      .find(query)
      .populate('teamId', 'teamName')
      .sort({ 'stats.totalYards': -1 }); // 총 야드수 기준 정렬

    return {
      success: true,
      data: players,
    };
  }

  // 전체 선수 랭킹 조회
  async getAllPlayersRanking(league?: string, sortBy?: string) {
    const query: any = {};
    if (league) {
      query.league = league;
    }

    let sortOption: any = { 'stats.totalYards': -1 }; // 기본 정렬
    if (sortBy) {
      sortOption = { [`stats.${sortBy}`]: -1 };
    }

    const players = await this.playerModel
      .find(query)
      .populate('teamId', 'teamName')
      .sort(sortOption);

    return {
      success: true,
      data: players,
    };
  }

  // 선수 스탯 업데이트
  async updatePlayerStats(
    playerId: string,
    updateStatsDto: UpdatePlayerStatsDto,
  ) {
    const player = await this.playerModel.findOne({ playerId });
    if (!player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    // 기존 스탯과 새로운 스탯을 병합
    player.stats = { ...player.stats, ...updateStatsDto.stats };
    await player.save();

    return {
      success: true,
      message: '선수 스탯이 성공적으로 업데이트되었습니다.',
      data: player,
    };
  }

  // 팀별 선수 목록 조회
  async getPlayersByTeam(teamId: string) {
    const players = await this.playerModel
      .find({ teamId })
      .populate('teamId', 'teamName')
      .sort({ position: 1, jerseyNumber: 1 });

    return {
      success: true,
      data: players,
    };
  }

  // === 새로운 클립 구조 처리 메서드들 ===

  /**
   * 새로운 클립 구조로 선수 스탯 업데이트 (팀명 + 등번호 기반)
   */
  async updatePlayerStatsFromNewClips(
    playerNumber: number,
    newClips: NewClipDto[],
    teamName?: string,
  ) {
    let player;

    if (teamName) {
      // JSON 팀명을 DB 팀명으로 매핑
      const dbTeamName = this.mapJsonTeamNameToDbTeamName(teamName);

      // 팀명 + 등번호로 선수 찾기
      player = await this.playerModel.findOne({
        jerseyNumber: playerNumber,
        teamName: dbTeamName,
      });

      if (!player) {
        console.log(
          `🔍 팀 ${teamName} (매핑: ${dbTeamName})의 등번호 ${playerNumber}번 선수를 찾을 수 없습니다.`,
        );

        // 매핑된 팀명으로도 찾을 수 없으면 등번호로만 시도
        player = await this.playerModel.findOne({
          jerseyNumber: playerNumber,
        });

        if (player) {
          console.log(
            `✅ 등번호로 선수 발견: ${player.name} (${player.teamName})`,
          );
        } else {
          console.log(
            `❌ 등번호 ${playerNumber}번 선수를 전혀 찾을 수 없습니다.`,
          );
          return {
            success: false,
            message: `등번호 ${playerNumber}번 선수를 찾을 수 없습니다. (JSON팀명: ${teamName}, DB팀명: ${dbTeamName})`,
            playerNumber,
            teamName,
            dbTeamName,
          };
        }
      }
    } else {
      // 기존 방식: 등번호로만 찾기 (하위 호환성)
      player = await this.playerModel.findOne({
        jerseyNumber: playerNumber,
      });

      if (!player) {
        throw new NotFoundException(
          `등번호 ${playerNumber}번 선수를 찾을 수 없습니다.`,
        );
      }
    }

    // 해당 선수가 참여한 클립들만 필터링 (새 구조에서 직접)
    const playerClips = newClips.filter(
      (clip) =>
        clip.car?.num === playerNumber ||
        clip.car2?.num === playerNumber ||
        clip.tkl?.num === playerNumber ||
        clip.tkl2?.num === playerNumber,
    );

    if (playerClips.length === 0) {
      return {
        success: false,
        message: `등번호 ${playerNumber}번 선수의 플레이가 클립에서 발견되지 않았습니다.`,
        data: player,
      };
    }

    // 포지션별 분석기 실행
    const position = player.position;
    let analyzedStats: any;

    switch (position) {
      case 'QB':
        console.log(
          `🏈 QB ${player.jerseyNumber}번 분석 시작 - ${player.name} (${player.teamName})`,
        );
        analyzedStats = this.analyzeQBStats(
          playerClips,
          player.jerseyNumber,
          player.name,
          player.teamName,
        );
        break;
      case 'RB':
      case 'WR':
      case 'TE':
      case 'DB':
      case 'LB':
      case 'DL':
      case 'OL':
      case 'K':
      case 'P':
        console.log(
          `⚠️ ${position} ${player.jerseyNumber}번 분석 건너뜀 - ${player.name} (${player.teamName})`,
        );
        return {
          success: true,
          message: `${position} 포지션은 현재 분석을 지원하지 않습니다.`,
          data: player,
          skipped: true,
        };
      default:
        throw new Error(`알 수 없는 포지션입니다: ${position}`);
    }

    // 🏈 3단계 스탯 시스템 업데이트
    // 1. 기존 player.stats 업데이트 (호환성)
    player.stats = { ...player.stats, ...analyzedStats };
    await player.save();

    // 2. 새로운 3단계 시스템 업데이트
    // gameKey 생성 (클립의 첫 번째 clipKey 또는 현재 타임스탬프 사용)
    const gameKey =
      newClips.length > 0 && newClips[0].clipKey
        ? `GAME_${newClips[0].clipKey}`
        : `GAME_${Date.now()}`;

    const gameDate = new Date();
    const homeTeam = '홈팀'; // TODO: 실제 게임 정보에서 가져와야 함
    const awayTeam = '어웨이팀'; // TODO: 실제 게임 정보에서 가져와야 함

    // StatsManagement 서비스를 통해 3단계 스탯 업데이트
    const gameStatsResult = await this.statsManagement.updateGameStats(
      playerNumber,
      gameKey,
      gameDate,
      homeTeam,
      awayTeam,
      analyzedStats,
    );

    return {
      success: true,
      message: `등번호 ${playerNumber}번 ${position} 선수의 스탯이 3단계 시스템에 업데이트되었습니다.`,
      data: player,
      analyzedStats: analyzedStats,
      processedClips: playerClips.length,
      gameStatsCreated: !!gameStatsResult,
      tierSystemUpdate: {
        gameKey: gameKey,
        gameDate: gameDate,
        autoAggregated: true,
      },
    };
  }

  /**
   * 새로운 게임 데이터 분석 (JSON 클립 구조)
   */
  async analyzeGameData(gameData: any) {
    return await this.clipAnalyzer.analyzeGameData(gameData);
  }

  /**
   * 게임 고유 식별자 생성
   */
  private generateGameId(clip: any): string {
    // 클립의 다양한 정보로 게임 고유 ID 생성
    const date = new Date().toISOString().split('T')[0]; // 오늘 날짜
    const teams = [clip.car?.pos, clip.car2?.pos, clip.tkl?.pos, clip.tkl2?.pos]
      .filter(Boolean)
      .sort()
      .join('-');

    return `game-${date}-${teams.slice(0, 10)}`;
  }

  /**
   * 모든 선수 스탯 초기화
   */
  async resetAllPlayersStats() {
    try {
      const result = await this.playerModel.updateMany(
        {},
        {
          $unset: { stats: 1 },
        },
      );

      return {
        success: true,
        message: `${result.modifiedCount}명의 선수 스탯이 초기화되었습니다.`,
        modifiedCount: result.modifiedCount,
      };
    } catch (error) {
      throw new Error(`스탯 초기화 실패: ${error.message}`);
    }
  }

  /**
   * 처리된 게임 목록 초기화 (중복 입력 방지용)
   */
  async resetProcessedGames() {
    try {
      const result = await this.playerModel.updateMany(
        {},
        {
          $unset: { processedGames: 1 },
        },
      );

      return {
        success: true,
        message: '처리된 게임 목록이 초기화되었습니다.',
        modifiedCount: result.modifiedCount,
      };
    } catch (error) {
      throw new Error(`처리된 게임 목록 초기화 실패: ${error.message}`);
    }
  }

  /**
   * QB 스탯 분석 메서드
   */
  private analyzeQBStats(
    clips: any[],
    jerseyNumber: number,
    playerName: string,
    teamName: string,
  ) {
    let passingAttempts = 0;
    let passingCompletions = 0;
    let passingYards = 0;
    let passingTouchdowns = 0;
    let passingInterceptions = 0;
    let longestPass = 0;
    let sacks = 0;

    console.log(
      `📈 ${playerName} ${jerseyNumber}번 QB 통계 계산 시작 (${clips.length}개 클립)`,
    );

    // 클립 데이터 구조 디버깅
    clips.forEach((clip, index) => {
      console.log(`🔍 클립 ${index + 1}:`, {
        playType: clip.playType,
        gainYard: clip.gainYard,
        car: clip.car,
        car2: clip.car2,
        significantPlays: clip.significantPlays,
      });
    });

    for (const clip of clips) {
      const isPlayerInCar = clip.car?.num === jerseyNumber;
      const isPlayerInCar2 = clip.car2?.num === jerseyNumber;

      if (!isPlayerInCar && !isPlayerInCar2) continue;

      // 패스 시도 수 계산
      if (clip.playType === 'PASS' || clip.playType === 'NOPASS') {
        passingAttempts++;
        console.log(
          `  ✅ 패스 시도: ${clip.playType} (총 ${passingAttempts}회)`,
        );
      }

      // 패스 성공 수 계산
      if (clip.playType === 'PASS') {
        passingCompletions++;
        console.log(
          `  ✅ 패스 성공: ${clip.gainYard}야드 (총 ${passingCompletions}회)`,
        );
      }

      // 패싱 야드 계산
      if (clip.playType === 'PASS') {
        passingYards += clip.gainYard;
        // 가장 긴 패스 업데이트
        if (clip.gainYard > longestPass) {
          longestPass = clip.gainYard;
          console.log(`  🏈 새로운 최장 패스: ${longestPass}야드`);
        }
        console.log(
          `  ✅ 패싱 야드: +${clip.gainYard} (총 ${passingYards}야드)`,
        );
      }

      // 색(sack) 계산
      if (clip.playType === 'SACK') {
        sacks++;
        console.log(`  💥 색(playType): 총 ${sacks}회`);
      }

      // significantPlays 확인
      const hasSignificantPlay =
        clip.significantPlays &&
        Array.isArray(clip.significantPlays) &&
        clip.significantPlays.some((play) => play !== null);

      if (hasSignificantPlay) {
        const plays = clip.significantPlays.filter((play) => play !== null);

        for (const play of plays) {
          // 패싱 터치다운 계산
          if (play === 'TOUCHDOWN' && clip.playType === 'PASS') {
            passingTouchdowns++;
            console.log(`  🎯 패싱 터치다운: 총 ${passingTouchdowns}회`);
          }
          // 인터셉션 계산
          else if (play === 'INTERCEPT' || play === 'INTERCEPTION') {
            passingInterceptions++;
            console.log(`  ❌ 인터셉션: 총 ${passingInterceptions}회`);
          }
          // 색 계산
          else if (play === 'SACK') {
            sacks++;
            console.log(`  💥 색(significantPlay): 총 ${sacks}회`);
          }
        }
      }
    }

    // 패스 성공률 계산
    const completionPercentage =
      passingAttempts > 0
        ? Math.round((passingCompletions / passingAttempts) * 100)
        : 0;

    const finalStats = {
      gamesPlayed: 1,
      passingAttempts,
      passingCompletions,
      completionPercentage,
      passingYards,
      passingTouchdowns,
      passingInterceptions,
      longestPass,
      sacks,
    };

    // 🏈 원하시는 한 줄 요약 출력
    console.log(
      `🏈 ${teamName} ${jerseyNumber}번 QB: 패스시도 ${passingAttempts}회, 패스성공 ${passingCompletions}회, 성공률 ${completionPercentage}%, 패싱야드 ${passingYards}야드`,
    );

    return finalStats;
  }
}
