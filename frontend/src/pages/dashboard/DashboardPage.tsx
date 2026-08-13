import { useVessels } from '@features/vessels/hooks';
import { useMaintenance } from '@features/maintenance/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/ui/card';
import { Skeleton } from '@shared/ui/skeleton';
import { Ship, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function DashboardPage() {
  const { data: vessels, isLoading: vesselsLoading } = useVessels();
  const { data: maintenance, isLoading: maintLoading } = useMaintenance();

  const pending = maintenance?.filter((m) => m.status === 'pending').length ?? 0;
  const inProgress = maintenance?.filter((m) => m.status === 'in_progress').length ?? 0;
  const completed = maintenance?.filter((m) => m.status === 'completed').length ?? 0;
  const cancelled = maintenance?.filter((m) => m.status === 'cancelled').length ?? 0;

  const monthlyData = [
    { name: 'Pending', value: pending, fill: '#eab308' },
    { name: 'In Progress', value: inProgress, fill: '#3b82f6' },
    { name: 'Completed', value: completed, fill: '#22c55e' },
    { name: 'Cancelled', value: cancelled, fill: '#6b7280' },
  ];

  const recentMaintenance = maintenance?.slice(0, 5) ?? [];

  const stats = [
    {
      title: 'Total Vessels',
      value: vessels?.length ?? 0,
      icon: Ship,
      color: 'text-blue-600 bg-blue-100',
    },
    {
      title: 'Pending',
      value: pending,
      icon: Clock,
      color: 'text-yellow-600 bg-yellow-100',
    },
    {
      title: 'In Progress',
      value: inProgress,
      icon: AlertTriangle,
      color: 'text-orange-600 bg-orange-100',
    },
    {
      title: 'Completed',
      value: completed,
      icon: CheckCircle,
      color: 'text-green-600 bg-green-100',
    },
  ];

  const isLoading = vesselsLoading || maintLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Fleet maintenance overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`rounded-full p-2 ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Maintenance by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : recentMaintenance.length === 0 ? (
              <p className="text-sm text-muted-foreground">No maintenance records</p>
            ) : (
              <div className="space-y-3">
                {recentMaintenance.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-sm">
                    <span className="truncate max-w-[200px]">{m.description}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        m.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : m.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800'
                          : m.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {m.status.replace('_', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
