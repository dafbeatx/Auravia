import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import {
  listAdminAccounts,
  createAdminAccount,
  updateAdminAccount,
  resetAdminPassword,
  type AdminAccountItem,
} from '@/lib/adminAuth';

export function AdminAccounts() {
  const { admin, isSuperAdmin } = useAdminAuth();
  const [accounts, setAccounts] = useState<AdminAccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal Tambah Admin
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'super_admin' | 'admin'>('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal Edit Admin
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AdminAccountItem | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState<'super_admin' | 'admin'>('admin');
  const [editIsActive, setEditIsActive] = useState(true);

  // Modal Reset Password
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resettingAccount, setResettingAccount] = useState<AdminAccountItem | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listAdminAccounts();
      setAccounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat akun admin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      loadAccounts();
    }
  }, [isSuperAdmin]);

  // Tutup modal dengan Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCreateModalOpen(false);
        setEditModalOpen(false);
        setResetModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword) {
      setError('Username dan password wajib diisi.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await createAdminAccount(newUsername.trim(), newPassword, newRole);
      setSuccessMsg(`Akun administrator "${newUsername.trim()}" berhasil dibuat.`);
      setCreateModalOpen(false);
      setNewUsername('');
      setNewPassword('');
      loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat akun admin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await updateAdminAccount(
        editingAccount.id,
        editUsername.trim(),
        editRole,
        editIsActive
      );
      setSuccessMsg(`Akun "${editUsername.trim()}" berhasil diperbarui.`);
      setEditModalOpen(false);
      setEditingAccount(null);
      loadAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui akun admin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingAccount) return;
    if (resetNewPassword.length < 8) {
      setError('Password baru minimal 8 karakter.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await resetAdminPassword(resettingAccount.id, resetNewPassword);
      setSuccessMsg(`Password akun "${resettingAccount.username}" berhasil direset secara aman.`);
      setResetModalOpen(false);
      setResettingAccount(null);
      setResetNewPassword('');
      setResetConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mereset kata sandi admin.');
    } finally {
      setIsSubmitting(false);
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

  if (!isSuperAdmin) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-warning/15 text-warning flex items-center justify-center border border-warning/30">
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="font-serif text-2xl font-bold text-primary">
          Akses Khusus Super Admin
        </h2>
        <p className="text-xs text-text-muted leading-relaxed">
          Manajemen akun administrator hanya dapat diakses oleh akun dengan peran Super Admin. Silakan hubungi Super Admin untuk penyesuaian hak akses.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-primary">
            Manajemen Akun Administrator
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Kelola akun otorisasi, status aktif, penetapan peran (super_admin atau admin), dan reset kredensial.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setSuccessMsg(null);
            setCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold shadow-xs min-h-[44px] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Tambah Admin Baru</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-success/10 border border-success/30 text-success text-xs">
          {successMsg}
        </div>
      )}

      {/* Tabel Akun Administrator */}
      <div className="bg-surface rounded-2xl border border-border shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-text-muted">Memuat akun administrator...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-12 text-center text-xs text-text-muted">
            Belum ada akun administrator terdaftar.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-elevated/60 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Username</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Dibuat</th>
                  <th className="py-3.5 px-4">Login Terakhir</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-primary">
                          {acc.username}
                        </span>
                        {acc.id === admin?.id && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-soft text-primary font-bold">
                            Anda
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        acc.role === 'super_admin'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/15 text-primary border border-secondary/30'
                      }`}>
                        {acc.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {acc.is_active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/15 text-success border border-success/30">
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-danger/10 text-danger border border-danger/20">
                          Nonaktif
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-text-muted text-[11px]">
                      {formatDate(acc.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-text-muted text-[11px]">
                      {formatDate(acc.last_login_at)}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAccount(acc);
                            setEditUsername(acc.username);
                            setEditRole(acc.role);
                            setEditIsActive(acc.is_active);
                            setEditModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary-soft transition-colors min-h-[36px] cursor-pointer"
                        >
                          Ubah
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setResettingAccount(acc);
                            setResetNewPassword('');
                            setResetConfirmPassword('');
                            setResetModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-text-muted hover:text-primary transition-colors min-h-[36px] cursor-pointer"
                        >
                          Reset Sandi
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah Admin Baru */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif text-lg font-bold text-primary">
                Buat Akun Administrator Baru
              </h3>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 text-text-muted hover:bg-surface-elevated rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="admin_baru"
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Kata Sandi (Minimal 8 Karakter)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Kombinasi kata sandi kuat"
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Peran (Role)
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'super_admin' | 'admin')}
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px] cursor-pointer"
                >
                  <option value="admin">Admin (Kelola Konten &amp; Lalu Lintas)</option>
                  <option value="super_admin">Super Admin (Akses Penuh Termasuk Kelola Akun)</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 bg-surface-elevated hover:bg-border text-text-primary font-semibold rounded-xl text-xs transition-colors min-h-[44px] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-xl text-xs transition-colors min-h-[44px] shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Akun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Admin */}
      {editModalOpen && editingAccount && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif text-lg font-bold text-primary">
                Perbarui Akun Administrator
              </h3>
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="p-1.5 text-text-muted hover:bg-surface-elevated rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Peran (Role)
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as 'super_admin' | 'admin')}
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px] cursor-pointer"
                >
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  id="admin-status-toggle"
                  type="checkbox"
                  checked={editIsActive}
                  disabled={editingAccount.id === admin?.id}
                  onChange={(e) => setEditIsActive(e.target.checked)}
                  className="w-4 h-4 text-primary rounded border-border focus:ring-primary cursor-pointer"
                />
                <label htmlFor="admin-status-toggle" className="text-xs font-semibold text-text-primary cursor-pointer">
                  Akun aktif dan diizinkan login
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 bg-surface-elevated hover:bg-border text-text-primary font-semibold rounded-xl text-xs transition-colors min-h-[44px] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-xl text-xs transition-colors min-h-[44px] shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Memperbarui...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {resetModalOpen && resettingAccount && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border shadow-xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-primary">
                  Reset Kata Sandi Akun
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Akun: <strong>{resettingAccount.username}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="p-1.5 text-text-muted hover:bg-surface-elevated rounded-lg min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Kata Sandi Baru (Minimal 8 Karakter)
                </label>
                <input
                  type="password"
                  required
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="Masukkan kata sandi baru"
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-primary mb-1">
                  Ulangi Kata Sandi Baru
                </label>
                <input
                  type="password"
                  required
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  className="w-full px-3.5 py-2.5 bg-surface-elevated border border-border rounded-xl text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px]"
                />
              </div>

              <p className="text-[11px] text-text-muted leading-relaxed">
                Kata sandi akan disimpan dalam bentuk hash terenkripsi bcrypt dan seluruh sesi login akun ini akan otomatis diakhiri.
              </p>

              <div className="pt-3 flex justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setResetModalOpen(false)}
                  className="px-4 py-2 bg-surface-elevated hover:bg-border text-text-primary font-semibold rounded-xl text-xs transition-colors min-h-[44px] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-danger hover:bg-red-700 text-white font-semibold rounded-xl text-xs transition-colors min-h-[44px] shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Mereset...' : 'Reset Sandi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAccounts;
