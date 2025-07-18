const mongoose = require('mongoose');

  // 영상 스키마 정의
  const videoSchema = new mongoose.Schema({
    videoId: {
      type: String,
      required: true,  
      unique: true
    },
    // 영상 파일 경로 (서버에 저장된 파일 경로)
    url: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    quarter: {
      type: String,
      required: true,
      enum: ['1Q', '2Q', '3Q', '4Q']  // 이 값들만 허용
    },
    // 플레이 종류 (Run, Pass, Kick)
    playType: {
      type: String,
      required: true,
      enum: ['Run', 'Pass', 'Kick']  
    },
    // 플레이 성공 여부 (true/false)
    success: {
      type: Boolean,
      required: true
    },
    // 플레이 시작 위치 {side: "own"/"opp", yard: 숫자}
    startYard: {
      side: {
        type: String,
        required: true,
        enum: ['own', 'opp']  // 자진영(own) 또는 상대진영(opp)
      },
      yard: {
        type: Number,
        required: true,
        min: -100,              // 최소값 -100
        max: 100              // 최대값 100
      }
    },
    // 플레이 끝 위치 {side: "own"/"opp", yard: 숫자}
    endYard: {
      side: {
        type: String,
        required: true,
        enum: ['own', 'opp']
      },
      yard: {
        type: Number,
        required: true,
        min: -100,
        max: 100
      }
    },
    // 획득한 야드 (음수면 손실)
    gainedYard: {
      type: Number,
      required: true
    },
    // 참여한 선수들 배열
    players: [{
      playerId: {
        type: String,
        required: true
      },
      name: {
        type: String,
        required: true
      },
      number: {
        type: Number,
        required: true
      },
      position: {
        type: String,
        required: true
      },
      role: {
        type: String,      // 이 플레이에서의 역할 (receiver, line 등)
        required: true
      }
    }],
    // 중요한 순간들 (터치다운, 인터셉션 등)
    significantPlays: [{
      label: {
        type: String,      // 예: "Touchdown", "Interception"
        required: true
      },
      timestamp: {
        type: Number,      // 영상에서 몇 초 지점인지
        required: true
      }
    }],
    // 어떤 경기의 영상인지 연결
    gameId: {
      type: mongoose.Schema.Types.ObjectId,  // MongoDB ObjectId 타입
      ref: 'Game',       // Game 모델과 연결
      required: true   
    }
  }, {
    timestamps: true   // createdAt, updatedAt 자동 생성
  });

  // 검색 속도 향상을 위한 인덱스 설정
  videoSchema.index({ videoId: 1 });           
  videoSchema.index({ gameId: 1 });           
  videoSchema.index({ playType: 1 });    
  videoSchema.index({ success: 1 });        
  videoSchema.index({ 'players.playerId': 1 }); // 특정 선수 영상 검색시 
  빠름

  // 가상 필드: 이 영상이 속한 경기 정보 조회
  videoSchema.virtual('game', {
    ref: 'Game',           // Game 모델 참조
    localField: 'gameId',  // 현재 스키마의 gameId 필드
    foreignField: '_id',   // Game 모델의 _id 필드
    justOne: true          // 하나의 경기만 반환
  });

  const Video = mongoose.model('Video', videoSchema);
  module.exports = Video;