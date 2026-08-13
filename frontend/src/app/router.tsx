import { lazy, Suspense, type ReactElement } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@features/auth/ProtectedRoute';
import { MainLayout } from './layouts/MainLayout';
import { Skeleton } from '@shared/ui/skeleton';

const LoginPage = lazy(() => import('@pages/login/LoginPage'));
const DashboardPage = lazy(() => import('@pages/dashboard/DashboardPage'));
const VesselListPage = lazy(() => import('@pages/vessels/VesselListPage'));
const ComponentListPage = lazy(() => import('@pages/components/ComponentListPage'));
const CreateMaintenancePage = lazy(() => import('@pages/maintenance/CreateMaintenancePage'));
const MaintenanceListPage = lazy(() => import('@pages/maintenance/MaintenanceListPage'));
const MaintenanceDetailPage = lazy(() => import('@pages/maintenance/MaintenanceDetailPage'));
const AIQueryPage = lazy(() => import('@pages/ai/AIQueryPage'));

function PageLoader() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function withSuspense(node: ReactElement) {
  return <Suspense fallback={<PageLoader />}>{node}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: withSuspense(<LoginPage />),
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: withSuspense(<DashboardPage />) },
          { path: 'vessels', element: withSuspense(<VesselListPage />) },
          { path: 'vessels/:id/components', element: withSuspense(<ComponentListPage />) },
          {
            path: 'components/:id/maintenance/new',
            element: withSuspense(<CreateMaintenancePage />),
          },
          { path: 'maintenance', element: withSuspense(<MaintenanceListPage />) },
          { path: 'maintenance/:id', element: withSuspense(<MaintenanceDetailPage />) },
          { path: 'ai-query', element: withSuspense(<AIQueryPage />) },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);