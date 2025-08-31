import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Team, TeamDocument } from '../schemas/team.schema';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { CreateTeamDto, UpdateTeamDto } from '../common/dto/team.dto';

@Injectable()
export class TeamService {
  constructor(
    @InjectModel(Team.name) private teamModel: Model<TeamDocument>,
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
  ) {}

  async createTeam(createTeamDto: CreateTeamDto, ownerId: string) {
    const { teamName, logoUrl } = createTeamDto;

    // 팀 ID 자동 생성
    const teamId = `team_${uuidv4().substring(0, 8)}`;

    // 새 팀 생성
    const newTeam = new this.teamModel({
      teamId,
      teamName,
      logoUrl,
      ownerId,
    });

    await newTeam.save();

    return {
      success: true,
      message: '팀이 성공적으로 생성되었습니다.',
      data: newTeam,
    };
  }

  async getTeam(teamId: string) {
    // 팀 정보와 선수들을 함께 조회
    const team = await this.teamModel
      .findOne({ teamId })
      .populate('ownerId', 'name email');
    if (!team) {
      throw new NotFoundException('팀을 찾을 수 없습니다.');
    }

    // 해당 팀의 선수들 조회
    const players = await this.playerModel.find({ teamId: team._id });

    return {
      success: true,
      data: {
        ...team.toObject(),
        players,
      },
    };
  }

  async getMyTeams(ownerId: string) {
    const teams = await this.teamModel
      .find({ ownerId })
      .sort({ createdAt: -1 });

    return {
      success: true,
      data: teams,
    };
  }

  async updateTeam(
    teamId: string,
    updateTeamDto: UpdateTeamDto,
    ownerId: string,
  ) {
    const { teamName, logoUrl } = updateTeamDto;

    // 팀 찾기 및 권한 확인
    const team = await this.teamModel.findOne({ teamId });
    if (!team) {
      throw new NotFoundException('팀을 찾을 수 없습니다.');
    }

    // 팀 소유자 확인
    if (team.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('팀을 수정할 권한이 없습니다.');
    }

    // 팀 정보 업데이트
    const updatedTeam = await this.teamModel.findOneAndUpdate(
      { teamId },
      { teamName, logoUrl },
      { new: true },
    );

    return {
      success: true,
      message: '팀 정보가 성공적으로 수정되었습니다.',
      data: updatedTeam,
    };
  }

  async deleteTeam(teamId: string, ownerId: string) {
    // 팀 찾기 및 권한 확인
    const team = await this.teamModel.findOne({ teamId });
    if (!team) {
      throw new NotFoundException('팀을 찾을 수 없습니다.');
    }

    // 팀 소유자 확인
    if (team.ownerId.toString() !== ownerId) {
      throw new ForbiddenException('팀을 삭제할 권한이 없습니다.');
    }

    // 관련 선수들도 함께 삭제
    await this.playerModel.deleteMany({ teamId: team._id });

    // 팀 삭제
    await this.teamModel.findOneAndDelete({ teamId });

    return {
      success: true,
      message: '팀이 성공적으로 삭제되었습니다.',
    };
  }
}
