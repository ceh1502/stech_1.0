const mongoose = require('mongoose');
const Video = require('../models/Video');
const Game = require('../models/Game');
const Team = require('../models/Team');
const Player = require('../models/player');
const { uploadToS3, deleteFromS3 } = require('../utils/s3Upload');
const { v4: uuidv4 } = require('uuid');

const uploadVideo = async (req, res) => {
  try {
    const { 
      // 프론트랑 비디오 업로드 되는지 확인용을 잠시 비활성화
      /*gameId, 
      quarter, 
      playType, 
      success, 
      startYard, 
      endYard, 
      gainedYard, 
      players, 
      significantPlays*/ 
      title,
      description
    } = req.body;


    /* 임시로 gameID 체크 제거 (태스트용)
    // 경기 존재 여부 확인
    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: '경기를 찾을 수 없습니다.'
      });
    } */

    // S3에 파일 업로드
    const uploadResult = await uploadToS3(req.file);
    if (!uploadResult.success) {
      return res.status(500).json({
        success: false,
        message: '파일 업로드에 실패했습니다.'
      });
    }

    // 고유한 비디오 ID 생성
    const videoId = `vid_${uuidv4().substring(0, 8)}`;

    // 새 비디오 객체 생성
    const newVideo = new Video({
      /*videoId,
      url: uploadResult.url,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      quarter,
      playType,
      success: success === 'true',
      startYard: JSON.parse(startYard),
      endYard: JSON.parse(endYard),
      gainedYard: parseInt(gainedYard),
      players: JSON.parse(players || '[]'),
      significantPlays: JSON.parse(significantPlays || '[]'),
      gameId*/
      videoId,
      url: uploadResult.url,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      title,
      description,
      // 올바른 기본값들
      quarter: "1Q",
      playType: "Run",  // ✅ enum 값
      success: true,
      startYard: {
        side: "own",     // ✅ required 
        yard: 0
      },
      endYard: {
        side: "own",     // ✅ required
        yard: 0
      },
      gainedYard: 0,
      players: [],
      significantPlays: [],
      gameId: new mongoose.Types.ObjectId(),
      
    });

    // 데이터베이스에 저장
    await newVideo.save();

    res.status(201).json({
      success: true,
      message: '영상이 성공적으로 업로드되었습니다.',
      data: newVideo
    });

  } catch (error) {
    console.error('영상 업로드 오류:', error);
    res.status(500).json({
      success: false,
      message: '영상 업로드 중 오류가 발생했습니다.'
    });
  }
};

const getVideo = async (req, res) => {
  try {
    const { videoId } = req.params;

    // 비디오 조회 (게임 및 팀 정보 포함)
    const video = await Video.findOne({ videoId }).populate({
      path: 'gameId',
      populate: {
        path: 'teamId',
        select: 'teamName logoUrl'
      }
    });

    if (!video) {
      return res.status(404).json({
        success: false,
        message: '영상을 찾을 수 없습니다.'
      });
    }

    res.status(200).json({
      success: true,
      data: video
    });

  } catch (error) {
    console.error('영상 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '영상 조회 중 오류가 발생했습니다.'
    });
  }
};

const getGameVideos = async (req, res) => {
  try {
    const { gameId } = req.params;

    // 특정 경기의 모든 영상 조회 (최신순)
    const videos = await Video.find({ gameId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: videos
    });

  } catch (error) {
    console.error('경기 영상 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '경기 영상 조회 중 오류가 발생했습니다.'
    });
  }
};

const deleteVideo = async (req, res) => {
  try {
    const { videoId } = req.params;

    // 비디오 존재 여부 확인
    const video = await Video.findOne({ videoId });
    if (!video) {
      return res.status(404).json({
        success: false,
        message: '영상을 찾을 수 없습니다.'
      });
    }

    // S3에서 파일 삭제
    const s3Key = video.url.split('/').pop();
    await deleteFromS3(`videos/${s3Key}`);

    // 데이터베이스에서 비디오 삭제
    await Video.findOneAndDelete({ videoId });

    res.status(200).json({
      success: true,
      message: '영상이 성공적으로 삭제되었습니다.'
    });

  } catch (error) {
    console.error('영상 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '영상 삭제 중 오류가 발생했습니다.'
    });
  }
};

// 팀의 전체 데이터 조회 (JSON 형식에 맞춰)
const getTeamCompleteData = async (req, res) => {
  try {
    const { teamId } = req.params;

    // 팀 기본 정보 조회
    const team = await Team.findOne({ teamId });
    if (!team) {
      return res.status(404).json({
        success: false,
        message: '팀을 찾을 수 없습니다.'
      });
    }

    // 팀의 선수들 조회
    const players = await Player.find({ teamId });

    // 팀의 경기들 조회
    const games = await Game.find({ teamId });

    // 각 경기의 영상들 조회
    const gamesWithVideos = await Promise.all(
      games.map(async (game) => {
        const videos = await Video.find({ gameId: game._id });
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
        createdAt: team.createdAt
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('팀 데이터 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '팀 데이터 조회 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  uploadVideo,
  getVideo,
  getGameVideos,
  deleteVideo,
  getTeamCompleteData
};