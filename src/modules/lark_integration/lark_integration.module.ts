import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LarkIntegrationController } from './lark_integration.controller';
import { LarkIntegrationService } from './lark_integration.service';
import { TaskEntity } from '../task_management/task.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([TaskEntity]),
  ],
  controllers: [LarkIntegrationController],
  providers: [LarkIntegrationService],
  exports: [LarkIntegrationService],
})
export class LarkIntegrationModule {}
