export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export class Maintenance {
  id: string;
  componentId: string;
  customerId: string;
  description: string;
  status: MaintenanceStatus;
  scheduledAt: Date;
  performedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(params: {
    id: string;
    componentId: string;
    customerId: string;
    description: string;
    status?: MaintenanceStatus;
    scheduledAt: Date;
    performedAt?: Date;
    createdBy: string;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    this.id = params.id;
    this.componentId = params.componentId;
    this.customerId = params.customerId;
    this.description = params.description;
    this.status = params.status || 'pending';
    this.scheduledAt = params.scheduledAt;
    this.performedAt = params.performedAt;
    this.createdBy = params.createdBy;
    this.createdAt = params.createdAt || new Date();
    this.updatedAt = params.updatedAt || new Date();
  }
}
