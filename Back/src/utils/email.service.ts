import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // 이메일 전송 설정 (Gmail 사용)
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Gmail 계정
        pass: process.env.EMAIL_PASS  // Gmail 앱 비밀번호
      }
    });
  }

  // 인증 토큰 생성
  generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // 인증 이메일 발송
  async sendVerificationEmail(email: string, token: string, name?: string): Promise<boolean> {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}&email=${email}`;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'STECH Pro 회원가입 인증',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 10px;">
            <h1>🏈 STECH Pro</h1>
            <p>미식축구 전문 플랫폼에 오신 것을 환영합니다!</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa; border-radius: 10px; margin-top: 20px;">
            <h2>안녕하세요, ${name || '사용자'}님!</h2>
            <p>STechPro 회원가입을 완료하려면 아래 버튼을 클릭해주세요.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background: #667eea; color: white; padding: 15px 30px; 
                        text-decoration: none; border-radius: 5px; font-weight: bold;">
                이메일 인증하기
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              만약 버튼이 작동하지 않으면 아래 링크를 복사해서 브라우저에 붙여넣어주세요:<br>
              <a href="${verificationUrl}">${verificationUrl}</a>
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              이 링크는 24시간 후에 만료됩니다.
            </p>
          </div>
        </div>
      `
    };
    
    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`인증 이메일 발송 성공: ${email}`);
      return true;
    } catch (error) {
      console.error('이메일 발송 실패:', error);
      return false;
    }
  }
}