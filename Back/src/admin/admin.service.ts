import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * PlayerId가 배정되지 않은 유저 목록 조회
   */
  async getUnassignedUsers(teamName?: string, role?: string) {
    const filter: any = {
      $or: [
        { playerId: null },
        { playerId: { $exists: false } }
      ]
    };

    // 팀명 필터
    if (teamName) {
      filter.teamName = teamName;
    }

    // 역할 필터 (player만 조회하는 경우가 많음)
    if (role) {
      filter.role = role;
    }

    const users = await this.userModel
      .find(filter)
      .select('username teamName role authCode createdAt profile')
      .sort({ createdAt: -1 }) // 최신 가입자부터
      .lean();

    console.log(`📋 playerId 미배정 유저 ${users.length}명 조회 완료`);
    console.log(`🔍 필터: 팀=${teamName || '전체'}, 역할=${role || '전체'}`);

    return users;
  }

  /**
   * 유저에게 playerId 배정
   */
  async assignPlayerId(userId: string, playerId: string) {
    // 1. 유저 존재 확인
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('해당 사용자를 찾을 수 없습니다.');
    }

    // 2. 이미 playerId가 배정되었는지 확인
    if (user.playerId) {
      throw new BadRequestException(
        `해당 사용자는 이미 playerId "${user.playerId}"가 배정되어 있습니다.`
      );
    }

    // 3. playerId 중복 확인
    const existingUser = await this.userModel.findOne({ playerId });
    if (existingUser) {
      throw new BadRequestException(
        `playerId "${playerId}"는 이미 다른 사용자(${existingUser.username})에게 배정되었습니다.`
      );
    }

    // 4. playerId 형식 검증 (시즌_학교코드_등번호)
    const playerIdPattern = /^\d{4}_[A-Z]{2,3}_\d+$/;
    if (!playerIdPattern.test(playerId)) {
      throw new BadRequestException(
        'playerId 형식이 올바르지 않습니다. (예: 2025_KK_10)'
      );
    }

    // 5. playerId 배정
    user.playerId = playerId;
    await user.save();

    console.log(`✅ PlayerId 배정 완료: ${user.username} → ${playerId}`);

    return {
      userId: user._id,
      username: user.username,
      playerId: user.playerId,
      teamName: user.teamName,
      role: user.role,
      assignedAt: new Date(),
    };
  }

  /**
   * PlayerId가 배정된 유저 목록 조회
   */
  async getAssignedUsers(teamName?: string, role?: string) {
    const filter: any = {
      playerId: { $ne: null, $exists: true }
    };

    // 팀명 필터
    if (teamName) {
      filter.teamName = teamName;
    }

    // 역할 필터
    if (role) {
      filter.role = role;
    }

    const users = await this.userModel
      .find(filter)
      .select('username teamName role playerId createdAt updatedAt profile')
      .sort({ updatedAt: -1 }) // 최근 배정된 순서
      .lean();

    console.log(`📋 playerId 배정된 유저 ${users.length}명 조회 완료`);
    console.log(`🔍 필터: 팀=${teamName || '전체'}, 역할=${role || '전체'}`);

    return users;
  }

  /**
   * 특정 playerId의 사용자 정보 조회
   */
  async getUserByPlayerId(playerId: string) {
    const user = await this.userModel
      .findOne({ playerId })
      .select('-password')
      .lean();

    if (!user) {
      throw new NotFoundException(`playerId "${playerId}"에 해당하는 사용자를 찾을 수 없습니다.`);
    }

    return user;
  }

  /**
   * playerId 배정 해제 (필요시)
   */
  async unassignPlayerId(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('해당 사용자를 찾을 수 없습니다.');
    }

    const oldPlayerId = user.playerId;
    user.playerId = null;
    await user.save();

    console.log(`🔄 PlayerId 배정 해제: ${user.username} (${oldPlayerId} → null)`);

    return {
      userId: user._id,
      username: user.username,
      oldPlayerId,
      unassignedAt: new Date(),
    };
  }
}