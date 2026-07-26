import { Module } from '@nestjs/common';
import { MaintenanceModule } from '../controller/MaintenanceModule';

@Module({
  imports: [MaintenanceModule],
})
export class AppModule {}
