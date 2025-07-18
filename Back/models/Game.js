const mongoose = require('mongoose');

  const gameSchema = new mongoose.Schema({
    gameId: {
      type: String,
      required: true,
      unique: true
    },
    date: {
      type: Date,
      required: true
    },
    opponent: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      required: true,
      enum: ['League', 'Practice']
    },
     // 어떤 팀의 경기인지 연결
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    }
  }, {
    timestamps: true
  });

// 인덱스 설정
gameSchema.index({ gameId: 1 });
gameSchema.index({ teamId: 1 });
gameSchema.index({ teamId: 1, date: -1 });

// 가상 필드: 이 경기를 한 팀 정보 조회
gameSchema.virtual('team', {
ref: 'Team',
localField: 'teamId',
foreignField: '_id',
justOne: true
});

gameSchema.virtual('videos', {
ref: 'Video',
localField: '_id',
foreignField: 'gameId'
});

const Game = mongoose.model('Game', gameSchema);
module.exports = Game;