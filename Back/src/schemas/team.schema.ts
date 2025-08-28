import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TeamDocument = Team & Document;

@Schema({ timestamps: true })
export class Team {
  @Prop({ required: true, unique: true })
  teamId: string;

  @Prop({ required: true, trim: true })
  teamName: string;

  @Prop({ default: null })
  logoUrl: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  ownerId: Types.ObjectId;
}

export const TeamSchema = SchemaFactory.createForClass(Team);

// 인덱스 설정
TeamSchema.index({ teamId: 1 });
TeamSchema.index({ ownerId: 1 });

// 가상 필드: 팀에 속한 선수들
TeamSchema.virtual('players', {
  ref: 'Player',
  localField: '_id',
  foreignField: 'teamId',
});
