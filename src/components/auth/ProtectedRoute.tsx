import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * ProtectedRoute: Menjaga rute dari akses pengguna yang belum terautentikasi.
 * Mengalihkan ke /login jika sesi tidak ditemukan setelah pemuatan selesai.
 */
export function ProtectedRoute() {
  const { user, loading } = useAuth();

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
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
