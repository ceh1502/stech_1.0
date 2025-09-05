#!/bin/bash

# 전체 게임 데이터를 API로 전송
curl -X POST http://localhost:4000/api/player/update-game-stats \
  -H "Content-Type: application/json" \
  -d '{
"gameKey":"SNUS20240907",
"date":"2024-09-07(토) 10:00",
"type":"League",
"score":{"home":38,"away":7},
"region":"Seoul",
"location":"서울대 운동장",
"homeTeam":"SNGreenTerrors",
"awayTeam":"USCityhawks",
"Clips": [
  {
    "clipKey":"1",
    "offensiveTeam":"Away",
    "quarter":1,
    "down":null,
    "toGoYard":null,
    "playType":"KICKOFF",
    "specialTeam":true,
    "start": {"side":"OWN","yard":35},
    "end": {"side":"OPP","yard":9},
    "gainYard":56,
    "car": {"num":20,"pos":"K"},
    "car2": {"num":null,"pos":null},
    "tkl": {"num":null,"pos":null},
    "tkl2": {"num":null,"pos":null},
    "significantPlays": [null,null,null,null]
  },
  {
    "clipKey":"44",
    "offensiveTeam":"Away",
    "quarter":2,
    "down":"1",
    "toGoYard":10,
    "playType":"NOPASS",
    "specialTeam":false,
    "start": {"side":"OWN","yard":20},
    "end": {"side":"OWN","yard":20},
    "gainYard":0,
    "car": {"num":87,"pos":"WR"},
    "car2": {"num":30,"pos":"QB"},
    "tkl": {"num":27,"pos":"DB"},
    "tkl2": {"num":null,"pos":null},
    "significantPlays": ["INTERCEPT",null,null,null]
  },
  {
    "clipKey":"44",
    "offensiveTeam":"Away",
    "quarter":2,
    "down":"1",
    "toGoYard":10,
    "playType":"RETURN",
    "specialTeam":false,
    "start": {"side":"OWN","yard":16},
    "end": {"side":"OWN","yard":0},
    "gainYard":-16,
    "car": {"num":30,"pos":"QB"},
    "car2": {"num":null,"pos":null},
    "tkl": {"num":27,"pos":"DB"},
    "tkl2": {"num":null,"pos":null},
    "significantPlays": ["TOUCHDOWN","TURNOVER",null,null]
  }
]
}'

echo -e "\n\n팀 스탯 조회:"
curl -X GET http://localhost:4000/api/team/total-stats | jq .