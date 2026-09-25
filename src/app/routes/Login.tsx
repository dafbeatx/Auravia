import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function Login() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Jika pengguna sudah memiliki sesi aktif, alihkan langsung ke dashboard
  if (!authLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Harap isi alamat email dan kata sandi.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // Penanganan error manusiawi tanpa membocorkan detail teknis database
        if (
          error.message.includes('Invalid login credentials') ||
          error.message.includes('invalid_credentials')
        ) {
          setErrorMessage('Email atau kata sandi tidak valid. Periksa kembali akun Anda.');
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMessage('Email belum dikonfirmasi. Periksa kotak masuk email Anda.');
        } else {
          setErrorMessage('Terjadi kendala saat proses masuk. Silakan coba kembali.');
        }
        return;
      }

      navigate('/dashboard');
    } catch {
      setErrorMessage('Koneksi terganggu. Periksa jaringan internet Anda dan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 max-w-md mx-auto">
      <div className="bg-surface border border-border rounded-xl p-6 sm:p-8 shadow-sm">
        <div className="flex justify-center mb-6">
          <Link to="/" aria-label="Beranda Aurovia">
            <img src="/logo.svg" alt="Aurovia" className="h-8 w-auto object-contain" />
          </Link>
        </div>
        <h1 className="font-serif text-2xl font-bold text-primary mb-1">
          Masuk ke Aurovia
        </h1>
        <p className="text-sm text-text-muted mb-6">
          Gunakan akun terdaftar Anda untuk mengelola undangan.
        </p>

        {errorMessage && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded text-xs text-danger font-medium leading-relaxed"
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
          <div>
            <label
              htmlFor="login-email"
              className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1"
            >
              Alamat Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              placeholder="nama@domain.com"
              className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-text-primary placeholder:text-text-subtle/50 focus:border-primary focus:outline-none transition-colors disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1"
            >
              Kata Sandi
            </label>
            <input
              id="login-password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-text-primary placeholder:text-text-subtle/50 focus:border-primary focus:outline-none transition-colors disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-2 px-4 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold rounded transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-border text-center text-xs text-text-muted">
          Belum memiliki akun?{' '}
          <Link
            to="/register"
            className="text-primary font-semibold hover:underline"
          >
            Daftar di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
