const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  nickname: { type: String, required: true, trim: true },
  role: { type: String, enum: ['player', 'coach', 'admin'], default: 'player' },
  createdAt: { type: Date, default: Date.now }
});

// Player Subschema
const playerSchema = new mongoose.Schema({
  playerId: { type: String, required: true },
  name: { type: String, required: true },
  jerseyNumber: { type: Number },
  offensePosition: { type: String, enum: ['qb','rb','wr','te','ol','other'], trim: true },
  defensePosition: { type: String, trim: true },
  stats: {
    appearances: { type: Number, default: 0 }
  }
}, { _id: false });

// Significant Play Subschema
const significantPlaySchema = new mongoose.Schema({
  label: { type: String, required: true },
  timestampSec: { type: Number, required: true },
  description: { type: String, default: '' }
}, { _id: false });

// Video Metadata Subschema
const metadataSchema = new mongoose.Schema({
  quarter: { type: Number, min: 1, max: 4, required: true },
  playType: { type: String, enum: ['Run','Pass','Punt','Kickoff'], required: true },
  success: { type: Boolean, default: false },
  start: {
    ownership: { type: String, enum: ['own','opp'], required: true },
    yard: { type: Number, required: true }
  },
  end: {
    ownership: { type: String, enum: ['own','opp'], required: true },
    yard: { type: Number, required: true }
  },
  yardsGained: { type: Number, required: true },
  significantPlays: { type: [significantPlaySchema], default: [] }
}, { _id: false });

// Video Subschema
const videoSchema = new mongoose.Schema({
  videoId: { type: String, required: true },
  url: { type: String, required: true },
  metadata: { type: metadataSchema, default: () => ({}) }
}, { _id: false });

// Match Subschema
const matchSchema = new mongoose.Schema({
  matchId: { type: String, required: true },
  date: { type: Date, required: true },
  type: { type: String, trim: true },
  opponent: {
    name: { type: String, required: true },
    logoUrl: { type: String, default: '' }
  },
  videos: { type: [videoSchema], default: [] }
}, { _id: false });

// Team Schema
const teamSchema = new mongoose.Schema({
  teamId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  logoUrl: { type: String, default: '' },
  coach: { type: String, required: true },
  players: { type: [playerSchema], default: [] },
  matches: { type: [matchSchema], default: [] }
});

// Model Exports
const User = mongoose.model('User', userSchema);
const Team = mongoose.model('Team', teamSchema);

module.exports = { User, Team };