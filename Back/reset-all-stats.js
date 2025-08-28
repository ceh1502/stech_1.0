const mongoose = require('mongoose');

async function resetAllPlayerStats() {
  try {
    console.log('🔄 모든 선수 스탯 초기화 중...');
    await mongoose.connect('mongodb+srv://ceh1502:ceh9412@cluster0.97esexh.mongodb.net/stech?retryWrites=true&w=majority&appName=Cluster0');
    
    const playerSchema = new mongoose.Schema({}, { strict: false, collection: 'players' });
    const Player = mongoose.model('Player', playerSchema);
    
    // 모든 선수의 스탯을 0으로 초기화
    const result = await Player.updateMany(
      {},
      { 
        $set: { 
          stats: {
            gamesPlayed: 0,
            passingAttempts: 0,
            passingCompletions: 0,
            completionPercentage: 0,
            passingYards: 0,
            passingTouchdowns: 0,
            passingInterceptions: 0,
            longestPass: 0,
            sacks: 0,
            rushingAttempts: 0,
            rushingYards: 0,
            yardsPerCarry: 0,
            rushingTouchdowns: 0,
            longestRush: 0,
            fumbles: 0,
            fumblesLost: 0,
            receivingTargets: 0,
            receptions: 0,
            receivingYards: 0,
            yardsPerReception: 0,
            receivingTouchdowns: 0,
            longestReception: 0,
            receivingFirstDowns: 0,
            tackles: 0,
            TFL: 0,
            forcedFumbles: 0,
            fumbleRecovery: 0,
            fumbleRecoveredYards: 0,
            passDefended: 0,
            interceptions: 0,
            interceptionYards: 0,
            touchdowns: 0,
            kickReturns: 0,
            kickReturnYards: 0,
            yardsPerKickReturn: 0,
            puntReturns: 0,
            puntReturnYards: 0,
            yardsPerPuntReturn: 0,
            returnTouchdowns: 0
          }
        }
      }
    );
    
    console.log(`✅ ${result.modifiedCount}명의 선수 스탯이 초기화되었습니다.`);
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// 선수 데이터를 완전히 삭제하려면 이 함수를 사용하세요
async function deleteAllPlayers() {
  try {
    console.log('🗑️ 모든 선수 데이터 삭제 중...');
    await mongoose.connect('mongodb+srv://ceh1502:ceh9412@cluster0.97esexh.mongodb.net/stech?retryWrites=true&w=majority&appName=Cluster0');
    
    const playerSchema = new mongoose.Schema({}, { strict: false, collection: 'players' });
    const Player = mongoose.model('Player', playerSchema);
    
    const result = await Player.deleteMany({});
    console.log(`✅ ${result.deletedCount}명의 선수 데이터가 삭제되었습니다.`);
    
  } catch (error) {
    console.error('❌ 오류:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// 스탯만 초기화
// resetAllPlayerStats();

// 모든 선수 삭제하려면 아래 주석을 해제하고 위 함수는 주석처리
deleteAllPlayers();