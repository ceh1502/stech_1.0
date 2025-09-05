import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GameInfoDocument = GameInfo & Document;

@Schema({ timestamps: true })
export class GameInfo {
  @Prop({ required: true, unique: true })
  gameKey: string;

  @Prop({ required: true })
  date: string;

  @Prop({ required: true })
  type: string;

  @Prop({ type: Object, required: true })
  score: {
    home: number;
    away: number;
  };

  @Prop({ required: true })
  region: string;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  homeTeam: string;

  @Prop({ required: true })
  awayTeam: string;
}

export const GameInfoSchema = SchemaFactory.createForClass(GameInfo);