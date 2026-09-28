import { useState, useEffect, useCallback } from 'react';
import {
  getAdminTrafficStats,
  getAdminTrafficLogs,
  type TrafficStatItem,
  type AdminTrafficLogItem,
} from '@/lib/admin';

export function AdminTraffic() {
  const [timeRange, setTimeRange] = useState<1 | 7 | 30 | 'custom'>(7);
  const [customDays, setCustomDays] = useState(14);
  const [eventFilter, setEventFilter] = useState('all');
  const [trafficData, setTrafficData] = useState<TrafficStatItem[]>([]);
  const [logs, setLogs] = useState<AdminTrafficLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const effectiveDays = timeRange === 'custom' ? customDays : timeRange;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [stats, logData] = await Promise.all([
        getAdminTrafficStats(effectiveDays),
        getAdminTrafficLogs(effectiveDays, eventFilter, 50, 0),
      ]);

      setTrafficData(stats);
      setLogs(logData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat analitik traffic.');
    } finally {
      setLoading(false);
    }
  }, [effectiveDays, eventFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Akumulasi metrik dari series traffic
  const totals = trafficData.reduce(
    (acc, curr) => ({
      visitors: acc.visitors + Number(curr.visitors || 0),
      page_views: acc.page_views + Number(curr.page_views || 0),
      demo_views: acc.demo_views + Number(curr.demo_views || 0),
      login_success: acc.login_success + Number(curr.login_success || 0),
      register_success: acc.register_success + Number(curr.register_success || 0),
      invitation_create: acc.invitation_create + Number(curr.invitation_create || 0),
      invitation_publish: acc.invitation_publish + Number(curr.invitation_publish || 0),
    }),
    {
      visitors: 0,
      page_views: 0,
      demo_views: 0,
      login_success: 0,
      register_success: 0,
      invitation_create: 0,
      invitation_publish: 0,
    }
  );

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return `${d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
      })} ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return isoString;
    }
  };

  const getEventBadge = (eventName: string) => {
    switch (eventName) {
      case 'landing_view':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary-soft text-primary">Landing</span>;
      case 'template_demo_view':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary/15 text-primary">Demo View</span>;
      case 'login_success':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-success/15 text-success">Login Sukses</span>;
      case 'login_failed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-danger/10 text-danger">Login Gagal</span>;
      case 'public_invitation_view':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-accent/20 text-primary">Invitation View</span>;
      case 'page_view':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-elevated text-text-muted">{eventName}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-primary">
            Lalu Lintas &amp; Analitik Pengunjung
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Pantau page views, pengunjung unik, aktivitas demo, dan riwayat event secara privacy-friendly.
          </p>
        </div>

        {/* Filter Rentang Periode */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="inline-flex rounded-xl p-1 bg-surface border border-border shadow-2xs">
            {([
              { value: 1, label: 'Hari Ini' },
              { value: 7, label: '7 Hari' },
              { value: 30, label: '30 Hari' },
              { value: 'custom', label: 'Kustom' },
            ] as const).map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setTimeRange(r.value)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all min-h-[36px] cursor-pointer ${
                  timeRange === r.value
                    ? 'bg-primary text-primary-foreground shadow-2xs'
                    : 'text-text-muted hover:text-primary'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {timeRange === 'custom' && (
            <div className="flex items-center gap-1 bg-surface px-2 py-1 rounded-xl border border-border">
              <input
                type="number"
                min={1}
                max={365}
                value={customDays}
                onChange={(e) => setCustomDays(Math.max(1, Number(e.target.value)))}
                className="w-16 px-2 py-1 text-xs border border-border rounded text-text-primary text-center"
              />
              <span className="text-xs text-text-muted">hari</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs">
          {error}
        </div>
      )}

      {/* Grid Metrik Kumulatif Periode */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-surface p-4 rounded-2xl border border-border shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
            Total Page Views
          </span>
          <p className="font-serif text-2xl font-bold text-primary">
            {loading ? '-' : totals.page_views}
          </p>
          <span className="text-[10px] text-text-subtle">Halaman diakses</span>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-border shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
            Unique Visitors
          </span>
          <p className="font-serif text-2xl font-bold text-secondary">
            {loading ? '-' : totals.visitors}
          </p>
          <span className="text-[10px] text-text-subtle">Sesi anonim unik</span>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-border shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
            Demo Template Views
          </span>
          <p className="font-serif text-2xl font-bold text-primary">
            {loading ? '-' : totals.demo_views}
          </p>
          <span className="text-[10px] text-text-subtle">Pratinjau dibuka</span>
        </div>

        <div className="bg-surface p-4 rounded-2xl border border-border shadow-2xs space-y-1">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
            Login Berhasil
          </span>
          <p className="font-serif text-2xl font-bold text-success">
            {loading ? '-' : totals.login_success}
          </p>
          <span className="text-[10px] text-text-subtle">Sesi terautentikasi</span>
        </div>
      </div>

      {/* Filter Jenis Event Log */}
      <div className="bg-surface p-4 rounded-2xl border border-border shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <span className="text-xs font-bold text-text-primary">
          Log Aktivitas Terkini (Real-time Audit Trail)
        </span>

        <select
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
          className="px-3 py-2 bg-surface-elevated border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px] cursor-pointer"
        >
          <option value="all">Semua Jenis Event</option>
          <option value="landing_view">Kunjungan Landing Page</option>
          <option value="template_demo_view">Kunjungan Demo Template</option>
          <option value="page_view">Kunjungan Halaman Biasa</option>
          <option value="login_success">Login Berhasil</option>
          <option value="login_failed">Login Gagal</option>
          <option value="public_invitation_view">Tamu Buka Undangan Publik</option>
        </select>
      </div>

      {/* Tabel Log Aktivitas */}
      <div className="bg-surface rounded-2xl border border-border shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-text-muted">Memuat log aktivitas...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-text-muted">
            Tidak ada rekaman log pada periode dan filter yang dipilih.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-elevated/60 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  <th className="py-3 px-4 sm:px-6">Waktu</th>
                  <th className="py-3 px-4">Jenis Event</th>
                  <th className="py-3 px-4">Rute / Path</th>
                  <th className="py-3 px-4">Template / Undangan</th>
                  <th className="py-3 px-4">Perangkat &amp; Browser</th>
                  <th className="py-3 px-4 sm:px-6">Referrer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3 px-4 sm:px-6 font-mono text-[11px] text-text-muted whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      {getEventBadge(log.event_name)}
                    </td>
                    <td className="py-3 px-4 font-mono text-text-primary text-[11px] max-w-xs truncate">
                      {log.path}
                    </td>
                    <td className="py-3 px-4 text-text-primary">
                      {log.template_name || (log.invitation_slug ? `/${log.invitation_slug}` : '-')}
                    </td>
                    <td className="py-3 px-4 text-text-muted capitalize">
                      {log.device_type} • {log.browser || 'Browser'}
                    </td>
                    <td className="py-3 px-4 sm:px-6 text-text-muted text-[11px] truncate max-w-[150px]">
                      {log.referrer || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-[11px] text-text-subtle text-center">
        Sistem analitik internal Aurovia mematuhi standar privasi: tidak menyimpan kata sandi, token autentikasi, ataupun informasi identitas pribadi (PII).
      </p>
    </div>
  );
}

export default AdminTraffic;
