import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GameInfo, GameInfoDocument } from '../schemas/game-info.schema';
import { GameClips, GameClipsDocument } from '../schemas/game-clips.schema';

@Injectable()
export class GameService {
  constructor(
    @InjectModel(GameInfo.name)
    private gameInfoModel: Model<GameInfoDocument>,
    @InjectModel(GameClips.name)
    private gameClipsModel: Model<GameClipsDocument>,
  ) {}

  async createGameInfo(gameData: any): Promise<GameInfo> {
    const gameInfo = {
      gameKey: gameData.gameKey,
      date: gameData.date,
      type: gameData.type,
      score: gameData.score,
      region: gameData.region,
      location: gameData.location,
      homeTeam: gameData.homeTeam,
      awayTeam: gameData.awayTeam,
    };

    const createdGameInfo = new this.gameInfoModel(gameInfo);
    return createdGameInfo.save();
  }

  async findGamesByTeam(teamName: string): Promise<GameInfo[]> {
    return this.gameInfoModel.find({
      $or: [
        { homeTeam: teamName },
        { awayTeam: teamName }
      ]
    }).exec();
  }

  async findAllGames(): Promise<GameInfo[]> {
    return this.gameInfoModel.find().exec();
  }

  async findGameByKey(gameKey: string): Promise<GameInfo> {
    return this.gameInfoModel.findOne({ gameKey }).exec();
  }

  async updateGameInfo(gameKey: string, gameData: any): Promise<GameInfo> {
    const updateData = {
      gameKey: gameData.gameKey,
      date: gameData.date,
      type: gameData.type,
      score: gameData.score,
      region: gameData.region,
      location: gameData.location,
      homeTeam: gameData.homeTeam,
      awayTeam: gameData.awayTeam,
    };

    return this.gameInfoModel.findOneAndUpdate(
      { gameKey },
      updateData,
      { new: true, upsert: true }
    ).exec();
  }

  async deleteGameInfo(gameKey: string): Promise<any> {
    return this.gameInfoModel.deleteOne({ gameKey }).exec();
  }

  // 경기 클립 데이터 저장 (전체 데이터 포함)
  async saveGameClips(gameData: any): Promise<GameClips> {
    const existingClips = await this.gameClipsModel.findOne({ gameKey: gameData.gameKey });
    
    if (existingClips) {
      // 이미 존재하면 업데이트
      return this.gameClipsModel.findOneAndUpdate(
        { gameKey: gameData.gameKey },
        gameData,
        { new: true }
      ).exec();
    }
    
    // 새로 생성
    const createdGameClips = new this.gameClipsModel(gameData);
    return createdGameClips.save();
  }

  // gameKey로 경기 클립 데이터 조회
  async getGameClipsByKey(gameKey: string): Promise<GameClips> {
    return this.gameClipsModel.findOne({ gameKey }).exec();
  }

  // 코치용 하이라이트 조회
  async getCoachHighlights(teamName: string): Promise<any[]> {
    // 해당 팀이 참여한 모든 경기 찾기
    const games = await this.gameClipsModel.find({
      $or: [
        { homeTeam: teamName },
        { awayTeam: teamName }
      ]
    }).exec();

    const highlights = [];

    for (const game of games) {
      // 각 경기에서 하이라이트 클립 필터링
      const highlightClips = game.Clips.filter(clip => {
        // significantPlays에 null이 아닌 값이 있는지 확인
        const hasSignificantPlay = clip.significantPlays.some(play => play !== null);
        // gainYard가 10 이상인지 확인
        const hasLongGain = clip.gainYard >= 10;
        
        return hasSignificantPlay || hasLongGain;
      });

      // 하이라이트 클립에 경기 정보 추가
      highlightClips.forEach(clip => {
        highlights.push({
          gameKey: game.gameKey,
          date: game.date,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          location: game.location,
          clip: clip
        });
      });
    }

    return highlights;
  }

  // 선수용 하이라이트 조회
  async getPlayerHighlights(playerId: string, teamName: string): Promise<any[]> {
    // playerId에서 실제 선수 번호 추출 (예: "2025_KK_10" -> 10)
    const playerNumber = this.extractPlayerNumberFromId(playerId);
    // 해당 팀이 참여한 모든 경기 찾기
    const games = await this.gameClipsModel.find({
      $or: [
        { homeTeam: teamName },
        { awayTeam: teamName }
      ]
    }).exec();

    const highlights = [];

    for (const game of games) {
      // 현재 팀이 홈팀인지 어웨이팀인지 확인
      const isHomeTeam = game.homeTeam === teamName;
      const isAwayTeam = game.awayTeam === teamName;
      
      console.log(`경기 ${game.gameKey}: ${teamName}는 ${isHomeTeam ? '홈팀' : '어웨이팀'}`);
      
      // 각 경기에서 해당 선수가 참여한 클립 필터링 (팀 구분 포함)
      const playerClips = game.Clips.filter(clip => {
        const participatesInClip = (
          clip.car?.num === playerNumber ||
          clip.car2?.num === playerNumber ||
          clip.tkl?.num === playerNumber ||
          clip.tkl2?.num === playerNumber
        );
        
        if (!participatesInClip) return false;
        
        // offensiveTeam을 기준으로 팀 구분
        // "Home"이면 홈팀 공격, "Away"면 어웨이팀 공격
        const isOffensivePlay = (clip.offensiveTeam === "Home" && isHomeTeam) || 
                              (clip.offensiveTeam === "Away" && isAwayTeam);
        
        // 공격 플레이인 경우: car, car2가 우리 팀 선수여야 함
        if (isOffensivePlay && (clip.car?.num === playerNumber || clip.car2?.num === playerNumber)) {
          console.log(`✅ ${playerNumber}번 공격 플레이 매칭 (${clip.offensiveTeam})`);
          return true;
        }
        
        // 수비 플레이인 경우: tkl, tkl2가 우리 팀 선수여야 함  
        const isDefensivePlay = (clip.offensiveTeam === "Home" && isAwayTeam) || 
                               (clip.offensiveTeam === "Away" && isHomeTeam);
        
        if (isDefensivePlay && (clip.tkl?.num === playerNumber || clip.tkl2?.num === playerNumber)) {
          console.log(`✅ ${playerNumber}번 수비 플레이 매칭 (상대: ${clip.offensiveTeam})`);
          return true;
        }
        
        console.log(`❌ ${playerNumber}번 플레이 제외: ${clip.offensiveTeam} 공격, 우리팀 ${isHomeTeam ? 'Home' : 'Away'}`);
        return false;
      });

      // 선수 클립에 경기 정보 추가
      playerClips.forEach(clip => {
        highlights.push({
          gameKey: game.gameKey,
          date: game.date,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          location: game.location,
          clip: clip
        });
      });
    }

    return highlights;
  }

  // playerId에서 실제 선수 번호 추출하는 헬퍼 메서드
  private extractPlayerNumberFromId(playerId: string): number {
    // "2025_KK_10" 형식에서 마지막 숫자 추출
    const parts = playerId.split('_');
    const lastPart = parts[parts.length - 1];
    const playerNumber = parseInt(lastPart, 10);
    
    console.log(`playerId "${playerId}"에서 선수 번호 ${playerNumber} 추출`);
    return playerNumber;
  }
}