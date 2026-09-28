import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from '@/contexts/AdminAuthContext';

function AdminRouteInner() {
  const { admin, loading } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4 p-6">
        <div className="w-9 h-9 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-text-muted font-medium tracking-wide">
          Memverifikasi hak akses administrator...
        </p>
      </div>
    );
  }

  const isAdmin = !!admin;

  // Jika belum login admin, alihkan ke /admin/login dengan query redirect aman
  if (!isAdmin) {
    return <Navigate to={`/admin/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  return (
    <AdminAuthProvider>
      <AdminRouteInner />
    </AdminAuthProvider>
  );
}

export default AdminRoute;
