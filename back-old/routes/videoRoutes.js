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

  /**
   * @swagger
   * components:
   *   schemas:
   *     Video:
   *       type: object
   *       properties:
   *         videoId:
   *           type: string
   *           description: 비디오 고유 ID
   *         url:
   *           type: string
   *           description: S3 비디오 URL
   *         fileName:
   *           type: string
   *           description: 원본 파일명
   *         fileSize:
   *           type: number
   *           description: 파일 크기
   *         title:
   *           type: string
   *           description: 제목
   *         description:
   *           type: string
   *           description: 설명
   *         createdAt:
   *           type: string
   *           format: date-time
   *           description: 생성 시간
   */

  /**
   * @swagger
   * /api/video/upload:
   *   post:
   *     summary: 영상 업로드
   *     tags: [Video]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             properties:
   *               video:
   *                 type: string
   *                 format: binary
   *                 description: 업로드할 비디오 파일
   *               title:
   *                 type: string
   *                 description: 영상 제목
   *               description:
   *                 type: string
   *                 description: 영상 설명
   *             required:
   *               - video
   *               - title
   *     responses:
   *       201:
   *         description: 영상 업로드 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *                 data:
   *                   $ref: '#/components/schemas/Video'
   *       400:
   *         description: 잘못된 요청
   *       401:
   *         description: 인증 실패
   *       500:
   *         description: 서버 오류
   */
  router.post('/upload', authenticateToken, uploadMiddleware, uploadVideo);

  /**
   * @swagger
   * /api/video/{videoId}:
   *   get:
   *     summary: 특정 영상 조회
   *     tags: [Video]
   *     parameters:
   *       - in: path
   *         name: videoId
   *         required: true
   *         schema:
   *           type: string
   *         description: 비디오 ID
   *     responses:
   *       200:
   *         description: 영상 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   $ref: '#/components/schemas/Video'
   *       404:
   *         description: 영상을 찾을 수 없음
   *       500:
   *         description: 서버 오류
   */
  router.get('/:videoId', getVideo);

  /**
   * @swagger
   * /api/video/{videoId}:
   *   delete:
   *     summary: 영상 삭제
   *     tags: [Video]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: videoId
   *         required: true
   *         schema:
   *           type: string
   *         description: 비디오 ID
   *     responses:
   *       200:
   *         description: 영상 삭제 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 message:
   *                   type: string
   *       401:
   *         description: 인증 실패
   *       404:
   *         description: 영상을 찾을 수 없음
   *       500:
   *         description: 서버 오류
   */
  router.delete('/:videoId', authenticateToken, deleteVideo);

  /**
   * @swagger
   * /api/video/game/{gameId}:
   *   get:
   *     summary: 특정 경기의 모든 영상 조회
   *     tags: [Video]
   *     parameters:
   *       - in: path
   *         name: gameId
   *         required: true
   *         schema:
   *           type: string
   *         description: 경기 ID
   *     responses:
   *       200:
   *         description: 경기 영상 조회 성공
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 success:
   *                   type: boolean
   *                 data:
   *                   type: array
   *                   items:
   *                     $ref: '#/components/schemas/Video'
   *       500:
   *         description: 서버 오류
   */
  router.get('/game/:gameId', getGameVideos);

  module.exports = router;