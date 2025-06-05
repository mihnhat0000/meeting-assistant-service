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
import { UserEntity } from '../auth/user.entity';
import { TranscriptionEntity } from '../transcription/transcription.entity';

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

  @Column()
  size: number;
  @Column({ nullable: true })
  duration: number | null;

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

  @OneToOne(() => TranscriptionEntity, (transcription) => transcription.audioRecording, {
    eager: false,
    nullable: true,
  })
  transcription: TranscriptionEntity;
}
