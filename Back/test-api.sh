#!/bin/bash

echo "경기 플레이콜 분석 API 테스트"

curl -X POST http://localhost:4000/api/team/analyze-game-playcall \
  -H "Content-Type: application/json" \
  -d '{"gameKey": "SNUS240908"}'