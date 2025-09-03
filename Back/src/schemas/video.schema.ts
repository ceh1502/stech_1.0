import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VideoDocument = Video & Document;

@Schema()
export class StartYard {
  @Prop({ required: true, enum: ['own', 'opp'] })
  side: string;

  @Prop({ required: true, min: -100, max: 100 })
  yard: number;
}

@Schema()
export class EndYard {
  @Prop({ required: true, enum: ['own', 'opp'] })
  side: string;

  @Prop({ required: true, min: -100, max: 100 })
  yard: number;
}

@Schema()
export class PlayerInfo {
  @Prop({ required: true })
  playerId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  number: number;

  @Prop({ required: true })
  position: string;

  @Prop({ required: true })
  role: string;
}

@Schema()
export class SignificantPlay {
  @Prop({ required: true })
  label: string;

  @Prop({ required: true })
  timestamp: number;
}

@Schema({ collection: 'videos', timestamps: true })
export class Video {
  @Prop({ required: true, unique: true })
  videoId: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  fileSize: number;

  @Prop({ required: true, enum: ['1Q', '2Q', '3Q', '4Q'] })
  quarter: string;

  @Prop({ required: true, enum: ['Run', 'Pass', 'Kick'] })
  playType: string;

  @Prop({ required: true })
  success: boolean;

  @Prop({ type: StartYard, required: true })
  startYard: StartYard;

  @Prop({ type: EndYard, required: true })
  endYard: EndYard;

  @Prop({ required: true })
  gainedYard: number;

  @Prop({ type: [PlayerInfo], default: [] })
  players: PlayerInfo[];

  @Prop({ type: [SignificantPlay], default: [] })
  significantPlays: SignificantPlay[];

  @Prop({ type: Types.ObjectId, ref: 'Game', required: true })
  gameId: Types.ObjectId;
}

export const VideoSchema = SchemaFactory.createForClass(Video);

// 인덱스 설정
VideoSchema.index({ videoId: 1 });
VideoSchema.index({ gameId: 1 });
VideoSchema.index({ playType: 1 });
VideoSchema.index({ success: 1 });
VideoSchema.index({ 'players.playerId': 1 });

// 가상 필드: 이 영상이 속한 경기 정보
VideoSchema.virtual('game', {
  ref: 'Game',
  localField: 'gameId',
  foreignField: '_id',
  justOne: true,
});
