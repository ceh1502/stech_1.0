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
        expandedPlayers.push({
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
        });
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
}
