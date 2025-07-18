// AWS SDK 및 필요한 모듈 가져오기
  const AWS = require('aws-sdk');
  const { v4: uuidv4 } = require('uuid');
  const path = require('path');

  // AWS S3 설정
  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  });

  // S3에 파일 업로드하는 함수
  const uploadToS3 = async (file, folder = 'videos') => {
    try {
      // 고유한 파일명 생성 (UUID + 원본 확장자)
      const fileExtension = path.extname(file.originalname);
      const fileName = `${uuidv4()}${fileExtension}`;
      const key = `${folder}/${fileName}`;

      // S3 업로드 파라미터 설정
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read'  // 공개 읽기 권한
      };

      // S3에 파일 업로드 실행
      const result = await s3.upload(params).promise();

      return {
        success: true,
        url: result.Location,     // 파일 URL
        key: result.Key,          // S3 키
        bucket: result.Bucket,    // 버킷 이름
        fileName: fileName        // 생성된 파일명
      };
    } catch (error) {
      console.error('S3 업로드 오류:', error);
      return {
        success: false,
        error: error.message
      };
    }
  };

  // S3에서 파일 삭제하는 함수
  const deleteFromS3 = async (key) => {
    try {
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
      };

      await s3.deleteObject(params).promise();
      return { success: true };
    } catch (error) {
      console.error('S3 삭제 오류:', error);
      return { success: false, error: error.message };
    }
  };

  module.exports = { uploadToS3, deleteFromS3 };