// 필요한 모델들 가져오기
const Team = require('../models/Team');
const Player = require('../models/player');
const { v4: uuidv4 } = require('uuid');

/**
   * @swagger
   * /api/team:
   *   post:
   *     summary: 팀 생성
   *     tags: [Team]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               teamName:
   *                 type: string
   *                 example: "Lions"
   *               logoUrl:
   *                 type: string
   *                 example: "/images/lions.png"
   *     responses:
   *       201:
   *         description: 팀 생성 성공
   */

// 팀 생성
const createTeam = async (req, res) => {
  try {
    const { teamName, logoUrl } = req.body;
    const ownerId = req.user._id; // 인증된 사용자 ID

    // 팀 ID 자동 생성
    const teamId = `team_${uuidv4().substring(0, 8)}`;

    // 새 팀 생성
    const newTeam = new Team({
      teamId,
      teamName,
      logoUrl,
      ownerId
    });

    await newTeam.save();

    res.status(201).json({
      success: true,
      message: '팀이 성공적으로 생성되었습니다.',
      data: newTeam
    });
  } catch (error) {
    console.error('팀 생성 오류:', error);
    res.status(500).json({
      success: false,
      message: '팀 생성 중 오류가 발생했습니다.'
    });
  }
};

/**
   * @swagger
   * /api/team/{teamId}:
   *   get:
   *     summary: 팀 조회
   *     tags: [Team]
   *     parameters:
   *       - in: path
   *         name: teamId
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: 팀 조회 성공
   */



// 팀 조회 (선수 정보 포함)
const getTeam = async (req, res) => {
  try {
    const { teamId } = req.params;

    // 팀 정보와 선수들을 함께 조회
    const team = await Team.findOne({ teamId }).populate('ownerId', 'name email');
    if (!team) {
      return res.status(404).json({
        success: false,
        message: '팀을 찾을 수 없습니다.'
      });
    }

    // 해당 팀의 선수들 조회
    const players = await Player.find({ teamId: team._id });

    res.status(200).json({
      success: true,
      data: {
        ...team.toObject(),
        players
      }
    });
  } catch (error) {
    console.error('팀 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '팀 조회 중 오류가 발생했습니다.'
    });
  }
};
 /**
   * @swagger
   * /api/team/my:
   *   get:
   *     summary: 내 팀 목록 조회
   *     tags: [Team]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: 내 팀 목록 조회 성공
   *       401:
   *         description: 인증 필요
   */

// 내가 만든 팀들 조회
const getMyTeams = async (req, res) => {
  try {
    const ownerId = req.user._id;

    const teams = await Team.find({ ownerId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: teams
    });
  } catch (error) {
    console.error('내 팀 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '팀 목록 조회 중 오류가 발생했습니다.'
    });
  }
};

/**
   * @swagger
   * /api/team/{teamId}:
   *   put:
   *     summary: 팀 정보 수정
   *     tags: [Team]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: teamId
   *         required: true
   *         schema:
   *           type: string
   *         example: "team_50f4fae6"
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               teamName:
   *                 type: string
   *                 example: "Updated Lions"
   *               logoUrl:
   *                 type: string
   *                 example: "/images/new-logo.png"
   *     responses:
   *       200:
   *         description: 팀 정보 수정 성공
   *       403:
   *         description: 권한 없음
   *       404:
   *         description: 팀을 찾을 수 없음
   */

// 팀 수정
const updateTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { teamName, logoUrl } = req.body;
    const ownerId = req.user._id;

    // 팀 찾기 및 권한 확인
    const team = await Team.findOne({ teamId });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: '팀을 찾을 수 없습니다.'
      });
    }

    // 팀 소유자 확인
    if (team.ownerId.toString() !== ownerId) {
      return res.status(403).json({
        success: false,
        message: '팀을 수정할 권한이 없습니다.'
      });
    }

    // 팀 정보 업데이트
    const updatedTeam = await Team.findOneAndUpdate(
      { teamId },
      { teamName, logoUrl },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: '팀 정보가 성공적으로 수정되었습니다.',
      data: updatedTeam
    });
  } catch (error) {
    console.error('팀 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '팀 수정 중 오류가 발생했습니다.'
    });
  }
};

/**
   * @swagger
   * /api/team/{teamId}:
   *   delete:
   *     summary: 팀 삭제
   *     tags: [Team]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: teamId
   *         required: true
   *         schema:
   *           type: string
   *         example: "team_50f4fae6"
   *     responses:
   *       200:
   *         description: 팀 삭제 성공
   *       403:
   *         description: 권한 없음
   *       404:
   *         description: 팀을 찾을 수 없음
   */

// 팀 삭제
const deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const ownerId = req.user._id;

    // 팀 찾기 및 권한 확인
    const team = await Team.findOne({ teamId });

    if (!team) {
      return res.status(404).json({
        success: false,
        message: '팀을 찾을 수 없습니다.'
      });
    }

    // 팀 소유자 확인
    if (team.ownerId.toString() !== ownerId) {
      return res.status(403).json({
        success: false,
        message: '팀을 삭제할 권한이 없습니다.'
      });
    }

    // 관련 선수들도 함께 삭제
    await Player.deleteMany({ teamId: team._id });

    // 팀 삭제
    await Team.findOneAndDelete({ teamId });

    res.status(200).json({
      success: true,
      message: '팀이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('팀 삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '팀 삭제 중 오류가 발생했습니다.'
    });
  }
};

module.exports = {
  createTeam,
  getTeam,
  getMyTeams,
  updateTeam,
  deleteTeam
};

