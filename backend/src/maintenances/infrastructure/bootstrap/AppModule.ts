import { Module } from '@nestjs/common';
import { MaintenanceModule } from '../controller/MaintenanceModule.js';

@Module({
  imports: [MaintenanceModule],
})
export class AppModule {}
