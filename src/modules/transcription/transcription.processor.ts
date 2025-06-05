import { Processor, Process } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Job } from 'bull';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs';
import * as FormData from 'form-data';
import { TranscriptionService } from './transcription.service';
import { TranscriptionStatus } from '../../shared/types/shared.enums';

interface TranscriptionJobData {
  audioRecordingId: string;
  transcriptionId: string;
  filePath: string;
}

interface OpenAITranscriptionResponse {
  text: string;
  language?: string;
}

@Processor('audio-transcription')
@Injectable()
export class TranscriptionProcessor {
  private readonly logger = new Logger(TranscriptionProcessor.name);

  constructor(
    private readonly transcriptionService: TranscriptionService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  @Process('transcribe')
  async processTranscriptionJob(job: Job<TranscriptionJobData>): Promise<void> {
    const { audioRecordingId, transcriptionId, filePath } = job.data;

    this.logger.log(`Starting transcription for audio recording: ${audioRecordingId}`);

    try {
      // Update status to processing
      await this.transcriptionService.updateTranscriptionStatus(transcriptionId, TranscriptionStatus.PROCESSING);

      // TODO: FFmpeg conversion would go here
      // For now, we'll assume the file is already in the correct format
      // Example: convertAudioFormat(filePath);

      // Call OpenAI Whisper API
      const transcriptionResult = await this.transcribeWithOpenAI(filePath);

      // Update transcription with results
      await this.transcriptionService.updateTranscriptionStatus(
        transcriptionId,
        TranscriptionStatus.COMPLETED,
        transcriptionResult.text,
        transcriptionResult.language,
      );

      this.logger.log(`Transcription completed for audio recording: ${audioRecordingId}`);
    } catch (error) {
      this.logger.error(`Transcription failed for audio recording: ${audioRecordingId}`, error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      // Update transcription with error
      await this.transcriptionService.updateTranscriptionStatus(
        transcriptionId,
        TranscriptionStatus.FAILED,
        undefined,
        undefined,
        errorMessage,
      );
    }
  }

  private async transcribeWithOpenAI(filePath: string): Promise<{ text: string; language: string }> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file not found: ${filePath}`);
    }

    try {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(filePath));
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');
      const response = await firstValueFrom(
        this.httpService.post<OpenAITranscriptionResponse>('https://api.openai.com/v1/audio/transcriptions', formData, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            ...formData.getHeaders(),
          },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }),
      );
      return {
        text: response.data.text,
        language: response.data.language ?? 'unknown',
      };
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error?.message ?? error?.message ?? 'Unknown error occurred';
      this.logger.error('OpenAI API error:', error?.response?.data ?? errorMessage);
      throw new Error(`OpenAI transcription failed: ${errorMessage}`);
    }
  }
  // Placeholder for FFmpeg audio conversion
  private async convertAudioFormat(inputPath: string): Promise<string> {
    // TODO: Implement FFmpeg conversion
    // Example using child_process:
    // const outputPath = inputPath.replace(path.extname(inputPath), '_converted.flac');
    // await new Promise((resolve, reject) => {
    //   exec(`ffmpeg -i "${inputPath}" -ar 16000 -ac 1 "${outputPath}"`, (error) => {
    //     if (error) reject(error);
    //     else resolve(outputPath);
    //   });
    // });
    // return outputPath;

    this.logger.log('Audio format conversion placeholder - returning original file');
    return Promise.resolve(inputPath);
  }
}
