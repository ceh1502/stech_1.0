const mongoose = require('mongoose');

  const playerSchema = new mongoose.Schema({
    playerId: {
      type: String,
      required: true,
      unique: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    jerseyNumber: {
      type: Number,
      required: true
    },
    position: {
      type: String,
      required: true,
      trim: true
    },
    studentId: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true
    },
    nickname: {
      type: String,
      trim: true
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    }
  }, {
    timestamps: true
  });

  // 인덱스 설정
  playerSchema.index({ playerId: 1 });
  playerSchema.index({ teamId: 1 });
  playerSchema.index({ teamId: 1, jerseyNumber: 1 }, { unique: true });

  // 가상 필드
  playerSchema.virtual('team', {
    ref: 'Team',
    localField: 'teamId',
    foreignField: '_id',
    justOne: true
  });

  const Player = mongoose.model('Player', playerSchema);
  module.exports = Player;