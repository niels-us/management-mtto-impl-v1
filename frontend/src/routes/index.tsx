import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { MainLayout } from '../layouts/MainLayout';
import LoginPage from '../pages/LoginPage';
import DashboardPage from '../pages/DashboardPage';
import VesselListPage from '../pages/VesselListPage';
import ComponentListPage from '../pages/ComponentListPage';
import CreateMaintenancePage from '../pages/CreateMaintenancePage';
import MaintenanceListPage from '../pages/MaintenanceListPage';
import MaintenanceDetailPage from '../pages/MaintenanceDetailPage';
import AIQueryPage from '../pages/AIQueryPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'vessels', element: <VesselListPage /> },
          { path: 'vessels/:id/components', element: <ComponentListPage /> },
          {
            path: 'components/:id/maintenance/new',
            element: <CreateMaintenancePage />,
          },
          { path: 'maintenance', element: <MaintenanceListPage /> },
          { path: 'maintenance/:id', element: <MaintenanceDetailPage /> },
          { path: 'ai-query', element: <AIQueryPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
