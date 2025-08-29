import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Player, PlayerDocument } from '../schemas/player.schema';
import { RbAnalyzerService } from './analyzers/rb-analyzer.service';
import { WrAnalyzerService } from './analyzers/wr-analyzer.service';
import { TeAnalyzerService } from './analyzers/te-analyzer.service';
import { KAnalyzerService } from './analyzers/k-analyzer.service';

// 클립 데이터 인터페이스
export interface ClipData {
  clipKey: string;
  offensiveTeam: string; // "Home" or "Away"
  quarter: number;
  down: string | null;
  toGoYard: number | null;
  playType: string;
  specialTeam: boolean;
  start: { side: string; yard: number };
  end: { side: string; yard: number };
  gainYard: number;
  car: { num: number; pos: string };
  car2: { num: number | null; pos: string | null };
  tkl: { num: number | null; pos: string | null };
  tkl2: { num: number | null; pos: string | null };
  significantPlays: (string | null)[];
}

// 게임 데이터 인터페이스
export interface GameData {
  gameKey: string;
  date: string;
  type: string;
  score: { home: number; away: number };
  region: string;
  location: string;
  homeTeam: string;
  awayTeam: string;
  Clips: ClipData[];
}

// QB 스탯 인터페이스
export interface QBStats {
  jerseyNumber: number;
  teamName: string;
  gamesPlayed: number;
  passingAttempts: number;
  passingCompletions: number;
  completionPercentage: number;
  passingYards: number;
  passingTouchdowns: number;
  passingInterceptions: number;
  longestPass: number;
  sacks: number;
  rushingAttempts: number;
  rushingYards: number;
  yardsPerCarry: number;
  rushingTouchdowns: number;
  longestRush: number;
  fumbles: number;
}


@Injectable()
export class ClipAnalyzerService {
  constructor(
    @InjectModel(Player.name) private playerModel: Model<PlayerDocument>,
    private rbAnalyzer: RbAnalyzerService,
    private wrAnalyzer: WrAnalyzerService,
    private teAnalyzer: TeAnalyzerService,
    private kAnalyzer: KAnalyzerService,
  ) {}

  /**
   * 게임 데이터 분석해서 QB/RB/WR/TE 스탯 추출 및 저장
   */
  async analyzeGameData(gameData: GameData): Promise<any> {
    console.log(`\n🎮 게임 분석 시작: ${gameData.gameKey}`);
    console.log(`📍 ${gameData.homeTeam} vs ${gameData.awayTeam}`);
    console.log(`📊 총 클립 수: ${gameData.Clips.length}`);

    const results = [];

    // QB 분석
    const qbResult = await this.analyzeQBClips(gameData.Clips, gameData);
    results.push(...qbResult.results);

    // RB 분석
    const rbResult = await this.analyzeRBClips(gameData.Clips, gameData);
    results.push(...rbResult.results);
    
    // WR 분석
    const wrResult = await this.analyzeWRClips(gameData.Clips, gameData);
    results.push(...wrResult.results);
    
    // TE 분석
    const teResult = await this.analyzeTEClips(gameData.Clips, gameData);
    results.push(...teResult.results);
    
    // 키커 분석
    const kResult = await this.analyzeKClips(gameData.Clips, gameData);
    results.push(...kResult.results);
    
    console.log(`\n✅ 게임 분석 완료 - ${qbResult.qbCount}명의 QB, ${rbResult.rbCount}명의 RB, ${wrResult.wrCount}명의 WR, ${teResult.teCount}명의 TE, ${kResult.kCount}명의 K 처리됨`);
    return {
      success: true,
      message: `${qbResult.qbCount}명의 QB, ${rbResult.rbCount}명의 RB, ${wrResult.wrCount}명의 WR, ${teResult.teCount}명의 TE, ${kResult.kCount}명의 K 스탯이 업데이트되었습니다.`,
      qbCount: qbResult.qbCount,
      rbCount: rbResult.rbCount,
      wrCount: wrResult.wrCount,
      teCount: teResult.teCount,
      kCount: kResult.kCount,
      results,
    };
  }

