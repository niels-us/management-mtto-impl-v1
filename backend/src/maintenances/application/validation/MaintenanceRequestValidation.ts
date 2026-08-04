import { BadRequestException } from '@nestjs/common';
import type { LoginRequest } from '../dto/request/LoginRequest.js';
import type { CreateMaintenanceRequest } from '../dto/request/CreateMaintenanceRequest.js';
import type { UpdateMaintenanceRequest } from '../dto/request/UpdateMaintenanceRequest.js';
import { UUIDValidator } from '../../../common/application/validation/UUIDValidator.js';

export class MaintenanceRequestValidation {
  async validateLogin(payload: LoginRequest) {
    if (!payload?.username || !payload?.password) {
      throw new BadRequestException('username and password are required');
    }
  }

  async validateCreateMaintenance(payload: CreateMaintenanceRequest) {
    if (!payload?.description || !payload?.scheduledAt || !payload?.customerId || !payload?.createdBy) {
      throw new BadRequestException('description, scheduledAt, customerId and createdBy are required');
    }

    UUIDValidator.validateOrThrow(payload.customerId, 'customerId');
  }

  async validateUpdateMaintenance(payload: UpdateMaintenanceRequest) {
    if (!payload?.status) {
      throw new BadRequestException('status is required');
    }
  }

  validateVesselId(vesselId: string): void {
    if (!vesselId) {
      throw new BadRequestException('Vessel ID is required');
    }
    try {
      UUIDValidator.validateOrThrow(vesselId, 'vesselId');
    } catch (error) {
      throw new BadRequestException(
        `Invalid vessel ID format: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  validateMaintenanceId(maintenanceId: string): void {
    if (!maintenanceId) {
      throw new BadRequestException('Maintenance ID is required');
    }
    try {
      UUIDValidator.validateOrThrow(maintenanceId, 'maintenanceId');
    } catch (error) {
      throw new BadRequestException(
        `Invalid maintenance ID format: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  validateComponentId(componentId: string): void {
    if (!componentId) {
      throw new BadRequestException('Component ID is required');
    }
    UUIDValidator.validateOrThrow(componentId, 'componentId');
  }

  validateCustomerId(customerId: string): void {
    if (!customerId) {
      throw new BadRequestException('Customer ID is required');
    }
    try {
      UUIDValidator.validateOrThrow(customerId, 'customerId');
    } catch (error) {
      throw new BadRequestException(
        `Invalid customer ID format: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
