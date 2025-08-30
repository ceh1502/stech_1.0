import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TeamSeasonStats, TeamSeasonStatsDocument } from '../schemas/team-season-stats.schema';
import { ClipData, GameData } from '../player/clip-analyzer.service';

@Injectable()
export class TeamClipAnalyzerService {
  constructor(
    @InjectModel(TeamSeasonStats.name) private teamSeasonStatsModel: Model<TeamSeasonStatsDocument>,
  ) {}

  async analyzeTeamStats(gameData: GameData): Promise<any> {
    console.log(`\n🏆 팀 스탯 분석 시작: ${gameData.gameKey}`);
    console.log(`📍 ${gameData.homeTeam} vs ${gameData.awayTeam}`);

    // 홈팀과 어웨이팀 스탯 초기화
    const homeTeamStats = this.initializeTeamStats(gameData.homeTeam, '2024');
    const awayTeamStats = this.initializeTeamStats(gameData.awayTeam, '2024');

    // 각 클립 분석
    for (const clip of gameData.Clips) {
      await this.analyzeClipForTeam(clip, gameData, homeTeamStats, awayTeamStats);
    }

    // 최종 계산
    this.calculateFinalTeamStats(homeTeamStats);
    this.calculateFinalTeamStats(awayTeamStats);

    // 데이터베이스에 저장
    const homeResult = await this.saveTeamStats(homeTeamStats);
    const awayResult = await this.saveTeamStats(awayTeamStats);

    console.log(`🏆 ${gameData.homeTeam} 팀 스탯: 득점 ${homeTeamStats.totalPoints}, 총야드 ${homeTeamStats.totalYards}`);
    console.log(`🏆 ${gameData.awayTeam} 팀 스탯: 득점 ${awayTeamStats.totalPoints}, 총야드 ${awayTeamStats.totalYards}`);

    return {
      success: true,
      homeTeam: homeResult,
      awayTeam: awayResult,
      message: `${gameData.homeTeam} vs ${gameData.awayTeam} 팀 스탯이 업데이트되었습니다.`
    };
  }

  private initializeTeamStats(teamName: string, season: string) {
    return {
      teamName,
      season,
      totalPoints: 0,
      totalTouchdowns: 0,
      totalYards: 0,
      gamesPlayed: 1,
      rushingAttempts: 0,
      rushingYards: 0,
      rushingTouchdowns: 0,
      passAttempts: 0,
      passCompletions: 0,
      passingYards: 0,
      passingTouchdowns: 0,
      interceptions: 0,
      totalPuntYards: 0,
      totalPunts: 0,
      puntTouchbacks: 0,
      fieldGoalAttempts: 0,
      fieldGoalMakes: 0,
      kickReturnYards: 0,
      kickReturns: 0,
      puntReturnYards: 0,
      puntReturns: 0,
      fumbles: 0,
      fumblesLost: 0,
      totalTurnovers: 0,
      opponentTurnovers: 0,
      penalties: 0,
      penaltyYards: 0,
      extraPointsMade: 0,
      safeties: 0,
      processedGames: []
    };
  }

