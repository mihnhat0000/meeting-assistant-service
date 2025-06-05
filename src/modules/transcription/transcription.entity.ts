import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { TranscriptionStatus } from '../../shared/types/shared.enums';
import { AudioRecordingEntity } from '../audio/audio-recording.entity';

@Entity('transcriptions')
export class TranscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  audioRecordingId: string;

  @Column({
    type: 'enum',
    enum: TranscriptionStatus,
    default: TranscriptionStatus.PENDING,
  })
  status: TranscriptionStatus;

  @Column({ type: 'text', nullable: true })
  transcriptText: string;

  @Column({ nullable: true })
  language: string;

  @Column({ nullable: true })
  processedAt: Date;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToOne(() => AudioRecordingEntity, (audioRecording) => audioRecording.transcription)
  @JoinColumn({ name: 'audioRecordingId' })
  audioRecording: AudioRecordingEntity;
}
