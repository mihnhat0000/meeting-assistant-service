import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AudioController } from './audio.controller';
import { AudioService } from './audio.service';
import { AudioRecordingEntity } from './audio-recording.entity';
import { UserEntity } from '../auth/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([AudioRecordingEntity, UserEntity]),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        dest: configService.get<string>('UPLOAD_AUDIO_PATH') || './uploads/audio/',
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AudioController],
  providers: [AudioService],
  exports: [AudioService],
})
export class AudioModule {}
