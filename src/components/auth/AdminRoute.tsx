import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function AdminRoute() {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F2FEF7] flex flex-col items-center justify-center space-y-4 p-6">
        <div className="w-10 h-10 border-3 border-[#006A71] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[#006A71] font-medium tracking-wide">
          Memverifikasi hak akses administrator...
        </p>
      </div>
    );
  }

  // Jika belum login, redirect ke login dengan query redirect
  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Jika sudah login tetapi bukan administrator
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#F2FEF7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-[#9ACBD0] shadow-sm text-center space-y-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-[#9ACBD0]/30 text-[#006A71] flex items-center justify-center">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m12-5V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2h7" />
            </svg>
          </div>

          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-bold text-[#006A71]">
              Akses Khusus Administrator
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              Akun Anda terdaftar sebagai pengguna umum dan tidak memiliki izin untuk mengelola sistem admin Aurovia.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              to="/dashboard"
              className="flex-1 py-2.5 px-4 bg-[#006A71] hover:bg-[#00575d] text-white text-xs font-semibold rounded-xl transition-all shadow-xs min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#006A71]"
            >
              Ke Dashboard Pengguna
            </Link>
            <Link
              to="/"
              className="flex-1 py-2.5 px-4 bg-white border border-[#9ACBD0] text-[#006A71] hover:bg-[#F2FEF7] text-xs font-semibold rounded-xl transition-all min-h-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#006A71]"
            >
              Beranda Utama
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
