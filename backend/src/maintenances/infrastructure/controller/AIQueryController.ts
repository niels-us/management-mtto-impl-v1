import { Controller, Logger } from '@nestjs/common';
import { AIMaintenanceService } from '../../application/ai/AIMaintenanceService';
import { AIQueryRequest } from '../../application/ai/dto/AIQueryRequest';
import { AIQueryResponse } from '../../application/ai/dto/AIQueryResponse';
import { RequestDto } from '../../../common/application/dto/RequestDto';
import CustomException from '../../../common/application/exception/CustomException';

@Controller()
export class AIQueryController {
  private readonly logger = new Logger(AIQueryController.name);

  constructor(private readonly aiMaintenanceService: AIMaintenanceService) {}

  public async queryAI(request: RequestDto): Promise<AIQueryResponse> {
    try {
      const user = request.user as any;
      if (!user || !user.customerId) {
        this.logger.warn('Access attempt without authentication');
        throw new CustomException({
          code: 'AUTH001',
          message: 'User not authenticated',
          httpStatus: 401,
        });
      }

      const payload = request.payload as any;
      if (!payload || !payload.question) {
        this.logger.warn('Request without question');
        throw new CustomException({
          code: 'VALIDATION_ERROR',
          message: 'Question is required in the payload',
          httpStatus: 400,
        });
      }

      const aiQueryRequest = AIQueryRequest.validate({
        question: payload.question,
        customerId: user.customerId,
      });

      this.logger.log(
        `AI query received from customer ${user.customerId}: "${aiQueryRequest.question.substring(0, 50)}..."`
      );

      const response = await this.aiMaintenanceService.processQuery(aiQueryRequest);

      if (!response.success) {
        this.logger.warn(`⚠️ Query failed: ${response.error}`);
      }

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`Error in AIQueryController: ${errorMessage}`, error);

      if (error instanceof CustomException) {
        throw error;
      }

      if (errorMessage.includes('Validation failed')) {
        throw new CustomException({
          code: 'VALIDATION_ERROR',
          message: errorMessage,
          httpStatus: 400,
        });
      }

      throw new CustomException({
        code: 'AI_QUERY_ERROR',
        message: `Error processing query: ${errorMessage}`,
        httpStatus: 500,
      });
    }
  }

  public async healthCheck(request: RequestDto): Promise<{
    status: string;
    aiServiceAvailable: boolean;
    provider: string;
  }> {
    try {
      const user = request.user as any;
      if (!user || !user.customerId) {
        throw new CustomException({
          code: 'AUTH001',
          message: 'User not authenticated',
          httpStatus: 401,
        });
      }

      const providerInfo = this.aiMaintenanceService.getProviderInfo();

      return {
        status: 'ok',
        aiServiceAvailable: providerInfo.available,
        provider: providerInfo.name,
      };
    } catch (error) {
      this.logger.error(`Error in health check: ${error instanceof Error ? error.message : 'unknown'}`);

      if (error instanceof CustomException) {
        throw error;
      }

      throw new CustomException({
        code: 'HEALTH_CHECK_ERROR',
        message: 'Error verificando salud del servicio AI',
        httpStatus: 500,
      });
    }
  }
}