  private async analyzeClipForTeam(
    clip: ClipData, 
    gameData: GameData, 
    homeTeamStats: any, 
    awayTeamStats: any
  ) {
    // 공격팀 결정
    const isHomeOffensive = clip.offensiveTeam === 'Home';
    const offensiveTeamStats = isHomeOffensive ? homeTeamStats : awayTeamStats;
    const defensiveTeamStats = isHomeOffensive ? awayTeamStats : homeTeamStats;

    // 플레이타입별 야드 계산 (공격팀의 총 전진야드)
    switch (clip.playType?.toUpperCase()) {
      case 'PASS':
        offensiveTeamStats.passAttempts++; // 패스 시도 +1
        offensiveTeamStats.passCompletions++; // 패스 성공 +1  
        offensiveTeamStats.passingYards += clip.gainYard || 0;
        offensiveTeamStats.totalYards += clip.gainYard || 0; // 총 전진야드에 추가
        break;
        
      case 'NOPASS':
        offensiveTeamStats.passAttempts++; // 패스 시도 +1 (실패한 패스)
        // passCompletions는 증가하지 않음 (실패)
        break;
        
      case 'RUN':
        offensiveTeamStats.rushingAttempts++;
        offensiveTeamStats.rushingYards += clip.gainYard || 0;
        offensiveTeamStats.totalYards += clip.gainYard || 0; // 총 전진야드에 추가
        break;
        
      case 'PUNT':
        offensiveTeamStats.totalPunts++;
        offensiveTeamStats.totalPuntYards += clip.gainYard || 0;
        
        // 터치백 체크 (end.yard === 0)
        if (clip.end?.yard === 0) {
          offensiveTeamStats.puntTouchbacks++;
        }
        break;
        
      case 'FIELDGOAL':
        offensiveTeamStats.fieldGoalAttempts++;
        break;
        
      case 'NONE':
        // 페널티 처리는 significantPlays에서 확인
        break;
    }

    // significantPlays 처리
    if (clip.significantPlays && Array.isArray(clip.significantPlays)) {
      for (const play of clip.significantPlays) {
        switch (play) {
          case 'TOUCHDOWN':
            offensiveTeamStats.totalTouchdowns++;
            offensiveTeamStats.totalPoints += 6; // TD = 6점
            if (clip.playType === 'PASS') {
              offensiveTeamStats.passingTouchdowns++;
            } else if (clip.playType === 'RUN') {
              offensiveTeamStats.rushingTouchdowns++;
            }
            break;
            
          case 'FIELDGOALGOOD':
            offensiveTeamStats.fieldGoalMakes++;
            offensiveTeamStats.totalPoints += 3; // FG = 3점
            break;
            
          case 'PATGOOD':
            offensiveTeamStats.extraPointsMade++;
            offensiveTeamStats.totalPoints += 1; // XP = 1점
            break;
            
          case 'TWOPTCONV.GOOD':
            offensiveTeamStats.totalPoints += 2; // 2점 컨버전 = 2점
            break;
            
          case 'SAFETY':
            defensiveTeamStats.safeties++;
            defensiveTeamStats.totalPoints += 2; // Safety = 2점 (디펜스 팀)
            break;
            
          case 'INTERCEPT':
          case 'INTERCEPTION':
            offensiveTeamStats.interceptions++;
            defensiveTeamStats.opponentTurnovers++;
            break;
            
          case 'FUMBLE':
            offensiveTeamStats.fumbles++;
            break;
            
          case 'PENALTYH.HOME':
            if (clip.playType === 'NONE') {
              homeTeamStats.penalties++;
              homeTeamStats.penaltyYards += clip.start?.yard || 0;
            }
            break;
            
          case 'PENALTYH.AWAY':
            if (clip.playType === 'NONE') {
              awayTeamStats.penalties++;
              awayTeamStats.penaltyYards += clip.start?.yard || 0;
            }
            break;
        }
      }
    }

    // 리턴 야드 처리
    if (clip.playType === 'PUNT' && clip.gainYard < 0) {
      // 펀트 리턴 (디펜스 팀)
      defensiveTeamStats.puntReturnYards += Math.abs(clip.gainYard);
      defensiveTeamStats.puntReturns++;
    } else if (clip.playType === 'KICKOFF' && clip.gainYard > 0) {
      // 킥오프 리턴 (디펜스 팀)
      defensiveTeamStats.kickReturnYards += clip.gainYard;
      defensiveTeamStats.kickReturns++;
    }
  }

