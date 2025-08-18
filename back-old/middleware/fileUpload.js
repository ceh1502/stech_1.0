// multer 라이브러리 가져오기 (파일 업로드 처리)
const multer = require('multer');
const path = require('path');

// 파일 필터링 함수 (어떤 파일을 허용할지 결정)
const fileFilter = (req, file, cb) => {
  // 허용되는 동영상 형식들 (기본값 설정)
  const allowedTypes = (process.env.ALLOWED_VIDEO_TYPES || 'video/mp4,video/avi,video/mov,video/quicktime').split(',');

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);  // 파일 허용
  } else {
    cb(new Error('허용되지 않는 파일 형식입니다. MP4, AVI, MOV, QuickTime만 업로드 가능합니다.'), false);
  }
};

// 파일 크기 및 형식 제한 설정
const upload = multer({
  storage: multer.memoryStorage(),  // 메모리에 임시 저장 (S3로 바로 전송)
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100000000  // 최대 100MB
  },
  fileFilter: fileFilter
});

// 단일 파일 업로드 미들웨어
const uploadSingle = upload.single('video');

// 에러 처리가 포함된 업로드 미들웨어
const uploadMiddleware = (req, res, next) => {
  uploadSingle(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // multer 관련 에러 처리
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: '파일 크기가 너무 큽니다. 최대 100MB까지 업로드 가능합니다.'
        });
      }
      return res.status(400).json({
        success: false,
        message: '파일 업로드 중 오류가 발생했습니다.'
      });
    } else if (err) {
      // 파일 형식 에러 등 기타 에러
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }

    // 파일이 업로드되지 않은 경우
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '업로드할 파일이 없습니다.'
      });
    }

    next();  // 다음 미들웨어로 이동
  });
};

module.exports = {uploadMiddleware};