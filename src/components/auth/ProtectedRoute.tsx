import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * ProtectedRoute: Menjaga rute dari akses pengguna yang belum terautentikasi.
 * Mengalihkan ke /login jika sesi tidak ditemukan dengan mempertahankan target URL tujuan.
 */
export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[240px]">
        <p className="text-text-muted text-sm font-medium" role="status">
          Memeriksa status sesi...
        </p>
      </div>
    );
  }

  if (!user) {
    const redirectUrl = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirectUrl)}`} replace />;
  }

  return <Outlet />;
}
