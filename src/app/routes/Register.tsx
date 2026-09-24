import React, { useState } from 'react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export function Register() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Jika pengguna sudah memiliki sesi aktif, alihkan langsung ke dashboard
  if (!authLoading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    // Validasi form dasar
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

      // Jika Supabase mengharuskan konfirmasi email sebelum sesi aktif
      if (data.user && !data.session) {
        setSuccessNotice(
          'Pendaftaran berhasil! Tautan verifikasi telah dikirimkan ke email Anda. Silakan verifikasi akun Anda sebelum masuk.'
        );
        return;
      }

      // Jika sesi langsung aktif
      if (data.session) {
        navigate('/dashboard');
      }
    } catch {
      setErrorMessage('Koneksi terganggu. Periksa jaringan internet Anda dan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-12 max-w-md mx-auto">
      <div className="bg-surface border border-border rounded p-6 shadow-sm">
        <h1 className="font-serif text-2xl font-bold text-primary mb-1">
          Daftar Akun Aurovia
        </h1>
        <p className="text-sm text-text-muted mb-6">
          Buat akun untuk mulai membuat dan mengelola undangan digital.
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

        {successNotice && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 p-3 bg-success/10 border border-success/30 rounded text-xs text-success font-medium leading-relaxed"
          >
            {successNotice}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="register-email"
              className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1"
            >
              Alamat Email
            </label>
            <input
              id="register-email"
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
              htmlFor="register-password"
              className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1"
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
              disabled={isSubmitting}
              placeholder="Minimal 6 karakter"
              className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-text-primary placeholder:text-text-subtle/50 focus:border-primary focus:outline-none transition-colors disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="register-confirm-password"
              className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1"
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
              disabled={isSubmitting}
              placeholder="Ulangi kata sandi"
              className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-text-primary placeholder:text-text-subtle/50 focus:border-primary focus:outline-none transition-colors disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-2 px-4 bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-semibold rounded transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Mendaftarkan...' : 'Daftar Sekarang'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-border text-center text-xs text-text-muted">
          Sudah memiliki akun?{' '}
          <Link
            to="/login"
            className="text-primary font-semibold hover:underline"
          >
            Masuk di sini
          </Link>
        </div>
      </div>
    </div>
  );
}
