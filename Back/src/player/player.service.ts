import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { Team, TeamDocument } from '../schemas/team.schema';
import { CreatePlayerDto, UpdatePlayerStatsDto } from '../common/dto/player.dto';
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
import { StatsManagementService } from '../common/services/stats-management.service';
import { NewClipDto } from '../common/dto/new-clip.dto';

@Injectable()
export class PlayerService {
  constructor(
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
    private qbStatsAnalyzer: QbStatsAnalyzerService,
    private rbStatsAnalyzer: RbStatsAnalyzerService,
    private wrStatsAnalyzer: WrStatsAnalyzerService,
    private teStatsAnalyzer: TeStatsAnalyzerService,
    private kickerStatsAnalyzer: KickerStatsAnalyzerService,
    private punterStatsAnalyzer: PunterStatsAnalyzerService,
    private olStatsAnalyzer: OLStatsAnalyzerService,
    private dlStatsAnalyzer: DLStatsAnalyzerService,
    private lbStatsAnalyzer: LBStatsAnalyzerService,
    private dbStatsAnalyzer: DBStatsAnalyzerService,
    private statsManagement: StatsManagementService,
  ) {}

  // JSON 게임 데이터의 팀명을 데이터베이스 팀명으로 매핑
  private mapJsonTeamNameToDbTeamName(jsonTeamName: string): string {
    const teamMapping = {
      // 기존 매핑 (정확히 일치하는 팀들)
      'KKRagingBulls': 'KKRagingBulls',
      'KHCommanders': 'KHCommanders', 
      'SNGreenTerrors': 'SNGreenTerrors',
      'USCityhawks': 'USCityhawks',
      'DGTuskers': 'DGTuskers',
      'KMRazorbacks': 'KMRazorbacks',
      'YSEagles': 'YSEagles',
      'KUTigers': 'KUTigers',
      'HICowboys': 'HICowboys',
      'SSCrusaders': 'SSCrusaders',
      
      // JSON에서 사용하는 팀명 매핑
      // 한양대(HYLions)가 이제 데이터베이스에 추가됨
      'HYLions': 'HYLions', // 한양대 라이온스 -> 그대로 유지 (데이터베이스에 존재)
      'HFBlackKnights': 'KHCommanders', // 한국외대 -> 경희대로 매핑
      
      // 추가 가능한 JSON 팀명들
      'KMRB': 'KMRazorbacks',
      'HYLI': 'YSEagles',
      'HanYang': 'YSEagles', // 한양대 다른 표기법
      'Lions': 'YSEagles', // 라이온스만으로 표기된 경우
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
          returnTouchdown: 0
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
          returnTouchdown: 0
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
          touchdown: 0
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
      data: newPlayer
    };
  }

  // PlayerCode로 개별 선수 조회
  async getPlayerByCode(playerId: string) {
    const player = await this.playerModel.findOne({ playerId }).populate('teamId', 'teamName');
    if (!player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    return {
      success: true,
      data: player
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
      data: players
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
      data: players
    };
  }

  // 선수 스탯 업데이트
  async updatePlayerStats(playerId: string, updateStatsDto: UpdatePlayerStatsDto) {
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
      data: player
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
      data: players
    };
  }


  // === 새로운 클립 구조 처리 메서드들 ===

