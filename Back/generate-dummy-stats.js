const mongoose = require('mongoose');
const path = require('path');

// MongoDB 연결 설정
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stech';

// Player Schema 정의
const playerSchema = new mongoose.Schema({}, {strict: false});
const Player = mongoose.model('Player', playerSchema);

// 포지션별 더미 스탯 생성기
class DummyStatsGenerator {
  static getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static getRandomFloat(min, max, decimals = 1) {
    const value = Math.random() * (max - min) + min;
    return parseFloat(value.toFixed(decimals));
  }

  // QB 스탯 생성
  static generateQBStats() {
    const passingAttempts = this.getRandomInt(25, 45);
    const passingCompletions = this.getRandomInt(15, Math.min(passingAttempts, 35));
    const passingYards = this.getRandomInt(150, 400);
    const passingTouchdowns = this.getRandomInt(0, 4);
    const rushingAttempts = this.getRandomInt(3, 12);
    const rushingYards = this.getRandomInt(-5, 80);
    
    return {
      // 패싱 스탯
      passingAttempts,
      passingCompletions,
      passingYards,
      passingTouchdowns,
      passingInterceptions: this.getRandomInt(0, 2),
      completionPercentage: this.getRandomFloat((passingCompletions / passingAttempts) * 100, 
        (passingCompletions / passingAttempts) * 100),
      longestPass: this.getRandomInt(15, 65),
      sacks: this.getRandomInt(0, 4),
      
      // 러싱 스탯
      rushingAttempts,
      rushingYards,
      yardsPerCarry: rushingAttempts > 0 ? this.getRandomFloat(rushingYards / rushingAttempts, rushingYards / rushingAttempts) : 0,
      rushingTouchdowns: this.getRandomInt(0, 2),
      longestRush: this.getRandomInt(5, 25),
      
      // 기본 스탯
      gamesPlayed: this.getRandomInt(8, 12),
      totalYards: passingYards + rushingYards,
      totalTouchdowns: passingTouchdowns + this.getRandomInt(0, 2),
    };
  }

  // RB 스탯 생성
  static generateRBStats() {
    const rushingAttempts = this.getRandomInt(15, 35);
    const rushingYards = this.getRandomInt(60, 180);
    const receivingTargets = this.getRandomInt(3, 12);
    const receptions = this.getRandomInt(2, Math.min(receivingTargets, 10));
    const receivingYards = this.getRandomInt(10, 80);
    
    return {
      // 러싱 스탯
      rushingAttempts,
      rushingYards,
      yardsPerCarry: this.getRandomFloat(rushingYards / rushingAttempts, rushingYards / rushingAttempts),
      rushingTouchdowns: this.getRandomInt(0, 3),
      longestRush: this.getRandomInt(10, 45),
      
      // 리시빙 스탯
      receivingTargets,
      receptions,
      receivingYards,
      yardsPerReception: receptions > 0 ? this.getRandomFloat(receivingYards / receptions, receivingYards / receptions) : 0,
      receivingTouchdowns: this.getRandomInt(0, 2),
      longestReception: this.getRandomInt(8, 35),
      receivingFirstDowns: this.getRandomInt(1, 6),
      
      // 기본 스탯
      gamesPlayed: this.getRandomInt(8, 12),
      totalYards: rushingYards + receivingYards,
      totalTouchdowns: this.getRandomInt(0, 3) + this.getRandomInt(0, 2),
      fumbles: this.getRandomInt(0, 2),
      fumblesLost: this.getRandomInt(0, 1),
    };
  }

  // WR/TE 스탯 생성
  static generateWRTEStats(position = 'WR') {
    const receivingTargets = position === 'WR' ? this.getRandomInt(8, 25) : this.getRandomInt(5, 15);
    const receptions = this.getRandomInt(5, Math.min(receivingTargets, 20));
    const receivingYards = position === 'WR' ? this.getRandomInt(80, 200) : this.getRandomInt(40, 120);
    const rushingAttempts = this.getRandomInt(0, 3);
    const rushingYards = rushingAttempts > 0 ? this.getRandomInt(-5, 25) : 0;
    
    return {
      // 리시빙 스탯
      receivingTargets,
      receptions,
      receivingYards,
      yardsPerReception: receptions > 0 ? this.getRandomFloat(receivingYards / receptions, receivingYards / receptions) : 0,
      receivingTouchdowns: this.getRandomInt(0, 3),
      longestReception: this.getRandomInt(12, 55),
      receivingFirstDowns: this.getRandomInt(2, 8),
      
      // 러싱 스탯 (가끔)
      rushingAttempts,
      rushingYards,
      yardsPerCarry: rushingAttempts > 0 ? this.getRandomFloat(rushingYards / rushingAttempts, rushingYards / rushingAttempts) : 0,
      rushingTouchdowns: this.getRandomInt(0, 1),
      
      // 기본 스탯
      gamesPlayed: this.getRandomInt(8, 12),
      totalYards: receivingYards + rushingYards,
      totalTouchdowns: this.getRandomInt(0, 3),
      fumbles: this.getRandomInt(0, 1),
    };
  }

