import { Injectable, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User, UserDocument } from '../schemas/user.schema';
import { SignupDto, LoginDto, VerifyEmailDto } from '../common/dto/auth.dto';
import { EmailService } from '../utils/email.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { email, password, name, nickname } = signupDto;
    
    const fullName = name || nickname;

    // 이메일 중복 확인
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new BadRequestException('이미 존재하는 이메일입니다.');
    }

    // 이메일 인증 토큰 생성
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24시간

    // 새 유저 저장 (비밀번호는 스키마에서 자동 해싱)
    const newUser = new this.userModel({
      email,
      password,
      name: fullName,
      emailVerificationToken: token,
      emailVerificationExpires: expires,
      isEmailVerified: false,
    });

    await newUser.save();

    // 이메일 전송
    await this.emailService.sendVerificationEmail(email, token, fullName);

    return {
      success: true,
      message: '회원가입 성공! 인증 메일을 확인하세요.',
      data: {
        user: {
          id: newUser._id,
          email: newUser.email,
          name: newUser.name
        }
      }
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    console.log('=== 로그인 시도 ===');
    console.log('받은 이메일:', email);

    // 이메일로 유저 찾기
    const user = await this.userModel.findOne({ email });
    if (!user) {
      console.log('❌ 이메일 불일치');
      throw new BadRequestException('존재하지 않는 이메일입니다.');
    }

    // 비밀번호 확인
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('❌ 비밀번호 불일치');
      throw new UnauthorizedException('비밀번호가 틀렸습니다.');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('이메일 인증이 필요합니다.');
    }

    // JWT 발급
    const token = this.jwtService.sign({ id: user._id });

    console.log('✅ 로그인 성공');

    return {
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
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const { token, email } = verifyEmailDto;

    console.log('=== 이메일 인증 시도 ===');
    console.log('받은 이메일:', email);

    const user = await this.userModel.findOne({ email });
    if (!user) {
      console.log('❌ 이메일에 해당하는 유저 없음');
      throw new NotFoundException('해당 이메일의 사용자를 찾을 수 없습니다.');
    }

    if (user.isEmailVerified) {
      console.log('❗ 이미 인증된 계정');
      throw new BadRequestException('이미 인증된 계정입니다.');
    }

    if (
      user.emailVerificationToken !== token ||
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      console.log('❌ 토큰 불일치 또는 만료');
      throw new BadRequestException('유효하지 않거나 만료된 토큰입니다.');
    }

    // 인증 성공 처리
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    // 인증 후 JWT 발급
    const jwtToken = this.jwtService.sign({ id: user._id });

    console.log('✅ 이메일 인증 성공');

    return {
      success: true,
      message: '이메일 인증 완료',
      data: {
        token: jwtToken,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          isEmailVerified: true,
        }
      }
    };
  }
}