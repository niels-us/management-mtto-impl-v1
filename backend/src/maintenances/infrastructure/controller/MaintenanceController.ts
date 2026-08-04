import { Controller } from '@nestjs/common';
import { MaintenanceApplicationService } from '../../application/service/MaintenanceApplicationService.js';
import { MaintenanceRequestValidation } from '../../application/validation/MaintenanceRequestValidation.js';
import { RequestDto } from '../../../common/application/dto/RequestDto.js';
import CustomException from '../../../common/application/exception/CustomException.js';
import { RequireTenant } from '../../../common/infrastructure/middleware/index.js';
import type { CreateMaintenanceRequest } from '../../application/dto/request/CreateMaintenanceRequest.js';
import type { UpdateMaintenanceRequest } from '../../application/dto/request/UpdateMaintenanceRequest.js';
import { Maintenance } from '../../domain/entities/Maintenance.js';
import { v4 as uuidv4 } from 'uuid';

@Controller()
export class MaintenanceController {
  constructor(
    private readonly appService: MaintenanceApplicationService,
    private readonly validator: MaintenanceRequestValidation
  ) {}

  public async createMaintenance(request: RequestDto): Promise<Maintenance> {
    const path = request.path as any;
    const componentId: string = path?.id;

    this.validator.validateComponentId(componentId);

    const payload = request.payload as CreateMaintenanceRequest;
    await this.validator.validateCreateMaintenance(payload);

    const user = request.user as any;
    if (!user || !user.customerId) {
      throw new CustomException({ code: 'AUTH001', message: 'Unauthenticated user', httpStatus: 401 });
    }

    if (payload.customerId && payload.customerId !== user.customerId) {
      throw new CustomException({
        code: 'AUTHZ001',
        message: 'Access denied: You cannot create data for another tenant',
        httpStatus: 403,
      });
    }

    const maintenance = new Maintenance({
      id: uuidv4(),
      componentId,
      customerId: user.customerId,
      description: payload.description,
      scheduledAt: new Date(payload.scheduledAt),
      createdBy: user.sub || payload.createdBy,
      status: 'pending',
    });

    return this.appService.createMaintenance(maintenance);
  }

  public async getMaintenance(request: RequestDto): Promise<Maintenance[]> {
    const user = request.user as any;
    if (!user || !user.customerId) {
      throw new CustomException({ code: 'AUTH001', message: 'Unauthenticated user', httpStatus: 401 });
    }

    const query = (request.query || {}) as any;
    const status = query.status ? (query.status as string).toLowerCase() : undefined;

    return this.appService.getMaintenances(user.customerId, status);
  }

  public async updateMaintenance(request: RequestDto): Promise<Maintenance | null> {
    const path = request.path as any;
    const maintenanceId: string = path?.id;

    this.validator.validateMaintenanceId(maintenanceId);

    const payload = request.payload as UpdateMaintenanceRequest;
    await this.validator.validateUpdateMaintenance(payload);

    const user = request.user as any;
    if (!user || !user.customerId) {
      throw new CustomException({ code: 'AUTH001', message: 'Unauthenticated user', httpStatus: 401 });
    }

    return this.appService.updateMaintenanceStatus(user.customerId, maintenanceId, payload.status);
  }

  public async deleteMaintenance(request: RequestDto): Promise<{ message: string; id: string }> {
    const path = request.path as any;
    const maintenanceId: string = path?.id;

    this.validator.validateMaintenanceId(maintenanceId);

    const user = request.user as any;
    if (!user || !user.customerId) {
      throw new CustomException({ code: 'AUTH001', message: 'Unauthenticated user', httpStatus: 401 });
    }

    await this.appService.deleteMaintenance(user.customerId, maintenanceId);
    return { message: 'Maintenance deleted successfully', id: maintenanceId };
  }
}