  // 수비수 스탯 생성 (LB, DB, DL)
  static generateDefensiveStats(position) {
    const tackles = position === 'LB' ? this.getRandomInt(8, 20) : 
                   position === 'DB' ? this.getRandomInt(5, 15) :
                   this.getRandomInt(6, 16); // DL
    
    return {
      tackles,
      sacks: position === 'DL' ? this.getRandomInt(1, 6) : 
             position === 'LB' ? this.getRandomInt(0, 3) :
             this.getRandomInt(0, 2), // DB
      tacklesForLoss: this.getRandomInt(0, 4),
      forcedFumbles: this.getRandomInt(0, 2),
      fumbleRecoveries: this.getRandomInt(0, 1),
      passesDefended: position === 'DB' ? this.getRandomInt(2, 8) :
                     position === 'LB' ? this.getRandomInt(1, 4) :
                     this.getRandomInt(0, 2), // DL
      interceptions: position === 'DB' ? this.getRandomInt(0, 3) :
                    position === 'LB' ? this.getRandomInt(0, 1) :
                    this.getRandomInt(0, 1), // DL
      interceptionYards: this.getRandomInt(0, 45),
      defensiveTouchdowns: this.getRandomInt(0, 1),
      
      // 기본 스탯
      gamesPlayed: this.getRandomInt(8, 12),
      totalTouchdowns: this.getRandomInt(0, 1),
    };
  }

  // 키커 스탯 생성
  static generateKickerStats() {
    const fieldGoalsAttempted = this.getRandomInt(3, 12);
    const fieldGoalsMade = this.getRandomInt(Math.max(1, fieldGoalsAttempted - 4), fieldGoalsAttempted);
    const extraPointsAttempted = this.getRandomInt(8, 20);
    const extraPointsMade = this.getRandomInt(extraPointsAttempted - 2, extraPointsAttempted);
    
    return {
      fieldGoalsAttempted,
      fieldGoalsMade,
      fieldGoalPercentage: this.getRandomFloat((fieldGoalsMade / fieldGoalsAttempted) * 100, 
        (fieldGoalsMade / fieldGoalsAttempted) * 100),
      longestFieldGoal: this.getRandomInt(35, 52),
      extraPointsAttempted,
      extraPointsMade,
      
      // 기본 스탯
      gamesPlayed: this.getRandomInt(8, 12),
    };
  }

  // 펀터 스탯 생성
  static generatePunterStats() {
    const puntingAttempts = this.getRandomInt(8, 20);
    const puntingYards = this.getRandomInt(puntingAttempts * 35, puntingAttempts * 50);
    
    return {
      puntingAttempts,
      puntingYards,
      puntingAverage: this.getRandomFloat(puntingYards / puntingAttempts, puntingYards / puntingAttempts),
      longestPunt: this.getRandomInt(45, 68),
      puntsInside20: this.getRandomInt(2, Math.floor(puntingAttempts * 0.6)),
      
      // 기본 스탯
      gamesPlayed: this.getRandomInt(8, 12),
    };
  }

  // OL 스탯 생성 (오펜시브 라인은 기본 스탯만)
  static generateOLStats() {
    return {
      gamesPlayed: this.getRandomInt(8, 12),
      gamesStarted: this.getRandomInt(6, 12),
      // OL은 대부분 통계가 추적되지 않음
      sacks: 0, // 허용한 색 수는 팀 단위로 계산됨
    };
  }

