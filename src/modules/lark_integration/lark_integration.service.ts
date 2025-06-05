import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import { TaskEntity } from '../task_management/task.entity';

@Injectable()
export class LarkIntegrationService {
  private readonly logger = new Logger(LarkIntegrationService.name);
  private tenantAccessToken: string | null = null;
  private tokenExpiryTime: number = 0;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(TaskEntity)
    private readonly taskRepository: Repository<TaskEntity>,
  ) {}

  private async getTenantAccessToken(): Promise<string> {
    const now = Date.now();    // Return cached token if still valid
    if (this.tenantAccessToken && now < this.tokenExpiryTime) {
      return this.tenantAccessToken;
    }

    const appId = this.configService.get<string>('LARK_APP_ID');
    const appSecret = this.configService.get<string>('LARK_APP_SECRET');

    if (!appId || !appSecret) {
      throw new Error('Lark app credentials not configured');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
          {
            app_id: appId,
            app_secret: appSecret,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );      if (response.data.code === 0) {
        this.tenantAccessToken = response.data.tenant_access_token;
        // Set expiry time (usually 2 hours, we'll refresh 10 minutes early)
        this.tokenExpiryTime = now + (response.data.expire - 600) * 1000;
        return this.tenantAccessToken as string;
      } else {
        throw new Error(`Failed to get tenant access token: ${response.data.msg}`);
      }
    } catch (error) {
      this.logger.error('Failed to get Lark tenant access token:', error.response?.data || error.message);
      throw new Error(`Lark authentication failed: ${error.response?.data?.msg || error.message}`);
    }
  }

  async createTaskOnLark(taskDetails: {
    title: string;
    description?: string;
    dueDate?: string;
    assigneeIds?: string[];
  }): Promise<{ larkTaskId: string; data: any }> {
    const accessToken = await this.getTenantAccessToken();

    try {
      const taskData: any = {
        summary: taskDetails.title,
        description: {
          text: taskDetails.description || '',
          type: 'text',
        },
      };

      if (taskDetails.dueDate) {
        taskData.due = {
          timestamp: Math.floor(new Date(taskDetails.dueDate).getTime() / 1000).toString(),
          is_all_day: false,
        };
      }

      if (taskDetails.assigneeIds && taskDetails.assigneeIds.length > 0) {
        taskData.collaborators = taskDetails.assigneeIds.map(id => ({
          id,
          type: 'user',
        }));
      }

      const response = await firstValueFrom(
        this.httpService.post(
          'https://open.feishu.cn/open-apis/task/v1/tasks',
          taskData,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      if (response.data.code === 0) {
        return {
          larkTaskId: response.data.data.task.id,
          data: response.data.data,
        };
      } else {
        throw new Error(`Failed to create Lark task: ${response.data.msg}`);
      }
    } catch (error) {
      this.logger.error('Failed to create Lark task:', error.response?.data || error.message);
      throw new Error(`Lark task creation failed: ${error.response?.data?.msg || error.message}`);
    }
  }

  async createCalendarEventOnLark(eventDetails: {
    summary: string;
    startTime: string;
    endTime: string;
    description?: string;
    attendees?: string[];
  }): Promise<any> {
    const accessToken = await this.getTenantAccessToken();

    try {
      const eventData: any = {
        summary: eventDetails.summary,
        description: eventDetails.description || '',
        start_time: {
          timestamp: Math.floor(new Date(eventDetails.startTime).getTime() / 1000).toString(),
        },
        end_time: {
          timestamp: Math.floor(new Date(eventDetails.endTime).getTime() / 1000).toString(),
        },
      };

      if (eventDetails.attendees && eventDetails.attendees.length > 0) {
        eventData.attendee_ability = 'can_see_others';
        eventData.attendees = eventDetails.attendees.map(email => ({
          type: 'user',
          user_id: email,
        }));
      }

      const response = await firstValueFrom(
        this.httpService.post(
          'https://open.feishu.cn/open-apis/calendar/v4/calendars/primary/events',
          eventData,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      if (response.data.code === 0) {
        return response.data.data;
      } else {
        throw new Error(`Failed to create Lark calendar event: ${response.data.msg}`);
      }
    } catch (error) {
      this.logger.error('Failed to create Lark calendar event:', error.response?.data || error.message);
      throw new Error(`Lark calendar event creation failed: ${error.response?.data?.msg || error.message}`);
    }
  }

  async handleTaskUpdateWebhook(payload: any, signature: string, timestamp: string): Promise<void> {
    // TODO: Implement signature verification
    // const expectedSignature = this.calculateSignature(payload, timestamp);
    // if (signature !== expectedSignature) {
    //   throw new Error('Invalid webhook signature');
    // }

    this.logger.log('Received Lark task update webhook:', JSON.stringify(payload));

    try {
      const eventType = payload.header?.event_type;
      
      if (eventType === 'task.task.updated_v1') {
        const larkTaskId = payload.event?.object?.task_id;
        const taskData = payload.event?.object;

        if (larkTaskId) {
          // Find local task by larkTaskId
          const localTask = await this.taskRepository.findOne({
            where: { larkTaskId },
          });

          if (localTask) {
            // Update local task based on Lark changes
            if (taskData.summary) {
              localTask.title = taskData.summary;
            }

            if (taskData.description) {
              localTask.description = taskData.description.text;
            }

            // Map Lark status to local status if needed
            // This would depend on Lark's status values

            await this.taskRepository.save(localTask);
            this.logger.log(`Updated local task ${localTask.id} from Lark webhook`);
          }
        }
      }
    } catch (error) {
      this.logger.error('Error handling Lark task update webhook:', error);
      throw error;
    }
  }

  async handleCalendarEventWebhook(payload: any, signature: string, timestamp: string): Promise<void> {
    // TODO: Implement signature verification
    // const expectedSignature = this.calculateSignature(payload, timestamp);
    // if (signature !== expectedSignature) {
    //   throw new Error('Invalid webhook signature');
    // }

    this.logger.log('Received Lark calendar event webhook:', JSON.stringify(payload));

    try {
      const eventType = payload.header?.event_type;
      
      if (eventType === 'calendar.calendar.event.created_v4' || 
          eventType === 'calendar.calendar.event.updated_v4') {
        // Handle calendar event changes
        // This could trigger creation of tasks or other actions
        this.logger.log(`Handled Lark calendar event: ${eventType}`);
      }
    } catch (error) {
      this.logger.error('Error handling Lark calendar event webhook:', error);
      throw error;
    }
  }

  // TODO: Implement signature calculation for webhook verification
  // private calculateSignature(payload: any, timestamp: string): string {
  //   const appSecret = this.configService.get<string>('LARK_APP_SECRET');
  //   const stringToSign = timestamp + JSON.stringify(payload);
  //   return crypto.createHmac('sha256', appSecret).update(stringToSign).digest('hex');
  // }
}