  /**
   * QB 클립들 분석
   */
  private async analyzeQBClips(clips: ClipData[], gameData: GameData): Promise<any> {
    // QB별 스탯 누적을 위한 Map
    const qbStatsMap = new Map<string, QBStats>();

    // QB 클립 하나씩 분석
    for (const clip of clips) {
      await this.analyzeQBClip(clip, gameData, qbStatsMap);
    }

    // 최종 스탯 계산 및 저장
    const results = [];
    for (const [qbKey, qbStats] of qbStatsMap) {
      // 계산된 스탯 완성
      this.calculateFinalStats(qbStats);

      // 데이터베이스에 저장
      const saveResult = await this.saveQBStats(qbStats);
      results.push(saveResult);

      console.log(
        `\n🏈 QB ${qbStats.jerseyNumber}번 (${qbStats.teamName}) 최종 스탯:`,
      );
      console.log(
        `   패싱: ${qbStats.passingAttempts}시도/${qbStats.passingCompletions}성공 (${qbStats.completionPercentage}%)`,
      );
      console.log(
        `   패싱야드: ${qbStats.passingYards}, TD: ${qbStats.passingTouchdowns}, INT: ${qbStats.passingInterceptions}`,
      );
      console.log(
        `   러싱: ${qbStats.rushingAttempts}시도, ${qbStats.rushingYards}야드, TD: ${qbStats.rushingTouchdowns}`,
      );
      console.log(`   색: ${qbStats.sacks}, 펌블: ${qbStats.fumbles}`);
    }

    return {
      qbCount: qbStatsMap.size,
      results,
    };
  }

  /**
   * RB 클립들 분석
   */
  private async analyzeRBClips(clips: ClipData[], gameData: GameData): Promise<any> {
    // RB 클립들만 필터링
    const rbClips = clips.filter(clip => 
      clip.car?.pos === 'RB' || clip.car2?.pos === 'RB'
    );

    if (rbClips.length === 0) {
      return { rbCount: 0, results: [] };
    }

    return await this.rbAnalyzer.analyzeClips(rbClips, gameData);
  }

  /**
   * WR 클립들 분석
   */
  private async analyzeWRClips(clips: ClipData[], gameData: GameData): Promise<any> {
    // WR 클립들만 필터링 
    const wrClips = clips.filter(clip => 
      clip.car?.pos === 'WR' || clip.car2?.pos === 'WR'
    );

    if (wrClips.length === 0) {
      return { wrCount: 0, results: [] };
    }

    return await this.wrAnalyzer.analyzeClips(wrClips, gameData);
  }

  /**
   * TE 클립들 분석
   */
  private async analyzeTEClips(clips: ClipData[], gameData: GameData): Promise<any> {
    // TE 클립들만 필터링
    const teClips = clips.filter(clip => 
      clip.car?.pos === 'TE' || clip.car2?.pos === 'TE'
    );

    if (teClips.length === 0) {
      return { teCount: 0, results: [] };
    }

    return await this.teAnalyzer.analyzeClips(teClips, gameData);
  }

  /**
   * 키커 클립들 분석
   */
  private async analyzeKClips(clips: ClipData[], gameData: GameData): Promise<any> {
    console.log(`🦶 키커 클립 필터링 시작 - 전체 ${clips.length}개 클립`);
    
    // 키커 클립들만 필터링
    const kClips = clips.filter(clip => 
      clip.car?.pos === 'K' || clip.car2?.pos === 'K'
    );

    console.log(`🦶 키커 클립 필터링 완료 - ${kClips.length}개 키커 클립 발견`);

    if (kClips.length === 0) {
      console.log('⚠️ 키커 클립이 없어서 분석을 건너뜁니다.');
      return { kCount: 0, results: [] };
    }

    console.log(`🦶 키커 분석 서비스 호출 중...`);
    const result = await this.kAnalyzer.analyzeClips(kClips, gameData);
    console.log(`🦶 키커 분석 서비스 결과:`, result);
    
    return result;
  }

