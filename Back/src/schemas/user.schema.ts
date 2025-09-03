import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type UserDocument = User & Document;

@Schema({ collection: 'users', timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  username: string; // 아이디 (기존 email → username으로 변경)

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  teamName: string; // 인증코드로 검증된 팀명

  @Prop({ required: true, enum: ['coach', 'player'] })
  role: string; // 코치 또는 선수

  @Prop({ required: true })
  region: string; // 지역 (서울권, 경기강원권 등)

  @Prop({ required: true })
  authCode: string; // 사용된 인증코드

  @Prop({ default: true })
  isActive: boolean; // 계정 활성화 상태

  @Prop({ default: null })
  playerId: string | null; // 관리자가 배정하는 선수 ID (예: "2025_KK_10")

  @Prop({
    type: {
      avatar: String,
      bio: String,
      nickname: String,
      studentId: String,
      email: String,
      joinDate: { type: Date, default: Date.now },
      // 새로운 선수 프로필 필드들
      playerKey: String,
      realName: String,
      status: { type: String, enum: ['은퇴', '휴학', '재학', '진학'] },
      positions: {
        type: {
          PS1: String,
          PS2: String,
          PS3: String,
          PS4: String,
          PS5: String,
          PS6: String,
          PS7: String,
          PS8: String,
          PS9: String,
          PS10: String,
        },
        default: {},
        _id: false,
      },
      physicalInfo: {
        type: {
          height: Number, // cm
          weight: Number, // kg
          age: Number,
          grade: String, // 학년
          nationality: String,
        },
        default: {},
        _id: false,
      },
      contactInfo: {
        type: {
          postalCode: String,
          address: String,
          phone: String,
          email: String,
        },
        default: {},
        _id: false,
      },
      career: String,
      // 스탯 참조
      totalStats: String, // PlayerTotalStats 참조
      seasonStats: [String], // PlayerSeasonStats 배열 참조
      gameStats: [String], // PlayerGameStats 배열 참조
    },
    default: {},
    _id: false,
  })
  profile: {
    avatar?: string;
    bio?: string;
    nickname?: string;
    studentId?: string;
    email?: string;
    joinDate?: Date;
    // 새로운 선수 프로필 필드들
    playerKey?: string;
    realName?: string;
    status?: '은퇴' | '휴학' | '재학' | '진학';
    positions?: {
      PS1?: string;
      PS2?: string;
      PS3?: string;
      PS4?: string;
      PS5?: string;
      PS6?: string;
      PS7?: string;
      PS8?: string;
      PS9?: string;
      PS10?: string;
    };
    physicalInfo?: {
      height?: number; // cm
      weight?: number; // kg
      age?: number;
      grade?: string; // 학년
      nationality?: string;
    };
    contactInfo?: {
      postalCode?: string;
      address?: string;
      phone?: string;
      email?: string;
    };
    career?: string;
    // 스탯 참조
    totalStats?: string; // PlayerTotalStats 참조
    seasonStats?: string[]; // PlayerSeasonStats 배열 참조
    gameStats?: string[]; // PlayerGameStats 배열 참조
  };

  async comparePassword(candidatePassword: string): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, this.password);
  }
}

export const UserSchema = SchemaFactory.createForClass(User);

// 비밀번호 해싱 미들웨어
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 비밀번호 검증 메서드 추가
UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// 인덱스 설정
UserSchema.index({ username: 1 });
UserSchema.index({ teamName: 1, role: 1 });
