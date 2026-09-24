import { useEffect, useState, useCallback, useMemo, type FormEvent } from 'react';
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
  initializeInvitationSectionsFromTemplate,
  updateInvitationSections,
  extractInvitationContent,
  type InvitationDetail as IInvitationDetail,
  type InvitationTemplateConfig,
  type InvitationSectionItem,
} from '@/lib/invitations';
import { InvitationRenderer } from '@/components/template';
import { ValidationError, DatabaseError, AuthorizationError } from '@/lib/errors';

/**
 * Metadata seksi untuk tampilan pengelolaan tata letak editor
 */
const SECTION_METADATA: Record<string, { label: string; description: string }> = {
  hero: { label: 'Sampul Utama (Hero Cover)', description: 'Header pembuka dengan judul acara dan tanggal' },
  hosts: { label: 'Profil Mempelai (Couple)', description: 'Informasi calon mempelai pria dan wanita' },
  couple: { label: 'Profil Mempelai (Couple)', description: 'Informasi calon mempelai pria dan wanita' },
  events: { label: 'Agenda Acara (Events)', description: 'Waktu pelaksanaan, lokasi gedung, dan peta' },
  event: { label: 'Agenda Acara (Events)', description: 'Waktu pelaksanaan, lokasi gedung, dan peta' },
  story: { label: 'Kisah Cinta (Story)', description: 'Linimasa perjalanan cinta kedua mempelai' },
  gallery: { label: 'Galeri Foto (Gallery)', description: 'Dokumentasi foto momen kebahagiaan' },
  rsvp: { label: 'Konfirmasi Kehadiran (RSVP)', description: 'Formulir kepastian kehadiran tamu undangan' },
  wishes: { label: 'Buku Ucapan & Doa (Wishes)', description: 'Untaian doa dan ucapan hangat dari kerabat' },
  gift: { label: 'Tanda Kasih (Gift)', description: 'Nomor rekening atau amplop digital' },
  closing: { label: 'Penutup & Salam (Closing)', description: 'Kutipan ayat dan ucapan terima kasih' },
};

