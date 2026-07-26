import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import { useMaintenance, useUpdateMaintenance, useDeleteMaintenance } from '../hooks/useMaintenance';
import { MaintenanceStatusBadge } from '../components/MaintenanceStatusBadge';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { ArrowLeft, Loader2, Trash2 } from 'lucide-react';
import type { MaintenanceStatus } from '../types/api';

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function MaintenanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: maintenance, isLoading } = useMaintenance();
  const updateMutation = useUpdateMaintenance();
  const deleteMutation = useDeleteMaintenance();
  const [newStatus, setNewStatus] = useState('');

  const record = maintenance?.find((m) => m.id === id);

  const handleUpdateStatus = async () => {
    if (!id || !newStatus) return;
    await updateMutation.mutateAsync({
      id,
      data: { status: newStatus as MaintenanceStatus },
    });
    setNewStatus('');
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteMutation.mutateAsync(id);
    navigate('/maintenance');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="space-y-4">
        <Link
          to="/maintenance"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Maintenance
        </Link>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Maintenance record not found
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          to="/maintenance"
          className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Maintenance
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Maintenance Detail</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{record.description}</CardTitle>
            <MaintenanceStatusBadge status={record.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Component ID</span>
              <p className="font-mono text-xs">{record.componentId}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status</span>
              <p className="capitalize">{record.status.replace('_', ' ')}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Scheduled At</span>
              <p>{new Date(record.scheduledAt).toLocaleString()}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Performed At</span>
              <p>{record.performedAt ? new Date(record.performedAt).toLocaleString() : '—'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Created By</span>
              <p className="font-mono text-xs">{record.createdBy}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Created At</span>
              <p>{new Date(record.createdAt).toLocaleString()}</p>
            </div>
          </div>

          <div className="flex items-end gap-3 border-t pt-4">
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">Update Status</label>
              <Select
                options={statusOptions}
                placeholder="Select new status..."
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
              />
            </div>
            <Button
              onClick={handleUpdateStatus}
              disabled={!newStatus || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Update'
              )}
            </Button>
          </div>

          <div className="border-t pt-4">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Delete Record
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
