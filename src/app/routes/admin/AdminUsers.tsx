import { useState, useEffect } from 'react';
import { getAdminUsersList, type AdminUserItem } from '@/lib/admin';

export function AdminUsers() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const handler = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await getAdminUsersList(searchTerm, roleFilter);
        if (isMounted) {
          setUsers(data);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Gagal memuat pengguna.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(handler);
    };
  }, [searchTerm, roleFilter]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#006A71]">
            Daftar &amp; Manajemen Pengguna
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Data pengguna terdaftar, status role otoritas, serta jumlah undangan yang dikelola.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* Filter & Bar Pencarian */}
      <div className="bg-white p-4 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama atau email..."
            className="w-full pl-9 pr-4 py-2 bg-[#F2FEF7] border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[40px]"
          />
          <svg
            className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['all', 'admin', 'user'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all min-h-[36px] cursor-pointer ${
                roleFilter === r
                  ? 'bg-[#006A71] text-white shadow-2xs'
                  : 'text-gray-600 hover:bg-[#F2FEF7]'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Daftar Pengguna */}
      <div className="bg-white rounded-2xl border border-[#9ACBD0]/60 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#006A71] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400">Memuat daftar pengguna...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-gray-600">Tidak ada pengguna ditemukan</p>
            <p className="text-xs text-gray-400">
              Coba gunakan kata kunci pencarian yang berbeda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F2FEF7] border-b border-[#9ACBD0]/40 text-gray-600 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Pengguna</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Terdaftar</th>
                  <th className="py-3.5 px-4">Aktivitas Terakhir</th>
                  <th className="py-3.5 px-4">Total Undangan</th>
                  <th className="py-3.5 px-4">Dipublikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60 transition-colors">
                    {/* Nama & Email */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#48A6A7]/20 text-[#006A71] flex items-center justify-center font-bold text-xs">
                          {u.full_name ? u.full_name[0] : u.email[0]}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 block">
                            {u.full_name}
                          </span>
                          <span className="text-[11px] text-gray-500 font-mono">
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-[#006A71]/10 text-[#006A71]'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>

                    {/* Created At */}
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(u.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Last Sign In */}
                    <td className="py-3 px-4 text-gray-500">
                      {u.last_sign_in_at
                        ? new Date(u.last_sign_in_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Belum login'}
                    </td>

                    {/* Undangan */}
                    <td className="py-3 px-4 font-semibold text-gray-700">
                      {u.invitation_count}
                    </td>

                    {/* Published */}
                    <td className="py-3 px-4 font-semibold text-emerald-700">
                      {u.published_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
