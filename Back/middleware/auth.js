const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: '접근 권한이 없습니다. 토큰이 필요합니다.'
            });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: '유효하지 않은 토큰입니다.'
            });
        }
        
        if (!user.isEmailVerified) {
            return res.status(401).json({
                success: false,
                message: '이메일 인증이 필요합니다.'
            });
        }
        
        req.user = user;
        next();
    } catch (error) {
        console.error('토큰 검증 실패:', error);
        res.status(401).json({
            success: false,
            message: '유효하지 않은 토큰입니다.'
        });
    }
};

module.exports = { authenticateToken };
