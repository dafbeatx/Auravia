import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  listAllPlatformMedia,
  getAdminTemplates,
  uploadDemoMedia,
  uploadTemplatePreviewImage,
  deleteTemplateAsset,
  recordAdminActivity,
  type PlatformMediaItem,
  type TemplateRow,
} from '@/lib/admin';

export function AdminMedia() {
  const [mediaList, setMediaList] = useState<PlatformMediaItem[]>([]);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateFilter, setSelectedTemplateFilter] = useState('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('all');
  const [selectedPreviewMedia, setSelectedPreviewMedia] = useState<PlatformMediaItem | null>(null);

  // Upload state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadTargetTemplate, setUploadTargetTemplate] = useState('');
  const [uploadTargetCategory, setUploadTargetCategory] = useState<'hero' | 'couple' | 'gallery' | 'preview'>('hero');
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [media, tList] = await Promise.all([
        listAllPlatformMedia(),
        getAdminTemplates(),
      ]);
      setMediaList(media);
      setTemplates(tList);
      if (tList.length > 0 && !uploadTargetTemplate && tList[0]) {
        setUploadTargetTemplate(tList[0].id);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal memuat pustaka media.',
      });
    } finally {
      setLoading(false);
    }
  }, [uploadTargetTemplate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered media items
  const filteredMedia = useMemo(() => {
    return mediaList.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.template_name && item.template_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesTemplate =
        selectedTemplateFilter === 'all' || item.template_id === selectedTemplateFilter;

      const matchesType =
        selectedTypeFilter === 'all' ||
        item.type === selectedTypeFilter ||
        (selectedTypeFilter === 'hero' && (item.type === 'hero' || item.type === 'cover'));

      return matchesSearch && matchesTemplate && matchesType;
    });
  }, [mediaList, searchQuery, selectedTemplateFilter, selectedTypeFilter]);

  const handleCopyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setFeedback({
        type: 'success',
        message: 'Tautan URL publik berhasil disalin ke clipboard!',
      });
      setTimeout(() => setFeedback(null), 3000);
    } catch {
      setFeedback({
        type: 'error',
        message: 'Gagal menyalin tautan ke clipboard.',
      });
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi tipe berkas
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFeedback({
        type: 'error',
        message: 'Hanya berkas gambar format JPG, PNG, atau WebP yang diperbolehkan.',
      });
      return;
    }

    // Validasi ukuran berkas (Maks 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      setFeedback({
        type: 'error',
        message: 'Ukuran berkas melebihi batas maksimal 5 MB.',
      });
      return;
    }

    setUploading(true);
    setFeedback(null);

    try {
      if (uploadTargetCategory === 'preview') {
        const res = await uploadTemplatePreviewImage(uploadTargetTemplate, 'desktop', file);
        await recordAdminActivity('media_uploaded', 'template-assets', res.path, {
          template_id: uploadTargetTemplate,
          category: 'preview',
        });
      } else {
        const res = await uploadDemoMedia(uploadTargetTemplate, uploadTargetCategory, file);
        await recordAdminActivity('media_uploaded', 'template-demo-media', res.path, {
          template_id: uploadTargetTemplate,
          category: uploadTargetCategory,
        });
      }

      setFeedback({
        type: 'success',
        message: 'Berkas media berhasil diunggah ke penyimpanan!',
      });
      setUploadModalOpen(false);
      await loadData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal mengunggah berkas gambar.',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteItem = async (item: PlatformMediaItem) => {
    if (!window.confirm(`Yakin ingin menghapus aset "${item.name}"?`)) {
      return;
    }

    try {
      if (item.storage_path) {
        await deleteTemplateAsset(item.storage_path);
      }
      await recordAdminActivity('media_deleted', 'media', item.id, {
        name: item.name,
        url: item.url,
      });

      setMediaList((prev) => prev.filter((m) => m.id !== item.id));
      setFeedback({
        type: 'success',
        message: 'Aset media berhasil dihapus dari daftar.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menghapus aset media.',
      });
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'hero':
      case 'cover':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Hero/Cover</span>;
      case 'couple':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">Mempelai</span>;
      case 'gallery':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">Galeri</span>;
      case 'preview':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Pratinjau</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-50 text-gray-700 border border-gray-200">Lainnya</span>;
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#006A71]">
            Pustaka Media Platform
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Kelola seluruh aset visual, foto demo template, gambar sampul, dan thumbnail di satu tempat terpadu.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setUploadModalOpen(true)}
          className="py-2.5 px-4 bg-[#006A71] hover:bg-[#00575d] text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center gap-2 cursor-pointer min-h-[44px]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Unggah Media Baru</span>
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          <span>{feedback.message}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari media berdasarkan nama atau template..."
              className="w-full pl-9 pr-4 py-2 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[40px]"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Template Filter */}
          <div className="w-full md:w-64">
            <select
              value={selectedTemplateFilter}
              onChange={(e) => setSelectedTemplateFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[40px] cursor-pointer"
            >
              <option value="all">Semua Template</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[#9ACBD0]/30">
          {[
            { id: 'all', label: 'Semua Kategori' },
            { id: 'hero', label: 'Hero & Sampul' },
            { id: 'couple', label: 'Foto Mempelai' },
            { id: 'gallery', label: 'Galeri Foto' },
            { id: 'preview', label: 'Pratinjau Template' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedTypeFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all min-h-[36px] cursor-pointer ${
                selectedTypeFilter === cat.id
                  ? 'bg-[#006A71] text-white shadow-2xs'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-gray-400 font-medium">
            {filteredMedia.length} berkas ditemukan
          </span>
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#006A71] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-gray-400">Memuat berkas media platform...</p>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-3">
          <svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-semibold text-gray-700">Tidak ada berkas media ditemukan</p>
          <p className="text-xs text-gray-400">Coba ubah kata kunci pencarian atau unggah gambar baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-[#9ACBD0]/60 overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col group"
            >
              {/* Media Thumbnail Container */}
              <div className="relative aspect-4/3 bg-gray-100 overflow-hidden">
                <img
                  src={item.url}
                  alt={item.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 left-2">
                  {getTypeBadge(item.type)}
                </div>
              </div>

              {/* Info & Actions */}
              <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <h4 className="text-xs font-bold text-gray-800 truncate" title={item.name}>
                    {item.name}
                  </h4>
                  {item.template_name && (
                    <p className="text-[11px] text-[#006A71] font-medium truncate mt-0.5">
                      {item.template_name}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedPreviewMedia(item)}
                    className="p-1.5 text-gray-600 hover:text-[#006A71] rounded-lg hover:bg-gray-50 text-xs font-semibold flex items-center gap-1 cursor-pointer min-h-[36px]"
                    title="Pratinjau Penuh"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>Lihat</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleCopyUrl(item.url)}
                    className="p-1.5 text-gray-600 hover:text-[#006A71] rounded-lg hover:bg-gray-50 text-xs font-semibold flex items-center gap-1 cursor-pointer min-h-[36px]"
                    title="Salin Tautan Publik"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Salin</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteItem(item)}
                    className="p-1.5 text-red-500 hover:text-red-700 rounded-lg hover:bg-red-50 text-xs font-semibold cursor-pointer min-h-[36px]"
                    title="Hapus Aset"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#9ACBD0]/80 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#9ACBD0]/30 pb-3">
              <h3 className="font-serif text-lg font-bold text-[#006A71]">
                Unggah Berkas Gambar
              </h3>
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">
                  Template Tujuan <span className="text-red-500">*</span>
                </label>
                <select
                  value={uploadTargetTemplate}
                  onChange={(e) => setUploadTargetTemplate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">
                  Kategori Penempatan <span className="text-red-500">*</span>
                </label>
                <select
                  value={uploadTargetCategory}
                  onChange={(e) =>
                    setUploadTargetCategory(e.target.value as 'hero' | 'couple' | 'gallery' | 'preview')
                  }
                  className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                >
                  <option value="hero">Hero / Cover Template</option>
                  <option value="couple">Foto Pasangan Mempelai</option>
                  <option value="gallery">Galeri Foto Acara</option>
                  <option value="preview">Gambar Pratinjau Katalog</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">
                  Pilih Berkas Gambar (JPG, PNG, WebP, Maks 5 MB)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelected}
                  disabled={uploading}
                  className="w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#006A71] file:text-white hover:file:bg-[#00575d] file:cursor-pointer cursor-pointer border border-[#9ACBD0]/60 rounded-xl p-2 bg-[#F2FEF7]/40"
                />
              </div>

              {uploading && (
                <div className="flex items-center gap-2 text-xs text-[#006A71] font-semibold py-2">
                  <div className="w-4 h-4 border-2 border-[#006A71] border-t-transparent rounded-full animate-spin" />
                  <span>Mengunggah dan mengoptimalkan gambar...</span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setUploadModalOpen(false)}
                className="py-2 px-4 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 min-h-[40px] cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Preview Modal */}
      {selectedPreviewMedia && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedPreviewMedia(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <div>
                <h3 className="text-xs font-bold text-gray-800">{selectedPreviewMedia.name}</h3>
                <p className="text-[11px] text-gray-400">{selectedPreviewMedia.template_name || 'Platform Media'}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPreviewMedia(null)}
                className="p-1 text-gray-500 hover:text-gray-800 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="max-h-[70vh] flex items-center justify-center bg-gray-900 rounded-xl overflow-hidden">
              <img
                src={selectedPreviewMedia.url}
                alt={selectedPreviewMedia.name}
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] font-mono text-gray-500 truncate max-w-md">
                {selectedPreviewMedia.url}
              </span>
              <button
                type="button"
                onClick={() => handleCopyUrl(selectedPreviewMedia.url)}
                className="py-2 px-4 bg-[#006A71] hover:bg-[#00575d] text-white rounded-lg text-xs font-semibold transition-all min-h-[36px] cursor-pointer"
              >
                Salin Tautan URL
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
