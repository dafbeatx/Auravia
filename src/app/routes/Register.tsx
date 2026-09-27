import React, { useState } from 'react';
import { Link, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getSafeRedirectUrl } from '@/lib/urls';
import { trackEvent } from '@/lib/analytics';

export function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const rawRedirect = searchParams.get('redirect');
  const targetRedirect = getSafeRedirectUrl(rawRedirect, '/dashboard');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  React.useEffect(() => {
    trackEvent({ event_name: 'register_view', path: '/register' });
  }, []);

  // Jika pengguna sudah memiliki sesi aktif, alihkan langsung ke target tujuan
  if (!authLoading && user) {
    return <Navigate to={targetRedirect} replace />;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!email || !password || !confirmPassword) {
      setErrorMessage('Harap lengkapi semua kolom pendaftaran.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi harus terdiri dari minimal 6 karakter.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        if (
          error.message.includes('User already registered') ||
          error.message.includes('already registered')
        ) {
          setErrorMessage('Alamat email ini sudah terdaftar. Silakan masuk.');
        } else {
          setErrorMessage('Terjadi kendala saat pendaftaran. Silakan periksa data Anda.');
        }
        return;
      }

      trackEvent({
        event_name: 'register_success',
        path: '/register',
        user_id: data.user?.id,
      });

      // Jika Supabase mengharuskan konfirmasi email sebelum sesi aktif
      if (data.user && !data.session) {
        setSuccessNotice(
          'Pendaftaran berhasil! Tautan verifikasi telah dikirimkan ke email Anda. Silakan verifikasi akun Anda sebelum masuk.'
        );
        return;
      }

      // Jika sesi langsung aktif
      if (data.session) {
        navigate(targetRedirect);
      }
    } catch {
      setErrorMessage('Koneksi terganggu. Periksa jaringan internet Anda dan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setErrorMessage(null);
    setSuccessNotice(null);
    setIsGoogleSubmitting(true);

    try {
      const redirectUri = window.location.origin + targetRedirect;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
        },
      });

      if (error) {
        if (
          error.message.includes('provider is not enabled') ||
          error.message.includes('Unsupported provider')
        ) {
          setErrorMessage('Autentikasi Google belum diaktifkan di server. Silakan mendaftar menggunakan email.');
        } else {
          setErrorMessage(error.message || 'Gagal memulai pendaftaran dengan Google. Silakan coba kembali.');
        }
      }
    } catch {
      setErrorMessage('Terjadi kendala saat menghubungkan ke Google. Silakan coba kembali.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const loginLink = rawRedirect
    ? `/login?redirect=${encodeURIComponent(targetRedirect)}`
    : '/login';

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 selection:bg-accent-light/40">
      <div className="w-full max-w-[420px]">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1 mb-4 hover:opacity-90 transition-opacity"
            aria-label="Kembali ke Beranda Aurovia"
          >
            <img src="/logo.svg" alt="Aurovia" className="h-9 sm:h-10 w-auto object-contain" />
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
            Buat Undangan Anda
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1.5">
            Daftar untuk mulai merancang dan membagikan undangan digital Anda.
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
          {errorMessage && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium leading-relaxed"
            >
              {errorMessage}
            </div>
          )}

          {successNotice && (
            <div
              role="status"
              aria-live="polite"
              className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium leading-relaxed"
            >
              {successNotice}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="register-email"
                className="block text-xs font-semibold text-text-primary mb-1.5"
              >
                Email
              </label>
              <input
                id="register-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting || isGoogleSubmitting}
                placeholder="nama@domain.com"
                className="w-full px-3.5 py-2.5 bg-background/50 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-subtle/50 focus:bg-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all disabled:opacity-60 min-h-[44px]"
              />
            </div>

            <div>
              <label
                htmlFor="register-password"
                className="block text-xs font-semibold text-text-primary mb-1.5"
              >
                Kata Sandi
              </label>
              <input
                id="register-password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting || isGoogleSubmitting}
                placeholder="Minimal 6 karakter"
                className="w-full px-3.5 py-2.5 bg-background/50 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-subtle/50 focus:bg-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all disabled:opacity-60 min-h-[44px]"
              />
            </div>

            <div>
              <label
                htmlFor="register-confirm-password"
                className="block text-xs font-semibold text-text-primary mb-1.5"
              >
                Konfirmasi Kata Sandi
              </label>
              <input
                id="register-confirm-password"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isSubmitting || isGoogleSubmitting}
                placeholder="Ulangi kata sandi"
                className="w-full px-3.5 py-2.5 bg-background/50 border border-border rounded-xl text-sm text-text-primary placeholder:text-text-subtle/50 focus:bg-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all disabled:opacity-60 min-h-[44px]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isGoogleSubmitting}
              className="w-full mt-2 py-3 px-4 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed min-h-[44px]"
            >
              {isSubmitting ? 'Mendaftarkan...' : 'Daftar'}
            </button>
          </form>

          {/* Divider 'atau' */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-surface px-3 text-text-subtle font-medium lowercase">
                atau
              </span>
            </div>
          </div>

          {/* Google: Daftar dengan Google */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            disabled={isGoogleSubmitting || isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl border border-border bg-surface hover:bg-surface-elevated text-text-primary text-xs font-semibold tracking-wide transition-all min-h-[44px] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.13C3.25 21.37 7.31 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.42l4.02-3.13z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.63 1.26 6.58l4.02 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
              />
            </svg>
            <span>{isGoogleSubmitting ? 'Menghubungkan...' : 'Daftar dengan Google'}</span>
          </button>
        </div>

        {/* Link Footer Akun */}
        <div className="mt-8 text-center text-xs text-text-muted">
          Sudah punya akun?{' '}
          <Link
            to={loginLink}
            className="text-primary font-semibold hover:underline"
          >
            Masuk
          </Link>
        </div>
      </div>
    </div>
  );
}
