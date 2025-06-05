import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../shared/auth/user.entity';

// Forward declaration to avoid circular import
interface ITranscriptionEntity {
  id: string;
  audioRecordingId: string;
  status: string;
  transcriptText: string;
  language: string;
  processedAt: Date;
  errorMessage: string;
  createdAt: Date;
  updatedAt: Date;
}

@Entity('audio_recordings')
export class AudioRecordingEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  originalFileName: string;

  @Column()
  filePath: string;

  @Column()
  mimeType: string;

  @Column({ nullable: true })
  duration_time?: number;

  @Column({ nullable: true })
  transcriptionId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'userId' })
  user: UserEntity;
  @OneToOne('TranscriptionEntity', 'audioRecording', {
    eager: false,
    nullable: true,
  })
  transcription: ITranscriptionEntity | null;
}
