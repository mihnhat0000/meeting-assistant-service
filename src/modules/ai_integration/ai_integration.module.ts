import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiIntegrationController } from './ai_integration.controller';
import { AiIntegrationService } from './ai_integration.service';

@Module({
  imports: [HttpModule],
  controllers: [AiIntegrationController],
  providers: [AiIntegrationService],
  exports: [AiIntegrationService],
})
export class AiIntegrationModule {}
