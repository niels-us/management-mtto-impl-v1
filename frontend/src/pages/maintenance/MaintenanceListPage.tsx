import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMaintenance } from '@features/maintenance/hooks';
import { MaintenanceStatusBadge } from '@entities/maintenance/ui/StatusBadge';
import { Button } from '@shared/ui/button';
import { Card, CardContent } from '@shared/ui/card';
import { Skeleton } from '@shared/ui/skeleton';
import { Wrench, Eye } from 'lucide-react';
import type { MaintenanceStatus } from '@entities/maintenance/model';

const tabs: { value: MaintenanceStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function MaintenanceListPage() {
  const [statusFilter, setStatusFilter] = useState<MaintenanceStatus | ''>('');
  const { data: maintenance, isLoading } = useMaintenance(statusFilter || undefined);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
        <p className="text-sm text-muted-foreground">All maintenance records</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            variant={statusFilter === tab.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : maintenance?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12">
            <Wrench className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">No maintenance records found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {maintenance?.map((m) => (
            <Card key={m.id} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{m.description}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <MaintenanceStatusBadge status={m.status} />
                    <span>
                      Scheduled: {new Date(m.scheduledAt).toLocaleDateString()}
                    </span>
                    {m.performedAt && (
                      <span>
                        Performed: {new Date(m.performedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <Link to={`/maintenance/${m.id}`}>
                  <Button variant="ghost" size="icon">
                    <Eye className="h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
