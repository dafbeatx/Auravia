import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RootLayout } from '@/components/layout/RootLayout';
import { LandingPage } from '@/app/routes/LandingPage';
import { Login } from '@/app/routes/Login';
import { Register } from '@/app/routes/Register';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Dashboard } from '@/app/routes/Dashboard';
import { CreateInvitation } from '@/app/routes/CreateInvitation';
import { InvitationDetail } from '@/app/routes/InvitationDetail';
import { PublicInvitation } from '@/app/routes/PublicInvitation';
import { TemplateDemo } from '@/app/routes/TemplateDemo';

import { lazy } from 'react';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { AdminLayout } from '@/components/layout/AdminLayout';

const AdminDashboard = lazy(() => import('@/app/routes/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })));
const AdminTraffic = lazy(() => import('@/app/routes/admin/AdminTraffic').then((m) => ({ default: m.AdminTraffic })));
const AdminInvitations = lazy(() => import('@/app/routes/admin/AdminInvitations').then((m) => ({ default: m.AdminInvitations })));
const AdminTemplates = lazy(() => import('@/app/routes/admin/AdminTemplates').then((m) => ({ default: m.AdminTemplates })));
const AdminTemplateDetail = lazy(() => import('@/app/routes/admin/AdminTemplateDetail').then((m) => ({ default: m.AdminTemplateDetail })));
const AdminDemo = lazy(() => import('@/app/routes/admin/AdminDemo').then((m) => ({ default: m.AdminDemo })));
const AdminUsers = lazy(() => import('@/app/routes/admin/AdminUsers').then((m) => ({ default: m.AdminUsers })));
const AdminSettings = lazy(() => import('@/app/routes/admin/AdminSettings').then((m) => ({ default: m.AdminSettings })));
const AdminSecuritySettings = lazy(() => import('@/app/routes/admin/AdminSecuritySettings').then((m) => ({ default: m.AdminSecuritySettings })));
const AdminAccounts = lazy(() => import('@/app/routes/admin/AdminAccounts').then((m) => ({ default: m.AdminAccounts })));
const AdminActivity = lazy(() => import('@/app/routes/admin/AdminActivity').then((m) => ({ default: m.AdminActivity })));
const AdminContent = lazy(() => import('@/app/routes/admin/AdminContent').then((m) => ({ default: m.AdminContent })));
const AdminMedia = lazy(() => import('@/app/routes/admin/AdminMedia').then((m) => ({ default: m.AdminMedia })));
const AdminLogin = lazy(() => import('@/app/routes/admin/AdminLogin').then((m) => ({ default: m.AdminLogin })));

/**
 * Konfigurasi rute Aurovia.
 * Mendaftarkan rute publik (landing, login, register, public invitation),
 * rute pengguna terproteksi (dashboard, editor undangan, template demo),
 * rute autentikasi admin khusus (/admin/login),
 * serta rute administrator terproteksi (/admin/*).
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
        path: 'templates',
        element: <Navigate to="/#template" replace />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: 'templates/:slug/demo',
            element: <TemplateDemo />,
          },
          {
            path: 'demo/:slug',
            element: <TemplateDemo />,
          },
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
      // Rute Login Khusus Admin (Username + Password, tanpa OAuth)
      {
        path: 'admin/login',
        element: <AdminLogin />,
      },
      // Rute Administrasi Terproteksi (Hanya Role Admin)
      {
        path: 'admin',
        element: <AdminRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              {
                index: true,
                element: <AdminDashboard />,
              },
              {
                path: 'dashboard',
                element: <AdminDashboard />,
              },
              {
                path: 'traffic',
                element: <AdminTraffic />,
              },
              {
                path: 'analytics',
                element: <Navigate to="/admin/traffic" replace />,
              },
              {
                path: 'content',
                element: <AdminContent />,
              },
              {
                path: 'media',
                element: <AdminMedia />,
              },
              {
                path: 'users',
                element: <AdminUsers />,
              },
              {
                path: 'invitations',
                element: <AdminInvitations />,
              },
              {
                path: 'templates',
                element: <AdminTemplates />,
              },
              {
                path: 'templates/:id',
                element: <AdminTemplateDetail />,
              },
              {
                path: 'templates/:id/media',
                element: <AdminTemplateDetail defaultTab="media" />,
              },
              {
                path: 'demo',
                element: <AdminDemo />,
              },
              {
                path: 'demo/:templateId',
                element: <AdminDemo />,
              },
              {
                path: 'activity',
                element: <AdminActivity />,
              },
              {
                path: 'settings',
                element: <AdminSettings />,
              },
              {
                path: 'settings/security',
                element: <AdminSecuritySettings />,
              },
              {
                path: 'accounts',
                element: <AdminAccounts />,
              },
            ],
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
