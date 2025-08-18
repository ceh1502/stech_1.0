import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class S3UploadService {
  private s3: AWS.S3;

  constructor() {
    // AWS S3 설정
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'ap-northeast-2'
    });
  }

  // S3에 파일 업로드하는 함수
  async uploadToS3(file: Express.Multer.File, folder = 'videos') {
    try {
      // AWS 설정 확인
      if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_BUCKET_NAME) {
        return {
          success: false,
          error: 'AWS 설정이 완료되지 않았습니다.'
        };
      }

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
      const result = await this.s3.upload(params).promise();

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
  }

  // S3에서 파일 삭제하는 함수
  async deleteFromS3(key: string) {
    try {
      const params = {
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key
      };

      await this.s3.deleteObject(params).promise();
      return { success: true };
    } catch (error) {
      console.error('S3 삭제 오류:', error);
      return { success: false, error: error.message };
    }
  }
}