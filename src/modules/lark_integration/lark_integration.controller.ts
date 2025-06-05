import {
  Controller,
  Post,
  Body,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { LarkIntegrationService } from './lark_integration.service';
import { CreateLarkTaskDto, CreateLarkCalendarEventDto } from './dto/lark-integration.dto';

@Controller('lark')
export class LarkIntegrationController {
  private readonly logger = new Logger(LarkIntegrationController.name);

  constructor(private readonly larkIntegrationService: LarkIntegrationService) {}

  @Post('tasks')
  @UseGuards(JwtAuthGuard)
  async createLarkTask(@Body() createTaskDto: CreateLarkTaskDto) {
    return await this.larkIntegrationService.createTaskOnLark(createTaskDto);
  }

  @Post('calendar/events')
  @UseGuards(JwtAuthGuard)
  async createLarkCalendarEvent(@Body() createEventDto: CreateLarkCalendarEventDto) {
    return await this.larkIntegrationService.createCalendarEventOnLark(createEventDto);
  }

  @Post('webhooks/event_callback')
  @HttpCode(HttpStatus.OK)
  async handleLarkWebhook(
    @Body() payload: any,
    @Headers('x-lark-signature') signature: string,
    @Headers('x-lark-request-timestamp') timestamp: string,
  ) {
    this.logger.log('Received Lark webhook');

    try {
      // Handle challenge verification for webhook setup
      if (payload.type === 'url_verification') {
        return { challenge: payload.challenge };
      }

      // Determine event type and route to appropriate handler
      const eventType = payload.header?.event_type;

      if (eventType?.startsWith('task.')) {
        await this.larkIntegrationService.handleTaskUpdateWebhook(payload, signature, timestamp);
      } else if (eventType?.startsWith('calendar.')) {
        await this.larkIntegrationService.handleCalendarEventWebhook(payload, signature, timestamp);
      }

      return { message: 'Webhook processed successfully' };
    } catch (error) {
      this.logger.error('Error processing Lark webhook:', error);
      // Return 200 to prevent Lark from retrying, but log the error
      return { message: 'Webhook received but processing failed' };
    }
  }
}