  /**
   * 새로운 클립 구조로 선수 스탯 업데이트 (팀명 + 등번호 기반)
   */
  async updatePlayerStatsFromNewClips(playerNumber: number, newClips: NewClipDto[], teamName?: string) {
    let player;
    
    if (teamName) {
      // JSON 팀명을 DB 팀명으로 매핑
      const dbTeamName = this.mapJsonTeamNameToDbTeamName(teamName);
      
      // 팀명 + 등번호로 선수 찾기
      player = await this.playerModel.findOne({ 
        jerseyNumber: playerNumber,
        teamName: dbTeamName
      });
      
      if (!player) {
        console.log(`🔍 팀 ${teamName} (매핑: ${dbTeamName})의 등번호 ${playerNumber}번 선수를 찾을 수 없습니다.`);
        
        // 매핑된 팀명으로도 찾을 수 없으면 등번호로만 시도
        player = await this.playerModel.findOne({ 
          jerseyNumber: playerNumber 
        });
        
        if (player) {
          console.log(`✅ 등번호로 선수 발견: ${player.name} (${player.teamName})`);
        } else {
          console.log(`❌ 등번호 ${playerNumber}번 선수를 전혀 찾을 수 없습니다.`);
          return { 
            success: false, 
            message: `등번호 ${playerNumber}번 선수를 찾을 수 없습니다. (JSON팀명: ${teamName}, DB팀명: ${dbTeamName})`,
            playerNumber,
            teamName,
            dbTeamName
          };
        }
      }
    } else {
      // 기존 방식: 등번호로만 찾기 (하위 호환성)
      player = await this.playerModel.findOne({ 
        jerseyNumber: playerNumber 
      });
      
      if (!player) {
        throw new NotFoundException(`등번호 ${playerNumber}번 선수를 찾을 수 없습니다.`);
      }
    }

    // 해당 선수가 참여한 클립들만 필터링 (새 구조에서 직접)
    const playerClips = newClips.filter(clip => 
      clip.car?.num === playerNumber || 
      clip.car2?.num === playerNumber ||
      clip.tkl?.num === playerNumber || 
      clip.tkl2?.num === playerNumber
    );

    if (playerClips.length === 0) {
      return {
        success: false,
        message: `등번호 ${playerNumber}번 선수의 플레이가 클립에서 발견되지 않았습니다.`,
        data: player
      };
    }

    // 포지션별 분석기 실행
    const position = player.position;
    let analyzedStats: any;

    switch (position) {
      case 'QB':
        analyzedStats = await this.qbStatsAnalyzer.analyzeQbStats(playerClips as any, player.jerseyNumber.toString());
        break;
      case 'RB':
        // RB 분석기가 새 구조로 업데이트됨
        console.log(`🏈 RB 분석기 실행 - 클립 수: ${playerClips.length}`);
        analyzedStats = await this.rbStatsAnalyzer?.analyzeRbStats?.(playerClips as any, player.jerseyNumber.toString()) || 
                       this.getDefaultStatsForPosition(position);
        break;
      case 'WR':
        // WR 분석기가 새 구조로 업데이트됨  
        console.log(`🏈 WR 분석기 실행 - 클립 수: ${playerClips.length}`);
        analyzedStats = await this.wrStatsAnalyzer?.analyzeWrStats?.(playerClips as any, player.jerseyNumber.toString()) || 
                       this.getDefaultStatsForPosition(position);
        break;
      case 'TE':
        // TE 분석기가 새 구조로 업데이트됨
        console.log(`🏈 TE 분석기 실행 - 클립 수: ${playerClips.length}`);
        analyzedStats = await this.teStatsAnalyzer?.analyzeTeStats?.(playerClips as any, player.jerseyNumber.toString()) || 
                       this.getDefaultStatsForPosition(position);
        break;
      case 'DB':
        // DB 분석기가 새 구조로 업데이트됨
        console.log(`🏈 DB 분석기 실행 - 클립 수: ${playerClips.length}`);
        const dbStats = await this.dbStatsAnalyzer?.analyzeDBStats?.(playerClips as any, player.jerseyNumber.toString()) || 
                       this.getDefaultStatsForPosition(position);
        
        // DB 분석기 결과를 프론트엔드 형태로 변환
        analyzedStats = {
          ...dbStats,
          // 수비 스탯 매핑
          gamesPlayed: dbStats.gamesPlayed || 0,
          tackles: dbStats.tackles || 0,
          sacks: dbStats.sacks || 0,
          forcedFumbles: dbStats.forced_fumbles || 0,
          fumbleRecoveries: dbStats.fumble_recovery || 0,
          fumbleRecoveryYards: dbStats.fumble_recovered_yards || 0,
          passesDefended: dbStats.pass_defended || 0,
          interceptions: dbStats.interceptions || 0,
          interceptionYards: dbStats.interception_yards || 0,
          defensiveTouchdowns: dbStats.touchdowns || 0,
          
          // 기존 더미 스탯 필드도 유지
          passingYards: 0,
          passingTouchdowns: 0,
          rushingYards: 0,
          rushingTouchdowns: 0,
          receivingYards: 0,
          receivingTouchdowns: 0,
          totalYards: 0,
          totalTouchdowns: dbStats.touchdowns || 0,
        };
        break;
      case 'LB':
        // LB 분석기가 새 구조로 업데이트됨
        console.log(`🏈 LB 분석기 실행 - 클립 수: ${playerClips.length}`);
        const lbStats = await this.lbStatsAnalyzer?.analyzeLBStats?.(playerClips as any, player.jerseyNumber.toString()) || 
                       this.getDefaultStatsForPosition(position);
        
        // LB 분석기 결과를 프론트엔드 형태로 변환
        analyzedStats = {
          ...lbStats,
          // 수비 스탯 매핑 (LB도 DB와 같은 형태)
          gamesPlayed: lbStats.games || lbStats.gamesPlayed || 0,
          tackles: lbStats.tackles || 0,
          sacks: lbStats.sacks || 0,
          forcedFumbles: lbStats.forcedFumbles || lbStats.forced_fumbles || 0,
          fumbleRecoveries: lbStats.fumbleRecovery || lbStats.fumble_recovery || 0,
          fumbleRecoveryYards: lbStats.fumbleRecoveredYards || lbStats.fumble_recovered_yards || 0,
          passesDefended: lbStats.passDefended || lbStats.pass_defended || 0,
          interceptions: lbStats.interception || lbStats.interceptions || 0,
          interceptionYards: lbStats.interceptionYards || lbStats.interception_yards || 0,
          defensiveTouchdowns: lbStats.touchdown || lbStats.touchdowns || 0,
          
          // 기존 더미 스탯 필드도 유지
          passingYards: 0,
          passingTouchdowns: 0,
          rushingYards: 0,
          rushingTouchdowns: 0,
          receivingYards: 0,
          receivingTouchdowns: 0,
          totalYards: 0,
          totalTouchdowns: lbStats.touchdown || lbStats.touchdowns || 0,
        };
        break;
      case 'DL':
        // DL 분석기가 새 구조로 업데이트됨
        console.log(`🏈 DL 분석기 실행 - 클립 수: ${playerClips.length}`);
        const dlStats = await this.dlStatsAnalyzer?.analyzeDLStats?.(playerClips as any, player.jerseyNumber.toString()) || 
                       this.getDefaultStatsForPosition(position);
        
        // DL 분석기 결과를 프론트엔드 형태로 변환
        analyzedStats = {
          ...dlStats,
          // 수비 스탯 매핑
          gamesPlayed: dlStats.games || dlStats.gamesPlayed || 0,
          tackles: dlStats.tackles || 0,
          sacks: dlStats.sacks || 0,
          forcedFumbles: dlStats.forcedFumbles || dlStats.forced_fumbles || 0,
          fumbleRecoveries: dlStats.fumbleRecovery || dlStats.fumble_recovery || 0,
          fumbleRecoveryYards: dlStats.fumbleRecoveredYards || dlStats.fumble_recovered_yards || 0,
          passesDefended: dlStats.passDefended || dlStats.pass_defended || 0,
          interceptions: dlStats.interception || dlStats.interceptions || 0,
          interceptionYards: dlStats.interceptionYards || dlStats.interception_yards || 0,
          defensiveTouchdowns: dlStats.touchdown || dlStats.touchdowns || 0,
          
          // 기존 더미 스탯 필드도 유지
          passingYards: 0,
          passingTouchdowns: 0,
          rushingYards: 0,
          rushingTouchdowns: 0,
          receivingYards: 0,
          receivingTouchdowns: 0,
          totalYards: 0,
          totalTouchdowns: dlStats.touchdown || dlStats.touchdowns || 0,
        };
        break;
      case 'Kicker':
      case 'K':
        analyzedStats = await this.kickerStatsAnalyzer.analyzeKickerStats(playerClips as any, player.jerseyNumber.toString());
        break;
      case 'Punter':
      case 'P':
        // P 포지션 지원 추가
        console.log(`🏈 Punter 분석기 실행 - 클립 수: ${playerClips.length}`);
        analyzedStats = await this.punterStatsAnalyzer.analyzePunterStats(playerClips as any, player.jerseyNumber.toString());
        break;
      case 'OL':
        analyzedStats = await this.olStatsAnalyzer.analyzeOLStats(playerClips as any, player.jerseyNumber.toString());
        break;
      default:
        throw new Error(`지원하지 않는 포지션입니다: ${position}`);
    }

    // 🏈 3단계 스탯 시스템 업데이트
    // 1. 기존 player.stats 업데이트 (호환성)
    player.stats = { ...player.stats, ...analyzedStats };
    await player.save();

    // 2. 새로운 3단계 시스템 업데이트
    // gameKey 생성 (클립의 첫 번째 clipKey 또는 현재 타임스탬프 사용)
    const gameKey = newClips.length > 0 && newClips[0].clipKey 
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
      analyzedStats
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
        autoAggregated: true
      }
    };
  }


  /**
   * 게임 전체 데이터로 여러 선수 스탯 업데이트
   */
  async updateGameStats(gameData: { Clips: NewClipDto[] }) {
    // 게임 고유 식별자 생성 (첫 번째 클립의 정보로)
    const firstClip = gameData.Clips[0];
    if (!firstClip) {
      throw new Error('클립 데이터가 없습니다.');
    }

    // 게임 식별자 생성 (날짜, 팀 정보 등 조합)
    const gameId = this.generateGameId(firstClip);
    
    // 이미 처리된 게임인지 확인
    const existingPlayer = await this.playerModel.findOne({ 
      'processedGames': gameId 
    });

    if (existingPlayer) {
      return {
        success: false,
        message: `이미 처리된 게임입니다: ${gameId}`,
        totalPlayers: 0,
        successfulUpdates: 0,
        totalClips: gameData.Clips.length,
        results: []
      };
    }

    const results = [];
    const processedPlayers = new Set<number>();

    // 모든 클립에서 등번호 추출
    gameData.Clips.forEach(clip => {
      [clip.car, clip.car2, clip.tkl, clip.tkl2].forEach(player => {
        if (player?.num) {
          processedPlayers.add(player.num);
        }
      });
    });

    // 각 선수별로 스탯 업데이트
    for (const playerNumber of processedPlayers) {
      try {
        const result = await this.updatePlayerStatsFromNewClips(playerNumber, gameData.Clips);
        results.push({
          playerNumber,
          success: result.success,
          message: result.message,
          processedClips: result.processedClips || 0
        });
      } catch (error) {
        results.push({
          playerNumber,
          success: false,
          message: error.message,
          processedClips: 0
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalClips = gameData.Clips.length;

    // 성공한 선수들에게 처리된 게임 ID 추가
    if (successCount > 0) {
      await this.playerModel.updateMany(
        { jerseyNumber: { $in: Array.from(processedPlayers) } },
        { $addToSet: { processedGames: gameId } }
      );
    }

    return {
      success: true,
      message: `게임 데이터 처리 완료: ${successCount}명의 선수 스탯 업데이트`,
      gameId: gameId,
      totalPlayers: processedPlayers.size,
      successfulUpdates: successCount,
      totalClips: totalClips,
      results: results
    };
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
          $unset: { stats: 1 }
        }
      );

      return {
        success: true,
        message: `${result.modifiedCount}명의 선수 스탯이 초기화되었습니다.`,
        modifiedCount: result.modifiedCount
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
          $unset: { processedGames: 1 }
        }
      );

      return {
        success: true,
        message: '처리된 게임 목록이 초기화되었습니다.',
        modifiedCount: result.modifiedCount
      };
    } catch (error) {
      throw new Error(`처리된 게임 목록 초기화 실패: ${error.message}`);
    }
  }
}