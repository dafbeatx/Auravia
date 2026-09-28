import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginAdmin, getAdminToken, verifyAdminSession } from '@/lib/adminAuth';

export const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialChecking, setInitialChecking] = useState(true);

  // Jika sudah memiliki sesi admin aktif yang valid, arahkan ke dashboard
  useEffect(() => {
    let isMounted = true;
    const token = getAdminToken();
    if (!token) {
      setInitialChecking(false);
      return;
    }

    verifyAdminSession()
      .then((res) => {
        if (!isMounted) return;
        if (res.valid) {
          const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/admin';
          navigate(from, { replace: true });
        } else {
          setInitialChecking(false);
        }
      })
      .catch(() => {
        if (isMounted) setInitialChecking(false);
      });

    return () => {
      isMounted = false;
    };
  }, [navigate, location.state]);

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
      const result = await loginAdmin(trimmedUsername, password);

      if (!result.success) {
        setError('Username atau password salah.');
        return;
      }

      // Ambil target redirect yang aman jika ada
      const searchParams = new URLSearchParams(location.search);
      const redirectTarget = searchParams.get('redirect') || '/admin';
      navigate(redirectTarget, { replace: true });
    } catch {
      setError('Username atau password salah.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (initialChecking) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-text-muted font-medium">Memeriksa status sesi administrator...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-accent-light/30">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-sm mb-4 border border-accent/40">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-primary">
            AUROVIA ADMIN
          </h1>
          <p className="mt-1.5 text-xs text-text-muted">
            Portal Administrasi &amp; Manajemen Platform
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-surface py-8 px-6 sm:px-10 shadow-sm rounded-2xl border border-border relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent" />

          {/* Generic Error Alert */}
          {error && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-start gap-3"
            >
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label
                htmlFor="admin-username-input"
                className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5"
              >
                Username
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted/60">
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
                  className="block w-full pl-10 pr-3.5 py-3 text-sm bg-surface-elevated border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-text-primary"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-password-input"
                className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1.5"
              >
                Password
              </label>
              <div className="relative rounded-xl">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-muted/60">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="admin-password-input"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Masukkan password admin"
                  className="block w-full pl-10 pr-11 py-3 text-sm bg-surface-elevated border border-border rounded-xl focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-text-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-text-muted hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg min-h-[44px] min-w-[44px] justify-center cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                id="admin-login-submit-button"
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[44px] flex justify-center items-center py-3 px-4 rounded-xl shadow-xs text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 mr-2 animate-spin text-primary-foreground" fill="none" viewBox="0 0 24 24">
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
          <div className="mt-8 pt-6 border-t border-border text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="inline-flex items-center text-xs font-medium text-text-muted hover:text-primary transition-colors py-1 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg px-2"
            >
              <svg className="w-3.5 h-3.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Kembali ke Beranda Aurovia
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <p className="mt-6 text-center text-[11px] text-text-muted leading-relaxed">
          Akses portal ini dibatasi khusus administrator Aurovia.
          <br />
          Sistem dilindungi enkripsi password server-level dan isolasi hak akses database.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
