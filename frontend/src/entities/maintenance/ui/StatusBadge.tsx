import { Badge } from '@shared/ui/badge';
import type { MaintenanceStatus } from '../model';

const statusConfig: Record<MaintenanceStatus, { label: string; className: string }> = {
  pending: {
    label: 'Pending',
    className:
      'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-500/20 dark:text-yellow-300 dark:border-yellow-500/40',
  },
  in_progress: {
    label: 'In Progress',
    className:
      'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40',
  },
  completed: {
    label: 'Completed',
    className:
      'bg-green-100 text-green-800 border-green-300 dark:bg-green-500/20 dark:text-green-300 dark:border-green-500/40',
  },
  cancelled: {
    label: 'Cancelled',
    className:
      'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-500/20 dark:text-gray-300 dark:border-gray-500/40',
  },
};

export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  const config = statusConfig[status];
  return <Badge className={config.className}>{config.label}</Badge>;
}
