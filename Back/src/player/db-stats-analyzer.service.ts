import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { NewClipDto } from '../common/dto/new-clip.dto';

// Defensive Back 스탯 인터페이스 정의
export interface DBStats {
  // Defense category
  gamesPlayed: number; // 경기 수
  tackles: number; // 태클 수
  sacks: number; // 색 수
  forced_fumbles: number; // 펀블 유도 수
  fumble_recovery: number; // 펀블 리커버리 수
  fumble_recovered_yards: number; // 펀블 리커버리 야드
  pass_defended: number; // 패스를 막은 수
  interceptions: number; // 인터셉션
  interception_yards: number; // 인터셉션 야드
  touchdowns: number; // 수비 터치다운
  // ST category
  kick_returns: number; // 킥 리턴 시도 수
  kick_return_yards: number; // 킥 리턴 야드
  yards_per_kick_return: number; // 킥 리턴 시도 당 리턴 야드
  punt_returns: number; // 펐트 리턴 시도 수
  punt_return_yards: number; // 펐트 리턴 야드
  yards_per_punt_return: number; // 펐트 리턴 시도 당 리턴 야드
  return_td: number; // 리턴 터치다운
}


@Injectable()
export class DBStatsAnalyzerService {
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

  // 클립 데이터에서 DB 스탯 추출
  async analyzeDBStats(clips: NewClipDto[], playerId: string): Promise<DBStats> {
    const dbStats: DBStats = {
      gamesPlayed: 0,
      tackles: 0,
      sacks: 0,
      forced_fumbles: 0,
      fumble_recovery: 0,
      fumble_recovered_yards: 0,
      pass_defended: 0,
      interceptions: 0,
      interception_yards: 0,
      touchdowns: 0,
      kick_returns: 0,
      kick_return_yards: 0,
      yards_per_kick_return: 0,
      punt_returns: 0,
      punt_return_yards: 0,
      yards_per_punt_return: 0,
      return_td: 0
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

      // 이 클립에서 해당 DB가 참여했는지 확인 (수비 또는 스페셜팀)
      const isDefender = this.isPlayerInDefense(clip, playerId);
      const isSTPlayer = this.isPlayerInSpecialTeams(clip, playerId);
      
      if (!isDefender && !isSTPlayer) {
        continue; // 이 클립은 해당 DB 플레이가 아님
      }

      // 수비 플레이 분석
      if (isDefender) {
        // SignificantPlays 기반 스탯 분석
        this.analyzeSignificantPlaysNew(clip, dbStats, playerId);
        // 기본 디펜시브 플레이 분석
        this.analyzeBasicDefensivePlay(clip, dbStats, playerId);
      }
      
      // 스페셜팀 플레이 분석
      if (isSTPlayer) {
        this.analyzeSpecialTeamsPlay(clip, dbStats, playerId);
      }
    }

    // 계산된 스탯 업데이트
    dbStats.gamesPlayed = (player.stats?.gamesPlayed || 0) + 1;
    dbStats.yards_per_kick_return = dbStats.kick_returns > 0
      ? Math.round((dbStats.kick_return_yards / dbStats.kick_returns) * 10) / 10
      : 0;
    dbStats.yards_per_punt_return = dbStats.punt_returns > 0
      ? Math.round((dbStats.punt_return_yards / dbStats.punt_returns) * 10) / 10
      : 0;

    return dbStats;
  }

  // NewClipDto에서 해당 선수가 수비에 참여했는지 확인
  private isPlayerInDefense(clip: any, playerId: string): boolean {
    // tkl, tkl2에서 해당 선수 찾기
    const playerNum = parseInt(playerId);
    
    return (clip.tkl?.num === playerNum && clip.tkl?.pos === 'DB') ||
           (clip.tkl2?.num === playerNum && clip.tkl2?.pos === 'DB');
  }

