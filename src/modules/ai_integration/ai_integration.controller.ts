import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { AiIntegrationService } from './ai_integration.service';
import { SummarizeTextDto, AnalyzeSentimentDto } from './dto/ai-request.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiIntegrationController {
  constructor(private readonly aiIntegrationService: AiIntegrationService) {}

  @Post('summarize')
  async summarizeText(@Body() dto: SummarizeTextDto) {
    return await this.aiIntegrationService.summarizeText(dto.text);
  }

  @Post('sentiment')
  async analyzeSentiment(@Body() dto: AnalyzeSentimentDto) {
    return await this.aiIntegrationService.analyzeSentiment(dto.text);
  }
}
