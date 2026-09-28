import { useState, useEffect, useCallback } from 'react';
import { getAdminActivityLogs, type AdminActivityLogItem } from '@/lib/admin';

export function AdminActivity() {
  const [logs, setLogs] = useState<AdminActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AdminActivityLogItem | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const PAGE_SIZE = 25;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const data = await getAdminActivityLogs(
        actionFilter === 'all' ? undefined : actionFilter,
        PAGE_SIZE + 1,
        page * PAGE_SIZE
      );

      if (data.length > PAGE_SIZE) {
        setHasMore(true);
        setLogs(data.slice(0, PAGE_SIZE));
      } else {
        setHasMore(false);
        setLogs(data);
      }
    } catch (err: unknown) {
      setFeedback(err instanceof Error ? err.message : 'Gagal memuat log aktivitas.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, page]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleFilterChange = (newFilter: string) => {
    setActionFilter(newFilter);
    setPage(0);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'login':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Login
          </span>
        );
      case 'logout':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            Logout
          </span>
        );
      case 'template_created':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            Buat Template
          </span>
        );
      case 'template_updated':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Update Template
          </span>
        );
      case 'template_deleted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
            Hapus Template
          </span>
        );
      case 'template_duplicated':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Duplikasi Template
          </span>
        );
      case 'template_demo_updated':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
            Update Demo
          </span>
        );
      case 'media_uploaded':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            Upload Media
          </span>
        );
      case 'media_deleted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            Hapus Media
          </span>
        );
      case 'admin_password_changed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">
            Ganti Password
          </span>
        );
      case 'admin_profile_updated':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            Update Profil
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            {action}
          </span>
        );
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      }).format(d);
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-7xl">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#006A71]">
            Log Aktivitas Admin
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Audit trail pencatatan seluruh aktivitas administratif, autentikasi, dan perubahan template pada sistem Aurovia.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadLogs()}
          disabled={loading}
          className="py-2.5 px-4 bg-white border border-[#9ACBD0] hover:bg-[#F2FEF7] text-gray-700 rounded-xl text-xs font-semibold transition-all min-h-[44px] flex items-center gap-2 cursor-pointer shadow-2xs"
        >
          <svg
            className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <span>Refresh Data</span>
        </button>
      </div>

      {feedback && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor="action-filter" className="text-xs font-semibold text-gray-700">
            Filter Tipe Aksi:
          </label>
          <select
            id="action-filter"
            value={actionFilter}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="px-3 py-2 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
          >
            <option value="all">Semua Aktivitas</option>
            <option value="login">Login Admin</option>
            <option value="logout">Logout Admin</option>
            <option value="template_created">Buat Template</option>
            <option value="template_updated">Update Template</option>
            <option value="template_deleted">Hapus Template</option>
            <option value="template_duplicated">Duplikasi Template</option>
            <option value="template_demo_updated">Update Konten Demo</option>
            <option value="media_uploaded">Upload Media</option>
            <option value="media_deleted">Hapus Media</option>
            <option value="admin_password_changed">Ganti Password</option>
            <option value="admin_profile_updated">Ubah Profil Admin</option>
          </select>
        </div>

        <div className="text-xs text-gray-500">
          Halaman {page + 1}
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-[#9ACBD0]/60 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#006A71] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400">Memuat riwayat log aktivitas...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700">Belum ada catatan aktivitas</p>
            <p className="text-xs text-gray-400">Setiap perubahan administratif akan otomatis tercatat di sini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F2FEF7] border-b border-[#9ACBD0]/40 text-gray-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Admin</th>
                  <th className="py-3 px-4">Aksi</th>
                  <th className="py-3 px-4">Target Tipe</th>
                  <th className="py-3 px-4">Target ID</th>
                  <th className="py-3 px-4 text-right">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                      {formatTimestamp(log.created_at)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-gray-800">
                      {log.admin_username}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                      {log.target_type || '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-gray-500 font-mono text-[11px]">
                      {log.target_id ? log.target_id.slice(0, 12) + (log.target_id.length > 12 ? '...' : '') : '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="text-[#006A71] hover:underline font-semibold text-[11px] p-1 cursor-pointer min-h-[36px] inline-flex items-center"
                      >
                        Lihat Metadata
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 bg-gray-50 border-t border-[#9ACBD0]/40 flex items-center justify-between">
          <button
            type="button"
            disabled={page === 0 || loading}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="py-2 px-3.5 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 disabled:opacity-40 hover:bg-gray-100 transition-all min-h-[44px] cursor-pointer"
          >
            ← Sebelumnya
          </button>
          <span className="text-xs text-gray-500">
            Halaman {page + 1}
          </span>
          <button
            type="button"
            disabled={!hasMore || loading}
            onClick={() => setPage((p) => p + 1)}
            className="py-2 px-3.5 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 disabled:opacity-40 hover:bg-gray-100 transition-all min-h-[44px] cursor-pointer"
          >
            Selanjutnya →
          </button>
        </div>
      </div>

      {/* Metadata Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-serif text-base font-bold text-[#006A71]">
                Detail Log Aktivitas
              </h3>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-gray-50">
                <span className="font-semibold text-gray-500">ID Aktivitas:</span>
                <span className="col-span-2 font-mono text-[11px] text-gray-700">{selectedLog.id}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-gray-50">
                <span className="font-semibold text-gray-500">Waktu:</span>
                <span className="col-span-2 text-gray-700">{formatTimestamp(selectedLog.created_at)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-gray-50">
                <span className="font-semibold text-gray-500">Admin:</span>
                <span className="col-span-2 font-medium text-gray-800">{selectedLog.admin_username}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-gray-50">
                <span className="font-semibold text-gray-500">Aksi:</span>
                <span className="col-span-2">{getActionBadge(selectedLog.action)}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 py-1 border-b border-gray-50">
                <span className="font-semibold text-gray-500">Target:</span>
                <span className="col-span-2 text-gray-700">
                  {selectedLog.target_type || '-'} {selectedLog.target_id ? `(${selectedLog.target_id})` : ''}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-gray-600 block">Metadata JSON:</span>
              <pre className="bg-[#F2FEF7]/70 border border-[#9ACBD0]/40 p-3 rounded-xl text-[11px] font-mono text-gray-800 overflow-x-auto max-h-48">
                {JSON.stringify(selectedLog.metadata || {}, null, 2)}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="py-2 px-5 bg-[#006A71] hover:bg-[#00575d] text-white rounded-xl text-xs font-semibold transition-all min-h-[44px] cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
