export interface UpdateMaintenanceRequest {
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  customerId: string;
}
