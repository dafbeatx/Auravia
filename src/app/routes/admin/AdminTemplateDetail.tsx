import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getAdminTemplateById,
  createAdminTemplate,
  updateAdminTemplate,
  uploadTemplatePreviewImage,
  deleteTemplateAsset,
  getTemplateAssetPublicUrl,
} from '@/lib/admin';

export function AdminTemplateDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'mobile' | 'desktop' | 'thumbnail' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    category: 'wedding',
    description: '',
    status: 'draft' as 'draft' | 'active' | 'archived',
    is_featured: false,
    display_order: 0,
    thumbnail_url: '',
    preview_mobile_path: '' as string | null,
    preview_desktop_path: '' as string | null,
    preview_thumbnail_path: '' as string | null,
  });

  useEffect(() => {
    if (isNew || !id) return;

    let isMounted = true;
    setLoading(true);

    getAdminTemplateById(id)
      .then((tmpl) => {
        if (!isMounted) return;
        if (!tmpl) {
          setFeedback({ type: 'error', message: 'Template tidak ditemukan.' });
          return;
        }
        setFormData({
          name: tmpl.name,
          slug: tmpl.slug,
          category: tmpl.category,
          description: tmpl.description,
          status: tmpl.status,
          is_featured: tmpl.is_featured,
          display_order: tmpl.display_order,
          thumbnail_url: tmpl.thumbnail_url,
          preview_mobile_path: tmpl.preview_mobile_path,
          preview_desktop_path: tmpl.preview_desktop_path,
          preview_thumbnail_path: tmpl.preview_thumbnail_path,
        });
      })
      .catch((err) => {
        if (isMounted) {
          setFeedback({
            type: 'error',
            message: err instanceof Error ? err.message : 'Gagal memuat template.',
          });
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, isNew]);

  // Handle Save / Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    // Validasi format slug: huruf kecil, angka, tanda strip
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!slugRegex.test(formData.slug)) {
      setFeedback({
        type: 'error',
        message: 'Format slug tidak valid. Hanya boleh berisi huruf kecil, angka, dan strip (contoh: royal-gold).',
      });
      setSaving(false);
      return;
    }

    try {
      if (isNew) {
        const created = await createAdminTemplate({
          name: formData.name,
          slug: formData.slug,
          category: formData.category,
          description: formData.description,
          status: formData.status,
          is_active: formData.status === 'active',
          is_featured: formData.is_featured,
          display_order: Number(formData.display_order),
          thumbnail_url: formData.thumbnail_url || `/templates/${formData.slug}/thumbnail.webp`,
          preview_mobile_path: formData.preview_mobile_path,
          preview_desktop_path: formData.preview_desktop_path,
          preview_thumbnail_path: formData.preview_thumbnail_path,
          default_theme: {},
          default_sections: [],
        });

        setFeedback({ type: 'success', message: 'Template baru berhasil dibuat!' });
        setTimeout(() => {
          navigate(`/admin/templates/${created.id}`);
        }, 800);
      } else if (id) {
        await updateAdminTemplate(id, {
          name: formData.name,
          slug: formData.slug,
          category: formData.category,
          description: formData.description,
          status: formData.status,
          is_active: formData.status === 'active',
          is_featured: formData.is_featured,
          display_order: Number(formData.display_order),
          thumbnail_url: formData.thumbnail_url,
          preview_mobile_path: formData.preview_mobile_path,
          preview_desktop_path: formData.preview_desktop_path,
          preview_thumbnail_path: formData.preview_thumbnail_path,
        });

        setFeedback({ type: 'success', message: 'Perubahan template berhasil disimpan!' });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal menyimpan perubahan.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Upload Preview Image dengan safe replacement
  const handleFileUpload = async (
    type: 'mobile' | 'desktop' | 'thumbnail',
    file: File
  ) => {
    if (!id || isNew) {
      setFeedback({
        type: 'error',
        message: 'Harap simpan data template baru terlebih dahulu sebelum mengunggah gambar preview.',
      });
      return;
    }

    setUploading(type);
    setFeedback(null);

    const oldPath =
      type === 'mobile'
        ? formData.preview_mobile_path
        : type === 'desktop'
        ? formData.preview_desktop_path
        : formData.preview_thumbnail_path;

    try {
      // 1. Upload berkas baru ke Supabase Storage bucket 'template-assets'
      const { path, publicUrl } = await uploadTemplatePreviewImage(id, type, file);

      // 2. Perbarui database dengan storage path baru
      const updatePayload =
        type === 'mobile'
          ? { preview_mobile_path: path }
          : type === 'desktop'
          ? { preview_desktop_path: path }
          : { preview_thumbnail_path: path, thumbnail_url: publicUrl };

      await updateAdminTemplate(id, updatePayload);

      // 3. Update state lokal
      setFormData((prev) => ({
        ...prev,
        ...(type === 'mobile' && { preview_mobile_path: path }),
        ...(type === 'desktop' && { preview_desktop_path: path }),
        ...(type === 'thumbnail' && {
          preview_thumbnail_path: path,
          thumbnail_url: publicUrl,
        }),
      }));

      // 4. Hapus berkas lama secara aman setelah update database sukses
      if (oldPath && oldPath !== path) {
        await deleteTemplateAsset(oldPath);
      }

      setFeedback({
        type: 'success',
        message: `Preview gambar ${type} berhasil diperbarui!`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'Gagal mengunggah berkas.',
      });
    } finally {
      setUploading(null);
    }
  };

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#006A71] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-gray-400">Memuat detail template...</p>
      </div>
    );
  }

  const mobilePreviewUrl = getTemplateAssetPublicUrl(formData.preview_mobile_path);
  const desktopPreviewUrl = getTemplateAssetPublicUrl(formData.preview_desktop_path);
  const thumbnailPreviewUrl = getTemplateAssetPublicUrl(
    formData.preview_thumbnail_path || formData.thumbnail_url
  );

  return (
    <div className="space-y-6 pb-16 max-w-5xl">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-[#006A71]">
            {isNew ? 'Tambah Template Baru' : `Edit Template: ${formData.name}`}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Konfigurasi metadata, informasi katalog, dan upload aset gambar preview.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/templates"
            className="py-2 px-3.5 bg-white border border-[#9ACBD0] text-gray-700 hover:bg-[#F2FEF7] rounded-xl text-xs font-semibold transition-all min-h-[44px] flex items-center"
          >
            ← Kembali ke Katalog
          </Link>
          {!isNew && (
            <Link
              to={`/templates/${formData.slug}/demo`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3.5 bg-[#48A6A7] hover:bg-[#3b8c8d] text-white rounded-xl text-xs font-semibold transition-all min-h-[44px] flex items-center gap-1.5"
            >
              <span>Lihat Demo Publik</span>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
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

      {/* Form Editor Grid */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kolom Kiri: Metadata & Identitas (2 Kolom) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Kartu Identitas */}
            <div className="bg-white p-6 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-4">
              <h3 className="font-serif text-base font-bold text-[#006A71] border-b border-[#9ACBD0]/30 pb-3">
                Identitas Template
              </h3>

              {/* Template Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">
                  Nama Template <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Royal Navy & Gold"
                  className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                />
              </div>

              {/* Slug */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">
                  Slug URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="Contoh: royal-navy-gold"
                  className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                />
                <p className="text-[10px] text-gray-400">
                  Slug digunakan untuk rute publik demo: /templates/{formData.slug || 'slug'}/demo
                </p>
              </div>

              {/* Category */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">
                  Kategori Template
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                >
                  <option value="wedding">Pernikahan (Wedding)</option>
                  <option value="birthday">Ulang Tahun (Birthday)</option>
                  <option value="corporate">Acara Korporat (Corporate)</option>
                  <option value="general">Umum (General)</option>
                </select>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-700 block">
                  Deskripsi Singkat
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Jelaskan karakteristik visual, nuansa, dan keunggulan desain template ini..."
                  className="w-full px-3.5 py-2 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71]"
                />
              </div>
            </div>

            {/* Pengaturan Status & Tampilan */}
            <div className="bg-white p-6 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-4">
              <h3 className="font-serif text-base font-bold text-[#006A71] border-b border-[#9ACBD0]/30 pb-3">
                Status &amp; Urutan
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Status */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 block">
                    Status Publikasi
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as 'draft' | 'active' | 'archived',
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                  >
                    <option value="active">ACTIVE (Tampil di Publik)</option>
                    <option value="draft">DRAFT (Hanya Admin)</option>
                    <option value="archived">ARCHIVED (Diarsipkan)</option>
                  </select>
                </div>

                {/* Display Order */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 block">
                    Urutan Tampil (Display Order)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.display_order}
                    onChange={(e) =>
                      setFormData({ ...formData, display_order: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3.5 py-2.5 bg-[#F2FEF7]/60 border border-[#9ACBD0]/60 rounded-xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
                  />
                  <p className="text-[10px] text-gray-400">Angka lebih kecil tampil lebih awal</p>
                </div>
              </div>

              {/* Is Featured Checkbox */}
              <div className="pt-2 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                  className="w-4 h-4 rounded text-[#006A71] focus:ring-[#006A71] border-[#9ACBD0]"
                />
                <label htmlFor="is_featured" className="text-xs font-semibold text-gray-700 cursor-pointer">
                  Tampilkan sebagai Pilihan Unggulan (Featured Template di Landing Page)
                </label>
              </div>
            </div>
          </div>

          {/* Kolom Kanan: Pengelolaan Upload Aset Preview (1 Kolom) */}
          <div className="space-y-6">
            {/* Box Upload Mobile Preview (Paling Penting untuk Frame Smartphone) */}
            <div className="bg-white p-5 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#9ACBD0]/30 pb-2">
                <h4 className="font-serif text-xs font-bold text-[#006A71] uppercase tracking-wider">
                  Mobile Preview Mockup
                </h4>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                  Card Display
                </span>
              </div>

              <div className="w-full h-44 rounded-xl bg-gray-100 border border-dashed border-gray-300 overflow-hidden flex items-center justify-center relative group">
                {mobilePreviewUrl ? (
                  <img
                    src={mobilePreviewUrl}
                    alt="Mobile Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4 text-gray-400">
                    <svg className="w-8 h-8 mx-auto mb-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-[11px]">Belum ada gambar mobile</span>
                  </div>
                )}

                {uploading === 'mobile' && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center text-white text-xs">
                    Mengunggah...
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-gray-600">
                  Ganti Gambar Mobile (Max 5MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={isNew || uploading !== null}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('mobile', file);
                  }}
                  className="w-full text-[10px] text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-[#006A71] file:text-white hover:file:bg-[#00575d] cursor-pointer"
                />
                {isNew && (
                  <p className="text-[10px] text-amber-600">Simpan template dulu untuk mengaktifkan upload.</p>
                )}
              </div>
            </div>

            {/* Box Upload Thumbnail / Card Preview */}
            <div className="bg-white p-5 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#9ACBD0]/30 pb-2">
                <h4 className="font-serif text-xs font-bold text-[#006A71] uppercase tracking-wider">
                  Thumbnail Card
                </h4>
              </div>

              <div className="w-full h-32 rounded-xl bg-gray-100 border border-dashed border-gray-300 overflow-hidden flex items-center justify-center relative">
                {thumbnailPreviewUrl ? (
                  <img
                    src={thumbnailPreviewUrl}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-xs">Belum ada thumbnail</span>
                )}

                {uploading === 'thumbnail' && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center text-white text-xs">
                    Mengunggah...
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-gray-600">
                  Ganti Thumbnail (Max 5MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={isNew || uploading !== null}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('thumbnail', file);
                  }}
                  className="w-full text-[10px] text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-[#006A71] file:text-white hover:file:bg-[#00575d] cursor-pointer"
                />
              </div>
            </div>

            {/* Box Upload Desktop Preview */}
            <div className="bg-white p-5 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-[#9ACBD0]/30 pb-2">
                <h4 className="font-serif text-xs font-bold text-[#006A71] uppercase tracking-wider">
                  Desktop Preview
                </h4>
              </div>

              <div className="w-full h-32 rounded-xl bg-gray-100 border border-dashed border-gray-300 overflow-hidden flex items-center justify-center relative">
                {desktopPreviewUrl ? (
                  <img
                    src={desktopPreviewUrl}
                    alt="Desktop Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-xs">Belum ada desktop preview</span>
                )}

                {uploading === 'desktop' && (
                  <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center text-white text-xs">
                    Mengunggah...
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-gray-600">
                  Ganti Desktop Preview (Max 5MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={isNew || uploading !== null}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload('desktop', file);
                  }}
                  className="w-full text-[10px] text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[10px] file:font-semibold file:bg-[#006A71] file:text-white hover:file:bg-[#00575d] cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tombol Simpan Form */}
        <div className="pt-4 border-t border-[#9ACBD0]/40 flex items-center justify-end gap-3">
          <Link
            to="/admin/templates"
            className="py-2.5 px-5 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-all min-h-[44px] flex items-center"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="py-2.5 px-6 bg-[#006A71] hover:bg-[#00575d] text-white rounded-xl text-xs font-semibold transition-all shadow-xs min-h-[44px] flex items-center gap-2 cursor-pointer disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-[#006A71]"
          >
            {saving ? 'Menyimpan...' : isNew ? 'Buat Template' : 'Simpan Perubahan'}
          </button>
        </div>
      </form>
    </div>
  );
}
