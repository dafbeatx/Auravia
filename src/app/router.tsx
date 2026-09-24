import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { FoundationStatus } from '@/app/FoundationStatus';
import { Login } from '@/app/routes/Login';
import { Register } from '@/app/routes/Register';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Dashboard } from '@/app/routes/Dashboard';
import { InvitationDetail } from '@/app/routes/InvitationDetail';
import { PublicInvitation } from '@/app/routes/PublicInvitation';

/**
 * Konfigurasi rute Aurovia.
 * Mendaftarkan rute publik (landing, login, register, public invitation) dan
 * rute terproteksi (dashboard, detail invitation) melalui ProtectedRoute.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <FoundationStatus />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'dashboard',
            element: <Dashboard />,
          },
          {
            path: 'dashboard/invitations/:id',
            element: <InvitationDetail />,
          },
        ],
      },
    ],
  },
  {
    path: 'i/:slug',
    element: <PublicInvitation />,
  },
]);
