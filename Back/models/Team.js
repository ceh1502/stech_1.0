//몽구스 라이브러리 가져오고 DB 연결와 스키마 정의 하는 줄
const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
    teamId: {
      type: String,
      required: true,
      unique: true
    },
    teamName: {
      type: String,
      required: true,
      trim: true
    },
    logoUrl: {
      type: String,
      default: null
    },
    //objectID는 DB의 고유 ID 타입, ref는 관계 설정
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
  }, {
    timestamps: true
  });

  teamSchema.index({ teamId: 1 });
  teamSchema.index({ ownerId: 1 });


  // 실제 DB에 저장되지 않는 가상 필드이고,  팀에 속한 선수들을 쉽게 조회 가능
  teamSchema.virtual('players', {
    ref: 'Player',
    localField: '_id',
    foreignField: 'teamId'
  });

  //모델 생성하고 다른 파일에서 사용할 수 있도록 내보냄
  const Team = mongoose.model('Team', teamSchema);
  module.exports = Team;