import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { TranscriptionService } from './transcription.service';

@Controller('transcription')
@UseGuards(JwtAuthGuard)
export class TranscriptionController {
  constructor(private readonly transcriptionService: TranscriptionService) {}

  @Post('transcribe/:audioRecordingId')
  async startTranscription(@Param('audioRecordingId') audioRecordingId: string) {
    return await this.transcriptionService.startTranscription(audioRecordingId);
  }

  @Get(':transcriptionId/status')
  async getTranscriptionStatus(@Param('transcriptionId') transcriptionId: string) {
    return await this.transcriptionService.getTranscriptionStatus(transcriptionId);
  }
}
