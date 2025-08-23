import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { NewClipDto } from '../common/dto/new-clip.dto';

// Defensive Lineman 스탯 인터페이스 정의
export interface DLStats {
  games: number;
  tackles: number;
  sacks: number;
  tacklesForLoss: number; // TFL 추가
  forcedFumbles: number;
  fumbleRecovery: number;
  fumbleRecoveredYards: number;
  passDefended: number;
  interception: number;
  interceptionYards: number;
  touchdown: number;
}


@Injectable()
export class DLStatsAnalyzerService {
  constructor(
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
  ) {}
  
  // 필드 포지션 기반 야드 계산 (디펜스 리턴용)
  private calculateYards(startYard: number, startSide: string, endYard: number, endSide: string): number {
    // 시작과 끝이 같은 사이드인 경우
    if (startSide === endSide) {
      if (startSide === 'own') {
        return endYard - startYard; // own side에서는 야드가 클수록 전진
      } else {
        return startYard - endYard; // opp side에서는 야드가 작을수록 전진
      }
    }
    
    // 사이드를 넘나든 경우 (own -> opp 또는 opp -> own)
    if (startSide === 'own' && endSide === 'opp') {
      return (50 - startYard) + (50 - endYard); // own에서 50까지 + opp에서 50까지
    } else {
      return (50 - startYard) + (50 - endYard); // 반대의 경우도 동일한 계산
    }
  }

  // 클립 데이터에서 DL 스탯 추출
  async analyzeDLStats(clips: NewClipDto[], playerId: string): Promise<DLStats> {
    const dlStats: DLStats = {
      games: 0,
      tackles: 0,
      sacks: 0,
      tacklesForLoss: 0,
      forcedFumbles: 0,
      fumbleRecovery: 0,
      fumbleRecoveredYards: 0,
      passDefended: 0,
      interception: 0,
      interceptionYards: 0,
      touchdown: 0
    };

    const gameIds = new Set(); // 경기 수 계산용

    // Player DB에서 해당 선수 정보 미리 조회 (jerseyNumber로 검색)
    const player = await this.playerModel.findOne({ 
      jerseyNumber: parseInt(playerId)
    });
    if (!player) {
      throw new Error(`등번호 ${playerId}번 선수를 찾을 수 없습니다.`);
    }

    for (const clip of clips) {
      // 게임 ID 추가 (경기 수 계산)
      if (clip.clipKey) {
        gameIds.add(clip.clipKey);
      }

      // NewClipDto 구조 지원 - tkl, tkl2에서 찾기
      const isDefender = this.isPlayerInDefense(clip, playerId);
      
      if (!isDefender) {
        continue; // 이 클립은 해당 DL 플레이가 아님
      }

      // SignificantPlays 기반 스탯 분석
      this.analyzeSignificantPlaysNew(clip, dlStats, playerId);

      // 기본 디펜시브 플레이 분석
      this.analyzeBasicDefensivePlay(clip, dlStats, playerId);
    }

    // 계산된 스탯 업데이트
    dlStats.games = gameIds.size;

    return dlStats;
  }

  // NewClipDto에서 해당 선수가 수비에 참여했는지 확인
  private isPlayerInDefense(clip: any, playerId: string): boolean {
    // tkl, tkl2에서 해당 선수 찾기 (DL 분석기에서 호출되므로 포지션 무관하게 수비 참여만 확인)
    const playerNum = parseInt(playerId);
    
    return (clip.tkl?.num === playerNum) || (clip.tkl2?.num === playerNum);
  }

