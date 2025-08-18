import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Video, VideoDocument } from '../schemas/video.schema';
import { Game, GameDocument } from '../schemas/game.schema';
import { Team, TeamDocument } from '../schemas/team.schema';
import { Player, PlayerDocument } from '../schemas/player.schema';

@Injectable()
export class VideoService {
  constructor(
    @InjectModel(Video.name) private videoModel: Model<VideoDocument>,
    @InjectModel(Game.name) private gameModel: Model<GameDocument>,
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
  ) {}

  async uploadVideo(file: Express.Multer.File, uploadResult: any, title?: string, description?: string) {
    // 고유한 비디오 ID 생성
    const videoId = `vid_${uuidv4().substring(0, 8)}`;

    // 새 비디오 객체 생성 (임시 데이터로)
    const newVideo = new this.videoModel({
      videoId,
      url: uploadResult.url,
      fileName: file.originalname,
      fileSize: file.size,
      // 기본값들
      quarter: "1Q",
      playType: "Run",
      success: true,
      startYard: {
        side: "own",
        yard: 0
      },
      endYard: {
        side: "own",
        yard: 0
      },
      gainedYard: 0,
      players: [],
      significantPlays: [],
      gameId: new Types.ObjectId(),
    });

    await newVideo.save();

    return {
      success: true,
      message: '영상이 성공적으로 업로드되었습니다.',
      data: newVideo
    };
  }

  async getVideo(videoId: string) {
    // 비디오 조회 (게임 및 팀 정보 포함)
    const video = await this.videoModel.findOne({ videoId }).populate({
      path: 'gameId',
      populate: {
        path: 'teamId',
        select: 'teamName logoUrl'
      }
    });

    if (!video) {
      throw new NotFoundException('영상을 찾을 수 없습니다.');
    }

    return {
      success: true,
      data: video
    };
  }

  async getGameVideos(gameId: string) {
    // 특정 경기의 모든 영상 조회 (최신순)
    const videos = await this.videoModel.find({ gameId }).sort({ createdAt: -1 });

    return {
      success: true,
      data: videos
    };
  }

  async deleteVideo(videoId: string) {
    // 비디오 존재 여부 확인
    const video = await this.videoModel.findOne({ videoId });
    if (!video) {
      throw new NotFoundException('영상을 찾을 수 없습니다.');
    }

    // 데이터베이스에서 비디오 삭제
    await this.videoModel.findOneAndDelete({ videoId });

    return {
      success: true,
      message: '영상이 성공적으로 삭제되었습니다.'
    };
  }

  async getTeamCompleteData(teamId: string) {
    // 팀 기본 정보 조회
    const team = await this.teamModel.findOne({ teamId });
    if (!team) {
      throw new NotFoundException('팀을 찾을 수 없습니다.');
    }

    // 팀의 선수들 조회
    const players = await this.playerModel.find({ teamId: team._id });

    // 팀의 경기들 조회
    const games = await this.gameModel.find({ teamId: team._id });

    // 각 경기의 영상들 조회
    const gamesWithVideos = await Promise.all(
      games.map(async (game) => {
        const videos = await this.videoModel.find({ gameId: game._id });
        return {
          gameId: game.gameId,
          date: game.date,
          opponent: game.opponent,
          type: game.type,
          clips: videos // JSON 형식에 맞춰 clips로 명명
        };
      })
    );

    // JSON 형식에 맞춰 응답 구성
    const response = {
      team: {
        teamId: team.teamId,
        teamName: team.teamName,
        logoUrl: team.logoUrl,
        players: players,
        games: gamesWithVideos,
        createdAt: (team as any).createdAt
      }
    };

    return response;
  }
}