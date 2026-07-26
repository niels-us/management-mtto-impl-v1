import { Injectable, Logger, Inject } from '@nestjs/common';
import { MaintenanceDomainService } from '../../domain/service/MaintenanceDomainService';
import { AIPromptBuilder, MaintenanceContext } from '../../../common/ai/AIPromptBuilder';
import { LLMProvider } from '../../../common/ai/LLMProvider';
import { AIConstants } from '../../../common/constants/AIConstants';
import { AIQueryRequest } from './dto/AIQueryRequest';
import { AIQueryResponse } from './dto/AIQueryResponse';
import { Component } from '../../domain/entities/Component';
import { Maintenance } from '../../domain/entities/Maintenance';

@Injectable()
export class AIMaintenanceService {
  private readonly logger = new Logger(AIMaintenanceService.name);

  constructor(
    private maintenanceDomainService: MaintenanceDomainService,
    private promptBuilder: AIPromptBuilder,
    @Inject('LLMProvider') private llmProvider: LLMProvider
  ) {}

  async processQuery(request: AIQueryRequest): Promise<AIQueryResponse> {
    const startTime = Date.now();

    try {
      this.logger.log(`Processing AI query for customer ${request.customerId}: "${request.question}"`);

      // 1. Validar que el LLM esté disponible
      if (!this.llmProvider.isConfigured()) {
        const error = 'AI service is not available. Verify configuration.';
        this.logger.error(error);
        return AIQueryResponse.error(request.question, error);
      }

      // 2. Obtener contexto de datos de la BD
      this.logger.debug('Gathering context data...');
      const context = await this.gatherMaintenanceContext(request.customerId);

      this.logger.debug('Building contextual prompt...');
      const userPrompt = this.promptBuilder.buildContextualPrompt(request.question, context);

      this.logger.debug('Sending to LLM...');
      const systemPrompt = AIConstants.getSystemPrompt(request.question);
      const answer = await this.llmProvider.query(systemPrompt, userPrompt);

      const processingTime = Date.now() - startTime;
      this.logger.log(`Query processed successfully in ${processingTime}ms`);

      return AIQueryResponse.success(request.question, answer, processingTime);
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error(`Error processing AI query: ${errorMessage}`, error);

      return AIQueryResponse.error(request.question, errorMessage, processingTime);
    }
  }

  private async gatherMaintenanceContext(customerId: string): Promise<MaintenanceContext> {
    try {
      const vessels = await this.maintenanceDomainService.getVessels(customerId);

      let components: Component[] = [];
      let maintenances: Maintenance[] = [];

      if (vessels && vessels.length > 0) {
        const componentPromises = vessels.map((vessel) =>
          this.maintenanceDomainService.getVesselComponents(vessel.id, customerId)
        );
        const componentArrays = await Promise.all(componentPromises);
        components = componentArrays.flat();
      }

      maintenances = (await this.maintenanceDomainService.getMaintenances(customerId)) || [];

      this.logger.debug(
        `Context gathered: ${vessels.length} vessels, ${components.length} components, ${maintenances.length} maintenances`
      );

      return {
        vessels,
        components,
        maintenances,
      };
    } catch (error) {
      this.logger.error(`Error gathering context: ${error instanceof Error ? error.message : 'unknown'}`);
      return {
        vessels: [],
        components: [],
        maintenances: [],
      };
    }
  }

  isAIServiceAvailable(): boolean {
    return this.llmProvider.isConfigured();
  }

  getProviderInfo(): { name: string; available: boolean } {
    return {
      name: this.llmProvider.getName(),
      available: this.llmProvider.isConfigured(),
    };
  }
}
