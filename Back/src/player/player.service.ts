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
import { ClipAdapterService } from '../common/adapters/clip-adapter.service';
import { StatsManagementService } from '../common/services/stats-management.service';
import { NewClipDto } from '../common/dto/new-clip.dto';
import { ClipData, LegacyClipData } from '../common/interfaces/clip-data.interface';

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
    private clipAdapter: ClipAdapterService,
    private statsManagement: StatsManagementService,
  ) {}

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

  // 클립 데이터로 QB 스탯 업데이트
  async updateQbStatsFromClips(playerId: string, clips: ClipData[]) {
    let player = await this.playerModel.findOne({ 
      $or: [
        { playerId: playerId },
        { playercode: playerId },
        { playercode: parseInt(playerId) }
      ]
    });
    
    if (!player) {
      // 기본 팀 생성 또는 조회
      let defaultTeam = await this.teamModel.findOne({ teamName: 'Default Team' });
      if (!defaultTeam) {
        defaultTeam = new this.teamModel({
          teamId: 'DEFAULT_TEAM',
          teamName: 'Default Team',
          ownerId: new Types.ObjectId('507f1f77bcf86cd799439011'), // 임시 사용자 ID
        });
        await defaultTeam.save();
      }

      // 선수가 존재하지 않으면 새로 생성 (임시 기본값 사용)
      player = new this.playerModel({
        playerId: playerId,
        name: `QB Player ${playerId}`,
        jerseyNumber: parseInt(playerId.toString().slice(-2)) || 99, // 마지막 2자리를 등번호로 사용
        position: 'QB',
        league: '1부',
        season: '2024',
        teamId: defaultTeam._id, // 생성된 팀의 ObjectId 사용
        stats: {
          gamesPlayed: 0,
          totalYards: 0,
          totalTouchdowns: 0
        }
      });
      await player.save();
    }

    if (player.position !== 'QB') {
      throw new Error('쿼터백이 아닙니다.');
    }

    // 클립 데이터에서 QB 스탯 추출
    const qbStats = await this.qbStatsAnalyzer.analyzeQbStats(clips, playerId);

    // 선수 스탯 업데이트 (QB 스탯만)
    player.stats = { ...player.stats, ...qbStats };
    await player.save();

    return {
      success: true,
      message: 'QB 스탯이 클립 데이터로부터 업데이트되었습니다.',
      data: player
    };
  }

  // 클립 데이터 분석만 (DB 업데이트 안함)
  async analyzeQbStatsOnly(playerId: string, clips: ClipData[]) {
    const player = await this.playerModel.findOne({ 
      $or: [
        { playerId: playerId },
        { playercode: playerId },
        { playercode: parseInt(playerId) }
      ]
    });
    if (!player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    if (player.position !== 'QB') {
      throw new Error('쿼터백이 아닙니다.');
    }

    // 클립 데이터에서 QB 스탯 추출 (DB 업데이트 안함)
    const qbStats = await this.qbStatsAnalyzer.analyzeQbStats(clips, playerId);

    return {
      success: true,
      message: 'QB 스탯 분석이 완료되었습니다.',
      analyzedStats: qbStats,
      clipCount: clips.length
    };
  }

  // 테스트용: 샘플 클립으로 QB 스탯 생성
  async generateSampleQbStats(playerId: string = 'QB001') {
    const sampleStats = await this.qbStatsAnalyzer.generateSampleQbStats(playerId);
    
    const player = await this.playerModel.findOne({ playerId });
    if (!player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    player.stats = { ...player.stats, ...sampleStats };
    await player.save();

    return {
      success: true,
      message: '샘플 QB 스탯이 생성되었습니다.',
      data: player,
      analyzedStats: sampleStats
    };
  }

  // RB 전용: 클립 데이터로 스탯 업데이트
  async updateRbStatsFromClips(playerId: string, clips: ClipData[]) {
    let player = await this.playerModel.findOne({ 
      $or: [
        { playerId: playerId },
        { playercode: playerId },
        { playercode: parseInt(playerId) }
      ]
    });
    
    if (!player) {
      // 기본 팀 생성 또는 조회
      let defaultTeam = await this.teamModel.findOne({ teamName: 'Default Team' });
      if (!defaultTeam) {
        defaultTeam = new this.teamModel({
          teamId: 'DEFAULT_TEAM',
          teamName: 'Default Team',
          ownerId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        });
        await defaultTeam.save();
      }

      // 선수가 존재하지 않으면 새로 생성
      player = new this.playerModel({
        playerId: playerId,
        name: `RB Player ${playerId}`,
        jerseyNumber: parseInt(playerId.toString().slice(-2)) || 21, // RB는 보통 21번
        position: 'RB',
        league: '1부',
        season: '2024',
        teamId: defaultTeam._id,
        stats: {
          gamesPlayed: 0,
          totalYards: 0,
          totalTouchdowns: 0
        }
      });
      await player.save();
    }

    if (player.position !== 'RB') {
      throw new Error('러닝백이 아닙니다.');
    }

    // 클립 데이터에서 RB 스탯 추출
    const rbStats = await this.rbStatsAnalyzer.analyzeRbStats(clips, playerId);

    // 선수 스탯 업데이트 (RB 스탯만)
    player.stats = { ...player.stats, ...rbStats };
    await player.save();

    return {
      success: true,
      message: 'RB 스탯이 클립 데이터로부터 업데이트되었습니다.',
      data: player
    };
  }

  // RB 전용: 클립 데이터 분석만 (DB 업데이트 안함)
  async analyzeRbStatsOnly(playerId: string, clips: ClipData[]) {
    const player = await this.playerModel.findOne({ 
      $or: [
        { playerId: playerId },
        { playercode: playerId },
        { playercode: parseInt(playerId) }
      ]
    });
    if (!player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    if (player.position !== 'RB') {
      throw new Error('러닝백이 아닙니다.');
    }

    // 클립 데이터에서 RB 스탯 추출 (DB 업데이트 안함)
    const rbStats = await this.rbStatsAnalyzer.analyzeRbStats(clips, playerId);

    return {
      success: true,
      message: 'RB 스탯 분석이 완료되었습니다.',
      analyzedStats: rbStats,
      clipCount: clips.length
    };
  }

  // 테스트용: 샘플 클립으로 RB 스탯 생성
  async generateSampleRbStats(playerId: string = 'RB001') {
    const sampleStats = await this.rbStatsAnalyzer.generateSampleRbStats(playerId);
    
    const player = await this.playerModel.findOne({ playerId });
    if (!player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    player.stats = { ...player.stats, ...sampleStats };
    await player.save();

    return {
      success: true,
      message: '샘플 RB 스탯이 생성되었습니다.',
      data: player,
      analyzedStats: sampleStats
    };
  }

  // WR 전용: 클립 데이터로 스탯 업데이트
  async updateWrStatsFromClips(playerId: string, clips: ClipData[]) {
    let player = await this.playerModel.findOne({ 
      $or: [
        { playerId: playerId },
        { playercode: playerId },
        { playercode: parseInt(playerId) }
      ]
    });
    
    if (!player) {
      // 기본 팀 생성 또는 조회
      let defaultTeam = await this.teamModel.findOne({ teamName: 'Default Team' });
      if (!defaultTeam) {
        defaultTeam = new this.teamModel({
          teamId: 'DEFAULT_TEAM',
          teamName: 'Default Team',
          ownerId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        });
        await defaultTeam.save();
      }

      // 선수가 존재하지 않으면 새로 생성
      player = new this.playerModel({
        playerId: playerId,
        name: `WR Player ${playerId}`,
        jerseyNumber: parseInt(playerId.toString().slice(-2)) || 88, // WR는 보통 80번대
        position: 'WR',
        league: '1부',
        season: '2024',
        teamId: defaultTeam._id,
        stats: {
          gamesPlayed: 0,
          totalYards: 0,
          totalTouchdowns: 0
        }
      });
      await player.save();
    }

    if (player.position !== 'WR') {
      throw new Error('와이드 리시버가 아닙니다.');
    }

    // 클립 데이터에서 WR 스탯 추출
    const wrStats = await this.wrStatsAnalyzer.analyzeWrStats(clips, playerId);

    // 선수 스탯 업데이트 (WR 스탯만)
    player.stats = { ...player.stats, ...wrStats };
    await player.save();

    return {
      success: true,
      message: 'WR 스탯이 클립 데이터로부터 업데이트되었습니다.',
      data: player
    };
  }

  // WR 전용: 클립 데이터 분석만 (DB 업데이트 안함)
  async analyzeWrStatsOnly(playerId: string, clips: ClipData[]) {
    const player = await this.playerModel.findOne({ 
      $or: [
        { playerId: playerId },
        { playercode: playerId },
        { playercode: parseInt(playerId) }
      ]
    });
    if (!player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    if (player.position !== 'WR') {
      throw new Error('와이드 리시버가 아닙니다.');
    }

    // 클립 데이터에서 WR 스탯 추출 (DB 업데이트 안함)
    const wrStats = await this.wrStatsAnalyzer.analyzeWrStats(clips, playerId);

    return {
      success: true,
      message: 'WR 스탯 분석이 완료되었습니다.',
      analyzedStats: wrStats,
      clipCount: clips.length
    };
  }

  // 테스트용: 샘플 클립으로 WR 스탯 생성
  async generateSampleWrStats(playerId: string = 'WR001') {
    const sampleStats = await this.wrStatsAnalyzer.generateSampleWrStats(playerId);
    
    const player = await this.playerModel.findOne({ playerId });
    if (!player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    player.stats = { ...player.stats, ...sampleStats };
    await player.save();

    return {
      success: true,
      message: '샘플 WR 스탯이 생성되었습니다.',
      data: player,
      analyzedStats: sampleStats
    };
  }

  // TE 전용: 클립 데이터로 스탯 업데이트
  async updateTeStatsFromClips(playerId: string, clips: ClipData[]) {
    let player = await this.playerModel.findOne({ 
      $or: [
        { playerId: playerId },
        { playercode: playerId },
        { playercode: parseInt(playerId) }
      ]
    });
    
    if (!player) {
      // 기본 팀 생성 또는 조회
      let defaultTeam = await this.teamModel.findOne({ teamName: 'Default Team' });
      if (!defaultTeam) {
        defaultTeam = new this.teamModel({
          teamId: 'DEFAULT_TEAM',
          teamName: 'Default Team',
          ownerId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        });
        await defaultTeam.save();
      }

      // 선수가 존재하지 않으면 새로 생성
      player = new this.playerModel({
        playerId: playerId,
        name: `TE Player ${playerId}`,
        jerseyNumber: parseInt(playerId.toString().slice(-2)) || 87, // TE는 보통 80번대
        position: 'TE',
        league: '1부',
        season: '2024',
        teamId: defaultTeam._id,
        stats: {
          gamesPlayed: 0,
          totalYards: 0,
          totalTouchdowns: 0
        }
      });
      await player.save();
    }

    if (player.position !== 'TE') {
      throw new Error('타이트 엔드가 아닙니다.');
    }

    // 클립 데이터에서 TE 스탯 추출
    const teStats = await this.teStatsAnalyzer.analyzeTeStats(clips, playerId);

    // 선수 스탯 업데이트 (TE 스탯만)
    player.stats = { ...player.stats, ...teStats };
    await player.save();

    return {
      success: true,
      message: 'TE 스탯이 클립 데이터로부터 업데이트되었습니다.',
      data: player
    };
  }

  // TE 전용: 클립 데이터 분석만 (DB 업데이트 안함)
  async analyzeTeStatsOnly(playerId: string, clips: ClipData[]) {
    const player = await this.playerModel.findOne({ 
      $or: [
        { playerId: playerId },
        { playercode: playerId },
        { playercode: parseInt(playerId) }
      ]
    });
    if (!player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    if (player.position !== 'TE') {
      throw new Error('타이트 엔드가 아닙니다.');
    }

    // 클립 데이터에서 TE 스탯 추출 (DB 업데이트 안함)
    const teStats = await this.teStatsAnalyzer.analyzeTeStats(clips, playerId);

    return {
      success: true,
      message: 'TE 스탯 분석이 완료되었습니다.',
      analyzedStats: teStats,
      clipCount: clips.length
    };
  }

  // 테스트용: 샘플 클립으로 TE 스탯 생성
  async generateSampleTeStats(playerId: string = 'TE001') {
    const sampleStats = await this.teStatsAnalyzer.generateSampleTeStats(playerId);
    
    const player = await this.playerModel.findOne({ playerId });
    if (!player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    player.stats = { ...player.stats, ...sampleStats };
    await player.save();

    return {
      success: true,
      message: '샘플 TE 스탯이 생성되었습니다.',
      data: player,
      analyzedStats: sampleStats
    };
  }

  // Kicker 전용: 클립 데이터로 스탯 업데이트
  async updateKickerStatsFromClips(playerId: string, clips: ClipData[]) {
    let player = await this.playerModel.findOne({ 
      $or: [
        { playerId: playerId },
        { playercode: playerId },
        { playercode: parseInt(playerId) }
      ]
    });
    
    if (!player) {
      let defaultTeam = await this.teamModel.findOne({ teamName: 'Default Team' });
      if (!defaultTeam) {
        defaultTeam = new this.teamModel({
          teamId: 'DEFAULT_TEAM',
          teamName: 'Default Team',
          ownerId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        });
        await defaultTeam.save();
      }

      player = new this.playerModel({
        playerId: playerId,
        name: `Kicker Player ${playerId}`,
        jerseyNumber: parseInt(playerId.toString().slice(-2)) || 5,
        position: 'Kicker',
        league: '1부',
        season: '2024',
        teamId: defaultTeam._id,
        stats: {
          gamesPlayed: 0,
          totalYards: 0,
          totalTouchdowns: 0
        }
      });
      await player.save();
    }

    if (player.position !== 'Kicker') {
      throw new Error('키커가 아닙니다.');
    }

    const kickerStats = await this.kickerStatsAnalyzer.analyzeKickerStats(clips, playerId);
    player.stats = { ...player.stats, ...kickerStats };
    await player.save();

    return {
      success: true,
      message: 'Kicker 스탯이 클립 데이터로부터 업데이트되었습니다.',
      data: player
    };
  }

  async analyzeKickerStatsOnly(playerId: string, clips: ClipData[]) {
    const player = await this.playerModel.findOne({ 
      $or: [
        { playerId: playerId },
        { playercode: playerId },
        { playercode: parseInt(playerId) }
      ]
    });
    if (!player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    if (player.position !== 'Kicker') {
      throw new Error('키커가 아닙니다.');
    }

    const kickerStats = await this.kickerStatsAnalyzer.analyzeKickerStats(clips, playerId);

    return {
      success: true,
      message: 'Kicker 스탯 분석이 완료되었습니다.',
      analyzedStats: kickerStats,
      clipCount: clips.length
    };
  }

  async generateSampleKickerStats(playerId: string = 'K001') {
    const sampleStats = await this.kickerStatsAnalyzer.generateSampleKickerStats(playerId);
    
    const player = await this.playerModel.findOne({ playerId });
    if (!player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    player.stats = { ...player.stats, ...sampleStats };
    await player.save();

    return {
      success: true,
      message: '샘플 Kicker 스탯이 생성되었습니다.',
      data: player,
      analyzedStats: sampleStats
    };
  }

  // Punter 전용: 클립 데이터로 스탯 업데이트
  async updatePunterStatsFromClips(playerId: string, clips: ClipData[]) {
    let player = await this.playerModel.findOne({ 
      $or: [
        { playerId: playerId },
        { playercode: playerId },
        { playercode: parseInt(playerId) }
      ]
    });
    
    if (!player) {
      let defaultTeam = await this.teamModel.findOne({ teamName: 'Default Team' });
      if (!defaultTeam) {
        defaultTeam = new this.teamModel({
          teamId: 'DEFAULT_TEAM',
          teamName: 'Default Team',
          ownerId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        });
        await defaultTeam.save();
      }

      player = new this.playerModel({
        playerId: playerId,
        name: `Punter Player ${playerId}`,
        jerseyNumber: parseInt(playerId.toString().slice(-2)) || 8,
        position: 'Punter',
        league: '1부',
        season: '2024',
        teamId: defaultTeam._id,
        stats: {
          gamesPlayed: 0,
          totalYards: 0,
          totalTouchdowns: 0
        }
      });
      await player.save();
    }

    if (player.position !== 'Punter') {
      throw new Error('펀터가 아닙니다.');
    }

    const punterStats = await this.punterStatsAnalyzer.analyzePunterStats(clips, playerId);
    player.stats = { ...player.stats, ...punterStats };
    await player.save();

    return {
      success: true,
      message: 'Punter 스탯이 클립 데이터로부터 업데이트되었습니다.',
      data: player
    };
  }

  async analyzePunterStatsOnly(playerId: string, clips: ClipData[]) {
    const player = await this.playerModel.findOne({ 
      $or: [
        { playerId: playerId },
        { playercode: playerId },
        { playercode: parseInt(playerId) }
      ]
    });
    if (!player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    if (player.position !== 'Punter') {
      throw new Error('펀터가 아닙니다.');
    }

    const punterStats = await this.punterStatsAnalyzer.analyzePunterStats(clips, playerId);

    return {
      success: true,
      message: 'Punter 스탯 분석이 완료되었습니다.',
      analyzedStats: punterStats,
      clipCount: clips.length
    };
  }

  async generateSamplePunterStats(playerId: string = 'P001') {
    const sampleStats = await this.punterStatsAnalyzer.generateSamplePunterStats(playerId);
    
    const player = await this.playerModel.findOne({ playerId });
    if (!player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    player.stats = { ...player.stats, ...sampleStats };
    await player.save();

    return {
      success: true,
      message: '샘플 Punter 스탯이 생성되었습니다.',
      data: player,
      analyzedStats: sampleStats
    };
  }

  // OL 전용: 클립 데이터로 스탯 업데이트
  async updateOLStatsFromClips(playerId: string, clips: ClipData[]) {
    let player = await this.playerModel.findOne({ 
      $or: [
        { playerId: playerId },
        { playercode: playerId },
        { playercode: parseInt(playerId) }
      ]
    });
    
    if (!player) {
      let defaultTeam = await this.teamModel.findOne({ teamName: 'Default Team' });
      if (!defaultTeam) {
        defaultTeam = new this.teamModel({
          teamId: 'DEFAULT_TEAM',
          teamName: 'Default Team',
          ownerId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        });
        await defaultTeam.save();
      }

      player = new this.playerModel({
        playerId: playerId,
        name: `OL Player ${playerId}`,
        jerseyNumber: parseInt(playerId.toString().slice(-2)) || 75,
        position: 'OL',
        league: '1부',
        season: '2024',
        teamId: defaultTeam._id,
        stats: {
          gamesPlayed: 0,
          totalYards: 0,
          totalTouchdowns: 0
        }
      });
      await player.save();
    }

    if (player.position !== 'OL') {
      throw new Error('오펜시브 라인맨이 아닙니다.');
    }

    const olStats = await this.olStatsAnalyzer.analyzeOLStats(clips, playerId);
    player.stats = { ...player.stats, ...olStats };
    await player.save();

    return {
      success: true,
      message: 'OL 스탯이 클립 데이터로부터 업데이트되었습니다.',
      data: player
    };
  }

  async analyzeOLStatsOnly(playerId: string, clips: ClipData[]) {
    const player = await this.playerModel.findOne({ 
      $or: [
        { playerId: playerId },
        { playercode: playerId },
        { playercode: parseInt(playerId) }
      ]
    });
    if (!player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    if (player.position !== 'OL') {
      throw new Error('오펜시브 라인맨이 아닙니다.');
    }

    const olStats = await this.olStatsAnalyzer.analyzeOLStats(clips, playerId);

    return {
      success: true,
      message: 'OL 스탯 분석이 완료되었습니다.',
      analyzedStats: olStats,
      clipCount: clips.length
    };
  }

  async generateSampleOLStats(playerId: string = 'OL001') {
    const sampleStats = await this.olStatsAnalyzer.generateSampleOLStats(playerId);
    
    const player = await this.playerModel.findOne({ playerId });
    if (!player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    player.stats = { ...player.stats, ...sampleStats };
    await player.save();

    return {
      success: true,
      message: '샘플 OL 스탯이 생성되었습니다.',
      data: player,
      analyzedStats: sampleStats
    };
  }

  // DL 전용: 클립 데이터로 스탯 업데이트
  async updateDLStatsFromClips(playerId: string, clips: ClipData[]) {
    let player = await this.playerModel.findOne({ 
      $or: [
        { playerId: playerId },
        { playercode: playerId },
        { playercode: parseInt(playerId) }
      ]
    });
    
    if (!player) {
      let defaultTeam = await this.teamModel.findOne({ teamName: 'Default Team' });
      if (!defaultTeam) {
        defaultTeam = new this.teamModel({
          teamId: 'DEFAULT_TEAM',
          teamName: 'Default Team',
          ownerId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        });
        await defaultTeam.save();
      }

      player = new this.playerModel({
        playerId: playerId,
        name: `DL Player ${playerId}`,
        jerseyNumber: parseInt(playerId.toString().slice(-2)) || 95,
        position: 'DL',
        league: '1부',
        season: '2024',
        teamId: defaultTeam._id,
        stats: {
          gamesPlayed: 0,
          totalYards: 0,
          totalTouchdowns: 0
        }
      });
      await player.save();
    }

    if (player.position !== 'DL') {
      throw new Error('디펜시브 라인맨이 아닙니다.');
    }

    const dlStats = await this.dlStatsAnalyzer.analyzeDLStats(clips, playerId);
    player.stats = { ...player.stats, ...dlStats };
    await player.save();

    return {
      success: true,
      message: 'DL 스탯이 클립 데이터로부터 업데이트되었습니다.',
      data: player
    };
  }

  async analyzeDLStatsOnly(playerId: string, clips: ClipData[]) {
    const player = await this.playerModel.findOne({ 
      $or: [
        { playerId: playerId },
        { playercode: playerId },
        { playercode: parseInt(playerId) }
      ]
    });
    if (!player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    if (player.position !== 'DL') {
      throw new Error('디펜시브 라인맨이 아닙니다.');
    }

    const dlStats = await this.dlStatsAnalyzer.analyzeDLStats(clips, playerId);

    return {
      success: true,
      message: 'DL 스탯 분석이 완료되었습니다.',
      analyzedStats: dlStats,
      clipCount: clips.length
    };
  }

  async generateSampleDLStats(playerId: string = 'DL001') {
    const sampleStats = await this.dlStatsAnalyzer.generateSampleDLStats(playerId);
    
    const player = await this.playerModel.findOne({ playerId });
    if (!player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    player.stats = { ...player.stats, ...sampleStats };
    await player.save();

    return {
      success: true,
      message: '샘플 DL 스탯이 생성되었습니다.',
      data: player,
      analyzedStats: sampleStats
    };
  }

  // LB 전용: 클립 데이터로 스탯 업데이트
  async updateLBStatsFromClips(playerId: string, clips: ClipData[]) {
    let player = await this.playerModel.findOne({ 
      $or: [
        { playerId: playerId },
        { playercode: playerId },
        { playercode: parseInt(playerId) }
      ]
    });
    
    if (!player) {
      let defaultTeam = await this.teamModel.findOne({ teamName: 'Default Team' });
      if (!defaultTeam) {
        defaultTeam = new this.teamModel({
          teamId: 'DEFAULT_TEAM',
          teamName: 'Default Team',
          ownerId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        });
        await defaultTeam.save();
      }

      player = new this.playerModel({
        playerId: playerId,
        name: `LB Player ${playerId}`,
        jerseyNumber: parseInt(playerId.toString().slice(-2)) || 54,
        position: 'LB',
        league: '1부',
        season: '2024',
        teamId: defaultTeam._id,
        stats: {
          gamesPlayed: 0,
          totalYards: 0,
          totalTouchdowns: 0
        }
      });
      await player.save();
    }

    if (player.position !== 'LB') {
      throw new Error('라인백커가 아닙니다.');
    }

    const lbStats = await this.lbStatsAnalyzer.analyzeLBStats(clips, playerId);
    player.stats = { ...player.stats, ...lbStats };
    await player.save();

    return {
      success: true,
      message: 'LB 스탯이 클립 데이터로부터 업데이트되었습니다.',
      data: player
    };
  }

  async analyzeLBStatsOnly(playerId: string, clips: ClipData[]) {
    const player = await this.playerModel.findOne({ 
      $or: [
        { playerId: playerId },
        { playercode: playerId },
        { playercode: parseInt(playerId) }
      ]
    });
    if (!player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    if (player.position !== 'LB') {
      throw new Error('라인백커가 아닙니다.');
    }

    const lbStats = await this.lbStatsAnalyzer.analyzeLBStats(clips, playerId);

    return {
      success: true,
      message: 'LB 스탯 분석이 완료되었습니다.',
      analyzedStats: lbStats,
      clipCount: clips.length
    };
  }

  async generateSampleLBStats(playerId: string = 'LB001') {
    const sampleStats = await this.lbStatsAnalyzer.generateSampleLBStats(playerId);
    
    const player = await this.playerModel.findOne({ playerId });
    if (!player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    player.stats = { ...player.stats, ...sampleStats };
    await player.save();

    return {
      success: true,
      message: '샘플 LB 스탯이 생성되었습니다.',
      data: player,
      analyzedStats: sampleStats
    };
  }

  // DB 전용: 클립 데이터로 스탯 업데이트
  async updateDBStatsFromClips(playerId: string, clips: ClipData[]) {
    let player = await this.playerModel.findOne({ 
      $or: [
        { playerId: playerId },
        { playercode: playerId },
        { playercode: parseInt(playerId) }
      ]
    });
    
    if (!player) {
      let defaultTeam = await this.teamModel.findOne({ teamName: 'Default Team' });
      if (!defaultTeam) {
        defaultTeam = new this.teamModel({
          teamId: 'DEFAULT_TEAM',
          teamName: 'Default Team',
          ownerId: new Types.ObjectId('507f1f77bcf86cd799439011'),
        });
        await defaultTeam.save();
      }

      player = new this.playerModel({
        playerId: playerId,
        name: `DB Player ${playerId}`,
        jerseyNumber: parseInt(playerId.toString().slice(-2)) || 21,
        position: 'DB',
        league: '1부',
        season: '2024',
        teamId: defaultTeam._id,
        stats: {
          gamesPlayed: 0,
          totalYards: 0,
          totalTouchdowns: 0
        }
      });
      await player.save();
    }

    if (player.position !== 'DB') {
      throw new Error('디펜시브 백이 아닙니다.');
    }

    const dbStats = await this.dbStatsAnalyzer.analyzeDBStats(clips, playerId);
    player.stats = { ...player.stats, ...dbStats };
    await player.save();

    return {
      success: true,
      message: 'DB 스탯이 클립 데이터로부터 업데이트되었습니다.',
      data: player
    };
  }

  async analyzeDBStatsOnly(playerId: string, clips: ClipData[]) {
    const player = await this.playerModel.findOne({ 
      $or: [
        { playerId: playerId },
        { playercode: playerId },
        { playercode: parseInt(playerId) }
      ]
    });
    if (!player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    if (player.position !== 'DB') {
      throw new Error('디펜시브 백이 아닙니다.');
    }

    const dbStats = await this.dbStatsAnalyzer.analyzeDBStats(clips, playerId);

    return {
      success: true,
      message: 'DB 스탯 분석이 완료되었습니다.',
      analyzedStats: dbStats,
      clipCount: clips.length
    };
  }

  async generateSampleDBStats(playerId: string = 'DB001') {
    const sampleStats = await this.dbStatsAnalyzer.generateSampleDBStats(playerId);
    
    const player = await this.playerModel.findOne({ playerId });
    if (!player) {
      throw new NotFoundException('선수를 찾을 수 없습니다.');
    }

    player.stats = { ...player.stats, ...sampleStats };
    await player.save();

    return {
      success: true,
      message: '샘플 DB 스탯이 생성되었습니다.',
      data: player,
      analyzedStats: sampleStats
    };
  }

  // === 새로운 클립 구조 처리 메서드들 ===

  /**
   * 새로운 클립 구조로 선수 스탯 업데이트 (등번호 기반)
   */
  async updatePlayerStatsFromNewClips(playerNumber: number, newClips: NewClipDto[]) {
    // 등번호로 선수 찾기
    const player = await this.playerModel.findOne({ 
      jerseyNumber: playerNumber 
    });
    
    if (!player) {
      throw new NotFoundException(`등번호 ${playerNumber}번 선수를 찾을 수 없습니다.`);
    }

    // 새로운 클립 구조를 기존 구조로 변환
    const legacyClips = this.clipAdapter.convertNewClipsToLegacy(newClips);
    
    // 해당 선수의 클립만 필터링
    const filteredLegacyClips = legacyClips.filter(clip => 
      clip.Carrier?.some(c => 
        c.backnumber === playerNumber || 
        c.playercode === playerNumber.toString()
      )
    );

    // LegacyClipData를 ClipData로 변환
    const playerClips = this.clipAdapter.convertLegacyArrayToClipData(filteredLegacyClips);

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
        analyzedStats = await this.qbStatsAnalyzer.analyzeQbStats(playerClips, player.playerId);
        break;
      case 'RB':
        analyzedStats = await this.rbStatsAnalyzer.analyzeRbStats(playerClips, player.playerId);
        break;
      case 'WR':
        analyzedStats = await this.wrStatsAnalyzer.analyzeWrStats(playerClips, player.playerId);
        break;
      case 'TE':
        analyzedStats = await this.teStatsAnalyzer.analyzeTeStats(playerClips, player.playerId);
        break;
      case 'Kicker':
        analyzedStats = await this.kickerStatsAnalyzer.analyzeKickerStats(playerClips, player.playerId);
        break;
      case 'Punter':
        analyzedStats = await this.punterStatsAnalyzer.analyzePunterStats(playerClips, player.playerId);
        break;
      case 'OL':
        analyzedStats = await this.olStatsAnalyzer.analyzeOLStats(playerClips, player.playerId);
        break;
      case 'DL':
        analyzedStats = await this.dlStatsAnalyzer.analyzeDLStats(playerClips, player.playerId);
        break;
      case 'LB':
        analyzedStats = await this.lbStatsAnalyzer.analyzeLBStats(playerClips, player.playerId);
        break;
      case 'DB':
        analyzedStats = await this.dbStatsAnalyzer.analyzeDBStats(playerClips, player.playerId);
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
   * 새로운 클립 구조 분석만 (DB 업데이트 없이)
   */
  async analyzeNewClipsOnly(playerNumber: number, newClips: NewClipDto[]) {
    // 등번호로 선수 찾기
    const player = await this.playerModel.findOne({ 
      jerseyNumber: playerNumber 
    });
    
    if (!player) {
      throw new NotFoundException(`등번호 ${playerNumber}번 선수를 찾을 수 없습니다.`);
    }

    // 새로운 클립에서 해당 선수의 플레이 찾기
    const playerClips: any[] = [];
    
    newClips.forEach(clip => {
      const playerInfo = this.clipAdapter.findPlayerByNumber(clip, playerNumber);
      if (playerInfo) {
        // 새로운 구조에서 직접 스탯 추출
        const stats = this.clipAdapter.extractStatsFromNewClip(clip, playerNumber);
        if (stats) {
          playerClips.push({
            clipKey: clip.clipKey,
            playType: stats.playType,
            yards: stats.yards,
            position: stats.position,
            role: playerInfo.role,
            significantPlays: stats.significantPlays
          });
        }
      }
    });

    if (playerClips.length === 0) {
      return {
        success: false,
        message: `등번호 ${playerNumber}번 선수의 플레이가 클립에서 발견되지 않았습니다.`,
        player: {
          name: player.name,
          position: player.position,
          jerseyNumber: player.jerseyNumber
        },
        analyzedClips: []
      };
    }

    return {
      success: true,
      message: `등번호 ${playerNumber}번 ${player.position} 선수의 새로운 클립 분석이 완료되었습니다.`,
      player: {
        name: player.name,
        position: player.position,
        jerseyNumber: player.jerseyNumber
      },
      analyzedClips: playerClips,
      totalClips: newClips.length,
      playerClips: playerClips.length
    };
  }

  /**
   * 게임 전체 데이터로 여러 선수 스탯 업데이트
   */
  async updateGameStats(gameData: { Clips: NewClipDto[] }) {
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

    return {
      success: true,
      message: `게임 데이터 처리 완료: ${successCount}명의 선수 스탯 업데이트`,
      totalPlayers: processedPlayers.size,
      successfulUpdates: successCount,
      totalClips: totalClips,
      results: results
    };
  }
}