import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Configuration
import { getTypeOrmConfig } from './config/typeorm.config';

// Core components
import { HttpExceptionFilter } from './core/filters/http-exception.filter';
import { TransformResponseInterceptor } from './core/interceptors/transform-response.interceptor';

// Business modules
import { AuthModule } from './modules/auth/auth.module';
import { AudioModule } from './modules/audio/audio.module';
import { TranscriptionModule } from './modules/transcription/transcription.module';
import { AiIntegrationModule } from './modules/ai_integration/ai_integration.module';
import { LarkIntegrationModule } from './modules/lark_integration/lark_integration.module';
import { TaskManagementModule } from './modules/task_management/task_management.module';

@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getTypeOrmConfig,
      inject: [ConfigService],
    }),

    // Redis/Bull configuration for background jobs
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),    // Business modules
    AuthModule,
    AudioModule,
    TranscriptionModule,
    AiIntegrationModule,
    LarkIntegrationModule,
    TaskManagementModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    
    // Global pipes
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },

    // Global filters
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },

    // Global interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
  ],
})
export class AppModule {}
