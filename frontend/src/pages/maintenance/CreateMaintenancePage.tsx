import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateMaintenance } from '@features/maintenance/hooks';
import { useAuth } from '@features/auth/auth-context';
import {
  createMaintenanceSchema,
  type CreateMaintenanceFormData,
} from '@entities/maintenance/model';
import { Button } from '@shared/ui/button';
import { Input } from '@shared/ui/input';
import { Textarea } from '@shared/ui/textarea';
import { Label } from '@shared/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';

type FormData = CreateMaintenanceFormData;

export default function CreateMaintenancePage() {
  const { id: componentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const mutation = useCreateMaintenance();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } =   useForm<FormData>({
    resolver: zodResolver(createMaintenanceSchema),
  });

  const onSubmit = async (data: FormData) => {
    if (!componentId || !user?.customerId || !user?.sub) return;

    await mutation.mutateAsync({
      componentId,
      data: {
        description: data.description,
        scheduledAt: new Date(data.scheduledAt).toISOString(),
        customerId: user.customerId,
        createdBy: user.sub,
      },
    });

    navigate('/maintenance');
  };

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <Link
          to="/vessels"
          className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Create Maintenance</h1>
        <p className="text-sm text-muted-foreground">Schedule new maintenance for this component</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Maintenance Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the maintenance task..."
                {...register('description')}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledAt">Scheduled Date</Label>
              <Input
                id="scheduledAt"
                type="datetime-local"
                {...register('scheduledAt')}
              />
              {errors.scheduledAt && (
                <p className="text-xs text-destructive">{errors.scheduledAt.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Maintenance'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
