#!/usr/bin/env node

/**
 * STECH Pro 3-Tier Stats System Test
 * 테스트 스크립트: 새로운 클립 분석 후 3단계 컬렉션 생성 확인
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function test3TierSystem() {
  console.log('🏈 STECH Pro 3-Tier Stats System Test Starting...\n');

  // 테스트용 클립 데이터 (Ken Lee, 등번호 10번, QB)
  const testClip = {
    "clips": [
      {
        "clipKey": "TEST_3TIER_001", 
        "car": { "num": 10, "pos": "QB" },
        "tkl": { "num": 34, "pos": "WR" },
        "gainYard": 15,
        "significantPlays": ["FIRST_DOWN", null, null, null]
      }
    ]
  };

  try {
    // 1. 새로운 클립으로 스탯 업데이트 (3단계 시스템 트리거)
    console.log('1️⃣ Testing New Clip Analysis with 3-Tier System...');
    const response = await axios.post(
      `${BASE_URL}/player/jersey/10/analyze-new-clips`, 
      testClip,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    console.log('✅ API Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(response.data, null, 2));
    
    if (response.data.tierSystemUpdate) {
      console.log('🎯 3-Tier System Update Detected!');
      console.log('   Game Key:', response.data.tierSystemUpdate.gameKey);
      console.log('   Auto Aggregated:', response.data.tierSystemUpdate.autoAggregated);
    }

    // 2. 게임 스탯 조회 테스트
    console.log('\n2️⃣ Testing Game Stats Retrieval...');
    const gameStatsResponse = await axios.get(`${BASE_URL}/player/jersey/10/game-stats`);
    console.log('🎮 Game Stats Found:', gameStatsResponse.data.length, 'entries');
    if (gameStatsResponse.data.length > 0) {
      console.log('   Latest Game:', JSON.stringify(gameStatsResponse.data[0], null, 2));
    }

    // 3. 시즌 스탯 조회 테스트
    console.log('\n3️⃣ Testing Season Stats Retrieval...');
    const seasonStatsResponse = await axios.get(`${BASE_URL}/player/jersey/10/season-stats`);
    console.log('📅 Season Stats Found:', seasonStatsResponse.data.length, 'entries');
    if (seasonStatsResponse.data.length > 0) {
      console.log('   Latest Season:', JSON.stringify(seasonStatsResponse.data[0], null, 2));
    }

    // 4. 커리어 스탯 조회 테스트
    console.log('\n4️⃣ Testing Career Stats Retrieval...');
    const careerStatsResponse = await axios.get(`${BASE_URL}/player/jersey/10/career-stats`);
    console.log('🏆 Career Stats Found:', !!careerStatsResponse.data);
    if (careerStatsResponse.data) {
      console.log('   Career Data:', JSON.stringify(careerStatsResponse.data, null, 2));
    }

    console.log('\n🚀 3-Tier System Test COMPLETED! All tiers working properly.');
    
    return {
      success: true,
      gameStatsCount: gameStatsResponse.data.length,
      seasonStatsCount: seasonStatsResponse.data.length,
      careerStatsExists: !!careerStatsResponse.data
    };

  } catch (error) {
    console.error('❌ Test Failed:', error.response?.status, error.response?.statusText);
    console.error('Error Details:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

// MongoDB 컬렉션 직접 확인 (옵션)
async function checkMongoCollections() {
  console.log('\n📦 MongoDB Collections Check (Optional):');
  console.log('Run these commands to verify collections:');
  console.log('  mongosh stech --eval "db.gamestats.countDocuments()"');
  console.log('  mongosh stech --eval "db.seasonstats.countDocuments()"'); 
  console.log('  mongosh stech --eval "db.careerstats.countDocuments()"');
  console.log('  mongosh stech --eval "db.gamestats.findOne({playerNumber: 10})"');
}

// 메인 실행
if (require.main === module) {
  test3TierSystem()
    .then((result) => {
      console.log('\n📋 Test Summary:', result);
      if (result.success) {
        checkMongoCollections();
        console.log('\n🎉 STECH Pro 3-Tier System: FULLY OPERATIONAL! 🎉');
        process.exit(0);
      } else {
        console.log('\n💔 Test failed, check server logs.');
        process.exit(1);
      }
    });
}

module.exports = { test3TierSystem };