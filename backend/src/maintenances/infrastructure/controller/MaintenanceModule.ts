import { Module } from '@nestjs/common';
import { AuthController } from './AuthController';
import { VesselController } from './VesselController';
import { MaintenanceController } from './MaintenanceController';
import { AIQueryController } from './AIQueryController';
import { MaintenanceRequestValidation } from '../../application/validation/MaintenanceRequestValidation';
import { MaintenanceApplicationService } from '../../application/service/MaintenanceApplicationService';
import { MaintenanceDomainService } from '../../domain/service/MaintenanceDomainService';
import { AIMaintenanceService } from '../../application/ai/AIMaintenanceService';
import { MaintenancePostgreRepository } from '../repository/MaintenancePostgreRepository';
import { TenantValidator, TenantValidationGuard, TenantInterceptor } from '../../../common/infrastructure/middleware';
import { GroqLLMProvider } from '../../../common/ai/GroqLLMProvider';
import { AIPromptBuilder } from '../../../common/ai/AIPromptBuilder';
import { LLMProvider } from '../../../common/ai/LLMProvider';

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
      useClass: MaintenancePostgreRepository,
    },
    {
      provide: 'UserRepository',
      useClass: MaintenancePostgreRepository,
    },
    {
      provide: 'VesselRepository',
      useClass: MaintenancePostgreRepository,
    },
    {
      provide: 'ComponentRepository',
      useClass: MaintenancePostgreRepository,
    },
    {
      provide: 'MaintenanceRepository',
      useClass: MaintenancePostgreRepository,
    },
  ],
})
export class MaintenanceModule {}
