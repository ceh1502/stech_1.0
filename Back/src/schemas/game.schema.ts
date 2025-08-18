import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type GameDocument = Game & Document;

@Schema({ timestamps: true })
export class Game {
  @Prop({ required: true, unique: true })
  gameId: string;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true, trim: true })
  opponent: string;

  @Prop({ required: true, enum: ['League', 'Practice'] })
  type: string;

  @Prop({ type: Types.ObjectId, ref: 'Team', required: true })
  teamId: Types.ObjectId;
}

export const GameSchema = SchemaFactory.createForClass(Game);

// 인덱스 설정
GameSchema.index({ gameId: 1 });
GameSchema.index({ teamId: 1 });
GameSchema.index({ teamId: 1, date: -1 });

// 가상 필드: 이 경기를 한 팀 정보
GameSchema.virtual('team', {
  ref: 'Team',
  localField: 'teamId',
  foreignField: '_id',
  justOne: true
});

// 가상 필드: 이 경기의 비디오들
GameSchema.virtual('videos', {
  ref: 'Video',
  localField: '_id',
  foreignField: 'gameId'
});