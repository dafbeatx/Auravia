import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getAdminTemplates,
  getAdminTemplatePerformance,
  updateAdminTemplate,
  deleteAdminTemplate,
  duplicateAdminTemplate,
  getTemplateAssetPublicUrl,
  type TemplateRow,
  type TemplatePerformanceItem,
} from '@/lib/admin';

export function AdminTemplates() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [perfMap, setPerfMap] = useState<Record<string, TemplatePerformanceItem>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'draft' | 'archived'>('all');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  // State untuk modal konfirmasi penghapusan
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<TemplateRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tmplList, perfList] = await Promise.all([
        getAdminTemplates(),
        getAdminTemplatePerformance().catch(() => []),
      ]);

      setTemplates(tmplList);

      const pMap: Record<string, TemplatePerformanceItem> = {};
      perfList.forEach((p) => {
        pMap[p.template_id] = p;
      });
      setPerfMap(pMap);
      setFeedback(null);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal memuat template.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter templates
  const filteredTemplates = templates.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Toggle Status Aktif / Nonaktif
  const handleToggleStatus = async (tmpl: TemplateRow) => {
    const nextStatus = tmpl.status === 'active' ? 'draft' : 'active';
    const nextIsActive = nextStatus === 'active';

    try {
      await updateAdminTemplate(tmpl.id, {
        status: nextStatus,
        is_active: nextIsActive,
      });

      setTemplates((prev) =>
        prev.map((item) =>
          item.id === tmpl.id
            ? { ...item, status: nextStatus, is_active: nextIsActive }
            : item
        )
      );

      setFeedback({
        type: 'success',
        message: `Status template "${tmpl.name}" berhasil diubah menjadi ${nextStatus.toUpperCase()}.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal mengubah status template.',
      });
    }
  };

  // Duplikasi template beserta demo datanya
  const handleDuplicate = async (tmpl: TemplateRow) => {
    setDuplicatingId(tmpl.id);
    try {
      await duplicateAdminTemplate(tmpl.id);
      setFeedback({
        type: 'success',
        message: `Template "${tmpl.name}" berhasil diduplikasi menjadi salinan draft baru!`,
      });
      await loadData();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menduplikasi template.',
      });
    } finally {
      setDuplicatingId(null);
    }
  };

  // Konfirmasi dan proses hapus template
  const confirmDelete = async () => {
    if (!templateToDelete) return;

    try {
      setDeleting(true);
      await deleteAdminTemplate(templateToDelete.id);

      setTemplates((prev) => prev.filter((item) => item.id !== templateToDelete.id));
      setFeedback({
        type: 'success',
        message: `Template "${templateToDelete.name}" berhasil dihapus.`,
      });
      setDeleteModalOpen(false);
      setTemplateToDelete(null);
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menghapus template.',
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            ACTIVE
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            DRAFT
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
            ARCHIVED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-50 text-gray-600">
            {status.toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#006A71]">
            Katalog &amp; Manajemen Template
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Kelola template, atur status publikasi, dan perbarui aset visual preview langsung dari database.
          </p>
        </div>

        <div>
          <Link
            to="/admin/templates/new"
            className="py-2.5 px-4 bg-[#006A71] hover:bg-[#00575d] text-white text-xs font-semibold rounded-xl transition-all shadow-xs min-h-[44px] flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#006A71]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Tambah Template Baru</span>
          </Link>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-gray-600 font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bar Pencarian & Filter Status */}
      <div className="bg-white p-4 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama, slug, atau kategori..."
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

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['all', 'active', 'draft', 'archived'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all min-h-[36px] cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#006A71] text-white shadow-2xs'
                  : 'text-gray-600 hover:bg-[#F2FEF7]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel & Daftar Template */}
      <div className="bg-white rounded-2xl border border-[#9ACBD0]/60 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-2 border-[#006A71] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400">Memuat katalog template...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-gray-600">Tidak ada template yang cocok</p>
            <p className="text-xs text-gray-400">
              Coba sesuaikan kata kunci pencarian atau filter status yang dipilih.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F2FEF7] border-b border-[#9ACBD0]/40 text-gray-600 uppercase tracking-wider font-semibold text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Template</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Demo Views</th>
                  <th className="py-3.5 px-4">Diperbarui</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTemplates.map((t) => {
                  const demoCount = perfMap[t.id]?.demo_views ?? 0;
                  const thumbUrl = t.preview_thumbnail_path
                    ? getTemplateAssetPublicUrl(t.preview_thumbnail_path)
                    : t.preview_mobile_path
                    ? getTemplateAssetPublicUrl(t.preview_mobile_path)
                    : t.thumbnail_url;

                  return (
                    <tr key={t.id} className="hover:bg-gray-50/60 transition-colors">
                      {/* Thumbnail & Nama */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-14 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {thumbUrl ? (
                              <img
                                src={thumbUrl}
                                alt={t.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-[10px] font-mono text-gray-400">Preview</span>
                            )}
                          </div>
                          <div>
                            <span className="font-semibold text-gray-900 block">
                              {t.name}
                            </span>
                            {t.is_featured && (
                              <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-[#48A6A7]/10 text-[#006A71] text-[9px] font-bold rounded">
                                FEATURED
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-500">
                        {t.slug}
                      </td>

                      {/* Kategori */}
                      <td className="py-3 px-4 capitalize text-gray-700">
                        {t.category}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        {getStatusBadge(t.status)}
                      </td>

                      {/* Demo Views */}
                      <td className="py-3 px-4 font-semibold text-gray-800">
                        {demoCount}
                      </td>

                      {/* Updated At */}
                      <td className="py-3 px-4 text-gray-400 text-[11px]">
                        {new Date(t.updated_at || t.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Tombol Aksi */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Tombol Preview Demo */}
                          <Link
                            to={`/templates/${t.slug}/demo`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-500 hover:text-[#006A71] hover:bg-[#F2FEF7] rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="Buka Demo"
                            aria-label={`Preview demo ${t.name}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>

                          {/* Tombol Edit */}
                          <Link
                            to={`/admin/templates/${t.id}`}
                            className="p-2 text-[#006A71] hover:bg-[#006A71]/10 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center font-medium"
                            title="Edit Template"
                            aria-label={`Edit ${t.name}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>

                          {/* Tombol Duplikasi */}
                          <button
                            type="button"
                            disabled={duplicatingId === t.id}
                            onClick={() => handleDuplicate(t)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer disabled:opacity-40"
                            title="Duplikasi Template & Demo"
                            aria-label={`Duplikasi ${t.name}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>

                          {/* Tombol Toggle Status */}
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(t)}
                            className="px-2.5 py-1 text-[11px] font-semibold border rounded-lg transition-all min-h-[36px] cursor-pointer hover:bg-gray-50"
                            title={t.status === 'active' ? 'Ubah ke Draft' : 'Aktifkan Template'}
                          >
                            {t.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>

                          {/* Tombol Hapus */}
                          <button
                            type="button"
                            onClick={() => {
                              setTemplateToDelete(t);
                              setDeleteModalOpen(true);
                            }}
                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                            title="Hapus Template"
                            aria-label={`Hapus ${t.name}`}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
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

      {/* Confirmation Modal untuk Hapus Template */}
      {deleteModalOpen && templateToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-gray-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Konfirmasi Penghapusan Template
                </h3>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus template{' '}
              <strong className="text-gray-900">{templateToDelete.name}</strong> ({templateToDelete.slug})?
              Jika template ini sedang digunakan oleh undangan aktif, sistem akan menolak penghapusan.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  setDeleteModalOpen(false);
                  setTemplateToDelete(null);
                }}
                className="py-2 px-4 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-all min-h-[44px] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs min-h-[44px] flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus Template'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
