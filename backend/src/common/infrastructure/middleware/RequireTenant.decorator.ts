import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { TenantValidationGuard, TenantRequirement, TENANT_REQUIREMENT_KEY } from './TenantValidationGuard';

export function RequireTenant(requirement: TenantRequirement) {
  return applyDecorators(UseGuards(TenantValidationGuard), SetMetadata(TENANT_REQUIREMENT_KEY, requirement));
}

export function RequireTenantValidation(requirement: TenantRequirement) {
  return SetMetadata(TENANT_REQUIREMENT_KEY, requirement);
}
