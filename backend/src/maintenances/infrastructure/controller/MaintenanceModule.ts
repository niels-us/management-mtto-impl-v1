import { Module } from '@nestjs/common';
import { AuthController } from './AuthController.js';
import { VesselController } from './VesselController.js';
import { MaintenanceController } from './MaintenanceController.js';
import { AIQueryController } from './AIQueryController.js';
import { MaintenanceRequestValidation } from '../../application/validation/MaintenanceRequestValidation.js';
import { MaintenanceApplicationService } from '../../application/service/MaintenanceApplicationService.js';
import { MaintenanceDomainService } from '../../domain/service/MaintenanceDomainService.js';
import { AIMaintenanceService } from '../../application/ai/AIMaintenanceService.js';
import { MaintenanceDynamoRepository } from '../repository/MaintenanceDynamoRepository.js';
import { TenantValidator, TenantValidationGuard, TenantInterceptor } from '../../../common/infrastructure/middleware/index.js';
import { GroqLLMProvider } from '../../../common/ai/GroqLLMProvider.js';
import { AIPromptBuilder } from '../../../common/ai/AIPromptBuilder.js';

@Module({
  controllers: [AuthController, VesselController, MaintenanceController, AIQueryController],
  providers: [
    MaintenanceRequestValidation,
    MaintenanceApplicationService,
    MaintenanceDomainService,
    TenantValidator,
    TenantValidationGuard,
    {
      provide: 'APP_INTERCEPTOR',
      useClass: TenantInterceptor,
    },
    AIMaintenanceService,
    AIPromptBuilder,
    {
      provide: 'LLMProvider',
      useClass: GroqLLMProvider,
    },
    {
      provide: 'CustomerRepository',
      useClass: MaintenanceDynamoRepository,
    },
    {
      provide: 'UserRepository',
      useClass: MaintenanceDynamoRepository,
    },
    {
      provide: 'VesselRepository',
      useClass: MaintenanceDynamoRepository,
    },
    {
      provide: 'ComponentRepository',
      useClass: MaintenanceDynamoRepository,
    },
    {
      provide: 'MaintenanceRepository',
      useClass: MaintenanceDynamoRepository,
    },
  ],
})
export class MaintenanceModule {}
