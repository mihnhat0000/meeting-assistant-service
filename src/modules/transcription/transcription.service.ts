import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { TranscriptionEntity } from './transcription.entity';
import { AudioRecordingEntity } from '../audio/audio-recording.entity';
import { TranscriptionStatus } from '../../shared/enums';

@Injectable()
export class TranscriptionService {
  constructor(
    @InjectRepository(TranscriptionEntity)
    private readonly transcriptionRepository: Repository<TranscriptionEntity>,
    @InjectRepository(AudioRecordingEntity)
    private readonly audioRepository: Repository<AudioRecordingEntity>,
    @InjectQueue('audio-transcription')
    private readonly audioQueue: Queue,
  ) {}

  async startTranscription(audioRecordingId: string): Promise<TranscriptionEntity> {
    // Verify audio recording exists
    const audioRecording = await this.audioRepository.findOne({
      where: { id: audioRecordingId },
    });

    if (!audioRecording) {
      throw new NotFoundException('Audio recording not found');
    }

    // Create transcription record
    const transcription = this.transcriptionRepository.create({
      audioRecordingId,
      status: TranscriptionStatus.PENDING,
    });

    const savedTranscription = await this.transcriptionRepository.save(transcription);

    // Add job to queue
    await this.audioQueue.add('transcribe', {
      audioRecordingId,
      transcriptionId: savedTranscription.id,
      filePath: audioRecording.filePath,
    });

    return savedTranscription;
  }

  async getTranscriptionStatus(transcriptionId: string): Promise<TranscriptionEntity> {
    const transcription = await this.transcriptionRepository.findOne({
      where: { id: transcriptionId },
      relations: ['audioRecording'],
    });

    if (!transcription) {
      throw new NotFoundException('Transcription not found');
    }

    return transcription;
  }

  async updateTranscriptionStatus(
    transcriptionId: string,
    status: TranscriptionStatus,
    transcriptText?: string,
    language?: string,
    errorMessage?: string,
  ): Promise<TranscriptionEntity> {
    const transcription = await this.transcriptionRepository.findOne({
      where: { id: transcriptionId },
    });

    if (!transcription) {
      throw new NotFoundException('Transcription not found');
    }

    transcription.status = status;
    if (transcriptText) transcription.transcriptText = transcriptText;
    if (language) transcription.language = language;
    if (errorMessage) transcription.errorMessage = errorMessage;
    if (status === TranscriptionStatus.COMPLETED) {
      transcription.processedAt = new Date();
    }

    return await this.transcriptionRepository.save(transcription);
  }
}
