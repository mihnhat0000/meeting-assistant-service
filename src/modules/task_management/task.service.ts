import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaskEntity } from './task.entity';
import { UserEntity } from '../auth/user.entity';
import { AudioRecordingEntity } from '../audio/audio-recording.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from '../../shared/enums';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(AudioRecordingEntity)
    private readonly audioRepository: Repository<AudioRecordingEntity>,
  ) {}

  async create(createTaskDto: CreateTaskDto, reporterId: string): Promise<TaskEntity> {
    // Validate reporter exists
    const reporter = await this.userRepository.findOne({ where: { id: reporterId } });
    if (!reporter) {
      throw new NotFoundException('Reporter not found');
    }

    // Validate assignee if provided
    if (createTaskDto.assigneeId) {
      const assignee = await this.userRepository.findOne({ where: { id: createTaskDto.assigneeId } });
      if (!assignee) {
        throw new NotFoundException('Assignee not found');
      }
    }

    // Validate audio recording if provided
    if (createTaskDto.audioRecordingId) {
      const audioRecording = await this.audioRepository.findOne({
        where: { id: createTaskDto.audioRecordingId },
      });
      if (!audioRecording) {
        throw new NotFoundException('Audio recording not found');
      }
    }

    const task = this.taskRepository.create({
      ...createTaskDto,
      reporterId,
      status: createTaskDto.status || TaskStatus.TODO,
      dueDate: createTaskDto.dueDate ? new Date(createTaskDto.dueDate) : null,
    });

    return await this.taskRepository.save(task);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    status?: TaskStatus,
    assigneeId?: string,
  ): Promise<{ tasks: TaskEntity[]; total: number; page: number; limit: number }> {
    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.reporter', 'reporter')
      .leftJoinAndSelect('task.audioRecording', 'audioRecording');

    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    if (assigneeId) {
      queryBuilder.andWhere('task.assigneeId = :assigneeId', { assigneeId });
    }

    const [tasks, total] = await queryBuilder
      .orderBy('task.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      tasks,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<TaskEntity> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['assignee', 'reporter', 'audioRecording'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<TaskEntity> {
    const task = await this.findOne(id);

    // Validate assignee if being updated
    if (updateTaskDto.assigneeId && updateTaskDto.assigneeId !== task.assigneeId) {
      const assignee = await this.userRepository.findOne({
        where: { id: updateTaskDto.assigneeId },
      });
      if (!assignee) {
        throw new NotFoundException('Assignee not found');
      }
    }

    // Validate audio recording if being updated
    if (updateTaskDto.audioRecordingId && updateTaskDto.audioRecordingId !== task.audioRecordingId) {
      const audioRecording = await this.audioRepository.findOne({
        where: { id: updateTaskDto.audioRecordingId },
      });
      if (!audioRecording) {
        throw new NotFoundException('Audio recording not found');
      }
    }

    Object.assign(task, {
      ...updateTaskDto,
      dueDate: updateTaskDto.dueDate ? new Date(updateTaskDto.dueDate) : task.dueDate,
    });

    return await this.taskRepository.save(task);
  }

  async remove(id: string): Promise<void> {
    const task = await this.findOne(id);
    await this.taskRepository.remove(task);
  }

  async findByAudioRecording(audioRecordingId: string): Promise<TaskEntity[]> {
    return await this.taskRepository.find({
      where: { audioRecordingId },
      relations: ['assignee', 'reporter'],
    });
  }
}
