import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getAdminDashboardStats,
  getAdminTrafficStats,
  type DashboardStats,
  type TrafficStatItem,
} from '@/lib/admin';

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trafficData, setTrafficData] = useState<TrafficStatItem[]>([]);
  const [timeRange, setTimeRange] = useState<7 | 30 | 365>(30);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTraffic, setLoadingTraffic] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ambil data agregat statistik
  useEffect(() => {
    let isMounted = true;
    setLoadingStats(true);
    getAdminDashboardStats()
      .then((data) => {
        if (isMounted) {
          setStats(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Gagal memuat statistik.');
        }
      })
      .finally(() => {
        if (isMounted) setLoadingStats(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Ambil rincian data traffic berdasarkan rentang waktu yang dipilih
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

  // Hitung total kumulatif dari rincian traffic
  const trafficBreakdown = trafficData.reduce(
    (acc, curr) => ({
      visitors: acc.visitors + Number(curr.visitors),
      page_views: acc.page_views + Number(curr.page_views),
      demo_views: acc.demo_views + Number(curr.demo_views),
      login_success: acc.login_success + Number(curr.login_success),
      register_success: acc.register_success + Number(curr.register_success),
      invitation_create: acc.invitation_create + Number(curr.invitation_create),
      invitation_publish: acc.invitation_publish + Number(curr.invitation_publish),
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

  // Cari nilai maksimum untuk visualisasi chart
  const maxTrafficVal = Math.max(
    1,
    ...trafficData.map((d) => Math.max(Number(d.visitors), Number(d.page_views), Number(d.demo_views)))
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Banner / Header Overview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#006A71]">
            Ringkasan Platform Aurovia
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Data operasional dan lalu lintas teragregasi secara langsung dari basis data.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/templates"
            className="py-2.5 px-4 bg-[#006A71] hover:bg-[#00575d] text-white text-xs font-semibold rounded-xl transition-all shadow-xs min-h-[44px] flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#006A71]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Kelola Template</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Grid Kartu Statistik Utama (8 Metrik Riil) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pengguna */}
        <div className="bg-white p-5 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-2">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Total Pengguna
          </span>
          {loadingStats ? (
            <div className="h-8 w-16 bg-gray-100 rounded-md animate-pulse" />
          ) : (
            <p className="text-2xl font-serif font-bold text-[#006A71]">
              {stats?.total_users ?? 0}
            </p>
          )}
          <p className="text-[11px] text-gray-400">Akun terdaftar di Aurovia</p>
        </div>

        {/* Total Undangan */}
        <div className="bg-white p-5 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-2">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Total Undangan
          </span>
          {loadingStats ? (
            <div className="h-8 w-16 bg-gray-100 rounded-md animate-pulse" />
          ) : (
            <p className="text-2xl font-serif font-bold text-[#006A71]">
              {stats?.total_invitations ?? 0}
            </p>
          )}
          <p className="text-[11px] text-gray-400">Dibuat oleh pengguna</p>
        </div>

        {/* Total Template */}
        <div className="bg-white p-5 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-2">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Total Template
          </span>
          {loadingStats ? (
            <div className="h-8 w-16 bg-gray-100 rounded-md animate-pulse" />
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-serif font-bold text-[#006A71]">
                {stats?.total_templates ?? 0}
              </span>
              <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {stats?.active_templates ?? 0} Aktif
              </span>
            </div>
          )}
          <p className="text-[11px] text-gray-400">
            {stats?.draft_templates ?? 0} template berstatus draft
          </p>
        </div>

        {/* Total Demo Views */}
        <div className="bg-white p-5 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-2">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Total Demo Views
          </span>
          {loadingStats ? (
            <div className="h-8 w-16 bg-gray-100 rounded-md animate-pulse" />
          ) : (
            <p className="text-2xl font-serif font-bold text-[#48A6A7]">
              {stats?.total_demo_views ?? 0}
            </p>
          )}
          <p className="text-[11px] text-gray-400">Interaksi preview demo template</p>
        </div>

        {/* Total Visitor */}
        <div className="bg-white p-5 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-2">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Total Pengunjung Unik
          </span>
          {loadingStats ? (
            <div className="h-8 w-16 bg-gray-100 rounded-md animate-pulse" />
          ) : (
            <p className="text-2xl font-serif font-bold text-[#006A71]">
              {stats?.total_visitors ?? 0}
            </p>
          )}
          <p className="text-[11px] text-gray-400">Sesi unik tercatat</p>
        </div>

        {/* Total Invitation Views */}
        <div className="bg-white p-5 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-2">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Kunjungan Undangan
          </span>
          {loadingStats ? (
            <div className="h-8 w-16 bg-gray-100 rounded-md animate-pulse" />
          ) : (
            <p className="text-2xl font-serif font-bold text-[#006A71]">
              {stats?.total_invitation_views ?? 0}
            </p>
          )}
          <p className="text-[11px] text-gray-400">Tamu membuka undangan publik</p>
        </div>

        {/* Template Aktif */}
        <div className="bg-white p-5 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-2">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Template Aktif
          </span>
          {loadingStats ? (
            <div className="h-8 w-16 bg-gray-100 rounded-md animate-pulse" />
          ) : (
            <p className="text-2xl font-serif font-bold text-emerald-700">
              {stats?.active_templates ?? 0}
            </p>
          )}
          <p className="text-[11px] text-gray-400">Tampil di katalog publik</p>
        </div>

        {/* Template Draft */}
        <div className="bg-white p-5 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-2">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Template Draft
          </span>
          {loadingStats ? (
            <div className="h-8 w-16 bg-gray-100 rounded-md animate-pulse" />
          ) : (
            <p className="text-2xl font-serif font-bold text-amber-700">
              {stats?.draft_templates ?? 0}
            </p>
          )}
          <p className="text-[11px] text-gray-400">Hanya terlihat oleh admin</p>
        </div>
      </div>

      {/* Bagian Chart Traffic Harian & Filter Periode */}
      <div className="bg-white rounded-2xl border border-[#9ACBD0]/60 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#9ACBD0]/30 pb-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#006A71]">
              Aktivitas Traffic Pengguna
            </h3>
            <p className="text-xs text-gray-500">
              Perkembangan tren pengunjung unik dan tampilan halaman secara berkala.
            </p>
          </div>

          {/* Filter Range: 7 hari, 30 hari, 12 bulan */}
          <div className="inline-flex rounded-xl p-1 bg-[#F2FEF7] border border-[#9ACBD0]/60" role="group">
            <button
              type="button"
              onClick={() => setTimeRange(7)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all min-h-[36px] cursor-pointer ${
                timeRange === 7
                  ? 'bg-[#006A71] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-[#006A71]'
              }`}
            >
              7 Hari
            </button>
            <button
              type="button"
              onClick={() => setTimeRange(30)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all min-h-[36px] cursor-pointer ${
                timeRange === 30
                  ? 'bg-[#006A71] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-[#006A71]'
              }`}
            >
              30 Hari
            </button>
            <button
              type="button"
              onClick={() => setTimeRange(365)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all min-h-[36px] cursor-pointer ${
                timeRange === 365
                  ? 'bg-[#006A71] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-[#006A71]'
              }`}
            >
              12 Bulan
            </button>
          </div>
        </div>

        {/* Visualisasi Grafik Batang / Bar Chart Responsif */}
        {loadingTraffic ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#006A71] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400">Memuat visualisasi traffic...</p>
          </div>
        ) : trafficData.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-[#9ACBD0] rounded-xl">
            <p className="text-sm font-semibold text-gray-600">Belum ada data traffic</p>
            <p className="text-xs text-gray-400 mt-1">
              Data analitik akan muncul secara otomatis saat pengunjung berinteraksi dengan website.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Chart Area */}
            <div className="h-56 flex items-end gap-1 sm:gap-2 pt-6 pb-2 border-b border-gray-100 overflow-x-auto">
              {trafficData.map((d, index) => {
                const visitors = Number(d.visitors);
                const pageViews = Number(d.page_views);
                const demoViews = Number(d.demo_views);

                const visitorHeight = Math.round((visitors / maxTrafficVal) * 100);
                const pageViewsHeight = Math.round((pageViews / maxTrafficVal) * 100);

                // Format label tanggal ringkas
                const dateParts = d.day_date.split('-');
                const label = `${dateParts[2]}/${dateParts[1]}`;

                return (
                  <div
                    key={d.day_date || index}
                    className="flex-1 min-w-[18px] sm:min-w-[28px] h-full flex flex-col justify-end items-center group relative cursor-pointer"
                  >
                    {/* Tooltip Hover */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-gray-900 text-white text-[10px] p-2 rounded-lg shadow-lg z-30 whitespace-nowrap pointer-events-none">
                      <span className="font-semibold text-[#9ACBD0]">{d.day_date}</span>
                      <span>Pengunjung: {visitors}</span>
                      <span>Page Views: {pageViews}</span>
                      <span>Demo Views: {demoViews}</span>
                    </div>

                    {/* Batang Grafis */}
                    <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full">
                      {/* Bar Visitors */}
                      <div
                        style={{ height: `${Math.max(4, visitorHeight)}%` }}
                        className="w-1.5 sm:w-2.5 bg-[#006A71] rounded-t-sm transition-all duration-300 group-hover:bg-[#48A6A7]"
                      />
                      {/* Bar Page Views */}
                      <div
                        style={{ height: `${Math.max(4, pageViewsHeight)}%` }}
                        className="w-1.5 sm:w-2.5 bg-[#9ACBD0] rounded-t-sm transition-all duration-300 group-hover:bg-[#006A71]"
                      />
                    </div>

                    {/* Label Sumbu X */}
                    {(index % (timeRange > 30 ? 30 : timeRange > 7 ? 4 : 1) === 0 ||
                      index === trafficData.length - 1) && (
                      <span className="text-[9px] text-gray-400 mt-2 rotate-0">
                        {label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legenda Chart */}
            <div className="flex items-center justify-center gap-6 pt-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-xs bg-[#006A71]" />
                <span>Pengunjung Unik (Visitors)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-xs bg-[#9ACBD0]" />
                <span>Tampilan Halaman (Page Views)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rincian Breakdown Event Riil */}
      <div className="bg-white rounded-2xl border border-[#9ACBD0]/60 p-6 shadow-2xs space-y-4">
        <h3 className="font-serif text-lg font-bold text-[#006A71]">
          Rincian Konversi Periode Ini
        </h3>
        <p className="text-xs text-gray-500">
          Akumulasi aksi pengguna selama rentang waktu {timeRange} hari terakhir.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-2">
          <div className="p-3 rounded-xl bg-[#F2FEF7] border border-[#9ACBD0]/40">
            <span className="text-[10px] uppercase font-semibold text-gray-500 block">
              Visitor
            </span>
            <p className="text-lg font-bold text-[#006A71] mt-1">
              {trafficBreakdown.visitors}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#F2FEF7] border border-[#9ACBD0]/40">
            <span className="text-[10px] uppercase font-semibold text-gray-500 block">
              Page View
            </span>
            <p className="text-lg font-bold text-[#006A71] mt-1">
              {trafficBreakdown.page_views}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#F2FEF7] border border-[#9ACBD0]/40">
            <span className="text-[10px] uppercase font-semibold text-gray-500 block">
              Demo View
            </span>
            <p className="text-lg font-bold text-[#48A6A7] mt-1">
              {trafficBreakdown.demo_views}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#F2FEF7] border border-[#9ACBD0]/40">
            <span className="text-[10px] uppercase font-semibold text-gray-500 block">
              Login
            </span>
            <p className="text-lg font-bold text-[#006A71] mt-1">
              {trafficBreakdown.login_success}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#F2FEF7] border border-[#9ACBD0]/40">
            <span className="text-[10px] uppercase font-semibold text-gray-500 block">
              Register
            </span>
            <p className="text-lg font-bold text-[#006A71] mt-1">
              {trafficBreakdown.register_success}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#F2FEF7] border border-[#9ACBD0]/40">
            <span className="text-[10px] uppercase font-semibold text-gray-500 block">
              Create Undangan
            </span>
            <p className="text-lg font-bold text-[#006A71] mt-1">
              {trafficBreakdown.invitation_create}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-[#F2FEF7] border border-[#9ACBD0]/40">
            <span className="text-[10px] uppercase font-semibold text-gray-500 block">
              Published
            </span>
            <p className="text-lg font-bold text-emerald-700 mt-1">
              {trafficBreakdown.invitation_publish}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
