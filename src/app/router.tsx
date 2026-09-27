import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { LandingPage } from '@/app/routes/LandingPage';
import { Login } from '@/app/routes/Login';
import { Register } from '@/app/routes/Register';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Dashboard } from '@/app/routes/Dashboard';
import { CreateInvitation } from '@/app/routes/CreateInvitation';
import { InvitationDetail } from '@/app/routes/InvitationDetail';
import { PublicInvitation } from '@/app/routes/PublicInvitation';

/**
 * Konfigurasi rute Aurovia.
 * Mendaftarkan rute publik (landing, login, register, public invitation) dan
 * rute terproteksi (dashboard, flow pembuatan undangan, editor) melalui ProtectedRoute.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
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
            path: 'dashboard/invitations/new',
            element: <CreateInvitation />,
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
