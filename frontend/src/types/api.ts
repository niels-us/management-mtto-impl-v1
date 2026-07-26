export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
}

export interface Vessel {
  id: string;
  name: string;
  registrationNumber: string;
  customerId: string;
  createdAt: string;
}

export interface Component {
  id: string;
  name: string;
  vesselId: string;
  customerId: string;
  serialNumber: string | null;
  installedAt: string | null;
}

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

export interface AIQueryRequest {
  question: string;
}

export interface AIQueryResponse {
  success: boolean;
  question: string;
  answer: string;
  dataSource: string;
  timestamp: string;
  processingTimeMs: number;
  error: string | null;
}

export interface AIHealthResponse {
  status: string;
  aiServiceAvailable: boolean;
  provider: string;
}
