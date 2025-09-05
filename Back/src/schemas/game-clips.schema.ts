import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GameClipsDocument = GameClips & Document;

@Schema({ timestamps: true })
export class GameClips {
  @Prop({ required: true })
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

  @Prop({ type: Array, required: true })
  Clips: Array<{
    clipKey: string;
    offensiveTeam: string;
    quarter: number;
    down: number | null;
    toGoYard: number | null;
    playType: string;
    specialTeam: boolean;
    start: { side: string; yard: number };
    end: { side: string; yard: number };
    gainYard: number;
    car: { num: number | null; pos: string | null };
    car2: { num: number | null; pos: string | null };
    tkl: { num: number | null; pos: string | null };
    tkl2: { num: number | null; pos: string | null };
    significantPlays: Array<string | null>;
  }>;
}

export const GameClipsSchema = SchemaFactory.createForClass(GameClips);