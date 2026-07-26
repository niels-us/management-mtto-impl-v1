import { Maintenance, MaintenanceStatus } from '../entities/Maintenance';

export interface MaintenanceRepository {
  createMaintenance(maintenance: Maintenance): Promise<Maintenance>;
  findMaintenanceByCustomer(customerId: string): Promise<Maintenance[]>;
  updateStatus(maintenanceId: string, status: MaintenanceStatus, customerId?: string): Promise<Maintenance | null>;
  findMaintenanceById(maintenanceId: string, customerId?: string): Promise<Maintenance | null>;
  deleteMaintenance(maintenanceId: string, customerId: string): Promise<boolean>;
}
