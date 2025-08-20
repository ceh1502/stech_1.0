import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Account 서브스키마
@Schema({ _id: false })
export class Account {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  password: string;
}

// Team 서브스키마
@Schema({ _id: false })
export class Team {
  @Prop({ required: true })
  id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  abbr: string;

  @Prop()
  logo: string;

  @Prop()
  color: string;

  @Prop()
  location: string;

  @Prop()
  coach: string;

  @Prop()
  founded: Date;

  @Prop()
  website: string;
}

// Profile 서브스키마
@Schema({ _id: false })
export class Profile {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  number: number;

  @Prop({ required: true })
  position: string;

  @Prop()
  birth: Date;

  @Prop()
  age: number;

  @Prop()
  grade: number;

  @Prop()
  career: number;

  @Prop()
  height: number;

  @Prop()
  weight: number;

  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop()
  image: string;

  @Prop({ default: 'Active' })
  status: string;
}

// Game Stats 서브스키마
@Schema({ _id: false })
export class GameStats {
  @Prop({ default: 0 })
  GamesPlayed: number;

  // Passing Stats
  @Prop({ default: 0 })
  PassYards: number;

  @Prop({ default: 0 })
  PassATT: number;

  @Prop({ default: 0 })
  PassCmp: number;

  @Prop({ default: 0 })
  PassTD: number;

  @Prop({ default: 0 })
  Interceptions: number;

  @Prop({ default: 0 })
  LongPass: number;

  // Rushing Stats
  @Prop({ default: 0 })
  RushYards: number;

  @Prop({ default: 0 })
  RushAtt: number;

  @Prop({ default: 0 })
  RushTD: number;

  @Prop({ default: 0 })
  LongRush: number;

  // Receiving Stats
  @Prop({ default: 0 })
  Receptions: number;

  @Prop({ default: 0 })
  Target: number;

  @Prop({ default: 0 })
  ReceivingYards: number;

  @Prop({ default: 0 })
  ReceivingTD: number;

  @Prop({ default: 0 })
  LongReception: number;

  @Prop({ default: 0 })
  ReceivingFD: number;

  // Fumble Stats
  @Prop({ default: 0 })
  Fumbled: number;

  @Prop({ default: 0 })
  FumbleLost: number;

  // Return Stats
  @Prop({ default: 0 })
  KickReturn: number;

  @Prop({ default: 0 })
  KickReturnYds: number;

  @Prop({ default: 0 })
  PuntReturn: number;

  @Prop({ default: 0 })
  PuntReturnYds: number;

  @Prop({ default: 0 })
  ReturnTD: number;

  // Kicking Stats
  @Prop({ default: 0 })
  PATTry: number;

  @Prop({ default: 0 })
  PATMade: number;

  @Prop({ default: 0 })
  FieldGoalMade: number;

  @Prop({ default: 0 })
  FieldGoalAttempt: number;

  @Prop({ default: 0 })
  FGLengthAvg: number;

  @Prop({ default: 0 })
  LongestFGLength: number;

  @Prop({
    type: {
      "0_19": { made: { type: Number, default: 0 }, attempt: { type: Number, default: 0 } },
      "20_29": { made: { type: Number, default: 0 }, attempt: { type: Number, default: 0 } },
      "30_39": { made: { type: Number, default: 0 }, attempt: { type: Number, default: 0 } },
      "40_49": { made: { type: Number, default: 0 }, attempt: { type: Number, default: 0 } },
      "50_plus": { made: { type: Number, default: 0 }, attempt: { type: Number, default: 0 } }
    },
    default: {
      "0_19": { made: 0, attempt: 0 },
      "20_29": { made: 0, attempt: 0 },
      "30_39": { made: 0, attempt: 0 },
      "40_49": { made: 0, attempt: 0 },
      "50_plus": { made: 0, attempt: 0 }
    }
  })
  FieldGoalsByDistance: {
    "0_19": { made: number; attempt: number };
    "20_29": { made: number; attempt: number };
    "30_39": { made: number; attempt: number };
    "40_49": { made: number; attempt: number };
    "50_plus": { made: number; attempt: number };
  };

  // Punting Stats
  @Prop({ default: 0 })
  Punts: number;

  @Prop({ default: 0 })
  PuntYards: number;

  @Prop({ default: 0 })
  AvgPuntYds: number;

  @Prop({ default: 0 })
  LongestPuntYds: number;

  @Prop({ default: 0 })
  PuntsInside20: number;

  @Prop({ default: 0 })
  Touchback: number;

  // Defensive Stats
  @Prop({ default: 0 })
  Tackles: number;

  @Prop({ default: 0 })
  Sacks: number;

  @Prop({ default: 0 })
  SacksAllowed: number;

  @Prop({ default: 0 })
  Penalties: number;

  @Prop({ default: 0 })
  OffSnapsPlayed: number;

  @Prop({ default: 0 })
  ForcedFumbles: number;

  @Prop({ default: 0 })
  FumbleRecovery: number;

  @Prop({ default: 0 })
  FumRecoveredYds: number;

  @Prop({ default: 0 })
  PassDefended: number;

  @Prop({ default: 0 })
  IntYards: number;

  @Prop({ default: 0 })
  DefTD: number;
}

// Season Stats 서브스키마
@Schema({ _id: false })
export class SeasonStats extends GameStats {
  @Prop({ required: true })
  year: number;
}

// Career Stats 서브스키마
@Schema({ _id: false })
export class CareerStats {
  @Prop({ default: 0 })
  GamesPlayed: number;

  @Prop({ default: 0 })
  PassYards: number;

  @Prop({ default: 0 })
  PassATT: number;

  @Prop({ default: 0 })
  PassCmp: number;

  @Prop({ default: 0 })
  PassTD: number;

  @Prop({ default: 0 })
  Interceptions: number;

  @Prop({ default: 0 })
  RushYards: number;

  @Prop({ default: 0 })
  RushTD: number;

  @Prop({ default: 0 })
  ReceivingYards: number;

  @Prop({ default: 0 })
  ReceivingTD: number;

  @Prop({ default: 0 })
  Tackles: number;

  @Prop({ default: 0 })
  Sacks: number;

  @Prop({ default: 0 })
  DefTD: number;

  @Prop({ default: 0 })
  Punts: number;

  @Prop({ default: 0 })
  PuntYards: number;

  @Prop({ default: 0 })
  FieldGoalMade: number;

  @Prop({ default: 0 })
  FieldGoalAttempt: number;
}

// Stats 메인 스키마
@Schema({ _id: false })
export class Stats {
  @Prop({ type: GameStats, default: () => ({}) })
  game: GameStats;

  @Prop({ type: SeasonStats, default: () => ({}) })
  season: SeasonStats;

  @Prop({ type: CareerStats, default: () => ({}) })
  career: CareerStats;
}

// Achievement 서브스키마
@Schema({ _id: false })
export class Achievement {
  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;
}

// 메인 Player 스키마
@Schema({ timestamps: true })
export class PlayerNew {
  @Prop({ required: true, unique: true })
  playerKey: string;

  @Prop({ default: 'Player' })
  role: string;

  @Prop({ type: Account, required: true })
  account: Account;

  @Prop({ type: Team, required: true })
  team: Team;

  @Prop({ type: Profile, required: true })
  profile: Profile;

  @Prop({ type: Stats, default: () => ({}) })
  stats: Stats;

  @Prop({ type: [Achievement], default: [] })
  achievements: Achievement[];

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export type PlayerNewDocument = PlayerNew & Document;
export const PlayerNewSchema = SchemaFactory.createForClass(PlayerNew);