  // 새로운 SignificantPlays 기반 스탯 분석
  private analyzeSignificantPlaysNew(clip: any, stats: DLStats, playerId: string): void {
    if (!clip.significantPlays) return;

    const playerNum = parseInt(playerId);
    const isThisPlayerTackler = (clip.tkl?.num === playerNum) || (clip.tkl2?.num === playerNum);

    clip.significantPlays.forEach((play: string | null) => {
      if (!play || !isThisPlayerTackler) return;

      switch (play) {
        case 'SACK':
          // Sack할 때는 sacks, tackles 증가
          stats.sacks += 1;
          stats.tackles += 1;
          break;

        case 'TFL':
          // TFL (Tackle For Loss)
          stats.tackles += 1;
          break;

        case 'FUMBLE':
          // 펌블을 유발한 경우
          stats.forcedFumbles += 1;
          stats.tackles += 1; // 펌블 상황에서도 tackle 증가
          break;

        case 'FUMBLERECDEF':
          // 수비가 펌블을 리커버한 경우
          stats.fumbleRecovery += 1;
          stats.tackles += 1;
          // 펌블 리커버 야드 계산
          if (clip.gainYard && clip.gainYard > 0) {
            stats.fumbleRecoveredYards += clip.gainYard;
          }
          break;

        case 'INTERCEPT':
          // 인터셉션한 경우
          stats.interception += 1;
          // 인터셉션 리턴 야드 계산
          if (clip.gainYard && clip.gainYard > 0) {
            stats.interceptionYards += clip.gainYard;
          }
          break;

        case 'TOUCHDOWN':
          // 수비 터치다운 (인터셉션 리턴 TD, 펌블 리커버 TD 등)
          stats.touchdown += 1;
          break;
      }
    });
  }

  // 기본 디펜시브 플레이 분석 (일반적인 Run/Pass 상황에서의 tackle)
  private analyzeBasicDefensivePlay(clip: any, stats: DLStats, playerId: string): void {
    const playerNum = parseInt(playerId);
    const isThisPlayerTackler = (clip.tkl?.num === playerNum) || (clip.tkl2?.num === playerNum);

    if (!isThisPlayerTackler) return;

    // SignificantPlays에서 이미 처리된 경우가 아니라면 기본 tackle 추가
    const hasSpecialPlay = clip.significantPlays?.some((play: string | null) => 
      play === 'SACK' || play === 'TFL' || play === 'FUMBLE' || play === 'FUMBLERECDEF' || play === 'INTERCEPT'
    );

    if (!hasSpecialPlay) {
      // 일반적인 Run/Pass 상황에서의 tackle
      if (clip.playType === 'RUN' || clip.playType === 'PASS') {
        stats.tackles += 1;
      }
    }

    // Pass Defended 체크 (Incomplete Pass에서)
    if (clip.playType === 'PASS') {
      const isIncomplete = clip.significantPlays?.includes('INCOMPLETE') || 
                          clip.gainYard === 0;
      if (isIncomplete && isThisPlayerTackler) {
        stats.passDefended += 1;
      }
    }
  }

  // 샘플 클립 데이터로 테스트
  async generateSampleDLStats(playerId: string = 'DL001'): Promise<DLStats> {
    const sampleClips: NewClipDto[] = [
      {
        clipKey: 'SAMPLE_GAME_1',
        quarter: 1,
        offensiveTeam: 'Home',
        playType: 'PASS',
        specialTeam: false,
        down: '1',
        toGoYard: 10,
        start: { side: 'own', yard: 25 },
        end: { side: 'own', yard: 30 },
        gainYard: 5,
        car: { num: 12, pos: 'QB' },
        car2: { num: null, pos: null },
        tkl: { num: 95, pos: 'DL' },
        tkl2: { num: null, pos: null },
        significantPlays: [null, null, null, null]
      },
      {
        clipKey: 'SAMPLE_GAME_1',
        quarter: 2,
        offensiveTeam: 'Home',
        playType: 'PASS',
        specialTeam: false,
        down: '2',
        toGoYard: 7,
        start: { side: 'own', yard: 30 },
        end: { side: 'own', yard: 25 },
        gainYard: -5,
        car: { num: 12, pos: 'QB' },
        car2: { num: null, pos: null },
        tkl: { num: 95, pos: 'DL' },
        tkl2: { num: null, pos: null },
        significantPlays: ['SACK', null, null, null]
      },
      {
        clipKey: 'SAMPLE_GAME_1',
        quarter: 3,
        offensiveTeam: 'Home',
        playType: 'RUN',
        specialTeam: false,
        down: '1',
        toGoYard: 10,
        start: { side: 'own', yard: 35 },
        end: { side: 'own', yard: 32 },
        gainYard: -3,
        car: { num: 22, pos: 'RB' },
        car2: { num: null, pos: null },
        tkl: { num: 95, pos: 'DL' },
        tkl2: { num: null, pos: null },
        significantPlays: ['TFL', null, null, null]
      }
    ];

    const result = await this.analyzeDLStats(sampleClips, playerId);
    return result;
  }
}