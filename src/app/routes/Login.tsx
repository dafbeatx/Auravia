import React, { useState } from 'react';
import { Link, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { getSafeRedirectUrl } from '@/lib/urls';

export function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const rawRedirect = searchParams.get('redirect');
  const targetRedirect = getSafeRedirectUrl(rawRedirect, '/dashboard');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [showAccessCodeInput, setShowAccessCodeInput] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Jika pengguna sudah memiliki sesi aktif, alihkan langsung ke target tujuan yang aman
  if (!authLoading && user) {
    return <Navigate to={targetRedirect} replace />;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setInfoMessage(null);

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

      navigate(targetRedirect);
    } catch {
      setErrorMessage('Koneksi terganggu. Periksa jaringan internet Anda dan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setInfoMessage(null);
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
          setErrorMessage('Autentikasi Google belum diaktifkan di server. Silakan masuk menggunakan email dan kata sandi.');
        } else {
          setErrorMessage(error.message || 'Gagal memulai login dengan Google. Silakan coba kembali.');
        }
      }
    } catch {
      setErrorMessage('Terjadi kendala saat menghubungkan ke Google. Silakan coba kembali.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleAccessCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      setErrorMessage('Harap masukkan kode akses Anda.');
      return;
    }
    // Memberikan respon faktual mengenai kode akses
    setInfoMessage(
      'Kode akses saat ini hanya berlaku untuk verifikasi tamu undangan privat. Untuk mengelola dan membuat undangan, silakan masuk menggunakan akun email.'
    );
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailToReset = resetEmail.trim() || email.trim();
    if (!emailToReset) {
      setErrorMessage('Harap masukkan alamat email untuk pemulihan kata sandi.');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailToReset, {
        redirectTo: `${window.location.origin}/login`,
      });
      if (error) {
        setErrorMessage(error.message || 'Gagal mengirim instruksi pemulihan. Silakan periksa kembali email Anda.');
      } else {
        setResetSent(true);
        setInfoMessage('Instruksi pemulihan kata sandi telah dikirim ke email Anda.');
      }
    } catch {
      setErrorMessage('Koneksi terganggu. Silakan coba beberapa saat lagi.');
    }
  };

  const registerLink = rawRedirect
    ? `/register?redirect=${encodeURIComponent(targetRedirect)}`
    : '/register';

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1917] flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 selection:bg-[#D4AF37]/25">
      <div className="w-full max-w-[420px]">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1C1917] rounded-lg p-1 mb-4 hover:opacity-90 transition-opacity"
            aria-label="Kembali ke Beranda Aurovia"
          >
            <img src="/logo.svg" alt="Aurovia" className="h-9 sm:h-10 w-auto object-contain" />
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
            Selamat datang kembali
          </h1>
          <p className="text-xs sm:text-sm text-[#78716C] mt-1.5">
            Masuk untuk melanjutkan ke Aurovia.
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-[#FFFFFF] border border-[#E7E5E0] rounded-2xl p-6 sm:p-8 shadow-sm">
          {errorMessage && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium leading-relaxed"
            >
              {errorMessage}
            </div>
          )}

          {infoMessage && (
            <div
              role="status"
              aria-live="polite"
              className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium leading-relaxed"
            >
              {infoMessage}
            </div>
          )}

          {/* Form Login Standar */}
          {!showAccessCodeInput && !showForgotPassword && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-email"
                  className="block text-xs font-semibold text-[#1C1917] mb-1.5"
                >
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting || isGoogleSubmitting}
                  placeholder="nama@domain.com"
                  className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#E7E5E0] rounded-xl text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:bg-[#FFFFFF] focus:border-[#1C1917] focus:ring-1 focus:ring-[#1C1917] focus:outline-none transition-all disabled:opacity-60 min-h-[44px]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="login-password"
                    className="block text-xs font-semibold text-[#1C1917]"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setResetEmail(email);
                      setShowForgotPassword(true);
                      setErrorMessage(null);
                      setInfoMessage(null);
                    }}
                    className="text-xs font-medium text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer"
                  >
                    Lupa password?
                  </button>
                </div>
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting || isGoogleSubmitting}
                  placeholder="Masukkan kata sandi Anda"
                  className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#E7E5E0] rounded-xl text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:bg-[#FFFFFF] focus:border-[#1C1917] focus:ring-1 focus:ring-[#1C1917] focus:outline-none transition-all disabled:opacity-60 min-h-[44px]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isGoogleSubmitting}
                className="w-full mt-2 py-3 px-4 bg-[#1C1917] hover:bg-[#292524] text-[#FAF9F6] text-sm font-semibold rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed min-h-[44px]"
              >
                {isSubmitting ? 'Memproses...' : 'Masuk'}
              </button>
            </form>
          )}

          {/* Form Kode Akses Alternatif */}
          {showAccessCodeInput && (
            <form onSubmit={handleAccessCodeSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="access-code"
                    className="block text-xs font-semibold text-[#1C1917]"
                  >
                    Kode Akses Undangan
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAccessCodeInput(false);
                      setErrorMessage(null);
                      setInfoMessage(null);
                    }}
                    className="text-xs text-[#78716C] hover:text-[#1C1917] underline cursor-pointer"
                  >
                    Gunakan Email
                  </button>
                </div>
                <input
                  id="access-code"
                  type="text"
                  required
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: AUR-7890"
                  className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#E7E5E0] rounded-xl text-sm text-[#1C1917] font-mono tracking-wider placeholder:text-[#A8A29E] focus:bg-[#FFFFFF] focus:border-[#1C1917] focus:ring-1 focus:ring-[#1C1917] focus:outline-none transition-all min-h-[44px]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#1C1917] hover:bg-[#292524] text-[#FAF9F6] text-sm font-semibold rounded-xl transition-all shadow-sm cursor-pointer min-h-[44px]"
              >
                Verifikasi Kode Akses
              </button>
            </form>
          )}

          {/* Form Lupa Password */}
          {showForgotPassword && (
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="reset-email"
                    className="block text-xs font-semibold text-[#1C1917]"
                  >
                    Email Akun
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setErrorMessage(null);
                      setInfoMessage(null);
                    }}
                    className="text-xs text-[#78716C] hover:text-[#1C1917] underline cursor-pointer"
                  >
                    Kembali ke Login
                  </button>
                </div>
                <input
                  id="reset-email"
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="nama@domain.com"
                  disabled={resetSent}
                  className="w-full px-3.5 py-2.5 bg-[#FAF9F6] border border-[#E7E5E0] rounded-xl text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:bg-[#FFFFFF] focus:border-[#1C1917] focus:ring-1 focus:ring-[#1C1917] focus:outline-none transition-all min-h-[44px]"
                />
              </div>

              {!resetSent && (
                <button
                  type="submit"
                  className="w-full py-3 px-4 bg-[#1C1917] hover:bg-[#292524] text-[#FAF9F6] text-sm font-semibold rounded-xl transition-all shadow-sm cursor-pointer min-h-[44px]"
                >
                  Kirim Tautan Pemulihan
                </button>
              )}
            </form>
          )}

          {/* Divider 'atau' */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-[#E7E5E0]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#FFFFFF] px-3 text-[#A8A29E] font-medium lowercase">
                atau
              </span>
            </div>
          </div>

          {/* Action Opsi Tambahan */}
          <div className="space-y-2.5">
            {/* Secondary: Masuk dengan kode akses */}
            {!showAccessCodeInput && (
              <button
                type="button"
                onClick={() => {
                  setShowAccessCodeInput(true);
                  setShowForgotPassword(false);
                  setErrorMessage(null);
                  setInfoMessage(null);
                }}
                className="w-full py-2.5 px-4 rounded-xl border border-[#E7E5E0] bg-[#FAF9F6] hover:bg-[#F5F4F0] text-[#1C1917] text-xs font-semibold tracking-wide transition-all min-h-[44px] flex items-center justify-center cursor-pointer"
              >
                Masuk dengan kode akses
              </button>
            )}

            {/* Google: Masuk dengan Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleSubmitting || isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl border border-[#E7E5E0] bg-[#FFFFFF] hover:bg-[#F5F4F0] text-[#1C1917] text-xs font-semibold tracking-wide transition-all min-h-[44px] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
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
              <span>{isGoogleSubmitting ? 'Menghubungkan...' : 'Masuk dengan Google'}</span>
            </button>
          </div>
        </div>

        {/* Link Footer Akun */}
        <div className="mt-8 text-center text-xs text-[#78716C]">
          Belum punya akun?{' '}
          <Link
            to={registerLink}
            className="text-[#1C1917] font-semibold hover:underline"
          >
            Daftar
          </Link>
        </div>
      </div>
    </div>
  );
}
