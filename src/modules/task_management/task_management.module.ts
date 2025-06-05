import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { TaskEntity } from './task.entity';
import { UserEntity } from '../auth/user.entity';
import { AudioRecordingEntity } from '../audio/audio-recording.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaskEntity, UserEntity, AudioRecordingEntity])],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskManagementModule {}