export function InvitationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Status dasar halaman
  const [invitation, setInvitation] = useState<IInvitationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Template config untuk preview
  const [previewConfig, setPreviewConfig] = useState<InvitationTemplateConfig | null>(null);

  // Snapshot data tersimpan di database untuk deteksi perubahan
  const [savedSnapshot, setSavedSnapshot] = useState({
    title: '',
    slug: '',
    eventType: 'wedding',
    allowRsvp: true,
    showWishes: true,
    groomName: '',
    groomBio: '',
    brideName: '',
    brideBio: '',
    closingNotes: '',
    sectionsJson: '',
  });

  // State Formulir Pengaturan Umum (General Settings)
  const [draftTitle, setDraftTitle] = useState('');
  const [draftSlug, setDraftSlug] = useState('');
  const [draftEventType, setDraftEventType] = useState('wedding');
  const [draftAllowRsvp, setDraftAllowRsvp] = useState(true);
  const [draftShowWishes, setDraftShowWishes] = useState(true);

  // State Formulir Konten Mempelai (invitation_data)
  const [draftGroomName, setDraftGroomName] = useState('');
  const [draftGroomBio, setDraftGroomBio] = useState('');
  const [draftBrideName, setDraftBrideName] = useState('');
  const [draftBrideBio, setDraftBrideBio] = useState('');
  const [draftClosingNotes, setDraftClosingNotes] = useState('');

  // State Seksi Undangan (invitation_sections)
  const [draftSections, setDraftSections] = useState<InvitationSectionItem[]>([]);

  // Tampilan antarmuka
  const [activeTab, setActiveTab] = useState<'settings' | 'content' | 'sections'>('settings');
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('desktop');
  const [showPreviewDesktop, setShowPreviewDesktop] = useState(true);

  // Status proses penyimpanan
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);

  // Status publikasi
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [publishSuccessModalOpen, setPublishSuccessModalOpen] = useState(false);
  const [publishValidationErrors, setPublishValidationErrors] = useState<string[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);

  // Status pembatalan publikasi (unpublish)
  const [isUnpublishing, setIsUnpublishing] = useState(false);
  const [unpublishModalOpen, setUnpublishModalOpen] = useState(false);
  const [unpublishError, setUnpublishError] = useState<string | null>(null);

  // Status penghapusan undangan
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Muat data undangan, konten, dan konfigurasi seksi
  const loadData = useCallback(async () => {
    if (!id) {
      setPageError('ID undangan tidak ditemukan.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setPageError(null);

    try {
      const invData = await getMyInvitationById(id);
      if (!invData) {
        setPageError('Undangan tidak ditemukan atau Anda tidak memiliki hak akses ke data ini.');
        setLoading(false);
        return;
      }

      setInvitation(invData);

      // Inisialisasi state pengaturan umum
      const initialTitle = invData.title || '';
      const initialSlug = invData.slug || '';
      const initialEventType = invData.event_type || 'wedding';
      const initialAllowRsvp = Boolean(invData.allow_rsvp);
      const initialShowWishes = Boolean(invData.show_wishes);

      setDraftTitle(initialTitle);
      setDraftSlug(initialSlug);
      setDraftEventType(initialEventType);
      setDraftAllowRsvp(initialAllowRsvp);
      setDraftShowWishes(initialShowWishes);

      // Muat data konten mempelai (invitation_data)
      const contentRecord = await getInvitationData(id);
      let initialGroomName = '';
      let initialGroomBio = '';
      let initialBrideName = '';
      let initialBrideBio = '';
      let initialClosingNotes = '';

      if (contentRecord?.content) {
        const hosts = Array.isArray(contentRecord.content.hosts) ? contentRecord.content.hosts : [];
        if (hosts[0]) {
          initialGroomName = typeof hosts[0].name === 'string' ? hosts[0].name : '';
          initialGroomBio = typeof hosts[0].bio === 'string' ? hosts[0].bio : '';
        }
        if (hosts[1]) {
          initialBrideName = typeof hosts[1].name === 'string' ? hosts[1].name : '';
          initialBrideBio = typeof hosts[1].bio === 'string' ? hosts[1].bio : '';
        }
        initialClosingNotes =
          typeof contentRecord.content.closing_notes === 'string'
            ? contentRecord.content.closing_notes
            : '';
      }

      setDraftGroomName(initialGroomName);
      setDraftGroomBio(initialGroomBio);
      setDraftBrideName(initialBrideName);
      setDraftBrideBio(initialBrideBio);
      setDraftClosingNotes(initialClosingNotes);

      // Muat template config & pastikan seksi terinisialisasi
      const config = await getInvitationTemplateConfig(id);
      let initialSections: InvitationSectionItem[] = [];

      if (config) {
        setPreviewConfig(config);
        const resolvedSections = await initializeInvitationSectionsFromTemplate(
          id,
          config.template?.default_sections
        );
        initialSections = resolvedSections;
        setDraftSections(resolvedSections);
      }

      // Simpan snapshot untuk melacak perubahan yang belum disimpan
      const initialSectionsJson = JSON.stringify(
        initialSections.map((s) => ({ id: s.id, order: s.display_order, enabled: s.is_enabled }))
      );

      setSavedSnapshot({
        title: initialTitle,
        slug: initialSlug,
        eventType: initialEventType,
        allowRsvp: initialAllowRsvp,
        showWishes: initialShowWishes,
        groomName: initialGroomName,
        groomBio: initialGroomBio,
        brideName: initialBrideName,
        brideBio: initialBrideBio,
        closingNotes: initialClosingNotes,
        sectionsJson: initialSectionsJson,
      });
    } catch {
      setPageError('Terjadi kendala saat memuat data undangan. Silakan periksa koneksi dan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Evaluasi apakah ada perubahan form lokal yang belum disimpan ke database
  const currentSectionsJson = useMemo(() => {
    return JSON.stringify(
      draftSections.map((s) => ({ id: s.id, order: s.display_order, enabled: s.is_enabled }))
    );
  }, [draftSections]);

  const hasUnsavedChanges = useMemo(() => {
    if (!invitation) return false;
    return (
      draftTitle !== savedSnapshot.title ||
      draftSlug !== savedSnapshot.slug ||
      draftEventType !== savedSnapshot.eventType ||
      draftAllowRsvp !== savedSnapshot.allowRsvp ||
      draftShowWishes !== savedSnapshot.showWishes ||
      draftGroomName !== savedSnapshot.groomName ||
      draftGroomBio !== savedSnapshot.groomBio ||
      draftBrideName !== savedSnapshot.brideName ||
      draftBrideBio !== savedSnapshot.brideBio ||
      draftClosingNotes !== savedSnapshot.closingNotes ||
      currentSectionsJson !== savedSnapshot.sectionsJson
    );
  }, [
    invitation,
    draftTitle,
    draftSlug,
    draftEventType,
    draftAllowRsvp,
    draftShowWishes,
    draftGroomName,
    draftGroomBio,
    draftBrideName,
    draftBrideBio,
    draftClosingNotes,
    currentSectionsJson,
    savedSnapshot,
  ]);

  // Objek live invitation untuk preview lokal instan tanpa query
  const liveInvitation = useMemo(() => {
    if (!invitation) return null;
    return {
      id: invitation.id,
      title: draftTitle,
      slug: draftSlug,
      eventType: draftEventType,
      status: invitation.status,
      allowRsvp: draftAllowRsvp,
      showWishes: draftShowWishes,
      theme_override: invitation.theme_override,
    };
  }, [invitation, draftTitle, draftSlug, draftEventType, draftAllowRsvp, draftShowWishes]);

  // Objek live content untuk preview lokal instan tanpa query
  const liveContent = useMemo(() => {
    const hosts = [];
    if (draftGroomName.trim()) {
      hosts.push({
        name: draftGroomName.trim(),
        role: 'Mempelai Pria',
        bio: draftGroomBio.trim() || undefined,
      });
    }
    if (draftBrideName.trim()) {
      hosts.push({
        name: draftBrideName.trim(),
        role: 'Mempelai Wanita',
        bio: draftBrideBio.trim() || undefined,
      });
    }

    const existingContent = extractInvitationContent(previewConfig?.data) || {};
    return {
      ...existingContent,
      hosts,
      closing_notes: draftClosingNotes.trim(),
    };
  }, [draftGroomName, draftGroomBio, draftBrideName, draftBrideBio, draftClosingNotes, previewConfig?.data]);

  // Handler simpan satu tombol untuk seluruh form
  const handleSaveAll = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!id || !invitation) return;

    setSaveSuccessMessage(null);
    setSaveErrorMessage(null);

    // 1. Validasi input client
    const cleanTitle = draftTitle.trim();
    if (!cleanTitle) {
      setSaveErrorMessage('Judul undangan tidak boleh kosong.');
      return;
    }
    if (cleanTitle.length > 120) {
      setSaveErrorMessage('Judul undangan maksimal 120 karakter.');
      return;
    }

    const cleanSlug = draftSlug.trim().toLowerCase();
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (cleanSlug.length < 3 || cleanSlug.length > 60 || !slugRegex.test(cleanSlug)) {
      setSaveErrorMessage(
        'Format tautan (slug) harus berupa huruf kecil, angka, dan tanda hubung (-) dengan panjang 3 sampai 60 karakter.'
      );
      return;
    }

    // Jika tidak ada perubahan, hentikan tanpa request
    if (!hasUnsavedChanges) {
      setSaveSuccessMessage('Tidak ada perubahan baru untuk disimpan.');
      return;
    }

    setIsSaving(true);

    try {
      const updateTasks: Promise<unknown>[] = [];

      // A. Periksa perubahan data inti
      const isCoreChanged =
        cleanTitle !== savedSnapshot.title ||
        cleanSlug !== savedSnapshot.slug ||
        draftEventType !== savedSnapshot.eventType ||
        draftAllowRsvp !== savedSnapshot.allowRsvp ||
        draftShowWishes !== savedSnapshot.showWishes;

      if (isCoreChanged) {
        updateTasks.push(
          updateInvitationCore(id, {
            title: cleanTitle,
            slug: cleanSlug,
            event_type: draftEventType,
            allow_rsvp: draftAllowRsvp,
            show_wishes: draftShowWishes,
          })
        );
      }

      // B. Periksa perubahan konten mempelai (invitation_data)
      const isContentChanged =
        draftGroomName !== savedSnapshot.groomName ||
        draftGroomBio !== savedSnapshot.groomBio ||
        draftBrideName !== savedSnapshot.brideName ||
        draftBrideBio !== savedSnapshot.brideBio ||
        draftClosingNotes !== savedSnapshot.closingNotes;

      if (isContentChanged) {
        const hosts = [];
        if (draftGroomName.trim()) {
          hosts.push({
            name: draftGroomName.trim(),
            role: 'Mempelai Pria',
            bio: draftGroomBio.trim() || undefined,
          });
        }
        if (draftBrideName.trim()) {
          hosts.push({
            name: draftBrideName.trim(),
            role: 'Mempelai Wanita',
            bio: draftBrideBio.trim() || undefined,
          });
        }

        updateTasks.push(
          upsertInvitationData(id, {
            hosts,
            closing_notes: draftClosingNotes.trim(),
          })
        );
      }

      // C. Periksa perubahan seksi (invitation_sections)
      const isSectionsChanged = currentSectionsJson !== savedSnapshot.sectionsJson;
      if (isSectionsChanged) {
        updateTasks.push(
          updateInvitationSections(
            id,
            draftSections.map((s) => ({
              id: s.id,
              display_order: s.display_order,
              is_enabled: s.is_enabled,
            }))
          )
        );
      }

      // Jalankan seluruh pembaruan secara paralel
      await Promise.all(updateTasks);

      // Perbarui snapshot tersimpan
      setSavedSnapshot({
        title: cleanTitle,
        slug: cleanSlug,
        eventType: draftEventType,
        allowRsvp: draftAllowRsvp,
        showWishes: draftShowWishes,
        groomName: draftGroomName,
        groomBio: draftGroomBio,
        brideName: draftBrideName,
        brideBio: draftBrideBio,
        closingNotes: draftClosingNotes,
        sectionsJson: currentSectionsJson,
      });

      setInvitation((prev) =>
        prev
          ? {
              ...prev,
              title: cleanTitle,
              slug: cleanSlug,
              event_type: draftEventType,
              allow_rsvp: draftAllowRsvp,
              show_wishes: draftShowWishes,
            }
          : null
      );

      setSaveSuccessMessage('Seluruh perubahan berhasil disimpan.');
    } catch (err: unknown) {
      if (err instanceof ValidationError) {
        setSaveErrorMessage(err.message);
      } else if (err instanceof DatabaseError) {
        setSaveErrorMessage(err.message);
      } else if (err instanceof AuthorizationError) {
        setSaveErrorMessage(err.message);
      } else {
        setSaveErrorMessage('Gagal menyimpan perubahan. Silakan periksa kembali isian formulir Anda.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Handler toggle aktif/nonaktif seksi di draft lokal
  const handleToggleSection = (sectionId: string) => {
    setDraftSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, is_enabled: !s.is_enabled } : s))
    );
  };

  // Handler memindahkan urutan seksi ke atas
  const handleMoveSectionUp = (index: number) => {
    if (index <= 0) return;
    setDraftSections((prev) => {
      const copy = [...prev];
      const target = copy[index];
      const previous = copy[index - 1];
      if (!target || !previous) return prev;
      copy[index - 1] = target;
      copy[index] = previous;
      return copy.map((item, idx) => ({ ...item, display_order: idx }));
    });
  };

  // Handler memindahkan urutan seksi ke bawah
  const handleMoveSectionDown = (index: number) => {
    if (index >= draftSections.length - 1) return;
    setDraftSections((prev) => {
      const copy = [...prev];
      const target = copy[index];
      const next = copy[index + 1];
      if (!target || !next) return prev;
      copy[index + 1] = target;
      copy[index] = next;
      return copy.map((item, idx) => ({ ...item, display_order: idx }));
    });
  };

  // Validasi sebelum membuka modal publikasi
  const handleOpenPublishModal = () => {
    const errors: string[] = [];

    const cleanTitle = draftTitle.trim();
    if (!cleanTitle) {
      errors.push('Judul undangan wajib diisi.');
    }

    const cleanSlug = draftSlug.trim().toLowerCase();
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (cleanSlug.length < 3 || cleanSlug.length > 60 || !slugRegex.test(cleanSlug)) {
      errors.push('Format tautan (slug) tidak valid (3 sampai 60 karakter huruf kecil, angka, tanda hubung).');
    }

    const hasGroom = draftGroomName.trim().length > 0;
    const hasBride = draftBrideName.trim().length > 0;
    if (!hasGroom && !hasBride) {
      errors.push('Setidaknya satu nama mempelai (pria atau wanita) wajib diisi sebelum publikasi.');
    }

    if (hasUnsavedChanges) {
      errors.push('Terdapat perubahan formulir yang belum disimpan. Silakan simpan perubahan terlebih dahulu.');
    }

    setPublishValidationErrors(errors);
    setPublishModalOpen(true);
  };

  // Eksekusi publikasi
  const handleConfirmPublish = async () => {
    if (!id) return;
    setIsPublishing(true);

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
      setPublishModalOpen(false);
      setPublishSuccessModalOpen(true);
      setSaveSuccessMessage('Undangan berhasil dipublikasikan.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setPublishValidationErrors([err.message]);
      } else {
        setPublishValidationErrors(['Terjadi kendala saat mempublikasikan undangan.']);
      }
    } finally {
      setIsPublishing(false);
    }
  };

  // Eksekusi unpublish (kembalikan ke status draf)
  const handleConfirmUnpublish = async () => {
    if (!id) return;
    setIsUnpublishing(true);
    setUnpublishError(null);

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
      setUnpublishModalOpen(false);
      setSaveSuccessMessage('Undangan telah dikembalikan ke status draf.');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setUnpublishError(err.message);
      } else {
        setUnpublishError('Gagal mengubah status undangan ke draf.');
      }
    } finally {
      setIsUnpublishing(false);
    }
  };

  // Eksekusi penghapusan undangan
  const handleConfirmDelete = async () => {
    if (!id) return;
    setIsDeleting(true);

    try {
      await deleteMyInvitation(id);
      navigate('/dashboard');
    } catch {
      alert('Gagal menghapus undangan. Silakan periksa koneksi Anda dan coba lagi.');
      setIsDeleting(false);
    }
  };

  // Salin tautan publik ke clipboard
  const handleCopyLink = () => {
    if (!invitation) return;
    const url = `${window.location.origin}/i/${invitation.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    });
  };

  if (loading) {
    return (
      <div className="py-24 max-w-2xl mx-auto text-center">
        <p className="text-xs text-text-muted font-medium" role="status">
          Memuat ruang kerja editor undangan...
        </p>
      </div>
    );
  }

  if (pageError || !invitation) {
    return (
      <div className="py-16 max-w-xl mx-auto">
        <div className="bg-surface border border-border rounded p-6 shadow-sm text-center space-y-4">
          <h1 className="font-serif text-xl font-bold text-primary">
            Akses Dibatasi atau Tidak Ditemukan
          </h1>
          <p className="text-xs text-text-muted leading-relaxed">
            {pageError ?? 'Undangan tidak ditemukan atau Anda tidak memiliki hak akses ke data ini.'}
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
    <div className="py-6 max-w-7xl mx-auto space-y-6">
      {/* 1. Header Toolbar Editor */}
      <header className="bg-surface border border-border rounded p-5 shadow-sm space-y-4">
        {/* Baris Navigasi Atas & Info Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="text-xs font-semibold text-text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1"
            >
              &larr; Dashboard
            </Link>
            <span className="text-border-strong text-xs">/</span>
            <span className="text-xs text-text-subtle font-mono truncate max-w-[200px]">
              {invitation.slug}
            </span>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {hasUnsavedChanges && (
              <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                Ada perubahan belum disimpan
              </span>
            )}
            <span
              className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border ${
                invitation.status === 'published'
                  ? 'border-success/40 bg-success/10 text-success'
                  : 'border-border bg-surface-elevated text-text-muted'
              }`}
            >
              {invitation.status === 'published' ? 'Dipublikasikan' : 'Draf'}
            </span>
          </div>
        </div>

        {/* Baris Judul & Tombol Aksi Utama */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary">
              {draftTitle || 'Tanpa Judul'}
            </h1>
            <p className="text-xs text-text-muted mt-0.5">
              Template: <strong className="font-medium text-text-primary">{previewConfig?.template?.name ?? 'Classic Elegance'}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Simpan Perubahan */}
            <button
              type="button"
              onClick={() => handleSaveAll()}
              disabled={isSaving}
              className="py-2 px-4 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>

            {/* Tombol Publikasi / Unpublish */}
            {invitation.status === 'draft' ? (
              <button
                type="button"
                onClick={handleOpenPublishModal}
                disabled={isSaving || isPublishing}
                className="py-2 px-4 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-primary rounded transition-colors cursor-pointer disabled:opacity-50"
              >
                Publikasikan
              </button>
            ) : (
              <>
                <Link
                  to={`/i/${invitation.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-primary rounded transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  Buka Undangan &rarr;
                </Link>
                <button
                  type="button"
                  onClick={() => setUnpublishModalOpen(true)}
                  disabled={isUnpublishing}
                  className="py-2 px-3 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-muted hover:text-danger rounded transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batalkan Publikasi
                </button>
              </>
            )}

            {/* Switch Tampilan Pratinjau di Layar Desktop */}
            <button
              type="button"
              onClick={() => setShowPreviewDesktop(!showPreviewDesktop)}
              className="hidden lg:inline-flex py-2 px-3 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-muted hover:text-text-primary rounded transition-colors cursor-pointer"
            >
              {showPreviewDesktop ? 'Sembunyikan Preview' : 'Tampilkan Preview'}
            </button>

            {/* Tombol Hapus */}
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              disabled={isDeleting}
              className="py-2 px-3 bg-surface hover:bg-danger/10 border border-border hover:border-danger/30 text-xs font-semibold text-danger rounded transition-colors cursor-pointer disabled:opacity-50"
              title="Hapus Undangan"
            >
              Hapus
            </button>
          </div>
        </div>

        {/* Notifikasi Status Penyimpanan */}
        {saveSuccessMessage && (
          <div
            role="status"
            className="p-3 bg-success/10 border border-success/30 rounded text-xs text-success font-medium flex items-center justify-between"
          >
            <span>{saveSuccessMessage}</span>
            <button
              type="button"
              onClick={() => setSaveSuccessMessage(null)}
              className="text-success hover:underline text-xs"
            >
              Tutup
            </button>
          </div>
        )}

        {saveErrorMessage && (
          <div
            role="alert"
            className="p-3 bg-danger/10 border border-danger/30 rounded text-xs text-danger font-medium flex items-center justify-between"
          >
            <span>{saveErrorMessage}</span>
            <button
              type="button"
              onClick={() => setSaveErrorMessage(null)}
              className="text-danger hover:underline text-xs"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Banner Khusus Saat Undangan Sudah Terbit */}
        {invitation.status === 'published' && (
          <div className="p-3 bg-surface-elevated border border-border rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-text-muted">Tautan Publik:</span>
              <strong className="text-text-primary font-mono font-normal">/i/{invitation.slug}</strong>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="py-1 px-2.5 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-primary rounded transition-colors cursor-pointer"
              >
                {linkCopied ? 'Tautan Disalin!' : 'Salin Tautan'}
              </button>
              <Link
                to={`/i/${invitation.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-1 px-2.5 bg-primary text-primary-foreground text-xs font-semibold rounded hover:bg-primary-hover transition-colors"
              >
                Lihat Halaman Publik &rarr;
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Switch Tampilan Khusus Mobile & Tablet (< lg) */}
      <div className="flex lg:hidden bg-surface border border-border rounded p-1 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMobileView('editor')}
          className={`flex-1 py-2 text-center rounded transition-colors cursor-pointer ${
            mobileView === 'editor'
              ? 'bg-primary text-primary-foreground'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          Formulir Editor
        </button>
        <button
          type="button"
          onClick={() => setMobileView('preview')}
          className={`flex-1 py-2 text-center rounded transition-colors cursor-pointer ${
            mobileView === 'preview'
              ? 'bg-primary text-primary-foreground'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          Pratinjau Langsung
        </button>
      </div>

      {/* 2. Grid Ruang Kerja Utama (Editor vs Live Preview) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Kolom Kiri: Panel Formulir Editor (5 cols atau 12 cols jika preview disembunyikan) */}
        <div
          className={`${
            showPreviewDesktop ? 'lg:col-span-5' : 'lg:col-span-12'
          } ${mobileView === 'preview' ? 'hidden lg:block' : 'block'} space-y-4`}
        >
          <div className="bg-surface border border-border rounded shadow-sm overflow-hidden">
            {/* Navigasi Sub-Tab Editor */}
            <div className="flex border-b border-border bg-surface-elevated text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-3 px-3 text-center border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'border-primary text-primary bg-surface'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                Pengaturan Umum
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={`flex-1 py-3 px-3 text-center border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'content'
                    ? 'border-primary text-primary bg-surface'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                Mempelai &amp; Tuan Rumah
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sections')}
                className={`flex-1 py-3 px-3 text-center border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'sections'
                    ? 'border-primary text-primary bg-surface'
                    : 'border-transparent text-text-muted hover:text-text-primary'
                }`}
              >
                Kelola Seksi
              </button>
            </div>

            {/* TAB 1: PENGATURAN UMUM */}
            {activeTab === 'settings' && (
              <div className="p-5 space-y-5 text-xs">
                {/* Judul Undangan */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label htmlFor="formTitle" className="font-semibold text-text-primary">
                      Judul Undangan
                    </label>
                    <span className="text-[11px] text-text-subtle font-mono">
                      {draftTitle.length}/120
                    </span>
                  </div>
                  <input
                    id="formTitle"
                    type="text"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    required
                    maxLength={120}
                    placeholder="Contoh: Pernikahan Romeo & Juliet"
                    className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                  />
                  <p className="text-[11px] text-text-subtle">
                    Judul ini tampil sebagai tajuk utama pada sampul undangan.
                  </p>
                </div>

                {/* Slug Tautan Kustom */}
                <div className="space-y-1">
                  <label htmlFor="formSlug" className="font-semibold text-text-primary block">
                    Tautan Kustom (Slug)
                  </label>
                  <div className="flex items-center">
                    <span className="py-2 px-2.5 bg-surface-elevated border border-r-0 border-border rounded-l text-text-muted text-xs font-mono">
                      /i/
                    </span>
                    <input
                      id="formSlug"
                      type="text"
                      value={draftSlug}
                      onChange={(e) =>
                        setDraftSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, '')
                        )
                      }
                      required
                      minLength={3}
                      maxLength={60}
                      pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
                      placeholder="romeo-juliet"
                      className="flex-1 py-2 px-3 border border-border rounded-r bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-text-subtle">
                    Hanya gunakan huruf kecil, angka, dan tanda hubung (-). Panjang 3 sampai 60 karakter.
                  </p>
                </div>

                {/* Jenis Acara */}
                <div className="space-y-1">
                  <label htmlFor="formEventType" className="font-semibold text-text-primary block">
                    Jenis Acara
                  </label>
                  <select
                    id="formEventType"
                    value={draftEventType}
                    onChange={(e) => setDraftEventType(e.target.value)}
                    className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
                  >
                    <option value="wedding">Pernikahan (Wedding)</option>
                    <option value="engagement">Pertunangan / Lamaran (Engagement)</option>
                    <option value="birthday">Ulang Tahun (Birthday)</option>
                    <option value="reception">Resepsi / Syukuran</option>
                    <option value="event">Acara Khusus / Lainnya</option>
                  </select>
                </div>

                {/* Sakelar Fitur Interaktif */}
                <div className="pt-3 border-t border-border space-y-3">
                  <span className="font-semibold text-text-primary block text-xs">
                    Fitur Interaktif Tamu
                  </span>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftAllowRsvp}
                      onChange={(e) => setDraftAllowRsvp(e.target.checked)}
                      className="mt-0.5 rounded border-border text-primary focus:ring-0"
                    />
                    <div>
                      <span className="font-medium text-text-primary block">
                        Konfirmasi Kehadiran (RSVP)
                      </span>
                      <span className="text-[11px] text-text-subtle leading-relaxed block">
                        Izinkan tamu untuk mengonfirmasi kehadiran mereka melalui formulir undangan.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={draftShowWishes}
                      onChange={(e) => setDraftShowWishes(e.target.checked)}
                      className="mt-0.5 rounded border-border text-primary focus:ring-0"
                    />
                    <div>
                      <span className="font-medium text-text-primary block">
                        Buku Ucapan &amp; Doa Tamu
                      </span>
                      <span className="text-[11px] text-text-subtle leading-relaxed block">
                        Tampilkan seksi ucapan selamat dan doa restu dari para tamu undangan.
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* TAB 2: MEMPELAI & TUAN RUMAH */}
            {activeTab === 'content' && (
              <div className="p-5 space-y-5 text-xs">
                {/* Mempelai Pria */}
                <div className="space-y-3 p-3.5 border border-border rounded bg-surface-elevated/40">
                  <h3 className="font-semibold text-text-primary text-xs uppercase tracking-wider">
                    Calon Mempelai Pria
                  </h3>

                  <div className="space-y-1">
                    <label htmlFor="groomName" className="font-medium text-text-primary block">
                      Nama Lengkap / Panggilan
                    </label>
                    <input
                      id="groomName"
                      type="text"
                      value={draftGroomName}
                      onChange={(e) => setDraftGroomName(e.target.value)}
                      placeholder="Contoh: Raden Satria Pratama"
                      className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="groomBio" className="font-medium text-text-primary block">
                      Keterangan / Informasi Keluarga
                    </label>
                    <input
                      id="groomBio"
                      type="text"
                      value={draftGroomBio}
                      onChange={(e) => setDraftGroomBio(e.target.value)}
                      placeholder="Contoh: Putra pertama dari Bpk. Hartono & Ibu Nurul"
                      className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                    />
                  </div>
                </div>

                {/* Mempelai Wanita */}
                <div className="space-y-3 p-3.5 border border-border rounded bg-surface-elevated/40">
                  <h3 className="font-semibold text-text-primary text-xs uppercase tracking-wider">
                    Calon Mempelai Wanita
                  </h3>

                  <div className="space-y-1">
                    <label htmlFor="brideName" className="font-medium text-text-primary block">
                      Nama Lengkap / Panggilan
                    </label>
                    <input
                      id="brideName"
                      type="text"
                      value={draftBrideName}
                      onChange={(e) => setDraftBrideName(e.target.value)}
                      placeholder="Contoh: Dewi Larasati Putri"
                      className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="brideBio" className="font-medium text-text-primary block">
                      Keterangan / Informasi Keluarga
                    </label>
                    <input
                      id="brideBio"
                      type="text"
                      value={draftBrideBio}
                      onChange={(e) => setDraftBrideBio(e.target.value)}
                      placeholder="Contoh: Putri kedua dari Bpk. Surya & Ibu Ratna"
                      className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                    />
                  </div>
                </div>

                {/* Pesan Penutup & Kutipan */}
                <div className="space-y-1 pt-2">
                  <label htmlFor="closingNotes" className="font-semibold text-text-primary block">
                    Pesan Penutup atau Kutipan
                  </label>
                  <textarea
                    id="closingNotes"
                    rows={4}
                    value={draftClosingNotes}
                    onChange={(e) => setDraftClosingNotes(e.target.value)}
                    placeholder="Contoh: Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir untuk memberikan doa restu kepada kedua mempelai."
                    className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs leading-relaxed"
                  />
                  <p className="text-[11px] text-text-subtle">
                    Pesan ini akan ditampilkan pada seksi penutup undangan.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: KELOLA SEKSI */}
            {activeTab === 'sections' && (
              <div className="p-5 space-y-4 text-xs">
                <div className="space-y-1">
                  <h3 className="font-semibold text-text-primary">
                    Tata Letak &amp; Urutan Seksi
                  </h3>
                  <p className="text-text-muted leading-relaxed">
                    Atur seksi yang tampil pada halaman undangan. Perubahan posisi atau status aktif dapat dipratinjau langsung di sisi kanan.
                  </p>
                </div>

                {draftSections.length === 0 ? (
                  <div className="p-4 border border-dashed border-border rounded text-center text-text-muted">
                    Seksi belum diinisialisasi dari template master.
                  </div>
                ) : (
                  <div className="divide-y divide-border border border-border rounded overflow-hidden">
                    {draftSections.map((section, index) => {
                      const meta = SECTION_METADATA[section.section_type] || {
                        label: section.section_type,
                        description: 'Seksi kustom undangan',
                      };

                      return (
                        <div
                          key={section.id}
                          className="p-3.5 flex items-center justify-between gap-3 hover:bg-surface-elevated transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Tombol Urutan Atas / Bawah */}
                            <div className="flex flex-col gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleMoveSectionUp(index)}
                                disabled={index === 0}
                                aria-label={`Pindahkan seksi ${meta.label} ke atas`}
                                className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed border border-border rounded text-[10px] bg-surface"
                              >
                                &uarr;
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveSectionDown(index)}
                                disabled={index === draftSections.length - 1}
                                aria-label={`Pindahkan seksi ${meta.label} ke bawah`}
                                className="w-5 h-5 flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed border border-border rounded text-[10px] bg-surface"
                              >
                                &darr;
                              </button>
                            </div>

                            <span className="font-mono text-text-subtle text-[11px] w-5">
                              #{index + 1}
                            </span>

                            <div className="truncate">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-text-primary">
                                  {meta.label}
                                </span>
                                <span
                                  className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.2 rounded border ${
                                    section.is_enabled
                                      ? 'border-success/30 bg-success/10 text-success'
                                      : 'border-border bg-surface-elevated text-text-subtle'
                                  }`}
                                >
                                  {section.is_enabled ? 'Aktif' : 'Nonaktif'}
                                </span>
                              </div>
                              <p className="text-[11px] text-text-subtle truncate">
                                {meta.description}
                              </p>
                            </div>
                          </div>

                          {/* Tombol Sakelar Aktif/Nonaktif */}
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              checked={section.is_enabled}
                              onChange={() => handleToggleSection(section.id)}
                              className="sr-only peer"
                            />
                            <div className="w-8 h-4 bg-surface-elevated border border-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-subtle peer-checked:after:bg-white after:border-border after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Kolom Kanan: Panel Pratinjau Desain Langsung (Live Preview) */}
        {showPreviewDesktop && (
          <div
            className={`lg:col-span-7 ${
              mobileView === 'editor' ? 'hidden lg:block' : 'block'
            } space-y-3 sticky top-6`}
          >
            <div className="border border-border rounded overflow-hidden shadow-sm bg-background">
              {/* Header Panel Pratinjau */}
              <div className="py-2.5 px-4 bg-surface-elevated border-b border-border flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-text-primary">
                    Pratinjau Langsung
                  </span>
                  <span className="px-2 py-0.5 rounded border border-border bg-surface text-[10px] uppercase font-semibold text-text-muted">
                    {previewConfig?.template?.name ?? 'Classic Elegance'}
                  </span>
                </div>

                {/* Sakelar Tampilan Lebar Desktop vs Ponsel */}
                <div className="flex items-center gap-1 bg-surface border border-border rounded p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`py-0.5 px-2 rounded transition-colors cursor-pointer ${
                      previewDevice === 'desktop'
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    Layar Lebar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`py-0.5 px-2 rounded transition-colors cursor-pointer ${
                      previewDevice === 'mobile'
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    Layar Ponsel
                  </button>
                </div>
              </div>

              {/* Area Renderer Undangan (Responsif terhadap draft lokal) */}
              <div
                className={`max-h-[720px] overflow-y-auto ${
                  previewDevice === 'mobile' ? 'p-6 flex justify-center bg-surface-elevated/60' : ''
                }`}
              >
                <div
                  className={
                    previewDevice === 'mobile'
                      ? 'w-[390px] border border-border rounded-xl overflow-hidden shadow-md bg-background'
                      : 'w-full'
                  }
                >
                  {liveInvitation ? (
                    <InvitationRenderer
                      invitation={liveInvitation}
                      template={previewConfig?.template}
                      customSections={draftSections}
                      content={liveContent}
                      events={previewConfig?.events}
                      gallery={previewConfig?.gallery}
                    />
                  ) : (
                    <div className="py-24 text-center text-xs text-text-muted">
                      Menyiapkan pratinjau...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Modal Konfirmasi Publikasi */}
      {publishModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 shadow-lg space-y-4">
            <h2 className="font-serif text-xl font-bold text-primary">
              Publikasikan Undangan
            </h2>

            {publishValidationErrors.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs text-danger font-medium leading-relaxed">
                  Undangan belum memenuhi syarat minimum untuk dipublikasikan:
                </p>
                <ul className="list-disc list-inside text-xs text-danger space-y-1 p-3 bg-danger/10 border border-danger/30 rounded">
                  {publishValidationErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setPublishModalOpen(false)}
                    className="py-1.5 px-4 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-primary rounded transition-colors cursor-pointer"
                  >
                    Tutup dan Perbaiki
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-text-muted leading-relaxed">
                  Undangan Anda akan dapat diakses secara publik melalui tautan:
                </p>
                <div className="p-2.5 bg-surface-elevated border border-border rounded font-mono text-xs text-text-primary">
                  /i/{draftSlug}
                </div>
                <p className="text-[11px] text-text-subtle leading-relaxed">
                  Tamu yang memiliki tautan dapat membuka undangan ini secara langsung. Anda dapat mengembalikan status ke draf kapan saja.
                </p>

                <div className="pt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPublishModalOpen(false)}
                    disabled={isPublishing}
                    className="py-1.5 px-3 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-muted rounded transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPublish}
                    disabled={isPublishing}
                    className="py-1.5 px-4 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isPublishing ? 'Mempublikasikan...' : 'Ya, Publikasikan Sekarang'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Modal Sukses Publikasi */}
      {publishSuccessModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 shadow-lg space-y-4 text-center">
            <h2 className="font-serif text-2xl font-bold text-primary">
              Undangan Telah Terbit
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Undangan pernikahan Anda telah aktif dan siap dibagikan kepada keluarga serta para tamu.
            </p>

            <div className="p-3 bg-surface-elevated border border-border rounded text-xs font-mono text-text-primary break-all">
              {window.location.origin}/i/{draftSlug}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full sm:w-auto py-2 px-4 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-primary rounded transition-colors cursor-pointer"
              >
                {linkCopied ? 'Tautan Disalin!' : 'Salin Tautan'}
              </button>
              <Link
                to={`/i/${draftSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto py-2 px-4 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors inline-block"
              >
                Buka Halaman Publik &rarr;
              </Link>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setPublishSuccessModalOpen(false)}
                className="text-xs text-text-muted hover:text-text-primary underline cursor-pointer"
              >
                Kembali ke Ruang Editor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal Konfirmasi Pembatalan Publikasi (Unpublish) */}
      {unpublishModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 shadow-lg space-y-4">
            <h2 className="font-serif text-xl font-bold text-primary">
              Batalkan Publikasi Undangan?
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Halaman publik <strong className="font-mono text-text-primary">/i/{draftSlug}</strong> tidak akan dapat diakses oleh pengunjung umum hingga Anda mempublikasikannya kembali. Seluruh data undangan tetap tersimpan dengan aman.
            </p>

            {unpublishError && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded text-xs text-danger">
                {unpublishError}
              </div>
            )}

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setUnpublishModalOpen(false)}
                disabled={isUnpublishing}
                className="py-1.5 px-3 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-muted rounded transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmUnpublish}
                disabled={isUnpublishing}
                className="py-1.5 px-4 bg-danger hover:bg-danger/90 text-danger-foreground text-xs font-semibold rounded transition-colors cursor-pointer disabled:opacity-50"
              >
                {isUnpublishing ? 'Memproses...' : 'Ya, Kembalikan ke Draf'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal Konfirmasi Hapus Undangan */}
      {deleteModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 shadow-lg space-y-4">
            <h2 className="font-serif text-xl font-bold text-danger">
              Hapus Undangan Ini?
            </h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Seluruh data undangan, termasuk konten mempelai, konfigurasi seksi, dan agenda acara yang terhubung akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                className="py-1.5 px-3 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-muted rounded transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="py-1.5 px-4 bg-danger hover:bg-danger/90 text-danger-foreground text-xs font-semibold rounded transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Menghapus...' : 'Ya, Hapus Undangan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
