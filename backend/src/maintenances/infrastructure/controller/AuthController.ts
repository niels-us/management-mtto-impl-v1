import { Controller } from '@nestjs/common';
import { MaintenanceApplicationService } from '../../application/service/MaintenanceApplicationService';
import { MaintenanceRequestValidation } from '../../application/validation/MaintenanceRequestValidation';
import { RequestDto } from '../../../common/application/dto/RequestDto';
import { LoginRequest } from '../../application/dto/request/LoginRequest';

@Controller()
export class AuthController {
  constructor(
    private readonly appService: MaintenanceApplicationService,
    private readonly validator: MaintenanceRequestValidation
  ) {}

  public async login(request: RequestDto): Promise<{ token: string }> {
    const payload = request.payload as LoginRequest;
    await this.validator.validateLogin(payload);
    const result = await this.appService.login(payload.username, payload.password);
    return { token: result.token };
  }
}
