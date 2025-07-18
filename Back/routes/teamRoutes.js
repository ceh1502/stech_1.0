const express = require('express');
  const router = express.Router();
  const { authenticateToken } = require('../middleware/auth');
  const {
    createTeam,
    getTeam,
    getMyTeams,
    updateTeam,
    deleteTeam
  } = require('../controllers/teamController');

  // 팀 생성
  router.post('/', authenticateToken, createTeam);

  // 내가 만든 팀들 조회
  router.get('/my', authenticateToken, getMyTeams);

  // 특정 팀 조회
  router.get('/:teamId', getTeam);

  // 팀 정보 수정
  router.put('/:teamId', authenticateToken, updateTeam);

  // 팀 삭제
  router.delete('/:teamId', authenticateToken, deleteTeam);

  module.exports = router;