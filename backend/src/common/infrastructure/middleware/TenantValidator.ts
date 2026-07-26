import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { VesselRepository } from '../../../maintenances/domain/repository/VesselRepository';
import { ComponentRepository } from '../../../maintenances/domain/repository/ComponentRepository';
import { MaintenanceRepository } from '../../../maintenances/domain/repository/MaintenanceRepository';

export type TenantEntity = 'vessel' | 'component' | 'maintenance' | 'custom';

export interface TenantValidationContext {
  resourceId: string;
  userCustomerId: string;
  entityType: TenantEntity;
  customValidator?: (resource: any) => boolean;
}

@Injectable()
export class TenantValidator {
  constructor(
    @Inject('VesselRepository') private vesselRepository: VesselRepository,
    @Inject('ComponentRepository') private componentRepository: ComponentRepository,
    @Inject('MaintenanceRepository') private maintenanceRepository: MaintenanceRepository
  ) {}

  async validateResourceOwnership(context: TenantValidationContext): Promise<boolean> {
    const { resourceId, userCustomerId, entityType, customValidator } = context;

    if (!resourceId || !userCustomerId) {
      throw new TenantValidationError(
        'Invalid validation context: resourceId and userCustomerId are required',
        'INVALID_CONTEXT'
      );
    }

    let resource: any;

    switch (entityType) {
      case 'vessel':
        resource = await this.vesselRepository.findVesselById(resourceId, userCustomerId);
        break;

      case 'component':
        resource = await this.componentRepository.findById(resourceId, userCustomerId);
        break;

      case 'maintenance':
        resource = await this.maintenanceRepository.findMaintenanceById(resourceId, userCustomerId);
        break;

      case 'custom':
        if (!customValidator) {
          throw new TenantValidationError(
            'Custom validator required for custom entity type',
            'CUSTOM_VALIDATOR_MISSING'
          );
        }
        return customValidator({ id: resourceId });

      default:
        throw new TenantValidationError(`Unknown entity type: ${entityType}`, 'UNKNOWN_ENTITY_TYPE');
    }

    if (!resource) {
      throw new TenantValidationError(
        `Resource ${resourceId} not found or not owned by tenant ${userCustomerId}`,
        'RESOURCE_NOT_FOUND',
        { resourceId, userCustomerId, entityType }
      );
    }

    if (resource.customerId !== userCustomerId) {
      throw new TenantValidationError(`Access denied: Resource belongs to different tenant`, 'TENANT_MISMATCH', {
        resourceCustomerId: resource.customerId,
        userCustomerId,
      });
    }

    return true;
  }

  async validateResourcesOwnership(
    contexts: TenantValidationContext[]
  ): Promise<{ resourceId: string; isValid: boolean; error?: Error }[]> {
    return Promise.all(
      contexts.map(async (context) => {
        try {
          await this.validateResourceOwnership(context);
          return { resourceId: context.resourceId, isValid: true };
        } catch (error) {
          return {
            resourceId: context.resourceId,
            isValid: false,
            error: error instanceof Error ? error : new Error(String(error)),
          };
        }
      })
    );
  }

  extractTenantId(user: any): string | null {
    if (!user) return null;
    return user.customerId || null;
  }

  hasValidTenantContext(user: any): boolean {
    return !!this.extractTenantId(user);
  }
}

export class TenantValidationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'TenantValidationError';
  }
}
