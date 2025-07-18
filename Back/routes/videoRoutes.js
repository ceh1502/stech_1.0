const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { uploadMiddleware } = require('../middleware/fileUpload');
const {
    uploadVideo,
    getVideo,
    getGameVideos,
    deleteVideo
} = require('../controllers/videoController');

// 영상 업로드 (파일 업로드 미들웨어 + 인증)
router.post('/upload', authenticateToken, uploadMiddleware, uploadVideo);

// 영상 상세 조회
router.get('/:videoId', getVideo);

// 영상 삭제
router.delete('/:videoId', authenticateToken, deleteVideo);

// 경기별 영상 조회
router.get('/game/:gameId', getGameVideos);

module.exports = router;