  // 새로운 SignificantPlays 기반 스탯 분석
  private analyzeSignificantPlaysNew(clip: any, stats: DBStats, playerId: string): void {
    if (!clip.significantPlays) return;

    const playerNum = parseInt(playerId);
    const isThisPlayerTackler = (clip.tkl?.num === playerNum && clip.tkl?.pos === 'DB') ||
                                (clip.tkl2?.num === playerNum && clip.tkl2?.pos === 'DB');

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
          stats.forced_fumbles += 1;
          stats.tackles += 1; // 펌블 상황에서도 tackle 증가
          break;

        case 'FUMBLERECDEF':
          // 수비가 펌블을 리커버한 경우
          stats.fumble_recovery += 1;
          stats.tackles += 1;
          // 펌블 리커버 야드 계산
          if (clip.gainYard && clip.gainYard > 0) {
            stats.fumble_recovered_yards += clip.gainYard;
          }
          break;

        case 'INTERCEPT':
          // 인터셉션한 경우
          stats.interceptions += 1;
          // 인터셉션 리턴 야드 계산
          if (clip.gainYard && clip.gainYard > 0) {
            stats.interception_yards += clip.gainYard;
          }
          break;

        case 'TOUCHDOWN':
          // 수비 터치다운 (인터셉션 리턴 TD, 펌블 리커버 TD 등)
          stats.touchdowns += 1;
          break;
      }
    });
  }

  // 기본 디펜시브 플레이 분석 (일반적인 Run/Pass 상황에서의 tackle)
  private analyzeBasicDefensivePlay(clip: any, stats: DBStats, playerId: string): void {
    const playerNum = parseInt(playerId);
    const isThisPlayerTackler = (clip.tkl?.num === playerNum && clip.tkl?.pos === 'DB') ||
                                (clip.tkl2?.num === playerNum && clip.tkl2?.pos === 'DB');

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
        stats.pass_defended += 1;
      }
    }
  }

  // NewClipDto에서 해당 선수가 특수팀에 참여했는지 확인
  private isPlayerInSpecialTeams(clip: any, playerId: string): boolean {
    // car, car2에서 해당 선수 찾기 (킥/펀트 리턴)
    const playerNum = parseInt(playerId);
    
    return ((clip.car?.num === playerNum && clip.car?.pos === 'DB') ||
            (clip.car2?.num === playerNum && clip.car2?.pos === 'DB')) &&
           (clip.playType === 'Kickoff' || clip.playType === 'Punt');
  }

  // 특수팀 플레이 분석
  private analyzeSpecialTeamsPlay(clip: any, stats: DBStats, playerId: string): void {
    const playerNum = parseInt(playerId);
    const isThisPlayerCarrier = (clip.car?.num === playerNum && clip.car?.pos === 'DB') ||
                                (clip.car2?.num === playerNum && clip.car2?.pos === 'DB');

    if (!isThisPlayerCarrier) return;

    const gainYard = clip.gainYard || 0;
    const hasTouchdown = clip.significantPlays?.includes('TOUCHDOWN');

    // 킥오프 리턴
    if (clip.playType === 'Kickoff') {
      stats.kick_returns += 1;
      stats.kick_return_yards += gainYard;
      
      if (hasTouchdown) {
        stats.return_td += 1;
      }
    }
    
    // 펀트 리턴
    else if (clip.playType === 'Punt') {
      stats.punt_returns += 1;
      stats.punt_return_yards += gainYard;
      
      if (hasTouchdown) {
        stats.return_td += 1;
      }
    }
  }

  // 샘플 클립 데이터로 테스트
  async generateSampleDBStats(playerId: string = 'DB001'): Promise<DBStats> {
    const sampleClips: NewClipDto[] = [
      {
        clipKey: 'SAMPLE_GAME_1',
        offensiveTeam: 'Home',
        quarter: 1,
        down: '1',
        toGoYard: 10,
        playType: 'PASS',
        specialTeam: false,
        start: { side: 'OWN', yard: 25 },
        end: { side: 'OWN', yard: 35 },
        gainYard: 0, // Incomplete pass
        car: { num: null, pos: null },
        car2: { num: null, pos: null },
        tkl: { num: parseInt(playerId), pos: 'DB' },
        tkl2: { num: null, pos: null },
        significantPlays: ['INCOMPLETE', null, null, null]
      },
      {
        clipKey: 'SAMPLE_GAME_1',
        offensiveTeam: 'Home',
        quarter: 2,
        down: '2',
        toGoYard: 5,
        playType: 'PASS',
        specialTeam: false,
        start: { side: 'OWN', yard: 35 },
        end: { side: 'OPP', yard: 25 },
        gainYard: 40,
        car: { num: null, pos: null },
        car2: { num: null, pos: null },
        tkl: { num: parseInt(playerId), pos: 'DB' },
        tkl2: { num: null, pos: null },
        significantPlays: ['INTERCEPT', 'TOUCHDOWN', null, null]
      },
      {
        clipKey: 'SAMPLE_GAME_1',
        offensiveTeam: 'Home',
        quarter: 3,
        down: '1',
        toGoYard: 10,
        playType: 'RUN',
        specialTeam: false,
        start: { side: 'OWN', yard: 30 },
        end: { side: 'OWN', yard: 32 },
        gainYard: 2,
        car: { num: null, pos: null },
        car2: { num: null, pos: null },
        tkl: { num: parseInt(playerId), pos: 'DB' },
        tkl2: { num: null, pos: null },
        significantPlays: ['FUMBLE', null, null, null]
      }
    ];

    const result = await this.analyzeDBStats(sampleClips, playerId);
    return result;
  }
}