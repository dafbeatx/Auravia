import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAdminIdentity, updateAdminUsername, updateAdminPassword, type AdminIdentity } from '@/lib/admin';

export const AdminSecuritySettings: React.FC = () => {
  const navigate = useNavigate();

  // State identitas admin
  const [identity, setIdentity] = useState<AdminIdentity | null>(null);
  const [isLoadingIdentity, setIsLoadingIdentity] = useState(true);

  // State Form Username
  const [usernameInput, setUsernameInput] = useState('');
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);
  const [usernameSuccess, setUsernameSuccess] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  // State Form Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    loadIdentity();
  }, []);

  const loadIdentity = async () => {
    setIsLoadingIdentity(true);
    try {
      const data = await getAdminIdentity();
      setIdentity(data);
      setUsernameInput(data.username || '');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat identitas admin.';
      setUsernameError(msg);
    } finally {
      setIsLoadingIdentity(false);
    }
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameSuccess(null);
    setUsernameError(null);

    const trimmed = usernameInput.trim();
    if (!trimmed) {
      setUsernameError('Username tidak boleh kosong.');
      return;
    }
    if (trimmed.length < 3 || trimmed.length > 30) {
      setUsernameError('Username harus antara 3 sampai 30 karakter.');
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
      setUsernameError('Username hanya boleh mengandung huruf, angka, underscore (_), titik (.), dan strip (-).');
      return;
    }

    setIsUpdatingUsername(true);
    try {
      const updated = await updateAdminUsername(trimmed);
      setIdentity((prev) => (prev ? { ...prev, username: updated } : null));
      setUsernameInput(updated);
      setUsernameSuccess(`Username admin berhasil diperbarui menjadi "${updated}".`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui username admin.';
      setUsernameError(msg);
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (!oldPassword) {
      setPasswordError('Password lama wajib diisi.');
      return;
    }
    if (!newPassword) {
      setPasswordError('Password baru wajib diisi.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password baru minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Password baru dan konfirmasi password tidak cocok.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const result = await updateAdminPassword(oldPassword, newPassword, confirmPassword);

      if (!result.success) {
        setPasswordError(result.error || 'Gagal memperbarui password.');
        setIsUpdatingPassword(false);
        return;
      }

      setPasswordSuccess('Password berhasil diubah. Seluruh sesi telah diakhiri. Mengalihkan ke halaman login...');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Redirect ke login admin setelah 1.5 detik
      setTimeout(() => {
        navigate('/admin/login', { replace: true });
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal memperbarui password.';
      setPasswordError(msg);
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header Info */}
      <div>
        <h1 className="font-serif text-2xl font-bold text-[#006A71]">
          Keamanan Akun Admin
        </h1>
        <p className="mt-1 text-xs text-gray-500">
          Kelola username dan kredensial password administrator untuk akses ke portal Aurovia Admin.
        </p>
      </div>

      {/* Identitas Saat Ini Card */}
      <div className="bg-white rounded-2xl border border-[#9ACBD0]/60 p-6 shadow-2xs">
        <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
          <div className="w-10 h-10 rounded-xl bg-[#006A71]/10 flex items-center justify-center text-[#006A71]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Status Identitas Administrator</h2>
            <p className="text-xs text-gray-500">Informasi akun autentikasi yang saat ini aktif</p>
          </div>
        </div>

        {isLoadingIdentity ? (
          <div className="py-6 flex items-center justify-center text-gray-500 gap-2 text-xs">
            <svg className="w-4 h-4 animate-spin text-[#48A6A7]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Memuat identitas...
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#F2FEF7] border border-[#9ACBD0]/40">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500">Username Aktif</span>
              <span className="mt-1 font-mono text-sm font-bold text-[#006A71]">
                {identity?.username || '(Belum diset)'}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#F2FEF7] border border-[#9ACBD0]/40">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500">Role Database</span>
              <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase bg-emerald-100 text-emerald-800">
                {identity?.role || 'admin'}
              </span>
            </div>
            <div className="p-4 rounded-xl bg-[#F2FEF7] border border-[#9ACBD0]/40">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-500">Email Terhubung</span>
              <span className="mt-1 text-xs text-gray-700 truncate block" title={identity?.email || ''}>
                {identity?.email || '-'}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form Ubah Username */}
        <div className="bg-white rounded-2xl border border-[#9ACBD0]/60 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
              <div className="w-9 h-9 rounded-xl bg-[#48A6A7]/10 flex items-center justify-center text-[#006A71]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Ubah Username Admin</h3>
                <p className="text-xs text-gray-500">Digunakan saat masuk di /admin/login</p>
              </div>
            </div>

            {usernameSuccess && (
              <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                <svg className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{usernameSuccess}</span>
              </div>
            )}

            {usernameError && (
              <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                <svg className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{usernameError}</span>
              </div>
            )}

            <form onSubmit={handleUpdateUsername} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="change-username-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
                >
                  Username Baru
                </label>
                <input
                  id="change-username-input"
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => {
                    setUsernameInput(e.target.value);
                    if (usernameError) setUsernameError(null);
                  }}
                  placeholder="Contoh: admin, superadmin"
                  className="block w-full px-3.5 py-2.5 text-sm bg-neutral-50/60 border border-neutral-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#48A6A7] focus:border-[#48A6A7] transition-colors text-gray-900"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  Minimal 3 karakter, alfanumerik, strip (-), titik (.), dan garis bawah (_).
                </p>
              </div>

              <div className="pt-2">
                <button
                  id="update-username-submit-button"
                  type="submit"
                  disabled={isUpdatingUsername || isLoadingIdentity}
                  className="min-h-[44px] w-full flex justify-center items-center py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#006A71] hover:bg-[#00575d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#006A71] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingUsername ? (
                    <>
                      <svg className="w-3.5 h-3.5 mr-2 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Menyimpan...
                    </>
                  ) : (
                    'Perbarui Username'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Form Ubah Password */}
        <div className="bg-white rounded-2xl border border-[#9ACBD0]/60 p-6 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 pb-4 border-b border-neutral-100">
              <div className="w-9 h-9 rounded-xl bg-[#48A6A7]/10 flex items-center justify-center text-[#006A71]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Ubah Password Admin</h3>
                <p className="text-xs text-gray-500">Otentikasi terenkripsi via Supabase Auth</p>
              </div>
            </div>

            {passwordSuccess && (
              <div className="mt-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
                <svg className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="mt-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                <svg className="w-4 h-4 flex-shrink-0 text-red-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="mt-5 space-y-4">
              <div>
                <label
                  htmlFor="change-old-password-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
                >
                  Password Lama
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="change-old-password-input"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={oldPassword}
                    onChange={(e) => {
                      setOldPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder="Masukkan password saat ini"
                    className="block w-full pl-9 pr-3.5 py-2.5 text-sm bg-neutral-50/60 border border-neutral-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#48A6A7] focus:border-[#48A6A7] transition-colors text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="change-new-password-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
                >
                  Password Baru
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="change-new-password-input"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder="Minimal 8 karakter"
                    className="block w-full pl-9 pr-3.5 py-2.5 text-sm bg-neutral-50/60 border border-neutral-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#48A6A7] focus:border-[#48A6A7] transition-colors text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="change-confirm-password-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-1.5"
                >
                  Konfirmasi Password Baru
                </label>
                <div className="relative rounded-xl shadow-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="change-confirm-password-input"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder="Ulangi password baru"
                    className="block w-full pl-9 pr-3.5 py-2.5 text-sm bg-neutral-50/60 border border-neutral-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#48A6A7] focus:border-[#48A6A7] transition-colors text-gray-900"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  id="update-password-submit-button"
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="min-h-[44px] w-full flex justify-center items-center py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-[#006A71] hover:bg-[#00575d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#006A71] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingPassword ? (
                    <>
                      <svg className="w-3.5 h-3.5 mr-2 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Memverifikasi...
                    </>
                  ) : (
                    'Ubah Password &amp; Akhiri Sesi'
                  )}
                </button>
              </div>
            </form>
          </div>

          <p className="mt-4 text-[11px] text-gray-500">
            Setelah password diperbarui, seluruh sesi login saat ini akan ditutup dan Anda wajib masuk kembali.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSecuritySettings;