  /**
   * QB 개별 클립 분석
   */
  private async analyzeQBClip(
    clip: ClipData,
    gameData: GameData,
    qbStatsMap: Map<string, QBStats>,
  ) {
    // 공격팀 결정
    const offensiveTeam =
      clip.offensiveTeam === 'Home' ? gameData.homeTeam : gameData.awayTeam;

    // QB 찾기
    let qb: { num: number; pos: string } | null = null;
    if (clip.car?.pos === 'QB') {
      qb = clip.car;
    } else if (clip.car2?.pos === 'QB') {
      qb = { num: clip.car2.num, pos: clip.car2.pos };
    }

    // QB 처리
    if (qb) {
      this.processQBClip(clip, qb, offensiveTeam, qbStatsMap);
    }
  }

  /**
   * QB 클립 처리
   */
  private processQBClip(
    clip: ClipData,
    qb: { num: number; pos: string },
    offensiveTeam: string,
    qbStatsMap: Map<string, QBStats>,
  ) {
    const qbKey = `${offensiveTeam}_QB_${qb.num}`;

    if (!qbStatsMap.has(qbKey)) {
      qbStatsMap.set(qbKey, {
        jerseyNumber: qb.num,
        teamName: offensiveTeam,
        gamesPlayed: 1,
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
      });
    }

    const qbStats = qbStatsMap.get(qbKey);

    // 패스 시도 수 계산
    if (clip.playType === 'PASS' || clip.playType === 'NOPASS') {
      qbStats.passingAttempts++;
    }

    // 패스 성공 수 및 패싱 야드 계산
    if (clip.playType === 'PASS') {
      qbStats.passingCompletions++;
      qbStats.passingYards += clip.gainYard || 0;
      
      // 가장 긴 패스 업데이트
      if ((clip.gainYard || 0) > qbStats.longestPass) {
        qbStats.longestPass = clip.gainYard || 0;
      }
    }

    // 러싱 처리
    if (clip.playType === 'RUN') {
      qbStats.rushingAttempts++;
      qbStats.rushingYards += clip.gainYard || 0;
      
      if ((clip.gainYard || 0) > qbStats.longestRush) {
        qbStats.longestRush = clip.gainYard || 0;
      }
    }

    // 색 처리
    if (clip.playType === 'SACK') {
      qbStats.sacks++;
    }

    // significantPlays 처리
    if (clip.significantPlays && Array.isArray(clip.significantPlays)) {
      for (const play of clip.significantPlays) {
        if (play === 'TOUCHDOWN') {
          if (clip.playType === 'PASS') {
            qbStats.passingTouchdowns++;
          } else if (clip.playType === 'RUN') {
            qbStats.rushingTouchdowns++;
          }
        } else if (play === 'INTERCEPT' || play === 'INTERCEPTION') {
          qbStats.passingInterceptions++;
        } else if (play === 'SACK') {
          qbStats.sacks++;
        } else if (play === 'FUMBLE') {
          qbStats.fumbles++;
        }
      }
    }

    console.log(`🏈 QB ${qb.num}번: ${clip.playType}, ${clip.gainYard}야드`);
  }

  /**
   * QB 최종 스탯 계산
   */
  private calculateFinalStats(qbStats: QBStats) {
    // 패스 성공률 계산
    qbStats.completionPercentage = qbStats.passingAttempts > 0 
      ? Math.round((qbStats.passingCompletions / qbStats.passingAttempts) * 100) 
      : 0;

    // Yards per carry 계산
    qbStats.yardsPerCarry = qbStats.rushingAttempts > 0 
      ? Math.round((qbStats.rushingYards / qbStats.rushingAttempts) * 100) / 100 
      : 0;

    qbStats.gamesPlayed = 1;
  }


