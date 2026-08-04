import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantValidator, TenantValidationError, type TenantEntity } from './TenantValidator.js';

export interface TenantRequirement {
  entityType: TenantEntity;
  paramName?: string; // URL param name (e.g., 'vesselId')
  payloadPath?: string; // Payload path (e.g., 'componentId' or 'data.resourceId')
  validator?: (resource: any) => boolean; // Custom validation function
}

export const TENANT_REQUIREMENT_KEY = 'tenant_requirement';

@Injectable()
export class TenantValidationGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private tenantValidator: TenantValidator
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirement = this.reflector.get<TenantRequirement>(TENANT_REQUIREMENT_KEY, context.getHandler());

    if (!requirement) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as any;

    if (!user || !user.customerId) {
      throw new ForbiddenException('User authentication required');
    }

    const resourceId = this.extractResourceId(request, requirement);

    if (!resourceId) {
      throw new BadRequestException(
        `Resource ID not found. Expected in ${requirement.paramName || requirement.payloadPath}`
      );
    }

    try {
      await this.tenantValidator.validateResourceOwnership({
        resourceId,
        userCustomerId: user.customerId,
        entityType: requirement.entityType,
        customValidator: requirement.validator,
      });

      (request as any).resourceId = resourceId;
      (request as any).tenantId = user.customerId;

      return true;
    } catch (error) {
      if (error instanceof TenantValidationError) {
        throw new ForbiddenException(
          error.code === 'RESOURCE_NOT_FOUND' ? 'Resource not found' : 'Access denied to this resource'
        );
      }
      throw error;
    }
  }

  private extractResourceId(request: any, requirement: TenantRequirement): string | null {
    if (requirement.paramName) {
      const paramValue = request.params?.[requirement.paramName] || request.pathParameters?.[requirement.paramName];
      if (paramValue) return paramValue;
    }

    if (requirement.payloadPath) {
      const payload = request.payload || request.body || {};
      const value = this.getNestedProperty(payload, requirement.payloadPath);
      if (value) return value;
    }

    const commonNames = ['id', 'resourceId', 'vesselId', 'componentId', 'maintenanceId'];
    for (const name of commonNames) {
      const value = request.params?.[name] || request.payload?.[name] || request.body?.[name];
      if (value) return value;
    }

    return null;
  }

  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }
}
