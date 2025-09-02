const gameData = {
  "gameKey":"DB",
  "date":"2023-04-06(목) 03:30",
  "type":"League",
  "score":{"home":null,"away":null},
  "region":"Seoul",
  "location":null,
  "homeTeam":"HYLions",
  "awayTeam":"SNGreenTerrors",
  "Clips": [
    {
      "clipKey":"9",
      "offensiveTeam":"Away",
      "quarter":1,
      "down":"1",
      "toGoYard":10,
      "playType":"RETURN",
      "specialTeam":false,
      "start": {"side":"OWN","yard":25},
      "end": {"side":"OWN","yard":35},
      "gainYard":10,
      "car": {"num":3,"pos":"DB"},
      "car2": {"num":null,"pos":null},
      "tkl": {"num":null,"pos":null},
      "tkl2": {"num":null,"pos":null},
      "significantPlays": ["TOUCHDOWN","KICKOFF",null,null]
    },
    {
      "clipKey":"9",
      "offensiveTeam":"Away",
      "quarter":1,
      "down":"1",
      "toGoYard":10,
      "playType":"RETURN",
      "specialTeam":false,
      "start": {"side":"OWN","yard":25},
      "end": {"side":"OWN","yard":28},
      "gainYard":3,
      "car": {"num":3,"pos":"DB"},
      "car2": {"num":null,"pos":null},
      "tkl": {"num":null,"pos":null},
      "tkl2": {"num":null,"pos":null},
      "significantPlays": ["KICKOFF",null,null,null]
    },
    {
      "clipKey":"10",
      "offensiveTeam":"Away",
      "quarter":1,
      "down":"1",
      "toGoYard":10,
      "playType":"RETURN",
      "specialTeam":false,
      "start": {"side":"OWN","yard":25},
      "end": {"side":"OWN","yard":35},
      "gainYard":10,
      "car": {"num":3,"pos":"DB"},
      "car2": {"num":null,"pos":null},
      "tkl": {"num":null,"pos":null},
      "tkl2": {"num":null,"pos":null},
      "significantPlays": ["PUNT","TOUCHDOWN",null,null]
    },
    {
      "clipKey":"10",
      "offensiveTeam":"Away",
      "quarter":1,
      "down":"1",
      "toGoYard":10,
      "playType":"RETURN",
      "specialTeam":false,
      "start": {"side":"OWN","yard":25},
      "end": {"side":"OWN","yard":28},
      "gainYard":3,
      "car": {"num":3,"pos":"DB"},
      "car2": {"num":null,"pos":null},
      "tkl": {"num":null,"pos":null},
      "tkl2": {"num":null,"pos":null},
      "significantPlays": ["PUNT",null,null,null]
    }
  ]
};

// DB3의 스페셜팀 스탯 계산 시뮬레이션
const dbStatsMap = new Map();

function getDBKey(jerseyNumber, offensiveTeam, gameData, role) {
  let teamName;
  
  if (role === 'car' || role === 'car2') {
    // 스페셜팀(리턴)일 때: 공격팀 소속
    teamName = offensiveTeam === 'Home' ? gameData.homeTeam : gameData.awayTeam;
  } else {
    // 수비일 때: 수비팀 소속
    teamName = offensiveTeam === 'Home' ? gameData.awayTeam : gameData.homeTeam;
  }
  
  return `${teamName}_DB_${jerseyNumber}`;
}

function initializeDBStats(jerseyNumber, teamName) {
  return {
    jerseyNumber,
    teamName,
    kickoffReturn: 0,
    kickoffReturnYard: 0,
    puntReturn: 0,
    puntReturnYard: 0,
    kickoffReturnTouchdowns: 0,
    puntReturnTouchdowns: 0
  };
}

console.log('DB3 스페셜팀 스탯 계산 시뮬레이션:\n');

gameData.Clips.forEach((clip, index) => {
  console.log(`클립 ${index + 1}: clipKey=${clip.clipKey}, offensiveTeam=${clip.offensiveTeam}`);
  console.log(`  car: ${clip.car?.num}(${clip.car?.pos})`);
  console.log(`  playType: ${clip.playType}, significantPlays: [${clip.significantPlays.join(', ')}]`);
  
  // car에 DB가 있는지 확인
  if (clip.car?.pos === 'DB') {
    const dbPlayer = { number: clip.car.num, role: 'car' };
    const dbKey = getDBKey(dbPlayer.number, clip.offensiveTeam, gameData, dbPlayer.role);
    
    console.log(`  → DB Key: ${dbKey}`);
    
    if (!dbStatsMap.has(dbKey)) {
      const teamName = clip.offensiveTeam === 'Home' ? gameData.homeTeam : gameData.awayTeam;
      dbStatsMap.set(dbKey, initializeDBStats(dbPlayer.number, teamName));
      console.log(`  → 새 DB 선수 초기화: ${dbKey}`);
    }
    
    const dbStats = dbStatsMap.get(dbKey);
    
    // 스페셜팀 스탯 처리
    if (clip.playType?.toUpperCase() === 'RETURN') {
      const significantPlays = clip.significantPlays || [];
      const hasKickoff = significantPlays.includes('KICKOFF');
      const hasPunt = significantPlays.includes('PUNT');
      const gainYard = clip.gainYard || 0;

      if (hasKickoff) {
        dbStats.kickoffReturn++;
        dbStats.kickoffReturnYard += gainYard;
        console.log(`  → 킥오프 리턴 +1, 야드 +${gainYard}`);
        
        if (significantPlays.includes('TOUCHDOWN')) {
          dbStats.kickoffReturnTouchdowns++;
          console.log(`  → 킥오프 리턴 TD +1`);
        }
      }

      if (hasPunt) {
        dbStats.puntReturn++;
        dbStats.puntReturnYard += gainYard;
        console.log(`  → 펀트 리턴 +1, 야드 +${gainYard}`);
        
        if (significantPlays.includes('TOUCHDOWN')) {
          dbStats.puntReturnTouchdowns++;
          console.log(`  → 펀트 리턴 TD +1`);
        }
      }
    }
  }
  console.log('');
});

console.log('최종 결과:');
for (const [key, stats] of dbStatsMap) {
  console.log(`${key}:`);
  console.log(`  킥오프리턴: ${stats.kickoffReturn}회, ${stats.kickoffReturnYard}야드, TD: ${stats.kickoffReturnTouchdowns}`);
  console.log(`  펀트리턴: ${stats.puntReturn}회, ${stats.puntReturnYard}야드, TD: ${stats.puntReturnTouchdowns}`);
}