const mongoose = require('mongoose');

async function checkTeams() {
  try {
    console.log('🔗 MongoDB Atlas 연결 중...');
    await mongoose.connect('mongodb+srv://ceh1502:ceh9412@cluster0.97esexh.mongodb.net/stech?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ MongoDB Atlas 연결 성공\n');

    const playerSchema = new mongoose.Schema({}, { strict: false, collection: 'players' });
    const Player = mongoose.model('Player', playerSchema);

    // JSON에서 사용하는 팀명들
    const jsonTeams = ['HFBlackKnights', 'HYLions'];
    
    console.log('🔍 JSON 팀명 vs DB 팀명 매핑 확인:');
    
    for (const jsonTeam of jsonTeams) {
      console.log(`\n📍 JSON 팀명: "${jsonTeam}"`);
      
      // 정확히 일치하는 팀 찾기
      const exactMatch = await Player.findOne({ teamName: jsonTeam }).lean();
      if (exactMatch) {
        console.log(`✅ 정확 일치: ${exactMatch.teamName} (${exactMatch.name} ${exactMatch.jerseyNumber}번)`);
      } else {
        console.log(`❌ 정확 일치 없음`);
      }
      
      // 유사한 팀명 찾기
      const similarTeams = await Player.aggregate([
        { $match: { teamName: { $regex: jsonTeam.slice(0, 2), $options: 'i' } } },
        { $group: { _id: '$teamName', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      
      console.log(`🔍 유사한 팀명들:`);
      similarTeams.forEach(team => {
        console.log(`   - ${team._id}: ${team.count}명`);
      });
    }

    // QB 선수들의 팀별 분포
    console.log('\n🎯 QB 선수들의 팀별 분포:');
    const qbByTeam = await Player.aggregate([
      { $match: { position: 'QB' } },
      { $group: { _id: '$teamName', count: { $sum: 1 }, players: { $push: { name: '$name', jerseyNumber: '$jerseyNumber' } } } },
      { $sort: { count: -1 } }
    ]);
    
    qbByTeam.forEach(team => {
      console.log(`\n🏈 ${team._id}: ${team.count}명`);
      team.players.forEach(player => {
        console.log(`   - ${player.jerseyNumber}번 ${player.name}`);
      });
    });

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

checkTeams();