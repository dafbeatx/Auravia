import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  getSystemSettings,
  updateSystemSettings,
  type SystemSettingsData,
} from '@/lib/admin';

export function AdminSettings() {
  const { isSuperAdmin } = useAdminAuth();
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getSystemSettings()
      .then((data) => {
        if (isMounted) setSettings(data);
      })
      .catch((err) => {
        if (isMounted) {
          setFeedback({
            type: 'error',
            message: err instanceof Error ? err.message : 'Gagal memuat pengaturan sistem.',
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setFeedback({ type: 'error', message: 'Hanya Super Admin yang berhak mengubah pengaturan sistem.' });
      return;
    }

    try {
      setSaving(true);
      setFeedback(null);
      await updateSystemSettings(settings);
      setFeedback({ type: 'success', message: 'Pengaturan sistem platform berhasil disimpan.' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menyimpan pengaturan.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-primary">
            Pengaturan Sistem &amp; Platform
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Konfigurasi global berbasis database untuk nama situs, identitas visual, SEO default, dan kontrol operasional.
          </p>
        </div>

        <Link
          to="/admin/settings/security"
          className="px-4 py-2 bg-surface-elevated hover:bg-border text-primary text-xs font-semibold rounded-xl border border-border transition-colors min-h-[40px] inline-flex items-center gap-1.5 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Keamanan Kredensial Pribadi</span>
        </Link>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-success/10 border border-success/30 text-success'
              : 'bg-danger/10 border border-danger/30 text-danger'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold hover:underline ml-4 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-surface p-12 rounded-2xl border border-border flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-text-muted">Memuat konfigurasi sistem...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identitas Situs & Branding */}
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-2xs space-y-4">
            <h3 className="font-serif text-base font-bold text-primary border-b border-border pb-3">
              Identitas Situs &amp; Branding
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Nama Platform / Situs
                </label>
                <input
                  type="text"
                  required
                  disabled={!isSuperAdmin}
                  value={settings.site_name}
                  onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary focus:ring-2 focus:ring-primary min-h-[40px] disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  URL Logo Publik
                </label>
                <input
                  type="text"
                  disabled={!isSuperAdmin}
                  value={settings.logo_url || ''}
                  onChange={(e) => setSettings({ ...settings, logo_url: e.target.value || null })}
                  placeholder="/logo.svg"
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary focus:ring-2 focus:ring-primary min-h-[40px] disabled:opacity-60"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                URL Favicon
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings.favicon_url || ''}
                onChange={(e) => setSettings({ ...settings, favicon_url: e.target.value || null })}
                placeholder="/favicon.ico"
                className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary focus:ring-2 focus:ring-primary min-h-[40px] disabled:opacity-60"
              />
            </div>
          </div>

          {/* Pengaturan SEO Bawaan */}
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-2xs space-y-4">
            <h3 className="font-serif text-base font-bold text-primary border-b border-border pb-3">
              Pengaturan Mesin Pencari (Default SEO)
            </h3>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Default SEO Title
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings.default_seo_title}
                onChange={(e) => setSettings({ ...settings, default_seo_title: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary focus:ring-2 focus:ring-primary min-h-[40px] disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Default SEO Meta Description
              </label>
              <textarea
                rows={3}
                disabled={!isSuperAdmin}
                value={settings.default_seo_description}
                onChange={(e) => setSettings({ ...settings, default_seo_description: e.target.value })}
                className="w-full px-3.5 py-2 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary focus:ring-2 focus:ring-primary disabled:opacity-60"
              />
            </div>
          </div>

          {/* Kontrol Layanan & Operasional Platform */}
          <div className="bg-surface p-6 rounded-2xl border border-border shadow-2xs space-y-4">
            <h3 className="font-serif text-base font-bold text-primary border-b border-border pb-3">
              Kontrol Layanan &amp; Operasional
            </h3>

            <div className="space-y-4">
              {/* Maintenance Mode */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-elevated">
                <div>
                  <span className="text-xs font-bold text-text-primary block">
                    Mode Pemeliharaan (Maintenance Mode)
                  </span>
                  <span className="text-[11px] text-text-muted">
                    Jika aktif, pengunjung situs publik akan melihat pemberitahuan pemeliharaan sistem.
                  </span>
                </div>
                <input
                  type="checkbox"
                  disabled={!isSuperAdmin}
                  checked={settings.maintenance_mode}
                  onChange={(e) => setSettings({ ...settings, maintenance_mode: e.target.checked })}
                  className="w-4 h-4 text-primary rounded border-border focus:ring-primary cursor-pointer disabled:opacity-60"
                />
              </div>

              {/* Registration Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-elevated">
                <div>
                  <span className="text-xs font-bold text-text-primary block">
                    Pendaftaran Pengguna Baru (Registration Enabled)
                  </span>
                  <span className="text-[11px] text-text-muted">
                    Mengizinkan atau menutup pendaftaran akun baru bagi pengunjung umum.
                  </span>
                </div>
                <input
                  type="checkbox"
                  disabled={!isSuperAdmin}
                  checked={settings.registration_enabled}
                  onChange={(e) => setSettings({ ...settings, registration_enabled: e.target.checked })}
                  className="w-4 h-4 text-primary rounded border-border focus:ring-primary cursor-pointer disabled:opacity-60"
                />
              </div>

              {/* Catalog Enabled */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-elevated">
                <div>
                  <span className="text-xs font-bold text-text-primary block">
                    Katalog Template Publik (Template Catalog Enabled)
                  </span>
                  <span className="text-[11px] text-text-muted">
                    Tampilkan seksi etalase katalog template di halaman beranda publik.
                  </span>
                </div>
                <input
                  type="checkbox"
                  disabled={!isSuperAdmin}
                  checked={settings.catalog_enabled}
                  onChange={(e) => setSettings({ ...settings, catalog_enabled: e.target.checked })}
                  className="w-4 h-4 text-primary rounded border-border focus:ring-primary cursor-pointer disabled:opacity-60"
                />
              </div>

              {/* Analytics Enabled */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-elevated">
                <div>
                  <span className="text-xs font-bold text-text-primary block">
                    Pelacakan Analitik Internal (Analytics Tracking Enabled)
                  </span>
                  <span className="text-[11px] text-text-muted">
                    Mencatat data page views, pengunjung unik, dan konversi demo secara privacy-friendly.
                  </span>
                </div>
                <input
                  type="checkbox"
                  disabled={!isSuperAdmin}
                  checked={settings.analytics_enabled}
                  onChange={(e) => setSettings({ ...settings, analytics_enabled: e.target.checked })}
                  className="w-4 h-4 text-primary rounded border-border focus:ring-primary cursor-pointer disabled:opacity-60"
                />
              </div>
            </div>
          </div>

          {/* Tombol Simpan */}
          {isSuperAdmin ? (
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold shadow-xs min-h-[44px] transition-all cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Menyimpan Pengaturan...' : 'Simpan Pengaturan Platform'}
              </button>
            </div>
          ) : (
            <p className="text-[11px] text-text-muted text-right">
              Anda masuk sebagai Admin (read-only). Hanya Super Admin yang dapat menyimpan perubahan pengaturan sistem.
            </p>
          )}
        </form>
      )}
    </div>
  );
}

export default AdminSettings;
