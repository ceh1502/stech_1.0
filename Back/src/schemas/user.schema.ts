import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
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

  @Prop({
    type: {
      avatar: String,
      bio: String,
      nickname: String,
      studentId: String,
      email: String,
      joinDate: { type: Date, default: Date.now },
    },
    default: {},
  })
  profile: {
    avatar?: string;
    bio?: string;
    nickname?: string;
    studentId?: string;
    email?: string;
    joinDate?: Date;
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
