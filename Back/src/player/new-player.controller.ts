import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { NewPlayerService } from './new-player.service';

@Controller('new-player')
export class NewPlayerController {
  constructor(private readonly playerService: NewPlayerService) {}

  @Post('analyze-game-data')
  async analyzeGameData(@Body() gameData: any) {
    try {
      // 필수 필드 검증
      if (!gameData.gameKey || !gameData.homeTeam || !gameData.awayTeam || !gameData.Clips) {
        throw new HttpException(
          '필수 필드가 누락되었습니다: gameKey, homeTeam, awayTeam, Clips',
          HttpStatus.BAD_REQUEST
        );
      }

      console.log('\n=== 게임 데이터 분석 시작 ===');
      console.log(`게임: ${gameData.homeTeam} vs ${gameData.awayTeam}`);
      console.log(`클립 수: ${gameData.Clips.length}개`);

      const result = await this.playerService.analyzeGameData(gameData);

      console.log('=== 게임 데이터 분석 완료 ===\n');

      return {
        success: true,
        message: '게임 데이터 분석이 완료되었습니다.',
        data: result
      };

    } catch (error) {
      console.error('게임 데이터 분석 중 오류:', error.message);
      
      throw new HttpException(
        `게임 데이터 분석 실패: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('test-qb-analysis')
  async testQBAnalysis(@Body() gameData: any) {
    try {
      console.log('\n=== QB 분석 테스트 시작 ===');
      
      const result = await this.playerService.testQBAnalysis(gameData);
      
      console.log('=== QB 분석 테스트 완료 ===\n');
      
      return {
        success: true,
        message: 'QB 분석 테스트가 완료되었습니다.',
        data: result
      };
      
    } catch (error) {
      console.error('QB 분석 테스트 중 오류:', error.message);
      
      throw new HttpException(
        `QB 분석 테스트 실패: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}