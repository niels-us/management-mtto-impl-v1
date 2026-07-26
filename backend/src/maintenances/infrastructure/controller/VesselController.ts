import { Controller } from '@nestjs/common';
import { MaintenanceApplicationService } from '../../application/service/MaintenanceApplicationService';
import { RequestDto } from '../../../common/application/dto/RequestDto';
import { RequireTenant } from '../../../common/infrastructure/middleware';
import CustomException from '../../../common/application/exception/CustomException';
import { MaintenanceRequestValidation } from '../../application/validation/MaintenanceRequestValidation';

@Controller()
export class VesselController {
  private readonly validator = new MaintenanceRequestValidation();

  constructor(private readonly appService: MaintenanceApplicationService) {}

  public async getVessels(request: RequestDto): Promise<any[]> {
    if (!request.user || typeof request.user !== 'object') {
      throw new CustomException({ code: 'AUTH001', message: 'Unauthenticated user', httpStatus: 401 });
    }

    const user: any = request.user;
    return this.appService.getVessels(user.customerId);
  }

  public async getVesselComponents(request: RequestDto): Promise<any[]> {
    const path = request.path as any;
    const vesselId = path?.id;

    this.validator.validateVesselId(vesselId);

    if (!request.user || typeof request.user !== 'object') {
      throw new CustomException({ code: 'AUTH001', message: 'Unauthenticated user', httpStatus: 401 });
    }

    const user: any = request.user;
    return this.appService.getVesselComponents(vesselId, user.customerId);
  }
}
