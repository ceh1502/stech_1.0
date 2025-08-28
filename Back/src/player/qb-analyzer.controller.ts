import { Controller, Post, Body } from '@nestjs/common';
import { QbAnalyzerService } from './qb-analyzer.service';

@Controller('qb')
export class QbAnalyzerController {
  constructor(private readonly qbAnalyzerService: QbAnalyzerService) {}

  @Post('analyze')
  async analyzeQbData(@Body() gameData: any) {
    console.log('=== QB 분석 시작 ===');
    return await this.qbAnalyzerService.analyzeQbStats(gameData);
  }
}
