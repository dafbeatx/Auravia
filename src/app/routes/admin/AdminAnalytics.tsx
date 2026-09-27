import { useState, useEffect } from 'react';
import {
  getAdminTrafficStats,
  getAdminTemplatePerformance,
  type TrafficStatItem,
  type TemplatePerformanceItem,
} from '@/lib/admin';

export function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState<7 | 30 | 90 | 365>(30);
  const [trafficData, setTrafficData] = useState<TrafficStatItem[]>([]);
  const [templatePerf, setTemplatePerf] = useState<TemplatePerformanceItem[]>([]);
  const [sortBy, setSortBy] = useState<'demo_views' | 'unique_visitors' | 'published_usage'>('demo_views');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      getAdminTrafficStats(timeRange),
      getAdminTemplatePerformance().catch(() => []),
    ])
      .then(([traffic, templates]) => {
        if (!isMounted) return;
        setTrafficData(traffic);
        setTemplatePerf(templates);
      })
      .catch(() => {
        if (!isMounted) return;
        setTrafficData([]);
        setTemplatePerf([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [timeRange]);

  // Akumulasi metric
  const totals = trafficData.reduce(
    (acc, curr) => ({
      visitors: acc.visitors + Number(curr.visitors),
      page_views: acc.page_views + Number(curr.page_views),
      demo_views: acc.demo_views + Number(curr.demo_views),
      login_success: acc.login_success + Number(curr.login_success),
      register_success: acc.register_success + Number(curr.register_success),
    }),
    {
      visitors: 0,
      page_views: 0,
      demo_views: 0,
      login_success: 0,
      register_success: 0,
    }
  );

  // Sorting tabel template performance
  const sortedTemplates = [...templatePerf].sort((a, b) => {
    const valA = Number(a[sortBy]);
    const valB = Number(b[sortBy]);
    return sortOrder === 'desc' ? valB - valA : valA - valB;
  });

  const toggleSort = (field: 'demo_views' | 'unique_visitors' | 'published_usage') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const maxVal = Math.max(1, ...trafficData.map((d) => Math.max(Number(d.visitors), Number(d.page_views))));

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Filter Periode */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#006A71]">
            Lalu Lintas &amp; Performa Analitik
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Data real-time interaksi anonim dan pengguna terdaftar tanpa menyimpan PII.
          </p>
        </div>

        {/* Filter Periode */}
        <div className="inline-flex rounded-xl p-1 bg-white border border-[#9ACBD0]/60 shadow-2xs" role="group">
          {([7, 30, 90, 365] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setTimeRange(r)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all min-h-[36px] cursor-pointer ${
                timeRange === r
                  ? 'bg-[#006A71] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-[#006A71]'
              }`}
            >
              {r === 365 ? '12 Bulan' : `${r} Hari`}
            </button>
          ))}
        </div>
      </div>

      {/* 5 Kartu Metrik Utama */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Visitor */}
        <div className="bg-white p-5 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-1">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">
            Total Visitor
          </span>
          <p className="text-2xl font-serif font-bold text-[#006A71]">
            {totals.visitors}
          </p>
          <p className="text-[10px] text-gray-400">Pengunjung unik ({timeRange} hari)</p>
        </div>

        {/* Total Page View */}
        <div className="bg-white p-5 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-1">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">
            Total Page View
          </span>
          <p className="text-2xl font-serif font-bold text-[#006A71]">
            {totals.page_views}
          </p>
          <p className="text-[10px] text-gray-400">Total muatan halaman</p>
        </div>

        {/* Total Demo View */}
        <div className="bg-white p-5 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-1">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">
            Total Demo View
          </span>
          <p className="text-2xl font-serif font-bold text-[#48A6A7]">
            {totals.demo_views}
          </p>
          <p className="text-[10px] text-gray-400">Akses demo template</p>
        </div>

        {/* Total Login */}
        <div className="bg-white p-5 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-1">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">
            Total Login
          </span>
          <p className="text-2xl font-serif font-bold text-[#006A71]">
            {totals.login_success}
          </p>
          <p className="text-[10px] text-gray-400">Sesi otentikasi sukses</p>
        </div>

        {/* Total Register */}
        <div className="bg-white p-5 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-1">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider block">
            Total Register
          </span>
          <p className="text-2xl font-serif font-bold text-emerald-700">
            {totals.register_success}
          </p>
          <p className="text-[10px] text-gray-400">Akun baru mendaftar</p>
        </div>
      </div>

      {/* Chart Visualisasi Harian */}
      <div className="bg-white rounded-2xl border border-[#9ACBD0]/60 p-6 shadow-2xs space-y-6">
        <h3 className="font-serif text-lg font-bold text-[#006A71]">
          Tren Traffic Harian ({timeRange} Hari Terakhir)
        </h3>

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#006A71] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400">Menghitung matriks lalu lintas...</p>
          </div>
        ) : trafficData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-xs text-gray-400 border border-dashed border-[#9ACBD0] rounded-xl">
            Tidak ada riwayat aktivitas dalam rentang waktu ini.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="h-56 flex items-end gap-1 sm:gap-2 pt-6 pb-2 border-b border-gray-100 overflow-x-auto">
              {trafficData.map((d, index) => {
                const visitors = Number(d.visitors);
                const pageViews = Number(d.page_views);

                const visitorH = Math.round((visitors / maxVal) * 100);
                const pvH = Math.round((pageViews / maxVal) * 100);

                const dateParts = d.day_date.split('-');
                const label = `${dateParts[2]}/${dateParts[1]}`;

                return (
                  <div
                    key={d.day_date || index}
                    className="flex-1 min-w-[18px] sm:min-w-[26px] h-full flex flex-col justify-end items-center group relative cursor-pointer"
                  >
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-gray-900 text-white text-[10px] p-2 rounded-lg shadow-lg z-30 whitespace-nowrap pointer-events-none">
                      <span className="font-semibold text-[#9ACBD0]">{d.day_date}</span>
                      <span>Visitor: {visitors}</span>
                      <span>Page View: {pageViews}</span>
                    </div>

                    <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-full">
                      <div
                        style={{ height: `${Math.max(4, visitorH)}%` }}
                        className="w-1.5 sm:w-2 bg-[#006A71] rounded-t-sm transition-all duration-300 group-hover:bg-[#48A6A7]"
                      />
                      <div
                        style={{ height: `${Math.max(4, pvH)}%` }}
                        className="w-1.5 sm:w-2 bg-[#9ACBD0] rounded-t-sm transition-all duration-300 group-hover:bg-[#006A71]"
                      />
                    </div>

                    {(index % (timeRange > 30 ? 30 : timeRange > 7 ? 4 : 1) === 0 ||
                      index === trafficData.length - 1) && (
                      <span className="text-[9px] text-gray-400 mt-2">
                        {label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 pt-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-xs bg-[#006A71]" />
                <span>Pengunjung Unik</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-xs bg-[#9ACBD0]" />
                <span>Page Views</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabel Template Performance */}
      <div className="bg-white rounded-2xl border border-[#9ACBD0]/60 shadow-2xs overflow-hidden space-y-4 p-6">
        <div>
          <h3 className="font-serif text-lg font-bold text-[#006A71]">
            Performa Katalog Template
          </h3>
          <p className="text-xs text-gray-500">
            Ditinjau berdasarkan popularitas demo dan frekuensi publikasi undangan.
          </p>
        </div>

        <div className="overflow-x-auto border border-gray-100 rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F2FEF7] border-b border-[#9ACBD0]/40 text-gray-600 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Template</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Status</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-[#006A71]"
                  onClick={() => toggleSort('demo_views')}
                >
                  <div className="flex items-center gap-1">
                    <span>Demo Views</span>
                    {sortBy === 'demo_views' && <span>{sortOrder === 'desc' ? '↓' : '↑'}</span>}
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-[#006A71]"
                  onClick={() => toggleSort('unique_visitors')}
                >
                  <div className="flex items-center gap-1">
                    <span>Unique Visitors</span>
                    {sortBy === 'unique_visitors' && <span>{sortOrder === 'desc' ? '↓' : '↑'}</span>}
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-[#006A71]"
                  onClick={() => toggleSort('published_usage')}
                >
                  <div className="flex items-center gap-1">
                    <span>Published Usage</span>
                    {sortBy === 'published_usage' && <span>{sortOrder === 'desc' ? '↓' : '↑'}</span>}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedTemplates.map((t) => (
                <tr key={t.template_id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-gray-900">
                    {t.name}
                    <span className="block font-mono text-[10px] text-gray-400 font-normal">
                      {t.slug}
                    </span>
                  </td>
                  <td className="py-3 px-4 capitalize text-gray-700">
                    {t.category}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                        t.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {t.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#006A71]">
                    {t.demo_views}
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {t.unique_visitors}
                  </td>
                  <td className="py-3 px-4 font-medium text-emerald-700">
                    {t.published_usage} undangan
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