  /**
   * QB 스탯 저장
   */
  private async saveQBStats(qbStats: QBStats): Promise<any> {
    try {
      // 기존 선수 찾기 (등번호 + 팀명으로)
      let player = await this.playerModel.findOne({
        jerseyNumber: qbStats.jerseyNumber,
        teamName: qbStats.teamName,
      });

      if (!player) {
        // 새 QB 선수 생성
        console.log(`🆕 새 QB 선수 생성: ${qbStats.jerseyNumber}번 (${qbStats.teamName})`);
        
        player = new this.playerModel({
          playerId: `QB${qbStats.jerseyNumber}_${qbStats.teamName}`,
          name: `QB${qbStats.jerseyNumber}번`,
          jerseyNumber: qbStats.jerseyNumber,
          position: 'QB',
          teamName: qbStats.teamName,
          league: '1부',
          season: '2024',
          stats: {
            gamesPlayed: qbStats.gamesPlayed,
            passingAttempts: qbStats.passingAttempts,
            passingCompletions: qbStats.passingCompletions,
            completionPercentage: qbStats.completionPercentage,
            passingYards: qbStats.passingYards,
            passingTouchdowns: qbStats.passingTouchdowns,
            passingInterceptions: qbStats.passingInterceptions,
            // longestPass field removed from schema
            sacks: qbStats.sacks,
            rushingAttempts: qbStats.rushingAttempts,
            rushingYards: qbStats.rushingYards,
            yardsPerCarry: qbStats.yardsPerCarry,
            rushingTouchdowns: qbStats.rushingTouchdowns,
            longestRush: qbStats.longestRush,
            fumbles: qbStats.fumbles,
          },
        });
      } else {
        // 기존 선수 업데이트
        console.log(`🔄 기존 QB 선수 업데이트: ${player.name}`);
        
        player.stats.gamesPlayed = (player.stats.gamesPlayed || 0) + qbStats.gamesPlayed;
        player.stats.passingAttempts = (player.stats.passingAttempts || 0) + qbStats.passingAttempts;
        player.stats.passingCompletions = (player.stats.passingCompletions || 0) + qbStats.passingCompletions;
        player.stats.completionPercentage = player.stats.passingAttempts > 0 ? 
          Math.round((player.stats.passingCompletions / player.stats.passingAttempts) * 100) : 0;
        player.stats.passingYards = (player.stats.passingYards || 0) + qbStats.passingYards;
        player.stats.passingTouchdowns = (player.stats.passingTouchdowns || 0) + qbStats.passingTouchdowns;
        player.stats.passingInterceptions = (player.stats.passingInterceptions || 0) + qbStats.passingInterceptions;
        // longestPass field doesn't exist in schema, using longestReception for now
        player.stats.sacks = (player.stats.sacks || 0) + qbStats.sacks;
        player.stats.rushingAttempts = (player.stats.rushingAttempts || 0) + qbStats.rushingAttempts;
        player.stats.rushingYards = (player.stats.rushingYards || 0) + qbStats.rushingYards;
        player.stats.yardsPerCarry = player.stats.rushingAttempts > 0 ? 
          Math.round((player.stats.rushingYards / player.stats.rushingAttempts) * 100) / 100 : 0;
        player.stats.rushingTouchdowns = (player.stats.rushingTouchdowns || 0) + qbStats.rushingTouchdowns;
        player.stats.longestRush = Math.max(player.stats.longestRush || 0, qbStats.longestRush);
        player.stats.fumbles = (player.stats.fumbles || 0) + qbStats.fumbles;
      }

      await player.save();
      return {
        success: true,
        player: {
          name: player.name,
          jerseyNumber: player.jerseyNumber,
          position: player.position,
          teamName: player.teamName,
          stats: qbStats,
        },
      };
    } catch (error) {
      console.error(`❌ QB ${qbStats.jerseyNumber}번 저장 실패:`, error);
      return {
        success: false,
        error: error.message,
        qbStats,
      };
    }
  }

}