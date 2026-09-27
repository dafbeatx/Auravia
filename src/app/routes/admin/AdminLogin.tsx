import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { loginAdminWithUsername } from '@/lib/admin';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin, loading: authLoading, refreshProfile } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Jika sudah terautentikasi dan memiliki hak akses admin, langsung arahkan ke /admin
  useEffect(() => {
    if (!authLoading && user && isAdmin) {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';
      navigate(from, { replace: true });
    }
  }, [user, isAdmin, authLoading, navigate, location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setError('Username atau password salah.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await loginAdminWithUsername(trimmedUsername, password);

      if (!result.success) {
        setError('Username atau password salah.');
        return;
      }

      // Perbarui profile di context agar state isAdmin sinkron
      await refreshProfile();
      navigate('/admin', { replace: true });
    } catch {
      setError('Username atau password salah.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2FEF7] flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-[#48A6A7]/20">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#006A71] text-white shadow-md mb-4 ring-4 ring-[#9ACBD0]/40">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-[#006A71]">
            AUROVIA ADMIN
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Portal Administrasi &amp; Manajemen Katalog
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-lg rounded-2xl border border-[#9ACBD0]/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#006A71] via-[#48A6A7] to-[#9ACBD0]" />

          {/* Generic Error Alert */}
          {error && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3"
            >
              <svg className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="admin-username-input"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
              >
                Username
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="admin-username-input"
                  name="username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Masukkan username admin"
                  className="block w-full pl-10 pr-3.5 py-3 text-sm bg-neutral-50/60 border border-neutral-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#48A6A7] focus:border-[#48A6A7] transition-colors text-gray-900"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password-input"
                className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
              >
                Password
              </label>
              <div className="relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="admin-password-input"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Masukkan password admin"
                  className="block w-full pl-10 pr-3.5 py-3 text-sm bg-neutral-50/60 border border-neutral-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#48A6A7] focus:border-[#48A6A7] transition-colors text-gray-900"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                id="admin-login-submit-button"
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[44px] flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-xs text-sm font-semibold text-white bg-[#006A71] hover:bg-[#00575d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#006A71] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Memverifikasi...
                  </>
                ) : (
                  'Masuk sebagai Admin'
                )}
              </button>
            </div>
          </form>

          {/* Footer Back Link */}
          <div className="mt-8 pt-6 border-t border-neutral-100 text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center text-xs font-medium text-gray-500 hover:text-[#006A71] transition-colors py-1"
            >
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Beranda Aurovia
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <p className="mt-6 text-center text-xs text-gray-500 leading-relaxed">
          Akses dibatasi khusus untuk tim otorisasi Aurovia.
          <br />
          Sistem dilindungi oleh otentikasi server-level dan Row Level Security (RLS).
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
