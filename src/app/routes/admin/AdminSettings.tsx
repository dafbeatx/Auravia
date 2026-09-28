import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { updateAdminProfile, changeAdminOwnPassword } from '@/lib/adminAuth';
import {
  getSystemSettings,
  updateSystemSettings,
  type SystemSettingsData,
} from '@/lib/admin';

export function AdminSettings() {
  const { admin, logout, isSuperAdmin, refreshSession } = useAdminAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'account' | 'platform'>('account');

  // Account State
  const [usernameInput, setUsernameInput] = useState(admin?.username || '');
  const [displayNameInput, setDisplayNameInput] = useState(admin?.display_name || admin?.username || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Password State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Platform Settings State
  const [settings, setSettings] = useState<SystemSettingsData>({
    site_name: 'Aurovia',
    logo_url: null,
    favicon_url: null,
    default_seo_title: 'Aurovia - Undangan Pernikahan Digital Elegan',
    default_seo_description: 'Platform undangan digital pernikahan eksklusif dengan desain kurasi modern, RSVP interaktif, dan sentuhan visual premium.',
    maintenance_mode: false,
    registration_enabled: true,
    catalog_enabled: true,
    analytics_enabled: true,
  });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [platformFeedback, setPlatformFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (admin) {
      setUsernameInput(admin.username);
      setDisplayNameInput(admin.display_name || admin.username);
    }
  }, [admin]);

  useEffect(() => {
    let isMounted = true;
    setLoadingSettings(true);
    getSystemSettings()
      .then((data) => {
        if (isMounted) setSettings(data);
      })
      .catch((err) => {
        if (isMounted) {
          setPlatformFeedback({
            type: 'error',
            message: err instanceof Error ? err.message : 'Gagal memuat pengaturan sistem.',
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoadingSettings(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update Profil Admin (Username & Display Name)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileFeedback(null);

    const cleanUser = usernameInput.trim().toLowerCase();
    const cleanDisplay = displayNameInput.trim();

    if (!cleanUser || cleanUser.length < 3 || cleanUser.length > 30) {
      setProfileFeedback({
        type: 'error',
        message: 'Username harus memiliki panjang antara 3 sampai 30 karakter.',
      });
      return;
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUser)) {
      setProfileFeedback({
        type: 'error',
        message: 'Username hanya boleh mengandung huruf, angka, underscore, titik, dan strip.',
      });
      return;
    }

    setSavingProfile(true);
    try {
      await updateAdminProfile(cleanUser, cleanDisplay || cleanUser);
      await refreshSession();
      setProfileFeedback({
        type: 'success',
        message: 'Profil akun admin berhasil diperbarui!',
      });
    } catch (err: unknown) {
      setProfileFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal memperbarui profil admin.',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  // Update Password Admin
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (!oldPassword) {
      setPasswordFeedback({ type: 'error', message: 'Password saat ini wajib diisi.' });
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setPasswordFeedback({ type: 'error', message: 'Password baru minimal 8 karakter.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: 'error',
        message: 'Password baru dan konfirmasi password tidak cocok.',
      });
      return;
    }

    setSavingPassword(true);
    try {
      await changeAdminOwnPassword(oldPassword, newPassword);
      setPasswordFeedback({
        type: 'success',
        message: 'Password admin berhasil diubah! Mengalihkan ke login...',
      });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(async () => {
        await logout();
        navigate('/admin/login');
      }, 1500);
    } catch (err: unknown) {
      setPasswordFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal mengubah password admin.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  // Update Platform Settings
  const handleSavePlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setPlatformFeedback({
        type: 'error',
        message: 'Hanya Super Admin yang berhak mengubah pengaturan konfigurasi platform.',
      });
      return;
    }

    setSavingSettings(true);
    setPlatformFeedback(null);
    try {
      await updateSystemSettings(settings);
      setPlatformFeedback({
        type: 'success',
        message: 'Konfigurasi platform berhasil disimpan!',
      });
    } catch (err: unknown) {
      setPlatformFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menyimpan pengaturan platform.',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#006A71]">
            Pengaturan Admin
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Kelola profil akun, kredensial keamanan password, dan konfigurasi global platform Aurovia.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-[#9ACBD0]/60 rounded-xl shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`py-2 px-3.5 rounded-lg text-xs font-semibold transition-all min-h-[40px] cursor-pointer ${
              activeTab === 'account'
                ? 'bg-[#006A71] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Akun &amp; Keamanan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('platform')}
            className={`py-2 px-3.5 rounded-lg text-xs font-semibold transition-all min-h-[40px] cursor-pointer ${
              activeTab === 'platform'
                ? 'bg-[#006A71] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Konfigurasi Platform
          </button>
        </div>
      </div>

      {activeTab === 'account' && (
        <div className="space-y-6">
          {/* Section A: Akun Profile */}
          <div className="bg-white p-6 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#9ACBD0]/30 pb-3">
              <div>
                <h3 className="font-serif text-base font-bold text-[#006A71]">
                  Identitas Akun Admin
                </h3>
                <p className="text-xs text-gray-400">Atur username dan nama tampilan akun Anda.</p>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </span>
            </div>

            {profileFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${
                  profileFeedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                <span>{profileFeedback.message}</span>
                <button
                  type="button"
                  onClick={() => setProfileFeedback(null)}
                  className="font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 block">
                    Username Admin <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="admin"
                    className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                  />
                  <p className="text-[10px] text-gray-400">Hanya huruf, angka, titik, underscore, dan strip.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 block">
                    Display Name (Nama Tampilan)
                  </label>
                  <input
                    type="text"
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    placeholder="Nama Lengkap / Administrator"
                    className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                  />
                  <p className="text-[10px] text-gray-400">Ditampilkan pada topbar dan riwayat aktivitas.</p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="py-2.5 px-5 bg-[#006A71] hover:bg-[#00575d] text-white rounded-xl text-xs font-semibold transition-all shadow-xs min-h-[44px] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingProfile ? 'Menyimpan...' : 'Simpan Profil'}
                </button>
              </div>
            </form>
          </div>

          {/* Section B: Security - Ganti Password */}
          <div className="bg-white p-6 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-4">
            <div className="border-b border-[#9ACBD0]/30 pb-3">
              <h3 className="font-serif text-base font-bold text-[#006A71]">
                Keamanan Password
              </h3>
              <p className="text-xs text-gray-400">
                Ubah kata sandi akun admin. Password selalu di-hash menggunakan algoritma aman sebelum disimpan ke database.
              </p>
            </div>

            {passwordFeedback && (
              <div
                className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${
                  passwordFeedback.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                <span>{passwordFeedback.message}</span>
                <button
                  type="button"
                  onClick={() => setPasswordFeedback(null)}
                  className="font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">
                  Password Saat Ini <span className="text-red-500">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan password saat ini"
                  className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 block">
                    Password Baru <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 block">
                    Konfirmasi Password Baru <span className="text-red-500">*</span>
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang password baru"
                    className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
                  <input
                    type="checkbox"
                    checked={showPassword}
                    onChange={(e) => setShowPassword(e.target.checked)}
                    className="w-4 h-4 rounded text-[#006A71] focus:ring-[#006A71] border-[#9ACBD0]"
                  />
                  <span>Tampilkan Password</span>
                </label>

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="py-2.5 px-5 bg-[#006A71] hover:bg-[#00575d] text-white rounded-xl text-xs font-semibold transition-all shadow-xs min-h-[44px] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingPassword ? 'Menyimpan...' : 'Perbarui Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Section C: Sesi Admin Aktif */}
          <div className="bg-white p-6 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-4">
            <div className="border-b border-[#9ACBD0]/30 pb-3">
              <h3 className="font-serif text-base font-bold text-[#006A71]">
                Sesi &amp; Autentikasi
              </h3>
              <p className="text-xs text-gray-400">
                Informasi sesi login saat ini dan opsi logout aman.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Peran Akun</span>
                <span className="font-semibold text-gray-800 mt-1 block">
                  {admin?.role === 'super_admin' ? 'Super Administrator' : 'Administrator'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Status Sesi</span>
                <span className="font-semibold text-emerald-700 mt-1 block flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Aktif (Session Storage)
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Terakhir Login</span>
                <span className="font-semibold text-gray-800 mt-1 block">
                  {admin?.last_login_at
                    ? new Date(admin.last_login_at).toLocaleString('id-ID')
                    : 'Sesi saat ini'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleLogout}
                className="py-2.5 px-5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition-all min-h-[44px] flex items-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout Sesi Admin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'platform' && (
        <div className="space-y-6">
          {platformFeedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${
                platformFeedback.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              <span>{platformFeedback.message}</span>
              <button
                type="button"
                onClick={() => setPlatformFeedback(null)}
                className="font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {loadingSettings ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-[#006A71] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-gray-400">Memuat konfigurasi platform...</p>
            </div>
          ) : (
            <form onSubmit={handleSavePlatform} className="space-y-6">
              {/* Identitas Website */}
              <div className="bg-white p-6 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-4">
                <div className="border-b border-[#9ACBD0]/30 pb-3">
                  <h3 className="font-serif text-base font-bold text-[#006A71]">
                    Identitas Platform Aurovia
                  </h3>
                  <p className="text-xs text-gray-400">Pengaturan nama brand dan aset grafis website publik.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 block">
                    Nama Situs / Platform
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.site_name}
                    onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                    placeholder="Aurovia"
                    className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 block">
                      URL Logo
                    </label>
                    <input
                      type="text"
                      value={settings.logo_url || ''}
                      onChange={(e) => setSettings({ ...settings, logo_url: e.target.value || null })}
                      placeholder="/images/logo.svg"
                      className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 block">
                      URL Favicon
                    </label>
                    <input
                      type="text"
                      value={settings.favicon_url || ''}
                      onChange={(e) => setSettings({ ...settings, favicon_url: e.target.value || null })}
                      placeholder="/favicon.ico"
                      className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              {/* SEO Defaults */}
              <div className="bg-white p-6 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-4">
                <div className="border-b border-[#9ACBD0]/30 pb-3">
                  <h3 className="font-serif text-base font-bold text-[#006A71]">
                    Pengaturan Default SEO
                  </h3>
                  <p className="text-xs text-gray-400">Meta judul dan deskripsi standar untuk search engine.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 block">
                    Default Title Tag
                  </label>
                  <input
                    type="text"
                    value={settings.default_seo_title}
                    onChange={(e) => setSettings({ ...settings, default_seo_title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 block">
                    Default Meta Description
                  </label>
                  <textarea
                    rows={2}
                    value={settings.default_seo_description}
                    onChange={(e) => setSettings({ ...settings, default_seo_description: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71]"
                  />
                </div>
              </div>

              {/* Toggles Operasional */}
              <div className="bg-white p-6 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-4">
                <div className="border-b border-[#9ACBD0]/30 pb-3">
                  <h3 className="font-serif text-base font-bold text-[#006A71]">
                    Mode &amp; Fitur Operasional
                  </h3>
                  <p className="text-xs text-gray-400">Kontrol ketersediaan fitur platform secara langsung.</p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-gray-800 block">Pendaftaran Pengguna (Registration)</span>
                      <span className="text-[11px] text-gray-500">Izinkan publik mendaftarkan akun baru</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.registration_enabled}
                      onChange={(e) => setSettings({ ...settings, registration_enabled: e.target.checked })}
                      className="w-4 h-4 rounded text-[#006A71] focus:ring-[#006A71] border-[#9ACBD0]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-gray-800 block">Katalog Template Publik</span>
                      <span className="text-[11px] text-gray-500">Tampilkan katalog template di landing page</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.catalog_enabled}
                      onChange={(e) => setSettings({ ...settings, catalog_enabled: e.target.checked })}
                      className="w-4 h-4 rounded text-[#006A71] focus:ring-[#006A71] border-[#9ACBD0]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-gray-800 block">Tracking Analitik Website</span>
                      <span className="text-[11px] text-gray-500">Catat traffic dan kunjungan halaman</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.analytics_enabled}
                      onChange={(e) => setSettings({ ...settings, analytics_enabled: e.target.checked })}
                      className="w-4 h-4 rounded text-[#006A71] focus:ring-[#006A71] border-[#9ACBD0]"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3 rounded-xl bg-amber-50/60 border border-amber-200/60 cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-amber-900 block">Mode Pemeliharaan (Maintenance Mode)</span>
                      <span className="text-[11px] text-amber-700">Tampilkan halaman pemeliharaan kepada pengunjung biasa</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.maintenance_mode}
                      onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300"
                    />
                  </label>
                </div>

                <div className="flex justify-end pt-3">
                  <button
                    type="submit"
                    disabled={savingSettings || !isSuperAdmin}
                    className="py-2.5 px-6 bg-[#006A71] hover:bg-[#00575d] text-white rounded-xl text-xs font-semibold transition-all shadow-xs min-h-[44px] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {savingSettings ? 'Menyimpan...' : 'Simpan Konfigurasi Platform'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
