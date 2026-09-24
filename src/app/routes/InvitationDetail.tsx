import { useEffect, useState, useCallback, type FormEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getMyInvitationById,
  updateInvitationCore,
  deleteMyInvitation,
  publishInvitation,
  unpublishInvitation,
  getInvitationTemplateConfig,
  getInvitationData,
  upsertInvitationData,
  toggleInvitationSection,
  initializeInvitationSectionsFromTemplate,
  extractInvitationContent,
  type InvitationDetail as IInvitationDetail,
  type InvitationTemplateConfig,
  type InvitationSectionItem,
} from '@/lib/invitations';
import { InvitationRenderer } from '@/components/template';
import { ValidationError, DatabaseError } from '@/lib/errors';

export function InvitationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [invitation, setInvitation] = useState<IInvitationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // State untuk aksi status (publish / unpublish)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusActionError, setStatusActionError] = useState<string | null>(null);

  // State untuk Pratinjau Mesin Template
  const [showPreview, setShowPreview] = useState(true);
  const [previewConfig, setPreviewConfig] = useState<InvitationTemplateConfig | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError] = useState<string | null>(null);

  // State Form Pengaturan Inti
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formAllowRsvp, setFormAllowRsvp] = useState(true);
  const [formShowWishes, setFormShowWishes] = useState(true);
  const [isSavingCore, setIsSavingCore] = useState(false);
  const [coreSuccessMessage, setCoreSuccessMessage] = useState<string | null>(null);
  const [coreErrorMessage, setCoreErrorMessage] = useState<string | null>(null);

  // State Form Konten (invitation_data)
  const [groomName, setGroomName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [contentSuccessMessage, setContentSuccessMessage] = useState<string | null>(null);
  const [contentErrorMessage, setContentErrorMessage] = useState<string | null>(null);

  // State Seksi (invitation_sections)
  const [sections, setSections] = useState<InvitationSectionItem[]>([]);
  const [togglingSectionId, setTogglingSectionId] = useState<string | null>(null);

  // Tab aktif editor
  const [activeTab, setActiveTab] = useState<'settings' | 'content' | 'sections'>('settings');

  const loadInvitation = useCallback(async () => {
    if (!id) {
      setError('ID undangan tidak valid.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getMyInvitationById(id);
      if (!data) {
        setError('Undangan tidak ditemukan atau Anda tidak memiliki hak akses ke data ini.');
      } else {
        setInvitation(data);
        setFormTitle(data.title);
        setFormSlug(data.slug);
        setFormAllowRsvp(Boolean(data.allow_rsvp));
        setFormShowWishes(Boolean(data.show_wishes));

        // Muat data konten (invitation_data)
        const invData = await getInvitationData(id);
        if (invData?.content) {
          const hosts = invData.content.hosts || [];
          setGroomName(hosts[0]?.name || '');
          setBrideName(hosts[1]?.name || '');
          setClosingNotes(invData.content.closing_notes || '');
        }

        // Muat konfigurasi template & seksi
        setLoadingPreview(true);
        const config = await getInvitationTemplateConfig(id);
        if (config) {
          setPreviewConfig(config);
          // Inisialisasi seksi jika belum ada
          if ((!config.sections || config.sections.length === 0) && config.template?.default_sections) {
            const initialSections = await initializeInvitationSectionsFromTemplate(
              id,
              config.template.default_sections
            );
            setSections(initialSections);
          } else if (config.sections) {
            setSections(
              config.sections.map((s) => ({
                id: s.id,
                invitation_id: id,
                section_type: s.section_type,
                variant: s.variant,
                display_order: s.display_order,
                is_enabled: s.is_enabled,
                custom_config: s.custom_config,
              }))
            );
          }
        }
      }
    } catch {
      setError('Terjadi kendala saat memuat detail undangan. Silakan coba kembali.');
    } finally {
      setLoading(false);
      setLoadingPreview(false);
    }
  }, [id]);

  useEffect(() => {
    loadInvitation();
  }, [loadInvitation]);

  const refreshPreview = async () => {
    if (!id) return;
    try {
      const config = await getInvitationTemplateConfig(id);
      if (config) {
        setPreviewConfig(config);
      }
    } catch {
      // Abaikan jika preview background refresh gagal
    }
  };

  const handleSaveCore = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSavingCore(true);
    setCoreSuccessMessage(null);
    setCoreErrorMessage(null);

    try {
      const updated = await updateInvitationCore(id, {
        title: formTitle,
        slug: formSlug,
        allow_rsvp: formAllowRsvp,
        show_wishes: formShowWishes,
      });

      setInvitation(updated);
      setCoreSuccessMessage('Pengaturan inti undangan berhasil disimpan.');
      await refreshPreview();
    } catch (err: unknown) {
      if (err instanceof ValidationError) {
        setCoreErrorMessage(err.message);
      } else if (err instanceof DatabaseError) {
        setCoreErrorMessage(err.message);
      } else {
        setCoreErrorMessage('Gagal menyimpan pengaturan undangan. Silakan periksa kembali formulir Anda.');
      }
    } finally {
      setIsSavingCore(false);
    }
  };

  const handleSaveContent = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSavingContent(true);
    setContentSuccessMessage(null);
    setContentErrorMessage(null);

    try {
      const hosts = [];
      if (groomName.trim()) {
        hosts.push({ name: groomName.trim(), role: 'Mempelai Pria' });
      }
      if (brideName.trim()) {
        hosts.push({ name: brideName.trim(), role: 'Mempelai Wanita' });
      }

      await upsertInvitationData(id, {
        hosts,
        closing_notes: closingNotes.trim(),
      });

      setContentSuccessMessage('Konten undangan berhasil diperbarui.');
      await refreshPreview();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setContentErrorMessage(err.message);
      } else {
        setContentErrorMessage('Gagal menyimpan konten undangan.');
      }
    } finally {
      setIsSavingContent(false);
    }
  };

  const handleToggleSection = async (sectionId: string, currentEnabled: boolean) => {
    setTogglingSectionId(sectionId);
    try {
      await toggleInvitationSection(sectionId, !currentEnabled);
      setSections((prev) =>
        prev.map((s) => (s.id === sectionId ? { ...s, is_enabled: !currentEnabled } : s))
      );
      await refreshPreview();
    } catch {
      alert('Gagal mengubah status seksi undangan. Silakan coba kembali.');
    } finally {
      setTogglingSectionId(null);
    }
  };

  const handlePublish = async () => {
    if (!id) return;
    setIsUpdatingStatus(true);
    setStatusActionError(null);
    try {
      const res = await publishInvitation(id);
      setInvitation((prev) =>
        prev
          ? {
              ...prev,
              status: res.status,
              published_at: res.published_at,
            }
          : null
      );
      await refreshPreview();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setStatusActionError(err.message);
      } else {
        setStatusActionError('Gagal mempublikasikan undangan. Silakan coba kembali.');
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleUnpublish = async () => {
    if (!id) return;
    const confirmed = window.confirm(
      'Apakah Anda yakin ingin mengembalikan undangan ke status draf? Halaman publik tidak akan dapat diakses oleh umum.'
    );
    if (!confirmed) return;

    setIsUpdatingStatus(true);
    setStatusActionError(null);
    try {
      const res = await unpublishInvitation(id);
      setInvitation((prev) =>
        prev
          ? {
              ...prev,
              status: res.status,
              published_at: res.published_at,
            }
          : null
      );
      await refreshPreview();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setStatusActionError(err.message);
      } else {
        setStatusActionError('Gagal mengubah status undangan ke draf. Silakan coba kembali.');
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;

    const confirmed = window.confirm(
      'Apakah Anda yakin ingin menghapus undangan ini? Seluruh data yang terkait akan terhapus dan tindakan ini tidak dapat dibatalkan.'
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await deleteMyInvitation(id);
      navigate('/dashboard');
    } catch {
      alert('Gagal menghapus undangan. Silakan periksa koneksi Anda dan coba lagi.');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 max-w-2xl mx-auto text-center">
        <p className="text-xs text-text-muted font-medium" role="status">
          Memuat data undangan...
        </p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="py-16 max-w-xl mx-auto">
        <div className="bg-surface border border-border rounded p-6 shadow-sm text-center space-y-4">
          <h1 className="font-serif text-xl font-bold text-primary">
            Akses Dibatasi atau Tidak Ditemukan
          </h1>
          <p className="text-xs text-text-muted leading-relaxed">
            {error ?? 'Undangan tidak ditemukan atau Anda tidak memiliki hak akses ke data ini.'}
          </p>
          <div className="pt-2">
            <Link
              to="/dashboard"
              className="inline-block py-2 px-4 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors"
            >
              Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 max-w-5xl mx-auto space-y-6">
      {/* Navigasi Breadcrumb */}
      <div>
        <Link
          to="/dashboard"
          className="text-xs font-semibold text-text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1"
        >
          &larr; Kembali ke Dashboard
        </Link>
      </div>

      {/* Header Utama Undangan */}
      <div className="bg-surface border border-border rounded p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-serif text-2xl font-bold text-primary">
                {invitation.title}
              </h1>
              <span
                className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${
                  invitation.status === 'published'
                    ? 'border-success/40 bg-success/10 text-success'
                    : 'border-border bg-surface-elevated text-text-muted'
                }`}
              >
                {invitation.status}
              </span>
            </div>
            <p className="text-xs text-text-subtle font-mono">
              slug: {invitation.slug}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {invitation.status === 'draft' ? (
              <button
                type="button"
                onClick={handlePublish}
                disabled={isUpdatingStatus}
                className="py-1.5 px-3 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors cursor-pointer disabled:opacity-50"
              >
                {isUpdatingStatus ? 'Memproses...' : 'Publikasikan Undangan'}
              </button>
            ) : (
              <>
                <Link
                  to={`/i/${invitation.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-1.5 px-3 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  Buka Tautan Publik &rarr;
                </Link>
                <button
                  type="button"
                  onClick={handleUnpublish}
                  disabled={isUpdatingStatus}
                  className="py-1.5 px-3 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-muted hover:text-danger rounded transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUpdatingStatus ? 'Memproses...' : 'Kembalikan ke Draf'}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="py-1.5 px-3 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-primary rounded transition-colors cursor-pointer"
            >
              {showPreview ? 'Sembunyikan Pratinjau' : 'Tampilkan Pratinjau'}
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isUpdatingStatus}
              className="py-1.5 px-3 bg-surface hover:bg-danger/10 border border-border hover:border-danger/30 text-xs font-semibold text-danger rounded transition-colors cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? 'Menghapus...' : 'Hapus Undangan'}
            </button>
          </div>
        </div>

        {statusActionError && (
          <div
            role="alert"
            className="mt-4 p-3 bg-danger/10 border border-danger/30 rounded text-xs text-danger font-medium leading-relaxed"
          >
            {statusActionError}
          </div>
        )}

        {invitation.status === 'published' && (
          <div className="mt-4 p-3 bg-surface-elevated border border-border rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <span className="text-text-muted">
              Tautan Publik:{' '}
              <strong className="text-text-primary font-mono font-normal">/i/{invitation.slug}</strong>
            </span>
            <Link
              to={`/i/${invitation.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-semibold hover:underline"
            >
              Lihat Undangan Langsung &rarr;
            </Link>
          </div>
        )}
      </div>

      {/* Editor Foundation & Panel Pengaturan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Editor (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface border border-border rounded shadow-sm overflow-hidden">
            {/* Tab Header */}
            <div className="flex border-b border-border bg-surface-elevated text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-2.5 px-3 text-center border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'border-primary text-primary bg-surface'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                Pengaturan Inti
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`flex-1 py-2.5 px-3 text-center border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'content'
                    ? 'border-primary text-primary bg-surface'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                Konten Mempelai
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sections')}
                className={`flex-1 py-2.5 px-3 text-center border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'sections'
                    ? 'border-primary text-primary bg-surface'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                Seksi Undangan
              </button>
            </div>

            {/* Tab 1: Pengaturan Inti */}
            {activeTab === 'settings' && (
              <form onSubmit={handleSaveCore} className="p-5 space-y-4 text-xs">
                {coreSuccessMessage && (
                  <div className="p-3 bg-success/10 border border-success/30 rounded text-success font-medium">
                    {coreSuccessMessage}
                  </div>
                )}
                {coreErrorMessage && (
                  <div className="p-3 bg-danger/10 border border-danger/30 rounded text-danger font-medium">
                    {coreErrorMessage}
                  </div>
                )}

                <div className="space-y-1">
                  <label htmlFor="formTitle" className="font-semibold text-text-primary block">
                    Judul Undangan
                  </label>
                  <input
                    id="formTitle"
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    required
                    maxLength={120}
                    className="w-full py-1.5 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="formSlug" className="font-semibold text-text-primary block">
                    Kustom Slug Tautan
                  </label>
                  <div className="flex items-center">
                    <span className="py-1.5 px-2 bg-surface-elevated border border-r-0 border-border rounded-l text-text-muted text-xs">
                      /i/
                    </span>
                    <input
                      id="formSlug"
                      type="text"
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value.toLowerCase())}
                      required
                      minLength={3}
                      maxLength={60}
                      pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
                      className="flex-1 py-1.5 px-3 border border-border rounded-r bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-text-subtle">
                    Hanya huruf kecil, angka, dan tanda hubung (-). Contoh: romeo-juliet
                  </p>
                </div>

                <div className="pt-2 space-y-3 border-t border-border">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formAllowRsvp}
                      onChange={(e) => setFormAllowRsvp(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-0"
                    />
                    <span className="text-text-primary">Aktifkan Formulir Konfirmasi Kehadiran (RSVP)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formShowWishes}
                      onChange={(e) => setFormShowWishes(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-0"
                    />
                    <span className="text-text-primary">Tampilkan Buku Ucapan dan Doa Tamu</span>
                  </label>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingCore}
                    className="w-full py-2 px-4 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSavingCore ? 'Menyimpan...' : 'Simpan Pengaturan'}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 2: Konten Mempelai (invitation_data) */}
            {activeTab === 'content' && (
              <form onSubmit={handleSaveContent} className="p-5 space-y-4 text-xs">
                {contentSuccessMessage && (
                  <div className="p-3 bg-success/10 border border-success/30 rounded text-success font-medium">
                    {contentSuccessMessage}
                  </div>
                )}
                {contentErrorMessage && (
                  <div className="p-3 bg-danger/10 border border-danger/30 rounded text-danger font-medium">
                    {contentErrorMessage}
                  </div>
                )}

                <div className="space-y-1">
                  <label htmlFor="groomName" className="font-semibold text-text-primary block">
                    Nama Calon Mempelai Pria
                  </label>
                  <input
                    id="groomName"
                    type="text"
                    value={groomName}
                    onChange={(e) => setGroomName(e.target.value)}
                    placeholder="Contoh: Raden Satria"
                    className="w-full py-1.5 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="brideName" className="font-semibold text-text-primary block">
                    Nama Calon Mempelai Wanita
                  </label>
                  <input
                    id="brideName"
                    type="text"
                    value={brideName}
                    onChange={(e) => setBrideName(e.target.value)}
                    placeholder="Contoh: Dewi Larasati"
                    className="w-full py-1.5 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="closingNotes" className="font-semibold text-text-primary block">
                    Pesan Penutup / Kutipan
                  </label>
                  <textarea
                    id="closingNotes"
                    rows={3}
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="Contoh: Merupakan kehormatan bagi kami atas kehadiran dan doa restu Bapak/Ibu sekalian."
                    className="w-full py-1.5 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSavingContent}
                    className="w-full py-2 px-4 bg-primary hover:bg-primary-hover text-primary-foreground font-semibold rounded transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSavingContent ? 'Menyimpan Konten...' : 'Simpan Konten'}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 3: Seksi Undangan (invitation_sections) */}
            {activeTab === 'sections' && (
              <div className="p-5 space-y-4 text-xs">
                <p className="text-text-muted leading-relaxed">
                  Aktifkan atau nonaktifkan seksi yang hendak ditampilkan pada halaman undangan:
                </p>

                {sections.length === 0 ? (
                  <div className="p-4 border border-dashed border-border rounded text-center text-text-muted">
                    Seksi belum diinisialisasi dari template master.
                  </div>
                ) : (
                  <div className="divide-y divide-border border border-border rounded overflow-hidden">
                    {sections.map((section) => (
                      <div
                        key={section.id}
                        className="p-3 flex items-center justify-between gap-3 hover:bg-surface-elevated transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-text-subtle text-[11px]">
                            #{section.display_order}
                          </span>
                          <span className="font-medium text-text-primary capitalize">
                            {section.section_type}
                          </span>
                          <span className="text-[10px] text-text-muted border border-border px-1 rounded">
                            {section.variant}
                          </span>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={section.is_enabled}
                            disabled={togglingSectionId === section.id}
                            onChange={() => handleToggleSection(section.id, section.is_enabled)}
                            className="sr-only peer"
                          />
                          <div className="w-8 h-4 bg-surface-elevated border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-subtle peer-checked:after:bg-white after:border-border after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Pratinjau Desain (7 cols) */}
        <div className="lg:col-span-7">
          {showPreview ? (
            <div className="border border-border rounded overflow-hidden shadow-sm bg-background">
              <div className="py-2.5 px-4 bg-surface-elevated border-b border-border flex items-center justify-between text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text-primary">
                    Pratinjau Langsung
                  </span>
                  <span className="px-1.5 py-0.5 rounded border border-border bg-surface text-[10px] uppercase font-semibold">
                    {previewConfig?.template?.name ?? 'Classic Elegance'}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-text-subtle">
                  /i/{invitation.slug}
                </span>
              </div>

              {loadingPreview ? (
                <div className="py-24 text-center text-xs text-text-muted" role="status">
                  Memuat pratinjau template dan seksi...
                </div>
              ) : previewError ? (
                <div
                  className="p-4 m-4 bg-danger/10 border border-danger/30 rounded text-xs text-danger text-center"
                  role="alert"
                >
                  {previewError}
                </div>
              ) : previewConfig ? (
                <div className="max-h-[640px] overflow-y-auto">
                  <InvitationRenderer
                    invitation={previewConfig}
                    template={previewConfig.template}
                    customSections={sections}
                    content={extractInvitationContent(previewConfig.data)}
                    events={previewConfig.events}
                    gallery={previewConfig.gallery}
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="p-12 border border-dashed border-border rounded text-center space-y-2">
              <p className="text-xs text-text-muted">
                Pratinjau disembunyikan untuk memberikan ruang kerja fokus.
              </p>
              <button
                type="button"
                onClick={() => setShowPreview(true)}
                className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              >
                Tampilkan Pratinjau Kembali
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