  private calculateFinalTeamStats(teamStats: any) {
    // 총 전진야드는 이미 클립 분석에서 실시간으로 계산됨 (RUN, PASS gainYard 합산)
    // teamStats.totalYards는 이미 설정됨
    
    // 총 득점도 이미 클립 분석에서 실시간으로 계산됨 (TOUCHDOWN+6, FIELDGOALGOOD+3, etc.)
    // teamStats.totalPoints는 이미 설정됨
    
    // 총 턴오버 = 인터셉트 + 펌블 로스트
    teamStats.totalTurnovers = teamStats.interceptions + teamStats.fumblesLost;
    
    console.log(`📊 ${teamStats.teamName} 최종 스탯:`);
    console.log(`   총 득점: ${teamStats.totalPoints} (TD: ${teamStats.totalTouchdowns}×6 + FG: ${teamStats.fieldGoalMakes}×3 + XP: ${teamStats.extraPointsMade}×1 + Safety: ${teamStats.safeties}×2)`);
    console.log(`   총 전진야드: ${teamStats.totalYards} (패싱: ${teamStats.passingYards} + 러싱: ${teamStats.rushingYards})`);
    console.log(`   경기 수: ${teamStats.gamesPlayed}`);
  }

  private async saveTeamStats(teamStats: any): Promise<any> {
    try {
      // 기존 팀 스탯 찾기
      let existingTeamStats = await this.teamSeasonStatsModel.findOne({
        teamName: teamStats.teamName,
        season: teamStats.season,
      });

      if (!existingTeamStats) {
        // 새 팀 스탯 생성
        console.log(`🆕 새 팀 스탯 생성: ${teamStats.teamName} (${teamStats.season})`);
        existingTeamStats = new this.teamSeasonStatsModel(teamStats);
      } else {
        // 기존 팀 스탯에 누적
        console.log(`🔄 기존 팀 스탯 업데이트: ${teamStats.teamName}`);
        
        existingTeamStats.totalPoints += teamStats.totalPoints;
        existingTeamStats.totalTouchdowns += teamStats.totalTouchdowns;
        existingTeamStats.totalYards += teamStats.totalYards;
        existingTeamStats.gamesPlayed += teamStats.gamesPlayed;
        existingTeamStats.rushingAttempts += teamStats.rushingAttempts;
        existingTeamStats.rushingYards += teamStats.rushingYards;
        existingTeamStats.rushingTouchdowns += teamStats.rushingTouchdowns;
        existingTeamStats.passAttempts += teamStats.passAttempts;
        existingTeamStats.passCompletions += teamStats.passCompletions;
        existingTeamStats.passingYards += teamStats.passingYards;
        existingTeamStats.passingTouchdowns += teamStats.passingTouchdowns;
        existingTeamStats.interceptions += teamStats.interceptions;
        existingTeamStats.totalPuntYards += teamStats.totalPuntYards;
        existingTeamStats.totalPunts += teamStats.totalPunts;
        existingTeamStats.puntTouchbacks += teamStats.puntTouchbacks;
        existingTeamStats.fieldGoalAttempts += teamStats.fieldGoalAttempts;
        existingTeamStats.fieldGoalMakes += teamStats.fieldGoalMakes;
        existingTeamStats.kickReturnYards += teamStats.kickReturnYards;
        existingTeamStats.kickReturns += teamStats.kickReturns;
        existingTeamStats.puntReturnYards += teamStats.puntReturnYards;
        existingTeamStats.puntReturns += teamStats.puntReturns;
        existingTeamStats.fumbles += teamStats.fumbles;
        existingTeamStats.fumblesLost += teamStats.fumblesLost;
        existingTeamStats.totalTurnovers += teamStats.totalTurnovers;
        existingTeamStats.opponentTurnovers += teamStats.opponentTurnovers;
        existingTeamStats.penalties += teamStats.penalties;
        existingTeamStats.penaltyYards += teamStats.penaltyYards;
        existingTeamStats.extraPointsMade += teamStats.extraPointsMade;
        existingTeamStats.safeties += teamStats.safeties;
      }

      await existingTeamStats.save();
      return {
        success: true,
        teamName: teamStats.teamName,
        stats: existingTeamStats.toObject()
      };
    } catch (error) {
      console.error(`❌ ${teamStats.teamName} 팀 스탯 저장 실패:`, error);
      return {
        success: false,
        error: error.message,
        teamName: teamStats.teamName
      };
    }
  }
}