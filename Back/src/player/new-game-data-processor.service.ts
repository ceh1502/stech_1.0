import { Injectable } from '@nestjs/common';

export interface ProcessedClip {
  clipKey: string;
  offensiveTeam: string;
  quarter: number;
  down: string | null;
  toGoYard: number | null;
  playType: string;
  specialTeam: boolean;
  start: { side: string; yard: number };
  end: { side: string; yard: number };
  gainYard: number;
  car: { num: number; pos: string } | null;
  car2: { num: number; pos: string } | null;
  tkl: { num: number; pos: string } | null;
  tkl2: { num: number; pos: string } | null;
  significantPlays: (string | null)[];
  actualOffensiveTeam: string;
  actualDefensiveTeam: string;
}

export interface ProcessedGameData {
  gameKey: string;
  homeTeam: string;
  awayTeam: string;
  processedClips: ProcessedClip[];
}

@Injectable()
export class NewGameDataProcessorService {
  
  processGameData(gameData: any): ProcessedGameData {
    const { gameKey, homeTeam, awayTeam, Clips } = gameData;
    
    console.log(`게임 데이터 전처리 시작 - ${gameKey}: ${homeTeam} vs ${awayTeam}`);
    console.log(`총 클립 수: ${Clips.length}개`);
    
    const processedClips: ProcessedClip[] = Clips.map((clip: any) => {
      // offensiveTeam을 실제 팀명으로 매핑
      const actualOffensiveTeam = clip.offensiveTeam === "Home" ? homeTeam : awayTeam;
      const actualDefensiveTeam = clip.offensiveTeam === "Home" ? awayTeam : homeTeam;
      
      return {
        clipKey: clip.clipKey,
        offensiveTeam: clip.offensiveTeam,
        quarter: clip.quarter,
        down: clip.down,
        toGoYard: clip.toGoYard,
        playType: clip.playType,
        specialTeam: clip.specialTeam,
        start: clip.start,
        end: clip.end,
        gainYard: clip.gainYard,
        car: clip.car,
        car2: clip.car2,
        tkl: clip.tkl,
        tkl2: clip.tkl2,
        significantPlays: clip.significantPlays,
        actualOffensiveTeam,
        actualDefensiveTeam
      };
    });
    
    console.log(`전처리 완료 - ${processedClips.length}개 클립`);
    
    return {
      gameKey,
      homeTeam,
      awayTeam,
      processedClips
    };
  }

  findAllQBs(processedClips: ProcessedClip[]): Map<string, { jerseyNumber: number; teamName: string }> {
    const qbMap = new Map();
    
    for (const clip of processedClips) {
      // car에서 QB 찾기
      if (clip.car?.pos === 'QB') {
        const key = `${clip.actualOffensiveTeam}-${clip.car.num}`;
        if (!qbMap.has(key)) {
          qbMap.set(key, {
            jerseyNumber: clip.car.num,
            teamName: clip.actualOffensiveTeam
          });
        }
      }
      
      // car2에서 QB 찾기
      if (clip.car2?.pos === 'QB') {
        const key = `${clip.actualOffensiveTeam}-${clip.car2.num}`;
        if (!qbMap.has(key)) {
          qbMap.set(key, {
            jerseyNumber: clip.car2.num,
            teamName: clip.actualOffensiveTeam
          });
        }
      }
    }
    
    console.log(`발견된 QB 수: ${qbMap.size}명`);
    for (const [key, qbInfo] of qbMap) {
      console.log(`  - ${qbInfo.teamName} ${qbInfo.jerseyNumber}번 QB`);
    }
    
    return qbMap;
  }

  filterClipsForPlayer(processedClips: ProcessedClip[], jerseyNumber: number, teamName: string): ProcessedClip[] {
    return processedClips.filter(clip => {
      // 해당 팀이 공격팀일 때만
      if (clip.actualOffensiveTeam !== teamName) return false;
      
      // car 또는 car2에 해당 등번호가 있는지 확인
      const isPlayerInCar = clip.car?.num === jerseyNumber;
      const isPlayerInCar2 = clip.car2?.num === jerseyNumber;
      
      return isPlayerInCar || isPlayerInCar2;
    });
  }
}