import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

// Configuration
// import { getTypeOrmConfig } from './config/typeorm.config';

// Core components
import { HttpExceptionFilter } from './core/filters/http-exception.filter';
import { TransformResponseInterceptor } from './core/interceptors/transform-response.interceptor';

// Business modules
import { AuthModule } from './shared/auth/auth.module';
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
    }), // Database configuration
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST') ?? 'localhost',
        port: parseInt(configService.get('DB_PORT') ?? '3306', 10),
        username: configService.get('DB_USERNAME') ?? 'root',
        password: configService.get('DB_PASSWORD') ?? '',
        database: configService.get('DB_NAME') ?? 'meeting_assistant',
        entityPrefix: process.env.DB_ENTITY_PREFIX ?? '',
        autoLoadEntities: true,
        // entities: ['dist/**/*.entity.js'],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
        charset: 'utf8mb4',
        namingStrategy: new SnakeNamingStrategy(),
      }),
      inject: [ConfigService],
    }),

    // Redis/Bull configuration for background jobs
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }), // Business modules
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
