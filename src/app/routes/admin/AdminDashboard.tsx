import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getAdminDashboardStatsV2,
  getAdminTrafficStats,
  type DashboardStatsV2,
  type TrafficStatItem,
} from '@/lib/admin';

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStatsV2 | null>(null);
  const [trafficData, setTrafficData] = useState<TrafficStatItem[]>([]);
  const [timeRange, setTimeRange] = useState<1 | 7 | 30>(7);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTraffic, setLoadingTraffic] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ambil data agregat statistik lengkap
  useEffect(() => {
    let isMounted = true;
    setLoadingStats(true);
    getAdminDashboardStatsV2()
      .then((data) => {
        if (isMounted) {
          setStats(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Gagal memuat statistik dashboard.');
        }
      })
      .finally(() => {
        if (isMounted) setLoadingStats(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Ambil rincian data traffic (1 hari, 7 hari, atau 30 hari)
  useEffect(() => {
    let isMounted = true;
    setLoadingTraffic(true);
    getAdminTrafficStats(timeRange)
      .then((data) => {
        if (isMounted) {
          setTrafficData(data);
        }
      })
      .catch(() => {
        if (isMounted) setTrafficData([]);
      })
      .finally(() => {
        if (isMounted) setLoadingTraffic(false);
      });

    return () => {
      isMounted = false;
    };
  }, [timeRange]);

  const maxTrafficVal = Math.max(
    1,
    ...trafficData.map((d) => Math.max(Number(d.visitors || 0), Number(d.page_views || 0)))
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Banner / Header Overview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="font-serif text-2xl font-bold text-primary">
            Ringkasan Platform Aurovia
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Data aktual ringkasan metrik pengguna, undangan, template, dan interaksi pengunjung.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/traffic"
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-surface-elevated hover:bg-border text-primary border border-border transition-colors min-h-[40px] flex items-center justify-center cursor-pointer"
          >
            Lihat Analitik Lalu Lintas
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs">
          {error}
        </div>
      )}

      {/* Grid 12 Statistik Utama */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* 1. Total User */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
            Total User
          </p>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-primary">
            {loadingStats ? '-' : stats?.total_users ?? 0}
          </p>
          <p className="text-[10px] text-text-subtle">Pengguna terdaftar</p>
        </div>

        {/* 2. User Baru Hari Ini */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
            User Baru Hari Ini
          </p>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-secondary">
            {loadingStats ? '-' : stats?.users_today ?? 0}
          </p>
          <p className="text-[10px] text-text-subtle">Registrasi sejak 00:00</p>
        </div>

        {/* 3. Total Undangan */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
            Total Undangan
          </p>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-primary">
            {loadingStats ? '-' : stats?.total_invitations ?? 0}
          </p>
          <p className="text-[10px] text-text-subtle">Seluruh undangan dibuat</p>
        </div>

        {/* 4. Undangan Draft */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
            Undangan Draf
          </p>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-warning">
            {loadingStats ? '-' : stats?.invitations_draft ?? 0}
          </p>
          <p className="text-[10px] text-text-subtle">Sedang disunting</p>
        </div>

        {/* 5. Undangan Published */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
            Undangan Published
          </p>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-success">
            {loadingStats ? '-' : stats?.invitations_published ?? 0}
          </p>
          <p className="text-[10px] text-text-subtle">Sudah terbit publik</p>
        </div>

        {/* 6. Total Template */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
            Total Template
          </p>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-primary">
            {loadingStats ? '-' : stats?.total_templates ?? 0}
          </p>
          <p className="text-[10px] text-text-subtle">Katalog terdaftar</p>
        </div>

        {/* 7. Template Aktif */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
            Template Aktif
          </p>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-primary">
            {loadingStats ? '-' : stats?.active_templates ?? 0}
          </p>
          <p className="text-[10px] text-text-subtle">Tersedia untuk pengguna</p>
        </div>

        {/* 8. Total Page Views */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
            Total Page Views
          </p>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-primary">
            {loadingStats ? '-' : stats?.total_page_views ?? 0}
          </p>
          <p className="text-[10px] text-text-subtle">Kunjungan landing &amp; halaman</p>
        </div>

        {/* 9. Unique Visitors */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
            Unique Visitors
          </p>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-secondary">
            {loadingStats ? '-' : stats?.total_visitors ?? 0}
          </p>
          <p className="text-[10px] text-text-subtle">Sesi unik pengunjung</p>
        </div>

        {/* 10. Demo Template Views */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
            Demo Template Views
          </p>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-primary">
            {loadingStats ? '-' : stats?.demo_views ?? 0}
          </p>
          <p className="text-[10px] text-text-subtle">Pratinjau interaktif dibuka</p>
        </div>

        {/* 11. Login Attempts */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
            Percobaan Login
          </p>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-text-primary">
            {loadingStats ? '-' : stats?.login_attempts ?? 0}
          </p>
          <p className="text-[10px] text-text-subtle">Event sukses &amp; gagal</p>
        </div>

        {/* 12. Error Events */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border shadow-2xs space-y-1">
          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
            Peristiwa Error
          </p>
          <p className="font-serif text-2xl sm:text-3xl font-bold text-danger">
            {loadingStats ? '-' : stats?.error_events ?? 0}
          </p>
          <p className="text-[10px] text-text-subtle">Catatan kendala sistem</p>
        </div>
      </div>

      {/* Grafik Sederhana Lalu Lintas */}
      <div className="bg-surface p-6 rounded-2xl border border-border shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-base sm:text-lg font-bold text-primary">
              Grafik Lalu Lintas Pengunjung
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Perbandingan Page Views dan Pengunjung Unik dalam periode terpilih.
            </p>
          </div>

          {/* Filter Rentang Hari Ini / 7 Hari / 30 Hari */}
          <div className="inline-flex rounded-xl p-1 bg-surface-elevated border border-border">
            {([
              { value: 1, label: 'Hari Ini' },
              { value: 7, label: '7 Hari' },
              { value: 30, label: '30 Hari' },
            ] as const).map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setTimeRange(item.value)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all min-h-[36px] cursor-pointer ${
                  timeRange === item.value
                    ? 'bg-primary text-primary-foreground shadow-2xs'
                    : 'text-text-muted hover:text-primary'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loadingTraffic ? (
          <div className="h-48 flex flex-col items-center justify-center space-y-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-text-muted">Memuat grafik lalu lintas...</p>
          </div>
        ) : trafficData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-text-muted">
            Belum ada catatan aktivitas pada rentang waktu ini.
          </div>
        ) : (
          <div className="space-y-4">
            {/* Visualisasi Bar Chart Sederhana */}
            <div className="h-48 flex items-end gap-2 pt-6 pb-2 border-b border-border overflow-x-auto">
              {trafficData.map((d, i) => {
                const heightPV = Math.round((Number(d.page_views || 0) / maxTrafficVal) * 100);
                const heightVis = Math.round((Number(d.visitors || 0) / maxTrafficVal) * 100);

                return (
                  <div key={d.day_date || i} className="flex-1 min-w-[20px] max-w-[48px] flex flex-col items-center gap-1 group">
                    <div className="w-full flex items-end justify-center gap-0.5 h-36">
                      {/* Bar Page Views */}
                      <div
                        style={{ height: `${Math.max(4, heightPV)}%` }}
                        className="w-1/2 bg-primary rounded-t-sm group-hover:brightness-110 transition-all relative"
                        title={`Page Views: ${d.page_views}`}
                      />
                      {/* Bar Visitors */}
                      <div
                        style={{ height: `${Math.max(4, heightVis)}%` }}
                        className="w-1/2 bg-secondary rounded-t-sm group-hover:brightness-110 transition-all relative"
                        title={`Visitors: ${d.visitors}`}
                      />
                    </div>
                    <span className="text-[9px] text-text-subtle truncate max-w-full font-mono">
                      {d.day_date ? d.day_date.slice(5) : ''}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legenda Grafik */}
            <div className="flex items-center justify-end gap-6 text-xs pt-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-primary" />
                <span className="text-text-muted font-medium">Page Views</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-secondary" />
                <span className="text-text-muted font-medium">Unique Visitors</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigasi Tautan Cepat */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/admin/invitations"
          className="p-4 rounded-xl bg-surface border border-border hover:border-primary/40 shadow-2xs transition-all group flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-bold text-text-primary group-hover:text-primary">
              Kelola Undangan
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              Buka daftar draf dan terbit
            </p>
          </div>
          <svg className="w-4 h-4 text-text-muted group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link
          to="/admin/templates"
          className="p-4 rounded-xl bg-surface border border-border hover:border-primary/40 shadow-2xs transition-all group flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-bold text-text-primary group-hover:text-primary">
              Katalog Template
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              Atur status aktif &amp; urutan display
            </p>
          </div>
          <svg className="w-4 h-4 text-text-muted group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link
          to="/admin/demo"
          className="p-4 rounded-xl bg-surface border border-border hover:border-primary/40 shadow-2xs transition-all group flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-bold text-text-primary group-hover:text-primary">
              Media Demo Template
            </p>
            <p className="text-[11px] text-text-muted mt-0.5">
              Kelola konten foto &amp; pratinjau publik
            </p>
          </div>
          <svg className="w-4 h-4 text-text-muted group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

export default AdminDashboard;
