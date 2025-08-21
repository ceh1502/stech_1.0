# STECH API 명세서 및 MongoDB 모델 정의

---

# 📑 API 명세서 (v1.1)

## 공통
- Base URL: `/api`
- 응답 형식: JSON
- 인증 방식: JWT Bearer Token (`Authorization: Bearer <token>`)

---

## 🔐 Auth API

### 회원가입
```
POST /auth/signup
```
#### Request Body
```json
{
  "email": "test@example.com",
  "password": "12345678",
  "nickname": "kenlee"
}
```

#### Response
```json
{ "message": "Signup success" }
```

### 로그인dzd
```
POST /auth/login
```
#### Request Body
```json
{
  "email": "test@example.com",
  "password": "12345678"
}
```

#### Response
```json
{
  "accessToken": "JWT_TOKEN"
}
```

### 내 정보 조회 (+팀, 경기, 클립 ID)
```
GET /auth/me
```
#### Response
```json
{
  "id": "1234567890",
  "email": "test@example.com",
  "nickname": "kenlee",
  "team": {
    "teamId": "team123",
    "teamName": "Lions",
    "logoUrl": "/images/lions.png"
  },
  "games": [
    {
      "gameId": "game001",
      "date": "2025-07-04",
      "opponent": "Eagles",
      "type": "League",
      "clipIds": ["clip1", "clip2"]
    },
    {
      "gameId": "game002",
      "date": "2025-07-05",
      "opponent": "Tigers",
      "type": "Practice",
      "clipIds": ["clip3"]
    }
  ]
}
```

### 팀의 플레이어 목록 조회
```
GET /teams/:teamId/players
```
#### Response
```json
[
  { "playerId": "p1", "name": "John Doe", "jerseyNumber": 10, "position": "WR" },
  { "playerId": "p2", "name": "Alex Kim", "jerseyNumber": 22, "position": "QB" }
]
```

---

## 🏈 Clip API

### 클립 상세 조회
```
GET /clips/:clipId
```
#### Response
```json
{
  "videoId": "clip1",
  "url": "https://example.com/videos/vid001.mp4",
  "quarter": "1Q",
  "playType": "Run",
  "success": true,
  "startYard": { "side": "own", "yard": 20 },
  "endYard": { "side": "opp", "yard": 45 },
  "gainedYard": 25,
  "playerIds": ["p1"],
  "significantPlays": [
    { "label": "Touchdown", "timestamp": 12.3 }
  ]
}
```

---

# 🛠️ MongoDB 모델 정의

## models/User.js
```js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  nickname: { type: String },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' }
});

module.exports = mongoose.model('User', userSchema);
```

## models/Team.js
```js
const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: String,
  jerseyNumber: Number,
  position: String
});

const teamSchema = new mongoose.Schema({
  teamName: String,
  logoUrl: String,
  players: [playerSchema]
});

module.exports = mongoose.model('Team', teamSchema);
```

## models/Game.js
```js
const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  date: Date,
  opponent: String,
  type: String,
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  clips: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Clip' }]
});

module.exports = mongoose.model('Game', gameSchema);
```

## models/Clip.js
```js
const mongoose = require('mongoose');

const yardSchema = new mongoose.Schema({
  side: { type: String, enum: ['own', 'opp'] },
  yard: Number
});

const significantPlaySchema = new mongoose.Schema({
  label: String,
  timestamp: Number
});

const clipSchema = new mongoose.Schema({
  url: String,
  quarter: String,
  playType: String,
  success: Boolean,
  startYard: yardSchema,
  endYard: yardSchema,
  gainedYard: Number,
  playerIds: [String],
  significantPlays: [significantPlaySchema],
  game: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' }
});

module.exports = mongoose.model('Clip', clipSchema);
```

## models/index.js
```js
const User = require('./User');
const Team = require('./Team');
const Game = require('./Game');
const Clip = require('./Clip');

module.exports = {
  User,
  Team,
  Game,
  Clip
};
```
