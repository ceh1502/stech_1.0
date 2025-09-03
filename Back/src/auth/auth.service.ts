import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from '../schemas/user.schema';
import { SignupDto, LoginDto } from '../common/dto/auth.dto';
import { TEAM_CODES } from '../common/constants/team-codes';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto) {
    const { username, password, authCode } = signupDto;
    
    console.log('=== 회원가입 시도 ===');
    console.log('받은 데이터:', { username, authCode });

    // 아이디 중복 확인
    const existingUser = await this.userModel.findOne({ username });
    if (existingUser) {
      throw new ConflictException('이미 존재하는 아이디입니다.');
    }

    // 인증코드 검증
    const teamInfo = TEAM_CODES[authCode];
    if (!teamInfo) {
      throw new BadRequestException('유효하지 않은 인증코드입니다.');
    }

    // 새 유저 생성
    const newUser = new this.userModel({
      username,
      password,
      teamName: teamInfo.team,
      role: teamInfo.role,
      region: teamInfo.region,
      authCode,
      isActive: true,
      profile: {
        // 선수 프로필 필드들을 null로 초기화
        playerKey: null,
        realName: null,
        status: null,
        positions: {
          PS1: null,
          PS2: null,
          PS3: null,
          PS4: null,
          PS5: null,
          PS6: null,
          PS7: null,
          PS8: null,
          PS9: null,
          PS10: null,
        },
        physicalInfo: {
          height: null,
          weight: null,
          age: null,
          grade: null,
          nationality: null,
        },
        contactInfo: {
          postalCode: null,
          address: null,
          phone: null,
          email: null,
        },
        career: null,
        totalStats: null,
        seasonStats: [],
        gameStats: [],
      },
    });

    console.log('유저 저장 전:', newUser);
    await newUser.save();
    console.log('✅ 유저 저장 완료:', newUser._id);

    // JWT 토큰 발급
    const token = this.jwtService.sign({ 
      id: newUser._id, 
      username: newUser.username,
      team: newUser.teamName,
      role: newUser.role,
      playerId: newUser.playerId || null
    });

    return {
      success: true,
      message: '회원가입 성공!',
      data: {
        token,
        user: {
          id: newUser._id,
          username: newUser.username,
          teamName: newUser.teamName,
          role: newUser.role,
          region: newUser.region,
        },
      },
    };
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    console.log('=== 로그인 시도 ===');
    console.log('받은 아이디:', username);

    // 아이디로 유저 찾기
    const user = await this.userModel.findOne({ username });
    if (!user) {
      console.log('❌ 아이디 불일치');
      throw new BadRequestException('존재하지 않는 아이디입니다.');
    }

    // 비밀번호 확인
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('❌ 비밀번호 불일치');
      throw new UnauthorizedException('비밀번호가 틀렸습니다.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('비활성화된 계정입니다.');
    }

    // JWT 발급
    const token = this.jwtService.sign({ 
      id: user._id, 
      username: user.username,
      team: user.teamName,
      role: user.role,
      playerId: user.playerId || null
    });

    console.log('✅ 로그인 성공');

    return {
      success: true,
      message: '로그인 성공',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          teamName: user.teamName,
          role: user.role,
          region: user.region,
        },
      },
    };
  }

  async checkUsername(username: string) {
    console.log('=== 아이디 중복 확인 ===');
    console.log('받은 아이디:', username);

    const existingUser = await this.userModel.findOne({ username });
    if (existingUser) {
      console.log('❌ 중복된 아이디');
      throw new ConflictException('중복된 아이디입니다.');
    }

    console.log('✅ 사용 가능한 아이디');
    return {
      success: true,
      message: '사용 가능한 아이디입니다.',
      data: { available: true }
    };
  }

  async verifyTeamCode(authCode: string) {
    console.log('=== 인증코드 검증 ===');
    console.log('받은 인증코드:', authCode);

    const teamInfo = TEAM_CODES[authCode];
    if (!teamInfo) {
      console.log('❌ 유효하지 않은 인증코드');
      throw new BadRequestException('유효하지 않은 인증코드입니다.');
    }

    console.log('✅ 유효한 인증코드:', teamInfo);
    return {
      success: true,
      message: '인증 완료',
      data: {
        team: teamInfo.team,
        role: teamInfo.role,
        region: teamInfo.region
      }
    };
  }
  
  async findUserByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findUserById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async updateProfile(userId: string, profileData: any) {
    console.log('=== 프로필 업데이트 ===');
    console.log('userId:', userId);
    console.log('profileData:', profileData);

    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { 
        $set: { 
          'profile.avatar': profileData.avatar,
          'profile.bio': profileData.bio, 
          'profile.nickname': profileData.nickname,
          'profile.email': profileData.email
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      throw new BadRequestException('사용자를 찾을 수 없습니다.');
    }

    console.log('✅ 프로필 업데이트 완료');
    
    return {
      success: true,
      message: '프로필이 업데이트되었습니다.',
      data: {
        profile: updatedUser.profile
      }
    };
  }
}