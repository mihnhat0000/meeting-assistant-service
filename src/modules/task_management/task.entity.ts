import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TaskStatus, TaskPriority } from '../../shared/enums';
import { UserEntity } from '../auth/user.entity';
import { AudioRecordingEntity } from '../audio/audio-recording.entity';

@Entity('tasks')
export class TaskEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.TODO,
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
    nullable: true,
  })
  priority: TaskPriority;
  @Column({ nullable: true })
  dueDate: Date | null;

  @Column({ nullable: true })
  assigneeId: string;

  @Column()
  reporterId: string;

  @Column({ nullable: true })
  audioRecordingId: string;

  @Column({ nullable: true, unique: true })
  larkTaskId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'assigneeId' })
  assignee: UserEntity;

  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'reporterId' })
  reporter: UserEntity;

  @ManyToOne(() => AudioRecordingEntity, { nullable: true })
  @JoinColumn({ name: 'audioRecordingId' })
  audioRecording: AudioRecordingEntity;
}
