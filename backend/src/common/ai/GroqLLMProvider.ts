import { Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';
import type { LLMProvider } from './LLMProvider.js';
import { AIConstants } from '../constants/AIConstants.js';
import CustomException from '../application/exception/CustomException.js';

@Injectable()
export class GroqLLMProvider implements LLMProvider {
  private readonly logger = new Logger(GroqLLMProvider.name);
  private groqClient: Groq;
  private isReady = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    try {
      const apiKey = process.env.GROQ_API_KEY;

      if (!apiKey) {
        this.logger.warn('GROQ_API_KEY not configured. AI service will not be available until configured.');
        this.isReady = false;
        return;
      }

      this.groqClient = new Groq({ apiKey });
      this.isReady = true;
      this.logger.log('Groq LLM Provider initialized successfully');
    } catch (error) {
      this.logger.error('Error initializing Groq LLM Provider', error);
      this.isReady = false;
    }
  }

  async query(systemPrompt: string, userPrompt: string): Promise<string> {
    if (!this.isReady || !this.groqClient) {
      throw new CustomException({
        code: 'AI_001',
        message: 'AI service is not available. Verify GROQ_API_KEY configuration.',
        httpStatus: 503,
      });
    }

    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < AIConstants.LLM_RETRY_ATTEMPTS) {
      try {
        this.logger.debug(`Sending query to Groq (attempt ${attempts + 1}/${AIConstants.LLM_RETRY_ATTEMPTS})`);

        const response = await this.groqClient.chat.completions.create(
          {
            messages: [
              {
                role: 'system',
                content: systemPrompt,
              },
              {
                role: 'user',
                content: userPrompt,
              },
            ],
            model: AIConstants.GROQ_MODEL,
            temperature: AIConstants.TEMPERATURE,
            max_tokens: AIConstants.MAX_TOKENS,
          },
          {
            timeout: AIConstants.LLM_REQUEST_TIMEOUT_MS,
          }
        );

        const content = response.choices[0]?.message?.content;

        if (!content) {
          throw new CustomException({ code: 'AI_002', message: 'Empty response from AI service', httpStatus: 502 });
        }

        this.logger.debug('Response received from LLM');
        return content;
      } catch (error) {
        lastError = error as Error;
        attempts++;

        if (attempts < AIConstants.LLM_RETRY_ATTEMPTS) {
          this.logger.warn(
            `Error on attempt ${attempts}: ${lastError.message}. Retrying in ${AIConstants.LLM_RETRY_DELAY_MS}ms...`
          );
          await this.sleep(AIConstants.LLM_RETRY_DELAY_MS);
        }
      }
    }

    this.logger.error(`Error after ${AIConstants.LLM_RETRY_ATTEMPTS} attempts: ${lastError?.message}`);
    throw new CustomException({
      code: 'AI_003',
      message: `Could not process query with AI service after ${AIConstants.LLM_RETRY_ATTEMPTS} attempts`,
      httpStatus: 503,
    });
  }

  isConfigured(): boolean {
    return this.isReady && !!this.groqClient;
  }

  getName(): string {
    return 'Groq LLM Provider';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
