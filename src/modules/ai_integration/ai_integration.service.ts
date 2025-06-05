import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AiIntegrationService {
  private readonly logger = new Logger(AiIntegrationService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async summarizeText(text: string): Promise<{ summary: string }> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a helpful assistant that summarizes text concisely and accurately.',
              },
              {
                role: 'user',
                content: `Please summarize the following text:\n\n${text}`,
              },
            ],
            max_tokens: 300,
            temperature: 0.3,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const summary = response.data.choices[0]?.message?.content?.trim();

      if (!summary) {
        throw new Error('No summary generated');
      }

      return { summary };
    } catch (error) {
      this.logger.error('OpenAI summarization error:', error.response?.data ?? error.message);
      throw new Error(`Text summarization failed: ${error.response?.data?.error?.message ?? error.message}`);
    }
  }

  async analyzeSentiment(text: string): Promise<{ sentiment: string; score: number }> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content:
                  'You are a sentiment analysis assistant. Analyze the sentiment of the given text and respond with a JSON object containing "sentiment" (positive, negative, or neutral) and "score" (a number between -1 and 1, where -1 is very negative, 0 is neutral, and 1 is very positive).',
              },
              {
                role: 'user',
                content: `Analyze the sentiment of this text:\n\n${text}`,
              },
            ],
            max_tokens: 150,
            temperature: 0.1,
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const result = response.data.choices[0]?.message?.content?.trim();

      if (!result) {
        throw new Error('No sentiment analysis generated');
      }

      try {
        const parsed = JSON.parse(result);
        return {
          sentiment: parsed.sentiment ?? 'neutral',
          score: parsed.score ?? 0,
        };
      } catch {
        // Fallback if JSON parsing fails
        this.logger.warn('Failed to parse sentiment JSON, using fallback');
        return {
          sentiment: 'neutral',
          score: 0,
        };
      }
    } catch (error) {
      this.logger.error('OpenAI sentiment analysis error:', error.response?.data ?? error.message);
      throw new Error(`Sentiment analysis failed: ${error.response?.data?.error?.message ?? error.message}`);
    }
  }
}
