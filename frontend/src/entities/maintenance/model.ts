import { z } from 'zod';

export type MaintenanceStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Maintenance {
  id: string;
  componentId: string;
  customerId: string;
  description: string;
  status: MaintenanceStatus;
  scheduledAt: string;
  performedAt: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateMaintenanceRequest {
  description: string;
  scheduledAt: string;
  customerId: string;
  createdBy: string;
}

export interface UpdateMaintenanceRequest {
  status: MaintenanceStatus;
}

export const createMaintenanceSchema = z.object({
  description: z.string().min(3, 'Description must be at least 3 characters'),
  scheduledAt: z.string().min(1, 'Scheduled date is required'),
});

export type CreateMaintenanceFormData = z.infer<typeof createMaintenanceSchema>;
