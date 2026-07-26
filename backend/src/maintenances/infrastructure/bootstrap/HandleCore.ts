import { INestApplicationContext, Type } from '@nestjs/common';
import { MaintenanceModule } from '../controller/MaintenanceModule';
import { MaintenanceController } from '../controller/MaintenanceController';
import { AuthController } from '../controller/AuthController';
import { VesselController } from '../controller/VesselController';
import { AIQueryController } from '../controller/AIQueryController';
import CustomException from '../../../common/application/exception/CustomException';

const controllersModulesMap: [Type<any>, Type<any>][] = [
  [AuthController, MaintenanceModule],
  [VesselController, MaintenanceModule],
  [MaintenanceController, MaintenanceModule],
  [AIQueryController, MaintenanceModule],
];

const HandleCore = (appContext: INestApplicationContext, action: string) => {
  for (const [controller, module] of controllersModulesMap) {
    const controllerInstance = appContext.select(module).get(controller);
    if (controllerInstance && controllerInstance[action]) {
      return controllerInstance;
    }
  }
  throw new CustomException({
    code: 'ROUTE_001',
    message: `Action ${action} not found in maintenances module`,
    httpStatus: 400,
  });
};

export default HandleCore;
