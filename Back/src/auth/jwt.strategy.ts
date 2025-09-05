import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {
    const secret = 'stech-super-secret-key-2025';
    console.log('JwtStrategy JWT_SECRET:', secret);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: any) {
    console.log('JWT Payload:', payload);
    const user = await this.userModel.findById(payload.id);
    if (!user) {
      console.log('사용자를 찾을 수 없음:', payload.id);
      throw new UnauthorizedException();
    }
    console.log('JWT 검증 성공:', user.username);
    return {
      id: user._id,
      username: user.username,
      team: user.teamName,
      role: user.role,
      playerId: user.playerId || null
    };
  }
}
