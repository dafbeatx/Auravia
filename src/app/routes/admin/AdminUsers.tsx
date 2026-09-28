import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  getAdminUsersList,
  setAdminUserStatus,
  deleteAdminUser,
  type AdminUserItem,
} from '@/lib/admin';

export function AdminUsers() {
  const { isSuperAdmin } = useAdminAuth();
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [errorState, setErrorState] = useState<string | null>(null);

  // Modal Detail Pengguna
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);

  // Modal Konfirmasi Aksi (Suspend, Activate, Delete)
  const [actionModal, setActionModal] = useState<{
    type: 'suspend' | 'activate' | 'delete';
    user: AdminUserItem;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setErrorState(null);
      const data = await getAdminUsersList(searchTerm, statusFilter === 'all' ? undefined : statusFilter);
      setUsers(data);
    } catch (err) {
      setErrorState(err instanceof Error ? err.message : 'Gagal memuat pengguna.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadUsers();
    }, 250);

    return () => clearTimeout(handler);
  }, [loadUsers]);

  // Tutup modal dengan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedUser(null);
        setActionModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleConfirmAction = async () => {
    if (!actionModal) return;
    const { type, user } = actionModal;

    try {
      setIsProcessing(true);
      if (type === 'suspend') {
        await setAdminUserStatus(user.id, 'suspended');
        setFeedback({ type: 'success', message: `Pengguna ${user.email} berhasil dinonaktifkan (suspend).` });
      } else if (type === 'activate') {
        await setAdminUserStatus(user.id, 'active');
        setFeedback({ type: 'success', message: `Pengguna ${user.email} berhasil diaktifkan kembali.` });
      } else if (type === 'delete') {
        await deleteAdminUser(user.id);
        setFeedback({ type: 'success', message: `Akun pengguna ${user.email} berhasil dihapus permanen.` });
      }
      setActionModal(null);
      loadUsers();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menjalankan aksi admin.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (isoString?: string | null) => {
    if (!isoString) return '-';
    try {
      return new Date(isoString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-primary">
            Daftar &amp; Manajemen Pengguna
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Data pengguna terdaftar, status akun, jumlah undangan yang dikelola, serta kontrol suspensi akun.
          </p>
        </div>
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

      {errorState && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs">
          {errorState}
        </div>
      )}

      {/* Filter & Bar Pencarian */}
      <div className="bg-surface p-4 rounded-2xl border border-border shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan nama, email, atau ID..."
            className="w-full pl-9 pr-4 py-2 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary placeholder-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px]"
          />
          <svg
            className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {(['all', 'active', 'suspended'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setStatusFilter(r)}
              className={`py-1.5 px-3.5 rounded-lg text-xs font-semibold capitalize transition-all min-h-[36px] cursor-pointer ${
                statusFilter === r
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'text-text-muted hover:bg-surface-elevated'
              }`}
            >
              {r === 'all' ? 'Semua Status' : r === 'active' ? 'Aktif' : 'Suspended'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Daftar Pengguna */}
      <div className="bg-surface rounded-2xl border border-border shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-text-muted">Memuat daftar pengguna...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-xs text-text-muted">
            Tidak ada pengguna ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-elevated/60 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Pengguna</th>
                  <th className="py-3.5 px-4">Status Akun</th>
                  <th className="py-3.5 px-4">Terdaftar</th>
                  <th className="py-3.5 px-4">Aktivitas Terakhir</th>
                  <th className="py-3.5 px-4">Undangan</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {users.map((u) => {
                  const isSuspended = u.status === 'suspended';

                  return (
                    <tr key={u.id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <p className="font-semibold text-text-primary">
                          {u.full_name || 'Tanpa Nama'}
                        </p>
                        <p className="text-[11px] text-text-muted font-mono truncate max-w-xs mt-0.5">
                          {u.email}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        {isSuspended ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-danger/10 text-danger border border-danger/20">
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/15 text-success border border-success/30">
                            Aktif
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-text-muted text-[11px]">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="py-3.5 px-4 text-text-muted text-[11px]">
                        {formatDate(u.last_sign_in_at)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-text-primary">
                          {u.invitation_count}
                        </span>
                        <span className="text-text-muted text-[11px] ml-1">
                          ({u.published_count} terbit)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-right">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedUser(u)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary-soft transition-colors min-h-[36px] cursor-pointer"
                          >
                            Detail
                          </button>

                          {isSuspended ? (
                            <button
                              type="button"
                              onClick={() => setActionModal({ type: 'activate', user: u })}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-success hover:bg-success/10 transition-colors min-h-[36px] cursor-pointer"
                            >
                              Aktifkan
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActionModal({ type: 'suspend', user: u })}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-warning hover:bg-warning/10 transition-colors min-h-[36px] cursor-pointer"
                            >
                              Suspend
                            </button>
                          )}

                          {isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => setActionModal({ type: 'delete', user: u })}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-danger hover:bg-danger/10 transition-colors min-h-[36px] cursor-pointer"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detail Pengguna */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif text-lg font-bold text-primary">
                Detail Profil Pengguna
              </h3>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-1.5 text-text-muted hover:bg-surface-elevated rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-surface-elevated space-y-1">
                <span className="text-[10px] text-text-muted block">Nama Lengkap</span>
                <p className="font-bold text-text-primary text-sm">
                  {selectedUser.full_name || 'Tanpa Nama'}
                </p>
                <p className="text-text-muted font-mono text-[11px]">{selectedUser.email}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface-elevated">
                <div>
                  <span className="text-[10px] text-text-muted block">User ID</span>
                  <span className="font-mono text-text-primary text-[10px] block truncate">
                    {selectedUser.id}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block">Nomor Telepon</span>
                  <span className="text-text-primary font-medium block">
                    {selectedUser.phone || '-'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface-elevated">
                <div>
                  <span className="text-[10px] text-text-muted block">Jumlah Undangan</span>
                  <span className="font-bold text-text-primary block">
                    {selectedUser.invitation_count} ({selectedUser.published_count} terbit)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block">Terdaftar Sejak</span>
                  <span className="text-text-primary block">
                    {formatDate(selectedUser.created_at)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-text-muted leading-relaxed">
                Kata sandi pengguna dienkripsi penuh di backend Supabase Auth dan tidak dapat diakses oleh administrator demi perlindungan privasi.
              </p>
            </div>

            <div className="pt-2 flex justify-end border-t border-border">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-surface-elevated hover:bg-border text-text-primary font-semibold rounded-xl text-xs transition-colors min-h-[44px] cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Tindakan (Destructive Action Confirmation) */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border shadow-xl max-w-sm w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="font-serif text-lg font-bold text-primary">
              Konfirmasi Tindakan
            </h3>

            <p className="text-xs text-text-primary leading-relaxed">
              {actionModal.type === 'suspend' && (
                <>
                  Apakah Anda yakin ingin menangguhkan (suspend) akun <strong>{actionModal.user.email}</strong>? Pengguna tidak akan dapat mengakses dashboard hingga diaktifkan kembali.
                </>
              )}
              {actionModal.type === 'activate' && (
                <>
                  Aktifkan kembali akun <strong>{actionModal.user.email}</strong> agar dapat mengelola undangan dan login?
                </>
              )}
              {actionModal.type === 'delete' && (
                <>
                  Apakah Anda yakin ingin <strong>MENGHAPUS PERMANEN</strong> akun <strong>{actionModal.user.email}</strong>? Tindakan ini tidak dapat dibatalkan.
                </>
              )}
            </p>

            <div className="pt-3 flex justify-end gap-2 border-t border-border">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                disabled={isProcessing}
                className="px-4 py-2 bg-surface-elevated hover:bg-border text-text-primary font-semibold rounded-xl text-xs transition-colors min-h-[44px] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={isProcessing}
                className={`px-5 py-2 font-semibold rounded-xl text-xs text-white transition-colors min-h-[44px] shadow-xs cursor-pointer ${
                  actionModal.type === 'delete' || actionModal.type === 'suspend'
                    ? 'bg-danger hover:bg-red-700'
                    : 'bg-success hover:bg-green-700'
                }`}
              >
                {isProcessing ? 'Memproses...' : 'Ya, Lanjutkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsers;
