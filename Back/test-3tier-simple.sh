#!/bin/bash

# STECH Pro 3-Tier System Test Script
echo "🏈 STECH Pro 3-Tier Stats System Integration Test"
echo "=================================================="

# Test data (올바른 NewClipDto 형식)
TEST_DATA='{
  "clips": [
    {
      "clipKey": "TEST_3TIER_001",
      "start": {"side": "OWN", "yard": 20},
      "end": {"side": "OWN", "yard": 35}, 
      "gainYard": 15,
      "car": {"num": 10, "pos": "QB"},
      "car2": {"num": null, "pos": null},
      "tkl": {"num": 34, "pos": "WR"},
      "tkl2": {"num": null, "pos": null},
      "significantPlays": ["FIRST_DOWN", null, null, null]
    }
  ]
}'

echo
echo "1️⃣ Testing New Clip Analysis with 3-Tier System..."
echo "POST /api/player/jersey/10/analyze-new-clips"

# Wait for server to be ready
for i in {1..10}; do
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "✅ Server is ready!"
        break
    fi
    echo "⏳ Waiting for server... ($i/10)"
    sleep 2
done

# Test the new clip analysis (this should trigger 3-tier system)
curl -X POST http://localhost:3001/api/player/jersey/10/analyze-new-clips \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA" \
  -w "\nHTTP Status: %{http_code}\n" 2>/dev/null || echo "❌ API call failed"

echo
echo "2️⃣ Checking MongoDB collections after API call..."
echo

echo "📊 GameStats collection:"
mongosh stech --eval "db.gamestats.countDocuments()" --quiet
echo "📊 SeasonStats collection:" 
mongosh stech --eval "db.seasonstats.countDocuments()" --quiet
echo "📊 CareerStats collection:"
mongosh stech --eval "db.careerstats.countDocuments()" --quiet

echo
echo "3️⃣ Sample data from collections:"
echo
echo "🎮 Latest GameStats:"
mongosh stech --eval "db.gamestats.findOne({playerNumber: 10})" --quiet 2>/dev/null || echo "No game stats found"

echo
echo "📅 Latest SeasonStats:"
mongosh stech --eval "db.seasonstats.findOne({playerNumber: 10})" --quiet 2>/dev/null || echo "No season stats found"

echo
echo "🏆 CareerStats:"
mongosh stech --eval "db.careerstats.findOne({playerNumber: 10})" --quiet 2>/dev/null || echo "No career stats found"

echo
echo "4️⃣ Testing API endpoints for 3-tier data retrieval..."

echo "🔍 GET /api/player/jersey/10/game-stats"
curl -s http://localhost:3001/api/player/jersey/10/game-stats 2>/dev/null | head -3 || echo "❌ Game stats API failed"

echo
echo "🔍 GET /api/player/jersey/10/season-stats"
curl -s http://localhost:3001/api/player/jersey/10/season-stats 2>/dev/null | head -3 || echo "❌ Season stats API failed"

echo
echo "🔍 GET /api/player/jersey/10/career-stats"  
curl -s http://localhost:3001/api/player/jersey/10/career-stats 2>/dev/null | head -3 || echo "❌ Career stats API failed"

echo
echo "=================================================="
echo "🎉 3-Tier System Integration Test Complete!"
echo "Check the results above to verify all systems working."
echo "=================================================="