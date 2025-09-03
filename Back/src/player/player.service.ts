import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { Team, TeamDocument } from '../schemas/team.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { PlayerGameStats, PlayerGameStatsDocument } from '../schemas/player-game-stats.schema';
import { PlayerSeasonStats, PlayerSeasonStatsDocument } from '../schemas/player-season-stats.schema';
import { PlayerTotalStats, PlayerTotalStatsDocument } from '../schemas/player-total-stats.schema';
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
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(PlayerGameStats.name) private playerGameStatsModel: Model<PlayerGameStatsDocument>,
    @InjectModel(PlayerSeasonStats.name) private playerSeasonStatsModel: Model<PlayerSeasonStatsDocument>,
    @InjectModel(PlayerTotalStats.name) private playerTotalStatsModel: Model<PlayerTotalStatsDocument>,
    private clipAnalyzer: ClipAnalyzerService,
    private statsManagement: StatsManagementService,
  ) {}

  // 팀명을 학교 이름으로 변환 (playerId용)
  private mapTeamNameToSchoolCode(teamName: string): string {
    const schoolMapping = {
      'KKRagingBulls': 'KK',
      '건국대 레이징불스': 'KK',
      'KHCommanders': 'KH',
      '경희대 커맨더스': 'KH',
      'SNGreenTerrors': 'SN',
      '서울대 그린테러스': 'SN',
      'USCityhawks': 'US',
      '서울시립대 시티호크스': 'US',
      'DGTuskers': 'DG',
      '대구대 터스커스': 'DG',
      'KMRazorbacks': 'KM',
      '국민대 레이저백스': 'KM',
      'YSEagles': 'YS',
      '연세대 이글스': 'YS',
      'KUTigers': 'KU',
      '고려대 타이거스': 'KU',
      'HICowboys': 'HI',
      '한국항공대 카우보이스': 'HI',
      'SSCrusaders': 'SS',
      '숭실대 크루세이더스': 'SS',
      'HYLions': 'HY',
      '한양대 라이온스': 'HY',
    };

    return schoolMapping[teamName] || teamName;
  }

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

  // 포지션별 선수 목록 조회 (멀티포지션 지원)
  async getPlayersByPosition(position: string, league?: string) {
    const query: any = { positions: position }; // 배열에서 position 찾기
    if (league) {
      query.league = league;
    }

    const players = await this.playerModel
      .find(query)
      .populate('teamId', 'teamName')
      .sort({ 'stats.totalGamesPlayed': -1 }); // 총 게임 수 기준 정렬

    return {
      success: true,
      data: players,
    };
  }

  // 전체 선수 랭킹 조회 (멀티포지션 지원)
  async getAllPlayersRanking(league?: string, sortBy?: string) {
    const query: any = {};
    if (league) {
      query.league = league;
    }

    const players = await this.playerModel
      .find(query)
      .populate('teamId', 'teamName');

    // 멀티포지션 선수를 각 포지션별로 분리하여 반환
    const expandedPlayers = [];
    
    for (const player of players) {
      // stats 구조 확인 및 변환
      const playerStats = player.stats || {};
      
      for (const position of player.positions) {
        // 포지션별 스탯 가져오기
        let positionStats = {};
        
        // stats 구조가 포지션별로 분리되어 있는지 확인
        if (playerStats[position]) {
          // 예: stats.RB, stats.WR 형태
          positionStats = playerStats[position];
        } else if (playerStats.totalGamesPlayed !== undefined) {
          // 포지션별 스탯이 없으면 전체 stats 사용 (하위 호환성)
          positionStats = playerStats;
        }
        
        // 각 포지션별로 별도의 선수 객체 생성
        const playerObject = {
          _id: `${player._id}_${position}`,
          playerId: player.playerId,
          name: player.name,
          position: position,
          positions: player.positions,
          primaryPosition: player.primaryPosition,
          teamName: player.teamName,
          teamId: player.teamId,
          jerseyNumber: player.jerseyNumber,
          league: player.league,
          season: player.season,
          stats: positionStats,
          createdAt: (player as any).createdAt,
          updatedAt: (player as any).updatedAt,
        };

        // WR 포지션일 경우 패스/런별 펌블 데이터를 최상위 레벨에 추가
        if (position === 'WR' && positionStats) {
          (playerObject as any).passingFumbles = (positionStats as any).passingFumbles || 0;
          (playerObject as any).rushingFumbles = (positionStats as any).rushingFumbles || 0;
          (playerObject as any).passingFumblesLost = (positionStats as any).passingFumblesLost || 0;
          (playerObject as any).rushingFumblesLost = (positionStats as any).rushingFumblesLost || 0;
          
          console.log(`🐛 WR ${player.jerseyNumber}번 펌블 데이터:`, {
            passingFumbles: (playerObject as any).passingFumbles,
            rushingFumbles: (playerObject as any).rushingFumbles,
            passingFumblesLost: (playerObject as any).passingFumblesLost,
            rushingFumblesLost: (playerObject as any).rushingFumblesLost
          });
        }

        expandedPlayers.push(playerObject);
      }
    }

    // DB 스페셜팀 스탯 디버깅
    const dbPlayers = expandedPlayers.filter(p => p.position === 'DB');
    if (dbPlayers.length > 0) {
      console.log('🐛 원본 DB 선수 stats 구조:', players.filter(p => p.positions.includes('DB')).map(p => ({
        name: p.name,
        positions: p.positions,
        dbStats: p.stats?.DB,
        totalStats: p.stats
      })));
      
      console.log('🐛 API 응답 - DB 선수들:', dbPlayers.map(p => ({
        name: p.name,
        position: p.position,
        kickReturns: p.stats?.kickReturns,
        kickReturnYards: p.stats?.kickReturnYards,
        yardsPerKickReturn: p.stats?.yardsPerKickReturn,
        puntReturns: p.stats?.puntReturns,
        puntReturnYards: p.stats?.puntReturnYards,
        yardsPerPuntReturn: p.stats?.yardsPerPuntReturn,
        returnTouchdowns: p.stats?.returnTouchdowns,
      })));
    }

    return {
      success: true,
      data: expandedPlayers,
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
    gameData?: any,
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
    const position = player.primaryPosition || player.positions[0];
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
        console.log(
          `🏃 RB ${player.jerseyNumber}번 분석 시작 - ${player.name} (${player.teamName})`,
        );
        analyzedStats = this.analyzeRBStats(
          playerClips,
          player.jerseyNumber,
          player.name,
          player.teamName,
        );
        break;
      case 'WR':
        console.log(
          `🎯 WR ${player.jerseyNumber}번 분석 시작 - ${player.name} (${player.teamName})`,
        );
        analyzedStats = this.analyzeWRStats(
          playerClips,
          player.jerseyNumber,
          player.name,
          player.teamName,
        );
        break;
      case 'TE':
        console.log(
          `🎯 TE ${player.jerseyNumber}번 분석 시작 - ${player.name} (${player.teamName})`,
        );
        analyzedStats = this.analyzeTEStats(
          playerClips,
          player.jerseyNumber,
          player.name,
          player.teamName,
        );
        break;
      case 'K':
        console.log(
          `🦶 K ${player.jerseyNumber}번 분석 시작 - ${player.name} (${player.teamName})`,
        );
        analyzedStats = this.analyzeKStats(
          playerClips,
          player.jerseyNumber,
          player.name,
          player.teamName,
        );
        break;
      case 'DB':
      case 'LB':
      case 'DL':
      case 'OL':
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

    // 🏈 새로운 3-tier 스탯 시스템 업데이트
    // 1. 기존 player.stats 업데이트 (호환성)
    player.stats = { ...player.stats, ...analyzedStats };
    await player.save();

    // 2. 새로운 3-tier 스탯 저장 (gameData가 있는 경우)
    if (gameData) {
      await this.savePlayerStatsWithNewStructure(player, analyzedStats, gameData, playerClips);
      
      return {
        success: true,
        message: `등번호 ${playerNumber}번 ${position} 선수의 스탯이 3-tier 시스템에 저장되었습니다.`,
        data: player,
        analyzedStats: analyzedStats,
        processedClips: playerClips.length,
        newStructureSaved: true,
        gameKey: gameData.gameKey,
        season: gameData.date ? gameData.date.substring(0, 4) : new Date().getFullYear().toString(),
      };
    }

    // 3. 기존 방식 fallback (gameData가 없는 경우)
    const gameKey =
      newClips.length > 0 && newClips[0].clipKey
        ? `GAME_${newClips[0].clipKey}`
        : `GAME_${Date.now()}`;

    const gameDate = new Date();
    const homeTeam = '홈팀';
    const awayTeam = '어웨이팀';

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
      message: `등번호 ${playerNumber}번 ${position} 선수의 스탯이 기존 3단계 시스템에 업데이트되었습니다.`,
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

  /**
   * RB 스탯 분석 메서드
   */
  private analyzeRBStats(
    clips: any[],
    jerseyNumber: number,
    playerName: string,
    teamName: string,
  ) {
    let rushingAttempts = 0;
    let frontRushYard = 0;
    let backRushYard = 0;
    let rushingTouchdowns = 0;
    let longestRush = 0;
    let fumbles = 0;
    let fumblesLost = 0;

    console.log(
      `🏃 ${playerName} ${jerseyNumber}번 RB 통계 계산 시작 (${clips.length}개 클립)`,
    );

    for (const clip of clips) {
      const isPlayerInCar = clip.car?.num === jerseyNumber;
      const isPlayerInCar2 = clip.car2?.num === jerseyNumber;

      if (!isPlayerInCar && !isPlayerInCar2) continue;

      // RUN 플레이만 처리
      if (clip.playType === 'RUN') {
        rushingAttempts++;
        const gainYard = clip.gainYard || 0;

        // TFL이나 SAFETY가 있으면 BackRushYard, 없으면 FrontRushYard
        const hasTFL = clip.significantPlays?.includes('TFL');
        const hasSAFETY = clip.significantPlays?.includes('SAFETY');

        if (hasTFL || hasSAFETY) {
          backRushYard += gainYard;
          console.log(`  📉 BackRushYard: +${gainYard} (TFL/SAFETY) 총 ${backRushYard}야드`);
        } else {
          frontRushYard += gainYard;
          console.log(`  📈 FrontRushYard: +${gainYard} 총 ${frontRushYard}야드`);
        }

        // 최장 러싱 업데이트
        if (gainYard > longestRush) {
          longestRush = gainYard;
          console.log(`  🏃 새로운 최장 러싱: ${longestRush}야드`);
        }

        console.log(`  ✅ 러싱 시도: +1 (총 ${rushingAttempts}회)`);
      }

      // significantPlays 확인
      const hasSignificantPlay =
        clip.significantPlays &&
        Array.isArray(clip.significantPlays) &&
        clip.significantPlays.some((play) => play !== null);

      if (hasSignificantPlay) {
        const plays = clip.significantPlays.filter((play) => play !== null);

        for (const play of plays) {
          // 러싱 터치다운
          if (play === 'TOUCHDOWN' && clip.playType === 'RUN') {
            rushingTouchdowns++;
            console.log(`  🎯 러싱 터치다운: 총 ${rushingTouchdowns}회`);
          }
          // 펌블
          else if (play === 'FUMBLE') {
            fumbles++;
            console.log(`  💨 펌블: 총 ${fumbles}회`);
          }
          // 펌블 로스트 (상대방이 회수)
          else if (play === 'FUMBLE_LOST') {
            fumblesLost++;
            console.log(`  ❌ 펌블 로스트: 총 ${fumblesLost}회`);
          }
        }
      }
    }

    // Total rushing yards = FrontRushYard - BackRushYard
    const totalRushingYards = frontRushYard - backRushYard;
    
    // Yards per carry 계산
    const yardsPerCarry = rushingAttempts > 0 ? 
      Math.round((totalRushingYards / rushingAttempts) * 100) / 100 : 0;

    const finalStats = {
      gamesPlayed: 1,
      rbRushingAttempts: rushingAttempts,
      rbFrontRushYard: frontRushYard,
      rbBackRushYard: backRushYard,
      rbRushingYards: totalRushingYards,
      rbYardsPerCarry: yardsPerCarry,
      rbRushingTouchdowns: rushingTouchdowns,
      rbLongestRush: longestRush,
      rbFumbles: fumbles,
      rbFumblesLost: fumblesLost,
    };

    // 한 줄 요약 출력
    console.log(
      `🏃 ${teamName} ${jerseyNumber}번 RB: 러싱시도 ${rushingAttempts}회, 러싱야드 ${totalRushingYards}야드 (Front: ${frontRushYard}, Back: ${backRushYard}), 평균 ${yardsPerCarry}야드`,
    );

    return finalStats;
  }

  /**
   * WR 스탯 분석 메서드
   */
  private analyzeWRStats(
    clips: any[],
    jerseyNumber: number,
    playerName: string,
    teamName: string,
  ) {
    // 리시빙 스탯
    let receivingTargets = 0;
    let receptions = 0;
    let receivingYards = 0;
    let receivingTouchdowns = 0;
    let longestReception = 0;
    let receivingFirstDowns = 0;
    
    // 러싱 스탯
    let rushingAttempts = 0;
    let rushingYards = 0;
    let rushingTouchdowns = 0;
    let longestRush = 0;
    
    // 스페셜팀 스탯
    let kickoffReturn = 0;
    let kickoffReturnYard = 0;
    let puntReturn = 0;
    let puntReturnYard = 0;
    let returnTouchdown = 0;
    
    // 펌블
    let fumbles = 0;
    let fumblesLost = 0;

    console.log(`🎯 ${playerName} ${jerseyNumber}번 WR 통계 계산 시작 (${clips.length}개 클립)`);

    for (const clip of clips) {
      const isPlayerInCar = clip.car?.num === jerseyNumber;
      const isPlayerInCar2 = clip.car2?.num === jerseyNumber;

      if (!isPlayerInCar && !isPlayerInCar2) continue;

      const gainYard = clip.gainYard || 0;
      const significantPlays = clip.significantPlays || [];

      // PASS 플레이 처리 (타겟/리시빙)
      if (clip.playType === 'PASS') {
        receivingTargets++;
        
        if (!significantPlays.includes('INCOMPLETE')) {
          receptions++;
          receivingYards += gainYard;
          console.log(`  🎯 리시빙: ${gainYard}야드 (총 ${receptions}캐치, ${receivingYards}야드)`);
          
          if (gainYard > longestReception) {
            longestReception = gainYard;
          }
        } else {
          console.log(`  ❌ 타겟만 (미완성 패스) 총 ${receivingTargets}타겟`);
        }
      }

      // RUN 플레이 처리
      if (clip.playType === 'RUN') {
        rushingAttempts++;
        rushingYards += gainYard;
        console.log(`  🏃 러싱: ${gainYard}야드 (총 ${rushingAttempts}시도, ${rushingYards}야드)`);
        
        if (gainYard > longestRush) {
          longestRush = gainYard;
        }
      }

      // 스페셜팀 리턴 처리
      if (clip.playType === 'RETURN') {
        const hasKickoff = significantPlays.some(play => play === 'KICKOFF');
        const hasPunt = significantPlays.some(play => play === 'PUNT');

        if (hasKickoff) {
          kickoffReturn++;
          kickoffReturnYard += gainYard;
          console.log(`  🟡 킥오프 리턴: ${gainYard}야드 (총 ${kickoffReturn}회, ${kickoffReturnYard}야드)`);
        }

        if (hasPunt) {
          puntReturn++;
          puntReturnYard += gainYard;
          console.log(`  🟡 펀트 리턴: ${gainYard}야드 (총 ${puntReturn}회, ${puntReturnYard}야드)`);
        }
      }

      // significantPlays 처리
      for (const play of significantPlays) {
        if (play === 'TOUCHDOWN') {
          if (clip.playType === 'PASS') {
            receivingTouchdowns++;
            console.log(`  🏈 리시빙 터치다운: 총 ${receivingTouchdowns}회`);
          } else if (clip.playType === 'RUN') {
            rushingTouchdowns++;
            console.log(`  🏈 러싱 터치다운: 총 ${rushingTouchdowns}회`);
          } else if (clip.playType === 'RETURN') {
            returnTouchdown++;
            console.log(`  🏈 리턴 터치다운: 총 ${returnTouchdown}회`);
          }
        } else if (play === 'FIRSTDOWN' && clip.playType === 'PASS') {
          receivingFirstDowns++;
          console.log(`  🚩 리시빙 퍼스트다운: 총 ${receivingFirstDowns}회`);
        } else if (play === 'FUMBLE') {
          fumbles++;
          console.log(`  💨 펌블: 총 ${fumbles}회`);
        } else if (play === 'FUMBLERECDEF') {
          fumblesLost++;
          console.log(`  ❌ 펌블 잃음: 총 ${fumblesLost}회`);
        }
      }
    }

    // 평균 계산
    const yardsPerReception = receptions > 0 ? Math.round((receivingYards / receptions) * 10) / 10 : 0;
    const yardsPerCarry = rushingAttempts > 0 ? Math.round((rushingYards / rushingAttempts) * 10) / 10 : 0;
    const yardPerKickoffReturn = kickoffReturn > 0 ? Math.round((kickoffReturnYard / kickoffReturn) * 10) / 10 : 0;
    const yardPerPuntReturn = puntReturn > 0 ? Math.round((puntReturnYard / puntReturn) * 10) / 10 : 0;

    const finalStats = {
      gamesPlayed: 1,
      // 리시빙 스탯
      wrReceivingTargets: receivingTargets,
      wrReceptions: receptions,
      wrReceivingYards: receivingYards,
      wrYardsPerReception: yardsPerReception,
      wrReceivingTouchdowns: receivingTouchdowns,
      wrLongestReception: longestReception,
      wrReceivingFirstDowns: receivingFirstDowns,
      // 러싱 스탯
      wrRushingAttempts: rushingAttempts,
      wrRushingYards: rushingYards,
      wrYardsPerCarry: yardsPerCarry,
      wrRushingTouchdowns: rushingTouchdowns,
      wrLongestRush: longestRush,
      // 스페셜팀 스탯
      wrKickReturns: kickoffReturn,
      wrKickReturnYards: kickoffReturnYard,
      wrYardsPerKickReturn: yardPerKickoffReturn,
      wrPuntReturns: puntReturn,
      wrPuntReturnYards: puntReturnYard,
      wrYardsPerPuntReturn: yardPerPuntReturn,
      wrReturnTouchdowns: returnTouchdown,
      // 펌블
      fumbles: fumbles,
      fumblesLost: fumblesLost,
    };

    console.log(
      `🎯 ${teamName} ${jerseyNumber}번 WR: 타겟 ${receivingTargets}회, 캐치 ${receptions}회, 리시빙 ${receivingYards}야드, 러싱 ${rushingYards}야드, 리턴 ${kickoffReturn + puntReturn}회`
    );

    return finalStats;
  }

  /**
   * TE 스탯 분석 메서드
   */
  private analyzeTEStats(
    clips: any[],
    jerseyNumber: number,
    playerName: string,
    teamName: string,
  ) {
    // 리시빙 스탯
    let receivingTargets = 0;
    let receptions = 0;
    let receivingYards = 0;
    let receivingTouchdowns = 0;
    let longestReception = 0;
    
    // 러싱 스탯
    let rushingAttempts = 0;
    let rushingYards = 0;
    let rushingTouchdowns = 0;
    let longestRush = 0;
    
    // 펌블
    let fumbles = 0;
    let fumblesLost = 0;

    console.log(`🎯 ${playerName} ${jerseyNumber}번 TE 통계 계산 시작 (${clips.length}개 클립)`);

    for (const clip of clips) {
      const isPlayerInCar = clip.car?.num === jerseyNumber;
      const isPlayerInCar2 = clip.car2?.num === jerseyNumber;

      if (!isPlayerInCar && !isPlayerInCar2) continue;

      const gainYard = clip.gainYard || 0;
      const significantPlays = clip.significantPlays || [];

      // PASS 플레이 처리 (타겟/리시빙)
      if (clip.playType === 'PASS') {
        receivingTargets++;
        
        if (!significantPlays.includes('INCOMPLETE')) {
          receptions++;
          receivingYards += gainYard;
          console.log(`  🎯 리시빙: ${gainYard}야드 (총 ${receptions}캐치, ${receivingYards}야드)`);
          
          if (gainYard > longestReception) {
            longestReception = gainYard;
          }
        } else {
          console.log(`  ❌ 타겟만 (미완성 패스) 총 ${receivingTargets}타겟`);
        }
      }

      // RUN 플레이 처리
      if (clip.playType === 'RUN') {
        rushingAttempts++;
        rushingYards += gainYard;
        console.log(`  🏃 러싱: ${gainYard}야드 (총 ${rushingAttempts}시도, ${rushingYards}야드)`);
        
        if (gainYard > longestRush) {
          longestRush = gainYard;
        }
      }

      // significantPlays 처리
      for (const play of significantPlays) {
        if (play === 'TOUCHDOWN') {
          if (clip.playType === 'PASS') {
            receivingTouchdowns++;
            console.log(`  🏈 리시빙 터치다운: 총 ${receivingTouchdowns}회`);
          } else if (clip.playType === 'RUN') {
            rushingTouchdowns++;
            console.log(`  🏈 러싱 터치다운: 총 ${rushingTouchdowns}회`);
          }
        } else if (play === 'FUMBLE') {
          fumbles++;
          console.log(`  💨 펌블: 총 ${fumbles}회`);
        } else if (play === 'FUMBLERECDEF') {
          fumblesLost++;
          console.log(`  ❌ 펌블 잃음: 총 ${fumblesLost}회`);
        }
      }
    }

    // 평균 계산
    const yardsPerReception = receptions > 0 ? Math.round((receivingYards / receptions) * 10) / 10 : 0;
    const yardsPerCarry = rushingAttempts > 0 ? Math.round((rushingYards / rushingAttempts) * 10) / 10 : 0;

    const finalStats = {
      gamesPlayed: 1,
      // 리시빙 스탯
      teReceivingTargets: receivingTargets,
      teReceptions: receptions,
      teReceivingYards: receivingYards,
      teYardsPerReception: yardsPerReception,
      teReceivingTouchdowns: receivingTouchdowns,
      teLongestReception: longestReception,
      // 러싱 스탯
      teRushingAttempts: rushingAttempts,
      teRushingYards: rushingYards,
      teYardsPerCarry: yardsPerCarry,
      teRushingTouchdowns: rushingTouchdowns,
      teLongestRush: longestRush,
      // 펌블
      fumbles: fumbles,
      fumblesLost: fumblesLost,
    };

    console.log(
      `🎯 ${teamName} ${jerseyNumber}번 TE: 타겟 ${receivingTargets}회, 캐치 ${receptions}회, 리시빙 ${receivingYards}야드, 러싱 ${rushingYards}야드`
    );

    return finalStats;
  }

  /**
   * K(키커) 스탯 분석 메서드
   */
  private analyzeKStats(
    clips: any[],
    jerseyNumber: number,
    playerName: string,
    teamName: string,
  ) {
    let fieldGoalsAttempted = 0;
    let fieldGoalsMade = 0;
    let longestFieldGoal = 0;
    let extraPointsAttempted = 0;
    let extraPointsMade = 0;

    console.log(`🦶 ${playerName} ${jerseyNumber}번 K 통계 계산 시작 (${clips.length}개 클립)`);

    for (const clip of clips) {
      const isPlayerInCar = clip.car?.num === jerseyNumber && clip.car?.pos === 'K';
      const isPlayerInCar2 = clip.car2?.num === jerseyNumber && clip.car2?.pos === 'K';

      if (!isPlayerInCar && !isPlayerInCar2) continue;

      const gainYard = clip.gainYard || 0;
      const significantPlays = clip.significantPlays || [];

      // FG 플레이 처리
      if (clip.playType === 'FG') {
        fieldGoalsAttempted++;
        const actualDistance = gainYard + 17; // 실제 필드골 거리
        
        if (significantPlays.includes('FIELDGOAL_GOOD')) {
          fieldGoalsMade++;
          if (actualDistance > longestFieldGoal) {
            longestFieldGoal = actualDistance;
          }
          console.log(`  🎯 필드골 성공: ${actualDistance}야드`);
        } else {
          console.log(`  ❌ 필드골 실패: ${actualDistance}야드`);
        }
      }

      // PAT 플레이 처리
      if (clip.playType === 'PAT') {
        extraPointsAttempted++;
        
        if (significantPlays.includes('PAT_GOOD')) {
          extraPointsMade++;
          console.log(`  ✅ PAT 성공`);
        } else {
          console.log(`  ❌ PAT 실패`);
        }
      }
    }

    // 필드골 성공률 계산
    const fieldGoalPercentage = fieldGoalsAttempted > 0 ?
      Math.round((fieldGoalsMade / fieldGoalsAttempted) * 100) : 0;

    const finalStats = {
      gamesPlayed: 1,
      fieldGoalsAttempted,
      fieldGoalsMade,
      fieldGoalPercentage,
      longestFieldGoal,
      extraPointsAttempted,
      extraPointsMade,
    };

    console.log(
      `🦶 ${teamName} ${jerseyNumber}번 K: 필드골 ${fieldGoalsMade}/${fieldGoalsAttempted} (${fieldGoalPercentage}%), 최장 ${longestFieldGoal}야드, PAT ${extraPointsMade}/${extraPointsAttempted}`
    );

    return finalStats;
  }

  /**
   * 모든 선수 데이터 완전 삭제
   */
  async resetAllPlayerData() {
    try {
      console.log('🗑️ 모든 선수 데이터 삭제 시작...');
      const result = await this.playerModel.deleteMany({});
      
      console.log(`✅ ${result.deletedCount}명의 선수 데이터가 삭제되었습니다.`);
      return {
        success: true,
        message: `${result.deletedCount}명의 선수 데이터가 삭제되었습니다.`,
        deletedCount: result.deletedCount,
      };
    } catch (error) {
      console.error('❌ 선수 데이터 삭제 실패:', error);
      throw new Error(`선수 데이터 삭제 실패: ${error.message}`);
    }
  }

  /**
   * 게임 데이터 처리 후 3-tier 스탯 저장
   */
  async savePlayerStatsWithNewStructure(
    player: PlayerDocument,
    analyzedStats: any,
    gameData: any,
    playerClips: any[]
  ) {
    try {
      const season = gameData.date ? gameData.date.substring(0, 4) : new Date().getFullYear().toString();
      const schoolCode = this.mapTeamNameToSchoolCode(player.teamName);
      const playerId = `${season}_${schoolCode}_${player.jerseyNumber}`;
      const gameKey = gameData.gameKey;
      const date = gameData.date;

      // 1. 경기별 스탯 저장
      const gameStats = await this.playerGameStatsModel.findOneAndUpdate(
        { playerId, gameKey },
        {
          playerId,
          gameKey,
          date,
          season,
          teamName: player.teamName,
          jerseyNumber: player.jerseyNumber,
          position: player.primaryPosition || player.positions[0],
          stats: analyzedStats,
          opponent: this.getOpponentTeam(gameData, player.teamName),
          isHomeGame: gameData.homeTeam === player.teamName,
        },
        { upsert: true, new: true }
      );
      console.log(`✅ 경기별 스탯 저장 완료: ${playerId} - ${gameKey}`);

      // 2. 시즌별 스탯 업데이트
      await this.updateSeasonStats(playerId, season, player, analyzedStats, gameKey);

      // 3. 통합 스탯 업데이트
      await this.updateTotalStats(playerId, player, analyzedStats, season, date);

      // 4. User 컬렉션 업데이트 (playerId로 연결)
      await this.updateUserStatsReferences(player.playerId);

      return {
        success: true,
        playerId,
        gameKey,
        season,
      };
    } catch (error) {
      console.error('❌ 스탯 저장 실패:', error);
      throw error;
    }
  }

  /**
   * 시즌별 스탯 업데이트
   */
  private async updateSeasonStats(
    playerId: string,
    season: string,
    player: PlayerDocument,
    gameStats: any,
    gameKey: string
  ) {
    // 기존 시즌 스탯 조회
    let seasonStats = await this.playerSeasonStatsModel.findOne({ playerId, season });

    if (!seasonStats) {
      // 첫 경기인 경우
      seasonStats = await this.playerSeasonStatsModel.create({
        playerId,
        season,
        teamName: player.teamName,
        jerseyNumber: player.jerseyNumber,
        position: player.primaryPosition || player.positions[0],
        stats: gameStats,
        gamesPlayed: 1,
        gameKeys: [gameKey],
      });
    } else {
      // 기존 스탯에 합산
      const updatedStats = this.aggregateStats(seasonStats.stats, gameStats, player.primaryPosition || player.positions[0]);
      
      // gameKey가 이미 있는지 확인 (중복 방지)
      if (!seasonStats.gameKeys.includes(gameKey)) {
        seasonStats.gameKeys.push(gameKey);
        seasonStats.gamesPlayed = seasonStats.gameKeys.length;
      }
      
      seasonStats.stats = updatedStats;
      await seasonStats.save();
    }
    
    console.log(`✅ 시즌별 스탯 업데이트 완료: ${playerId} - ${season} (${seasonStats.gamesPlayed}경기)`);
  }

  /**
   * 통합 스탯 업데이트
   */
  private async updateTotalStats(
    playerId: string,
    player: PlayerDocument,
    gameStats: any,
    season: string,
    date: string
  ) {
    // 기존 통합 스탯 조회
    let totalStats = await this.playerTotalStatsModel.findOne({ playerId });

    if (!totalStats) {
      // 첫 경기인 경우
      totalStats = await this.playerTotalStatsModel.create({
        playerId,
        teamName: player.teamName,
        jerseyNumber: player.jerseyNumber,
        position: player.primaryPosition || player.positions[0],
        stats: gameStats,
        totalGamesPlayed: 1,
        seasons: [season],
        firstGameDate: date,
        lastGameDate: date,
      });
    } else {
      // 기존 스탯에 합산
      const updatedStats = this.aggregateStats(totalStats.stats, gameStats, player.primaryPosition || player.positions[0]);
      
      // 시즌 추가 (중복 제거)
      if (!totalStats.seasons.includes(season)) {
        totalStats.seasons.push(season);
      }
      
      // 모든 시즌의 경기 수 합계
      const allSeasonStats = await this.playerSeasonStatsModel.find({ playerId });
      totalStats.totalGamesPlayed = allSeasonStats.reduce((sum, s) => sum + s.gamesPlayed, 0);
      
      totalStats.stats = updatedStats;
      totalStats.lastGameDate = date;
      await totalStats.save();
    }
    
    console.log(`✅ 통합 스탯 업데이트 완료: ${playerId} (총 ${totalStats.totalGamesPlayed}경기)`);
  }

  /**
   * 스탯 합산 로직 (포지션별)
   */
  private aggregateStats(existingStats: any, newStats: any, position: string): any {
    const aggregated = { ...existingStats };

    switch (position) {
      case 'QB':
        // QB 스탯 합산
        aggregated.passingYards = (aggregated.passingYards || 0) + (newStats.passingYards || 0);
        aggregated.passingTouchdowns = (aggregated.passingTouchdowns || 0) + (newStats.passingTouchdowns || 0);
        aggregated.passingCompletions = (aggregated.passingCompletions || 0) + (newStats.passingCompletions || 0);
        aggregated.passingAttempts = (aggregated.passingAttempts || 0) + (newStats.passingAttempts || 0);
        aggregated.passingInterceptions = (aggregated.passingInterceptions || 0) + (newStats.passingInterceptions || 0);
        aggregated.rushingYards = (aggregated.rushingYards || 0) + (newStats.rushingYards || 0);
        aggregated.rushingTouchdowns = (aggregated.rushingTouchdowns || 0) + (newStats.rushingTouchdowns || 0);
        aggregated.sacks = (aggregated.sacks || 0) + (newStats.sacks || 0);
        
        // 평균/퍼센트 재계산
        if (aggregated.passingAttempts > 0) {
          aggregated.completionPercentage = Math.round((aggregated.passingCompletions / aggregated.passingAttempts) * 100);
        }
        
        // 최장 기록 업데이트
        aggregated.longestPass = Math.max(aggregated.longestPass || 0, newStats.longestPass || 0);
        aggregated.longestRush = Math.max(aggregated.longestRush || 0, newStats.longestRush || 0);
        break;

      case 'RB':
        // RB 스탯 합산
        aggregated.rbRushingYards = (aggregated.rbRushingYards || 0) + (newStats.rbRushingYards || 0);
        aggregated.rbRushingTouchdowns = (aggregated.rbRushingTouchdowns || 0) + (newStats.rbRushingTouchdowns || 0);
        aggregated.rbRushingAttempts = (aggregated.rbRushingAttempts || 0) + (newStats.rbRushingAttempts || 0);
        aggregated.rbReceivingTargets = (aggregated.rbReceivingTargets || 0) + (newStats.rbReceivingTargets || 0);
        aggregated.rbReceptions = (aggregated.rbReceptions || 0) + (newStats.rbReceptions || 0);
        aggregated.rbReceivingYards = (aggregated.rbReceivingYards || 0) + (newStats.rbReceivingYards || 0);
        aggregated.rbReceivingTouchdowns = (aggregated.rbReceivingTouchdowns || 0) + (newStats.rbReceivingTouchdowns || 0);
        
        // 평균 재계산
        if (aggregated.rbRushingAttempts > 0) {
          aggregated.rbYardsPerCarry = Math.round(aggregated.rbRushingYards / aggregated.rbRushingAttempts * 10) / 10;
        }
        
        // 최장 기록 업데이트
        aggregated.rbLongestRush = Math.max(aggregated.rbLongestRush || 0, newStats.rbLongestRush || 0);
        aggregated.rbLongestReception = Math.max(aggregated.rbLongestReception || 0, newStats.rbLongestReception || 0);
        break;

      case 'WR':
      case 'TE':
        // WR/TE 스탯 합산
        aggregated.targets = (aggregated.targets || 0) + (newStats.targets || 0);
        aggregated.receptions = (aggregated.receptions || 0) + (newStats.receptions || 0);
        aggregated.receivingYards = (aggregated.receivingYards || 0) + (newStats.receivingYards || 0);
        aggregated.receivingTouchdowns = (aggregated.receivingTouchdowns || 0) + (newStats.receivingTouchdowns || 0);
        aggregated.receivingFirstDowns = (aggregated.receivingFirstDowns || 0) + (newStats.receivingFirstDowns || 0);
        
        // 평균 재계산
        if (aggregated.receptions > 0) {
          aggregated.yardsPerCatch = Math.round(aggregated.receivingYards / aggregated.receptions * 10) / 10;
        }
        
        // 최장 기록 업데이트
        aggregated.longestReception = Math.max(aggregated.longestReception || 0, newStats.longestReception || 0);
        break;

      case 'K':
        // K 스탯 합산
        aggregated.fieldGoalsAttempted = (aggregated.fieldGoalsAttempted || 0) + (newStats.fieldGoalsAttempted || 0);
        aggregated.fieldGoalsMade = (aggregated.fieldGoalsMade || 0) + (newStats.fieldGoalsMade || 0);
        aggregated.extraPointsAttempted = (aggregated.extraPointsAttempted || 0) + (newStats.extraPointsAttempted || 0);
        aggregated.extraPointsMade = (aggregated.extraPointsMade || 0) + (newStats.extraPointsMade || 0);
        
        // 퍼센트 재계산
        if (aggregated.fieldGoalsAttempted > 0) {
          aggregated.fieldGoalPercentage = Math.round((aggregated.fieldGoalsMade / aggregated.fieldGoalsAttempted) * 100);
        }
        
        // 최장 기록 업데이트
        aggregated.longestFieldGoal = Math.max(aggregated.longestFieldGoal || 0, newStats.longestFieldGoal || 0);
        break;
    }

    return aggregated;
  }

  /**
   * 상대팀 추출
   */
  private getOpponentTeam(gameData: any, myTeamName: string): string {
    if (gameData.homeTeam === myTeamName) {
      return gameData.awayTeam;
    } else if (gameData.awayTeam === myTeamName) {
      return gameData.homeTeam;
    }
    return 'Unknown';
  }

  /**
   * User 컬렉션의 스탯 참조 업데이트
   */
  private async updateUserStatsReferences(playerId: string) {
    try {
      // playerId로 User 찾기
      const user = await this.userModel.findOne({ playerId });
      if (!user) {
        console.log(`사용자를 찾을 수 없음: playerId=${playerId}`);
        return;
      }

      // 해당 선수의 모든 스탯 ID 가져오기
      const gameStats = await this.playerGameStatsModel.find({ playerId }).select('_id');
      const seasonStats = await this.playerSeasonStatsModel.find({ playerId }).select('_id');
      const totalStats = await this.playerTotalStatsModel.findOne({ playerId }).select('_id');

      // User 프로필 업데이트
      await this.userModel.updateOne(
        { playerId },
        {
          $set: {
            'profile.gameStats': gameStats.map(stat => stat._id.toString()),
            'profile.seasonStats': seasonStats.map(stat => stat._id.toString()),
            'profile.totalStats': totalStats ? totalStats._id.toString() : null,
          }
        }
      );

      console.log(`✅ User 스탯 참조 업데이트 완료: ${user.username}`);
    } catch (error) {
      console.error('❌ User 스탯 참조 업데이트 실패:', error);
    }
  }

  /**
   * 선수의 전체 스탯 조회 (마이페이지용)
   */
  async getPlayerStats(user: any) {
    try {
      // 1. playerId 확인
      if (!user.playerId) {
        throw new Error('playerId가 배정되지 않았습니다. 관리자에게 문의하세요.');
      }

      const playerId = user.playerId;
      console.log(`📊 선수 스탯 조회 시작: ${playerId} (${user.username})`);

      // 2. 경기별 스탯 조회 (최근 10경기)
      const gameStats = await this.playerGameStatsModel
        .find({ playerId })
        .sort({ date: -1 })
        .limit(10)
        .lean();

      // 3. 시즌별 스탯 조회
      const seasonStats = await this.playerSeasonStatsModel
        .find({ playerId })
        .sort({ season: -1 })
        .lean();

      // 4. 통합 스탯 조회
      const totalStats = await this.playerTotalStatsModel
        .findOne({ playerId })
        .lean();

      // 5. 선수 기본 정보 (players 컬렉션에서)
      const playerInfo = await this.playerModel
        .findOne({
          $or: [
            { playerId: playerId },
            { teamName: user.teamName, jerseyNumber: parseInt(playerId.split('_')[2]) }
          ]
        })
        .select('name teamName jerseyNumber primaryPosition positions')
        .lean();

      console.log(`✅ 스탯 조회 완료: 경기별 ${gameStats.length}개, 시즌별 ${seasonStats.length}개`);

      return {
        success: true,
        message: `${playerId} 선수의 스탯을 조회했습니다.`,
        data: {
          playerInfo: {
            playerId: playerId,
            username: user.username,
            teamName: user.teamName,
            name: playerInfo?.name || '미등록',
            jerseyNumber: playerInfo?.jerseyNumber || parseInt(playerId.split('_')[2]),
            position: playerInfo?.primaryPosition || playerInfo?.positions?.[0] || '미등록',
          },
          gameStats: gameStats.map(game => ({
            gameKey: game.gameKey,
            date: game.date,
            season: game.season,
            opponent: game.opponent,
            isHomeGame: game.isHomeGame,
            stats: game.stats,
          })),
          seasonStats: seasonStats.reduce((acc, season) => {
            acc[season.season] = {
              gamesPlayed: season.gamesPlayed,
              stats: season.stats,
            };
            return acc;
          }, {}),
          totalStats: totalStats ? {
            totalGamesPlayed: totalStats.totalGamesPlayed,
            seasons: totalStats.seasons,
            stats: totalStats.stats,
            firstGameDate: totalStats.firstGameDate,
            lastGameDate: totalStats.lastGameDate,
          } : null,
          summary: {
            totalGames: gameStats.length,
            seasonsPlayed: seasonStats.length,
            hasStats: gameStats.length > 0,
          }
        },
      };
    } catch (error) {
      console.error(`❌ 스탯 조회 실패 (${user.username}):`, error.message);
      
      if (error.message.includes('playerId가 배정되지')) {
        return {
          success: false,
          message: error.message,
          code: 'PLAYER_ID_NOT_ASSIGNED',
        };
      }

      return {
        success: false,
        message: '스탯 조회 중 오류가 발생했습니다.',
        error: error.message,
      };
    }
  }
}
