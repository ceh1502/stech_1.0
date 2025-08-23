const fs = require('fs');

// 팀 정보
const teams = [
  { code: "KK", name: "KKRagingBulls", fullName: "건국대" },
  { code: "KH", name: "KHCommanders", fullName: "경희대" },
  { code: "SN", name: "SNGreenTerrors", fullName: "서울대" },
  { code: "US", name: "USCityhawks", fullName: "서울시립대" },
  { code: "DG", name: "DGTuskers", fullName: "동국대" },
  { code: "KM", name: "KMRazorbacks", fullName: "국민대" },
  { code: "YS", name: "YSEagles", fullName: "연세대" },
  { code: "KU", name: "KUTigers", fullName: "고려대" },
  { code: "HI", name: "HICowboys", fullName: "홍익대" },
  { code: "SS", name: "SSCrusaders", fullName: "숭실대" }
];

// 한국 흔한 성씨와 이름
const surnames = ["김", "이", "박", "최", "정", "강", "조", "윤", "장", "임", "한", "오", "서", "신", "권", "황", "안", "송", "류", "전"];
const names = ["민수", "정호", "철수", "영수", "태현", "길동", "상민", "동원", "재민", "현우", "지훈", "성민", "준혁", "도현", "시우", "예준", "서준", "하준", "주원", "우진", "건우", "현준", "민준", "지후", "승우", "준서", "유준", "정민", "영준", "수호"];

// 포지션별 배치 (0-99번)
const positionMap = {
  // QB (0-9)
  0: "QB", 1: "QB", 2: "K", 3: "P", 4: "WR", 5: "WR", 6: "WR", 7: "LB", 8: "WR", 9: "WR",
  // RB (10-19)
  10: "RB", 11: "RB", 12: "RB", 13: "RB", 14: "WR", 15: "WR", 16: "QB", 17: "DB", 18: "K", 19: "P",
  // WR (20-39)
  20: "WR", 21: "WR", 22: "WR", 23: "RB", 24: "WR", 25: "RB", 26: "DB", 27: "RB", 28: "WR", 29: "WR",
  30: "WR", 31: "WR", 32: "WR", 33: "WR", 34: "WR", 35: "WR", 36: "WR", 37: "WR", 38: "WR", 39: "WR",
  // LB/DB (40-59)
  40: "LB", 41: "LB", 42: "LB", 43: "LB", 44: "LB", 45: "LB", 46: "LB", 47: "RB", 48: "LB", 49: "LB",
  50: "LB", 51: "LB", 52: "DL", 53: "LB", 54: "LB", 55: "OL", 56: "DL", 57: "LB", 58: "DL", 59: "LB",
  // OL (60-79)
  60: "OL", 61: "DL", 62: "OL", 63: "OL", 64: "OL", 65: "OL", 66: "OL", 67: "OL", 68: "OL", 69: "OL",
  70: "OL", 71: "OL", 72: "OL", 73: "OL", 74: "OL", 75: "DL", 76: "OL", 77: "OL", 78: "DL", 79: "OL",
  // DL/TE (80-99)
  80: "TE", 81: "TE", 82: "TE", 83: "TE", 84: "TE", 85: "DL", 86: "TE", 87: "TE", 88: "TE", 89: "TE",
  90: "DL", 91: "DL", 92: "DL", 93: "DL", 94: "DL", 95: "DL", 96: "DL", 97: "DL", 98: "DL", 99: "DL"
};

// 포지션별 체격 설정
function getPhysical(position) {
  switch(position) {
    case "QB": return { height: "180-185cm", weight: "75-80kg" };
    case "RB": return { height: "170-178cm", weight: "70-78kg" };
    case "WR": return { height: "175-185cm", weight: "70-78kg" };
    case "TE": return { height: "185-195cm", weight: "85-95kg" };
    case "OL": return { height: "185-195cm", weight: "100-120kg" };
    case "DL": return { height: "185-195cm", weight: "95-115kg" };
    case "LB": return { height: "180-190cm", weight: "80-90kg" };
    case "DB": return { height: "170-180cm", weight: "70-80kg" };
    case "K": case "P": return { height: "175-180cm", weight: "70-75kg" };
    default: return { height: "175-185cm", weight: "75-85kg" };
  }
}

function getRandomHeight(range) {
  const [min, max] = range.split('-').map(s => parseInt(s));
  return (min + Math.floor(Math.random() * (max - min + 1))) + "cm";
}

function getRandomWeight(range) {
  const [min, max] = range.split('-').map(s => parseInt(s));
  return (min + Math.floor(Math.random() * (max - min + 1))) + "kg";
}

function getRandomGrade() {
  const grades = ["1학년", "2학년", "3학년", "4학년"];
  return grades[Math.floor(Math.random() * grades.length)];
}

// 모든 선수 생성
const allPlayers = [];

teams.forEach(team => {
  for (let jerseyNumber = 0; jerseyNumber <= 99; jerseyNumber++) {
    const position = positionMap[jerseyNumber];
    const physical = getPhysical(position);
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    
    const player = {
      playerId: `${team.code}${jerseyNumber.toString().padStart(2, '0')}`,
      name: surname + name,
      jerseyNumber: jerseyNumber,
      position: position,
      teamName: team.name,
      league: "1부",
      season: "2024",
      height: getRandomHeight(physical.height),
      weight: getRandomWeight(physical.weight),
      grade: getRandomGrade()
    };
    
    allPlayers.push(player);
  }
});

// JSON 파일로 저장
const output = {
  totalPlayers: allPlayers.length,
  teams: teams.length,
  playersPerTeam: 100,
  players: allPlayers
};

fs.writeFileSync('all-teams-players-complete.json', JSON.stringify(output, null, 2), 'utf8');
console.log(`✅ 총 ${allPlayers.length}명의 선수 데이터가 생성되었습니다!`);
console.log(`📁 파일 저장: all-teams-players-complete.json`);

// 팀별 통계 출력
teams.forEach(team => {
  const teamPlayers = allPlayers.filter(p => p.teamName === team.name);
  console.log(`${team.fullName}(${team.name}): ${teamPlayers.length}명`);
});