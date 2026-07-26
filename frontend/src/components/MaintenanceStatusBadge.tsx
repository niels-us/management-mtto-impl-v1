import { Badge } from './ui/badge';
import type { MaintenanceStatus } from '../types/api';

const statusConfig: Record<MaintenanceStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-800 border-blue-300' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-800 border-green-300' },
  cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800 border-gray-300' },
};

export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  const config = statusConfig[status];
  return <Badge className={config.className}>{config.label}</Badge>;
}
