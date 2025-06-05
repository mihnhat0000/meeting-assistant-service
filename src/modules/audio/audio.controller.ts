import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { AudioService } from './audio.service';
import { AudioMetadataDto } from './dto/audio-metadata.dto';

@Controller('audio')
@UseGuards(JwtAuthGuard)
export class AudioController {
  constructor(private readonly audioService: AudioService) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
      },
      fileFilter: (req, file, callback) => {
        // Allow audio files
        if (file.mimetype.startsWith('audio/')) {
          callback(null, true);
        } else {
          callback(new BadRequestException('Only audio files are allowed'), false);
        }
      },
    }),
  )
  async uploadAudio(
    @UploadedFile() file: Express.Multer.File,
    @Body() metadataDto: AudioMetadataDto,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Use userId from JWT payload instead of body for security
    const userId = req.user.id;
    
    return await this.audioService.saveAudioFile(file, userId, metadataDto);
  }

  @Get(':id')
  async getAudioRecording(@Param('id') id: string) {
    return await this.audioService.getAudioRecordingById(id);
  }

  @Get('user/:userId')
  async getUserAudioRecordings(@Param('userId') userId: string) {
    return await this.audioService.getAudioRecordingsByUserId(userId);
  }
}