  // 포지션에 따른 스탯 생성
  static generateStatsForPosition(position) {
    const commonStats = {
      passingYards: 0,
      passingTouchdowns: 0,
      passingCompletions: 0,
      passingAttempts: 0,
      passingInterceptions: 0,
      completionPercentage: 0,
      passerRating: 0,
      rushingYards: 0,
      rushingTouchdowns: 0,
      rushingAttempts: 0,
      yardsPerCarry: 0,
      longestRush: 0,
      rushingFirstDowns: 0,
      receivingYards: 0,
      receivingTouchdowns: 0,
      receptions: 0,
      receivingTargets: 0,
      yardsPerReception: 0,
      longestReception: 0,
      receivingFirstDowns: 0,
      fieldGoalsMade: 0,
      fieldGoalsAttempted: 0,
      fieldGoalPercentage: 0,
      longestFieldGoal: 0,
      extraPointsMade: 0,
      extraPointsAttempted: 0,
      puntingYards: 0,
      puntingAttempts: 0,
      puntingAverage: 0,
      longestPunt: 0,
      puntsInside20: 0,
      tackles: 0,
      sacks: 0,
      interceptions: 0,
      passesDefended: 0,
      forcedFumbles: 0,
      fumbleRecoveries: 0,
      defensiveTouchdowns: 0,
      totalYards: 0,
      totalTouchdowns: 0,
      gamesPlayed: 0,
      gamesStarted: 0,
    };

    let positionStats = {};
    
    switch (position) {
      case 'QB':
        positionStats = this.generateQBStats();
        break;
      case 'RB':
        positionStats = this.generateRBStats();
        break;
      case 'WR':
        positionStats = this.generateWRTEStats('WR');
        break;
      case 'TE':
        positionStats = this.generateWRTEStats('TE');
        break;
      case 'LB':
      case 'DB':
      case 'DL':
        positionStats = this.generateDefensiveStats(position);
        break;
      case 'K':
        positionStats = this.generateKickerStats();
        break;
      case 'P':
        positionStats = this.generatePunterStats();
        break;
      case 'OL':
        positionStats = this.generateOLStats();
        break;
      default:
        positionStats = { gamesPlayed: this.getRandomInt(8, 12) };
    }

    return {
      ...commonStats,
      ...positionStats
    };
  }
}

async function generateDummyStatsForAllPlayers() {
  try {
    console.log('🔗 MongoDB에 연결 중...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB 연결 성공');

    // 모든 선수 조회
    const players = await Player.find({});
    console.log(`📊 총 선수 수: ${players.length}명`);

    // 이미 스탯이 있는 선수 수 확인
    const playersWithStats = await Player.countDocuments({ 'stats': { $exists: true, $ne: {} } });
    console.log(`📈 현재 스탯이 있는 선수: ${playersWithStats}명`);

    let updatedCount = 0;
    let errorCount = 0;
    
    console.log('🎯 모든 선수에게 더미 스탯 생성 시작...');
    
    // 배치 처리 (100명씩)
    const batchSize = 100;
    for (let i = 0; i < players.length; i += batchSize) {
      const batch = players.slice(i, i + batchSize);
      console.log(`📦 배치 ${Math.ceil((i + 1) / batchSize)} 처리 중... (${i + 1}-${Math.min(i + batchSize, players.length)}/${players.length})`);
      
      const updatePromises = batch.map(async (player) => {
        try {
          // 더미 스탯 생성
          const dummyStats = DummyStatsGenerator.generateStatsForPosition(player.position);
          
          // 기존 stats와 병합 (기존 스탯이 있다면 유지)
          const updatedStats = {
            ...dummyStats,
            ...(player.stats || {}) // 기존 스탯이 있으면 우선
          };
          
          await Player.updateOne(
            { _id: player._id },
            { $set: { stats: updatedStats } }
          );
          
          return { success: true, playerId: player.playerId, name: player.name };
        } catch (error) {
          console.error(`❌ ${player.playerId} (${player.name}) 스탯 생성 실패:`, error.message);
          return { success: false, playerId: player.playerId, name: player.name, error: error.message };
        }
      });
      
      const results = await Promise.all(updatePromises);
      const batchSuccess = results.filter(r => r.success).length;
      const batchError = results.filter(r => !r.success).length;
      
      updatedCount += batchSuccess;
      errorCount += batchError;
      
      console.log(`  ✅ 성공: ${batchSuccess}명, ❌ 실패: ${batchError}명`);
    }

    // 최종 확인
    const finalPlayersWithStats = await Player.countDocuments({ 'stats': { $exists: true, $ne: {} } });
    
    console.log('\n📊 더미 스탯 생성 결과:');
    console.log(`✅ 성공적으로 업데이트된 선수: ${updatedCount}명`);
    console.log(`❌ 실패한 선수: ${errorCount}명`);
    console.log(`📈 최종 스탯이 있는 선수: ${finalPlayersWithStats}명`);

    // 포지션별 통계
    console.log('\n🏈 포지션별 선수 수:');
    const positions = ['QB', 'RB', 'WR', 'TE', 'K', 'P', 'OL', 'DL', 'LB', 'DB'];
    for (const position of positions) {
      const count = await Player.countDocuments({ position, 'stats': { $exists: true, $ne: {} } });
      console.log(`${position}: ${count}명`);
    }

    console.log('\n🎯 더미 스탯 생성 완료!');

  } catch (error) {
    console.error('💥 더미 스탯 생성 중 오류 발생:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB 연결 종료');
  }
}

// 스크립트 실행
if (require.main === module) {
  generateDummyStatsForAllPlayers();
}

module.exports = { generateDummyStatsForAllPlayers, DummyStatsGenerator };