import { useState, useEffect, useCallback } from 'react';
import {
  getAdminInvitationsList,
  getAdminTemplates,
  type AdminInvitationItem,
  type TemplateRow,
} from '@/lib/admin';

export function AdminInvitations() {
  const [invitations, setInvitations] = useState<AdminInvitationItem[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [templateFilter, setTemplateFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);

  // State modal detail read-only
  const [selectedInvitation, setSelectedInvitation] = useState<AdminInvitationItem | null>(null);

  useEffect(() => {
    let isMounted = true;
    getAdminTemplates()
      .then((res) => {
        if (isMounted) setTemplates(res);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const loadInvitations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminInvitationsList(searchTerm, statusFilter, templateFilter);
      setInvitations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat data undangan.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, templateFilter]);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadInvitations();
    }, 250);

    return () => clearTimeout(handler);
  }, [loadInvitations]);

  // Tutup modal dengan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedInvitation(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/15 text-success border border-success/30">
            Terbit
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-danger/10 text-danger border border-danger/20">
            Arsip
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning/15 text-warning border border-warning/30">
            Draf
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-primary">
            Manajemen Undangan Pengguna
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Daftar seluruh undangan digital yang dibuat oleh pengguna platform Aurovia secara terpusat.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs">
          {error}
        </div>
      )}

      {/* Filter & Bar Pencarian */}
      <div className="bg-surface p-4 rounded-2xl border border-border shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari judul, slug, atau email pemilik..."
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-surface-elevated border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px] cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="draft">Draf</option>
            <option value="published">Terbit (Published)</option>
            <option value="archived">Diarsipkan</option>
          </select>

          {/* Filter Template */}
          <select
            value={templateFilter}
            onChange={(e) => setTemplateFilter(e.target.value)}
            className="px-3 py-2 bg-surface-elevated border border-border rounded-xl text-xs font-semibold text-text-primary focus:outline-none focus:ring-2 focus:ring-primary min-h-[40px] cursor-pointer"
          >
            <option value="all">Semua Template</option>
            {templates.map((t) => (
              <option key={t.id} value={t.slug}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabel Undangan */}
      <div className="bg-surface rounded-2xl border border-border shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-text-muted">Memuat daftar undangan...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-semibold text-text-primary">
              Tidak ada undangan ditemukan
            </p>
            <p className="text-xs text-text-muted">
              Coba sesuaikan kata kunci pencarian atau filter status undangan.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-elevated/60 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Judul &amp; Slug</th>
                  <th className="py-3.5 px-4">Pemilik</th>
                  <th className="py-3.5 px-4">Template</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Dibuat</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-xs">
                {invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface-elevated/40 transition-colors">
                    <td className="py-3.5 px-4 sm:px-6">
                      <p className="font-semibold text-text-primary max-w-xs truncate">
                        {inv.title}
                      </p>
                      <p className="text-[11px] text-text-muted font-mono mt-0.5">
                        /{inv.slug}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-text-primary font-medium">
                        {inv.owner_name || 'Tanpa Nama'}
                      </p>
                      <p className="text-[11px] text-text-muted truncate max-w-[180px]">
                        {inv.owner_email}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-text-primary font-medium">
                        {inv.template_name || inv.template_slug || '-'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="py-3.5 px-4 text-text-muted text-[11px]">
                      {formatDate(inv.created_at)}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedInvitation(inv)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary-soft transition-colors min-h-[36px] cursor-pointer"
                        >
                          Detail
                        </button>
                        {inv.status === 'published' && (
                          <a
                            href={`/i/${inv.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-text-muted hover:text-primary transition-colors min-h-[36px] inline-flex items-center gap-1"
                          >
                            <span>Buka</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detail Read-Only */}
      {selectedInvitation && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">
                  Detail Undangan (Read-Only)
                </span>
                <h3 className="font-serif text-lg font-bold text-primary">
                  {selectedInvitation.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvitation(null)}
                className="p-2 text-text-muted hover:bg-surface-elevated rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                aria-label="Tutup modal detail"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface-elevated">
                <div>
                  <span className="text-[10px] text-text-muted block">Status</span>
                  <div className="mt-1">{getStatusBadge(selectedInvitation.status)}</div>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block">Slug Undangan</span>
                  <span className="font-mono text-text-primary font-semibold mt-1 block truncate">
                    /{selectedInvitation.slug}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated space-y-1">
                <span className="text-[10px] text-text-muted block">Pemilik Akun</span>
                <p className="font-semibold text-text-primary">
                  {selectedInvitation.owner_name || 'Tanpa Nama'}
                </p>
                <p className="text-text-muted font-mono text-[11px]">
                  {selectedInvitation.owner_email}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface-elevated">
                <div>
                  <span className="text-[10px] text-text-muted block">Template</span>
                  <span className="font-semibold text-text-primary mt-0.5 block">
                    {selectedInvitation.template_name || selectedInvitation.template_slug || '-'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block">Tanggal Dibuat</span>
                  <span className="text-text-primary mt-0.5 block">
                    {formatDate(selectedInvitation.created_at)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-surface-elevated">
                <div>
                  <span className="text-[10px] text-text-muted block">Terakhir Diperbarui</span>
                  <span className="text-text-primary mt-0.5 block">
                    {formatDate(selectedInvitation.updated_at)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-text-muted block">Tanggal Terbit</span>
                  <span className="text-text-primary mt-0.5 block">
                    {formatDate(selectedInvitation.published_at)}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-primary-soft text-primary text-[11px] leading-relaxed">
                Mode inspeksi administrator. Mengubah isi undangan pengguna secara sepihak dilarang demi integritas data dan privasi pengguna.
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-border">
              {selectedInvitation.status === 'published' && (
                <a
                  href={`/i/${selectedInvitation.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded-xl text-xs transition-colors min-h-[44px] inline-flex items-center gap-1.5"
                >
                  <span>Buka Halaman Tamu</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
              <button
                type="button"
                onClick={() => setSelectedInvitation(null)}
                className="px-4 py-2 bg-surface-elevated hover:bg-border text-text-primary font-semibold rounded-xl text-xs transition-colors min-h-[44px] cursor-pointer"
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

export default AdminInvitations;
