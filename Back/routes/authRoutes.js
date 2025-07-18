const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateVerificationToken, sendVerificationEmail } = require('../utils/emailService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
const { verifyEmail } = require('../controllers/authController');


/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: 사용자 이메일
 *         password:
 *           type: string
 *           minLength: 6
 *           description: 사용자 비밀번호
 *         name:
 *           type: string
 *           description: 사용자 이름
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *     ApiResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         message:
 *           type: string
 *         data:
 *           type: object
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: 회원가입
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *           example:
 *             email: "user@example.com"
 *             password: "password123"
 *             name: "홍길동"
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: true
 *               message: "회원가입이 완료되었습니다. 이메일을 확인해주세요."
 *               data:
 *                 email: "user@example.com"
 *                 name: "홍길동"
 *                 emailVerificationRequired: true
 *       400:
 *         description: 잘못된 요청
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: 로그인
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: "user@example.com"
 *             password: "password123"
 *     responses:
 *       200:
 *         description: 로그인 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *             example:
 *               success: true
 *               message: "로그인 성공"
 *               data:
 *                 token: "eyJhbGciOiJIUzI1NiIs..."
 *                 user:
 *                   id: "64a1b2c3d4e5f6789"
 *                   email: "user@example.com"
 *                   name: "홍길동"
 *       400:
 *         description: 로그인 실패
 */

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: 이메일 인증
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - email
 *             properties:
 *               token:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *           example:
 *             token: "abc123def456..."
 *             email: "user@example.com"
 *     responses:
 *       200:
 *         description: 이메일 인증 성공
 *       400:
 *         description: 인증 실패
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: 현재 사용자 정보 조회
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 정보 조회 성공
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       401:
 *         description: 인증 필요
 */

// 회원가입 (이메일 인증 추가)
router.post('/signup', async (req, res) => {
    try {
        const { email, password, name, firstName, lastName } = req.body;

        // firstName과 lastName이 있으면 name 생성
        const fullName = name || `${firstName || ''} ${lastName || ''}`.trim();

        // 검증 로직
        if (!email || !password || !fullName) {
            return res.status(400).json({
                success: false,
                message: '모든 필드를 입력해주세요.'
            });
        }
        
        // 이메일 중복 확인
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: '이미 등록된 이메일입니다.'
            });
        }
        
        // 인증 토큰 생성
        const verificationToken = generateVerificationToken();
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24시간
        
        // 사용자 생성
        const user = new User({
            email,
            password,
            name: fullName,
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires
        });
        
        await user.save();
        
        // 인증 이메일 발송
        const emailSent = await sendVerificationEmail(email, verificationToken, name);
        
        if (emailSent) {
            res.status(201).json({
                success: true,
                message: '회원가입이 완료되었습니다. 이메일을 확인해주세요.',
                data: {
                    email: user.email,
                    name: user.name,
                    emailVerificationRequired: true
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: '이메일 발송에 실패했습니다. 잠시 후 다시 시도해주세요.'
            });
        }
        
    } catch (error) {
        console.error('회원가입 에러:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 이메일 인증 확인
router.post('/verify-email', async (req, res) => {
    try {
        const { token, email } = req.body;
        
        if (!token || !email) {
            return res.status(400).json({
                success: false,
                message: '토큰과 이메일이 필요합니다.'
            });
        }
        
        const user = await User.findOne({
            email,
            emailVerificationToken: token,
            emailVerificationExpires: { $gt: Date.now() }
        });
        
        if (!user) {
            return res.status(400).json({
                success: false,
                message: '유효하지 않거나 만료된 인증 토큰입니다.'
            });
        }
        
        // 이메일 인증 완료
        user.isEmailVerified = true;
        user.emailVerificationToken = null;
        user.emailVerificationExpires = null;
        await user.save();
        
        // JWT 토큰 생성
        const jwtToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            message: '이메일 인증이 완료되었습니다.',
            data: {
                token: jwtToken,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    isEmailVerified: user.isEmailVerified
                }
            }
        });
        
    } catch (error) {
        console.error('이메일 인증 에러:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 로그인 (이메일 인증 확인 추가)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: '이메일과 비밀번호를 입력해주세요.'
            });
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: '등록되지 않은 이메일입니다.'
            });
        }
        
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: '비밀번호가 올바르지 않습니다.'
            });
        }
        
        // 이메일 인증 확인
        if (!user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: '이메일 인증이 필요합니다. 인증 이메일을 확인해주세요.',
                emailVerificationRequired: true
            });
        }
        
        const token = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            message: '로그인 성공',
            data: {
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    isEmailVerified: user.isEmailVerified
                }
            }
        });
        
    } catch (error) {
        console.error('로그인 에러:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 현재 사용자 정보 조회
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        
        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    name: user.name,
                    isEmailVerified: user.isEmailVerified,
                    profile: user.profile,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt
                }
            }
        });
        
    } catch (error) {
        console.error('사용자 정보 조회 에러:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

// 인증 이메일 재발송
router.post('/resend-verification', async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: '이메일을 입력해주세요.'
            });
        }
        
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: '등록되지 않은 이메일입니다.'
            });
        }
        
        if (user.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: '이미 인증된 이메일입니다.'
            });
        }
        
        // 새로운 인증 토큰 생성
        const verificationToken = generateVerificationToken();
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        
        user.emailVerificationToken = verificationToken;
        user.emailVerificationExpires = verificationExpires;
        await user.save();
        
        // 인증 이메일 발송
        const emailSent = await sendVerificationEmail(email, verificationToken, user.name);
        
        if (emailSent) {
            res.json({
                success: true,
                message: '인증 이메일이 재발송되었습니다.'
            });
        } else {
            res.status(500).json({
                success: false,
                message: '이메일 발송에 실패했습니다.'
            });
        }
        
    } catch (error) {
        console.error('이메일 재발송 에러:', error);
        res.status(500).json({
            success: false,
            message: '서버 오류가 발생했습니다.'
        });
    }
});

module.exports = router;
