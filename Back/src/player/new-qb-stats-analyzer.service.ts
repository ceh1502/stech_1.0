import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NewPlayer, NewPlayerDocument } from '../schemas/new-player.schema';

interface ProcessedClip {
  clipKey: string;
  offensiveTeam: string;
  playType: string;
  gainYard: number;
  car: { num: number; pos: string } | null;
  car2: { num: number; pos: string } | null;
  significantPlays: (string | null)[];
  actualOffensiveTeam: string;
  actualDefensiveTeam: string;
}

interface QBStats {
  qbPassingAttempts: number;
  qbPassingCompletions: number;
  qbCompletionPercentage: number;
  qbPassingYards: number;
  qbPassingTouchdowns: number;
  qbPassingInterceptions: number;
  qbLongestPass: number;
  qbSacks: number;
  gamesPlayed: number;
}

@Injectable()
export class NewQbStatsAnalyzerService {
  constructor(
    @InjectModel(NewPlayer.name) private playerModel: Model<NewPlayerDocument>,
  ) {}

  async analyzeQBFromClips(clips: ProcessedClip[], jerseyNumber: number, teamName: string): Promise<QBStats> {
    // 해당 등번호의 QB 클립만 필터링 (DB position 무시, 클립의 pos만 확인)
    const qbClips = this.filterQBClips(clips, jerseyNumber);
    
    if (qbClips.length === 0) {
      throw new Error(`${teamName} ${jerseyNumber}번의 QB 플레이 클립이 없습니다.`);
    }

    console.log(`${teamName} ${jerseyNumber}번 QB 클립 ${qbClips.length}개 분석 시작`);

    // QB 통계 계산
    const stats = this.calculateQBStats(qbClips);

    // 데이터베이스 업데이트 (DB의 position 필드 무시)
    await this.updateQBStatsInDB(jerseyNumber, teamName, stats);

    return stats;
  }

  private filterQBClips(clips: ProcessedClip[], jerseyNumber: number): ProcessedClip[] {
    return clips.filter(clip => {
      // 클립의 car.pos가 'QB'이면서 등번호가 일치하는 경우
      const isQBInCar = clip.car?.num === jerseyNumber && clip.car?.pos === 'QB';
      const isQBInCar2 = clip.car2?.num === jerseyNumber && clip.car2?.pos === 'QB';
      
      return isQBInCar || isQBInCar2;
    });
  }

  private calculateQBStats(clips: ProcessedClip[]): QBStats {
    let qbPassingAttempts = 0;
    let qbPassingCompletions = 0;
    let qbPassingYards = 0;
    let qbPassingTouchdowns = 0;
    let qbPassingInterceptions = 0;
    let qbLongestPass = 0;
    let qbSacks = 0;

    for (const clip of clips) {
      console.log(`클립 분석: ${clip.playType}, 야드: ${clip.gainYard}, 특수: ${JSON.stringify(clip.significantPlays)}`);

      // 패스 시도 (PASS, NOPASS)
      if (clip.playType === 'PASS' || clip.playType === 'NOPASS') {
        qbPassingAttempts++;
      }

      // 패스 성공 및 야드 (PASS만)
      if (clip.playType === 'PASS') {
        qbPassingCompletions++;
        qbPassingYards += clip.gainYard;
        
        if (clip.gainYard > qbLongestPass) {
          qbLongestPass = clip.gainYard;
        }
      }

      // 색 (SACK)
      if (clip.playType === 'SACK') {
        qbSacks++;
      }

      // 특수 플레이 처리
      const hasSignificantPlay = clip.significantPlays && 
        Array.isArray(clip.significantPlays) && 
        clip.significantPlays.some(play => play !== null);

      if (hasSignificantPlay) {
        const plays = clip.significantPlays.filter(play => play !== null);
        
        for (const play of plays) {
          if (play === 'TOUCHDOWN' && clip.playType === 'PASS') {
            qbPassingTouchdowns++;
          } else if (play === 'INTERCEPT' || play === 'INTERCEPTION') {
            qbPassingInterceptions++;
          } else if (play === 'SACK') {
            qbSacks++;
          }
        }
      }
    }

    const qbCompletionPercentage = qbPassingAttempts > 0 
      ? Math.round((qbPassingCompletions / qbPassingAttempts) * 100) 
      : 0;

    console.log(`계산 결과: 시도 ${qbPassingAttempts}, 성공 ${qbPassingCompletions}, 야드 ${qbPassingYards}, TD ${qbPassingTouchdowns}`);

    return {
      qbPassingAttempts,
      qbPassingCompletions,
      qbCompletionPercentage,
      qbPassingYards,
      qbPassingTouchdowns,
      qbPassingInterceptions,
      qbLongestPass,
      qbSacks,
      gamesPlayed: 1
    };
  }

  private async updateQBStatsInDB(jerseyNumber: number, teamName: string, stats: QBStats): Promise<void> {
    // DB에서 등번호와 팀명으로만 찾기 (position 무시)
    const player = await this.playerModel.findOne({ 
      jerseyNumber: jerseyNumber, 
      teamName: teamName 
    });

    if (!player) {
      throw new Error(`선수를 찾을 수 없습니다: ${teamName} ${jerseyNumber}번`);
    }

    // stats 필드가 없으면 빈 객체로 초기화
    if (!player.stats) {
      player.stats = {};
    }

    // QB 스탯 누적 업데이트
    player.stats.qbPassingAttempts = (player.stats.qbPassingAttempts || 0) + stats.qbPassingAttempts;
    player.stats.qbPassingCompletions = (player.stats.qbPassingCompletions || 0) + stats.qbPassingCompletions;
    player.stats.qbPassingYards = (player.stats.qbPassingYards || 0) + stats.qbPassingYards;
    player.stats.qbPassingTouchdowns = (player.stats.qbPassingTouchdowns || 0) + stats.qbPassingTouchdowns;
    player.stats.qbPassingInterceptions = (player.stats.qbPassingInterceptions || 0) + stats.qbPassingInterceptions;
    player.stats.qbSacks = (player.stats.qbSacks || 0) + stats.qbSacks;
    player.stats.gamesPlayed = (player.stats.gamesPlayed || 0) + stats.gamesPlayed;

    // 최장 패스 갱신
    if (stats.qbLongestPass > (player.stats.qbLongestPass || 0)) {
      player.stats.qbLongestPass = stats.qbLongestPass;
    }

    // 패스 성공률 재계산
    player.stats.qbCompletionPercentage = player.stats.qbPassingAttempts > 0 
      ? Math.round((player.stats.qbPassingCompletions / player.stats.qbPassingAttempts) * 100) 
      : 0;

    await player.save();
    
    console.log(`DB 업데이트 완료: ${teamName} ${jerseyNumber}번 - QB 패싱 야드 ${player.stats.qbPassingYards}`);
  }
}