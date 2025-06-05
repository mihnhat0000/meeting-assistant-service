import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { AudioRecordingEntity } from './audio-recording.entity';
import { UserEntity } from '../auth/user.entity';

@Injectable()
export class AudioService {
  constructor(
    @InjectRepository(AudioRecordingEntity)
    private readonly audioRepository: Repository<AudioRecordingEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly configService: ConfigService,
  ) {}

  async saveAudioFile(file: Express.Multer.File, userId: string): Promise<AudioRecordingEntity> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const fileExtension = path.extname(file.originalname);
      const fileName = `${timestamp}_${userId}${fileExtension}`;

      // Get upload path from config
      const uploadPath = this.configService.get<string>('UPLOAD_AUDIO_PATH') || './uploads/audio/';
      const fullPath = path.join(uploadPath, fileName);

      // Ensure directory exists
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      // Save file to disk
      fs.writeFileSync(fullPath, file.buffer); // Create database record
      const audioRecording = this.audioRepository.create({
        user: user,
        originalFileName: file.originalname,
        filePath: fullPath,
        mimeType: file.mimetype,
        // If your entity has a 'size' property, ensure it's defined there; otherwise, remove or map it appropriately
        duration_time: 0, // Will be populated later if needed
      });

      return await this.audioRepository.save(audioRecording);
    } catch (error) {
      throw new BadRequestException(`Failed to save audio file: ${error}`);
    }
  }

  async getAudioRecordingById(id: string): Promise<AudioRecordingEntity> {
    const audioRecording = await this.audioRepository.findOne({
      where: { id },
      relations: ['user', 'transcription'],
    });

    if (!audioRecording) {
      throw new NotFoundException('Audio recording not found');
    }

    return audioRecording;
  }

  async getAudioRecordingsByUserId(userId: string): Promise<AudioRecordingEntity[]> {
    return await this.audioRepository.find({
      where: { userId },
      relations: ['transcription'],
      order: { createdAt: 'DESC' },
    });
  }
}
