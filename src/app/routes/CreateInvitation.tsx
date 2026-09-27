import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  createInvitation,
  suggestSlugFromTitle,
} from '@/lib/invitations';
import { type TemplateListItem, getAllTemplates } from '@/lib/templates';
import type { TemplateTheme } from '@/lib/template/types';

export type WizardStep = 'template' | 'info' | 'review';

export const EVENT_TYPE_OPTIONS = [
  { value: 'Pernikahan', label: 'Pernikahan', description: 'Akad nikah, pemberkatan, dan resepsi pernikahan' },
  { value: 'Pertunangan / Lamaran', label: 'Pertunangan / Lamaran', description: 'Acara tunangan, lamaran, atau sangjit' },
  { value: 'Ulang Tahun', label: 'Ulang Tahun', description: 'Peringatan hari lahir, sweet seventeen, atau syukuran' },
  { value: 'Resepsi', label: 'Resepsi', description: 'Jamuan makan dan perayaan bersama keluarga & kolega' },
  { value: 'Acara Khusus', label: 'Acara Khusus', description: 'Syukuran, gathering, perayaan dinas, atau peringatan khusus' },
] as const;

export function CreateInvitation() {
  const navigate = useNavigate();

  // Wizard Step State
  const [currentStep, setCurrentStep] = useState<WizardStep>('template');

  // Step 1: Template State
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templateFetchError, setTemplateFetchError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Step 2: Basic Info State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [eventType, setEventType] = useState<string>('Pernikahan');
  const [coupleNames, setCoupleNames] = useState('');

  // Submission & Validation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Ambil seluruh template dari tabel public.templates dalam 1 query
  const fetchTemplates = () => {
    let isMounted = true;
    setLoadingTemplates(true);
    setTemplateFetchError(null);

    getAllTemplates()
      .then((data) => {
        if (isMounted) {
          setTemplates(data);
          const firstActive = data.find((t) => t.is_active);
          if (firstActive) {
            setSelectedTemplateId((prev) => prev || firstActive.id);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setTemplateFetchError('Gagal memuat katalog template. Periksa koneksi internet Anda dan coba lagi.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoadingTemplates(false);
        }
      });

    return () => {
      isMounted = false;
    };
  };

  useEffect(() => {
    const cleanup = fetchTemplates();
    return cleanup;
  }, []);

  // Fokuskan input judul saat berpindah ke Langkah 2
  useEffect(() => {
    if (currentStep === 'info') {
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Otomatis hasilkan saran slug dari judul jika belum diedit manual
  const handleTitleChange = (val: string) => {
    setTitle(val);
    setErrorMessage(null);
    if (!isSlugManuallyEdited) {
      const suggested = suggestSlugFromTitle(val);
      setSlug(suggested);
    }
  };

  const handleSlugChange = (val: string) => {
    setIsSlugManuallyEdited(true);
    setErrorMessage(null);
    setSlug(val.toLowerCase().trim());
  };

  // Objek template terpilih
  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || null;
  }, [templates, selectedTemplateId]);

  // Evaluasi slug real-time secara lokal (tanpa request network per-keystroke)
  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  const cleanSlug = slug.trim().toLowerCase();
  const isSlugEmpty = cleanSlug.length === 0;
  const isSlugTooShort = cleanSlug.length > 0 && cleanSlug.length < 3;
  const isSlugTooLong = cleanSlug.length > 60;
  const isSlugFormatValid = slugRegex.test(cleanSlug);
  const isSlugValid = !isSlugEmpty && !isSlugTooShort && !isSlugTooLong && isSlugFormatValid;

  // Validasi Langkah 1
  const validateStep1 = (): boolean => {
    setErrorMessage(null);
    if (!selectedTemplateId) {
      setErrorMessage('Silakan pilih salah satu template desain yang tersedia.');
      return false;
    }
    const target = templates.find((t) => t.id === selectedTemplateId);
    if (!target || !target.is_active) {
      setErrorMessage('Template yang dipilih sedang tidak aktif dan belum dapat digunakan.');
      return false;
    }
    return true;
  };

  // Validasi Langkah 2
  const validateStep2 = (): boolean => {
    setErrorMessage(null);
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMessage('Judul undangan wajib diisi.');
      return false;
    }
    if (cleanTitle.length > 120) {
      setErrorMessage('Judul undangan maksimal 120 karakter.');
      return false;
    }

    if (!cleanSlug) {
      setErrorMessage('Tautan (slug) publik wajib diisi.');
      return false;
    }
    if (cleanSlug.length < 3 || cleanSlug.length > 60 || !slugRegex.test(cleanSlug)) {
      setErrorMessage(
        'Format tautan (slug) harus berupa huruf kecil, angka, dan tanda hubung (-) dengan panjang 3 sampai 60 karakter.'
      );
      return false;
    }

    return true;
  };

  const handleNextFromStep1 = () => {
    if (validateStep1()) {
      setCurrentStep('info');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNextFromStep2 = () => {
    if (validateStep2()) {
      setCurrentStep('review');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmitFinal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (!validateStep1() || !validateStep2()) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const created = await createInvitation({
        title: title.trim(),
        templateId: selectedTemplateId,
        slug: slug.trim().toLowerCase(),
        eventType,
        coupleNames: coupleNames.trim(),
      });

      // Berhasil dibuat: arahkan ke editor undangan
      navigate(`/dashboard/invitations/${created.id}`, {
        state: { flashMessage: 'Undangan berhasil dibuat' },
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Terjadi kendala saat membuat undangan. Silakan coba kembali.');
      }
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors mb-2 min-h-[36px]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Kembali ke Dashboard</span>
          </Link>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary tracking-tight">
            Buat Undangan Baru
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Rancang undangan digital pernikahan Anda dalam 3 langkah terstruktur.
          </p>
        </div>

        {/* Step Indicator */}
        <nav aria-label="Tahapan Pembuatan Undangan" className="bg-surface border border-border rounded-xl p-1.5 shadow-2xs self-start sm:self-auto">
          <ol className="flex items-center gap-1 sm:gap-2">
            <li>
              <button
                type="button"
                onClick={() => !isSubmitting && setCurrentStep('template')}
                className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all min-h-[40px] cursor-pointer ${
                  currentStep === 'template'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : selectedTemplateId
                    ? 'text-text-primary hover:bg-surface-elevated'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                aria-current={currentStep === 'template' ? 'step' : undefined}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentStep === 'template'
                    ? 'bg-primary-foreground text-primary'
                    : selectedTemplateId
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-border text-text-muted'
                }`}>
                  {selectedTemplateId && currentStep !== 'template' ? '✓' : '1'}
                </span>
                <span>Template</span>
              </button>
            </li>
            <li className="text-text-subtle font-mono text-xs select-none">/</li>
            <li>
              <button
                type="button"
                onClick={() => !isSubmitting && validateStep1() && setCurrentStep('info')}
                disabled={!selectedTemplateId}
                className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all min-h-[40px] ${
                  currentStep === 'info'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : isSlugValid && title.trim().length > 0
                    ? 'text-text-primary hover:bg-surface-elevated cursor-pointer'
                    : 'text-text-muted hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
                }`}
                aria-current={currentStep === 'info' ? 'step' : undefined}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentStep === 'info'
                    ? 'bg-primary-foreground text-primary'
                    : isSlugValid && title.trim().length > 0 && currentStep === 'review'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-border text-text-muted'
                }`}>
                  {isSlugValid && title.trim().length > 0 && currentStep === 'review' ? '✓' : '2'}
                </span>
                <span>Informasi</span>
              </button>
            </li>
            <li className="text-text-subtle font-mono text-xs select-none">/</li>
            <li>
              <button
                type="button"
                onClick={() => !isSubmitting && validateStep1() && validateStep2() && setCurrentStep('review')}
                disabled={!selectedTemplateId || !title.trim() || !isSlugValid}
                className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all min-h-[40px] ${
                  currentStep === 'review'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-text-muted hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
                }`}
                aria-current={currentStep === 'review' ? 'step' : undefined}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentStep === 'review'
                    ? 'bg-primary-foreground text-primary'
                    : 'bg-border text-text-muted'
                }`}>
                  3
                </span>
                <span>Konfirmasi</span>
              </button>
            </li>
          </ol>
        </nav>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="p-4 bg-danger/10 border border-danger/30 rounded-xl text-xs sm:text-sm text-danger font-medium leading-relaxed flex items-start gap-3"
        >
          <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="font-semibold">Perhatian</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* STEP 1: PILIH TEMPLATE */}
      {currentStep === 'template' && (
        <section aria-labelledby="step-1-heading" className="space-y-6">
          <div className="space-y-1">
            <h2 id="step-1-heading" className="font-serif text-xl sm:text-2xl font-bold text-primary">
              Langkah 1: Pilih Desain Template
            </h2>
            <p className="text-xs sm:text-sm text-text-muted">
              Pilih gaya dasar undangan digital. Seluruh template mengusung tipografi editorial dan dapat disesuaikan di editor.
            </p>
          </div>

          {loadingTemplates ? (
            <div className="py-20 text-center space-y-3 bg-surface border border-border rounded-xl" role="status">
              <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs sm:text-sm text-text-muted">Memuat katalog template resmi...</p>
            </div>
          ) : templateFetchError ? (
            <div role="alert" className="p-8 bg-danger/10 border border-danger/30 rounded-xl text-center space-y-3">
              <p className="text-xs sm:text-sm text-danger font-medium">{templateFetchError}</p>
              <button
                type="button"
                onClick={fetchTemplates}
                className="px-4 py-2 bg-surface border border-danger/40 text-danger text-xs font-semibold rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer min-h-[44px]"
              >
                Coba Lagi
              </button>
            </div>
          ) : templates.length === 0 ? (
            <div className="p-12 border border-border rounded-xl bg-surface text-center space-y-2" role="status">
              <p className="font-serif text-lg font-semibold text-primary">
                Belum ada template yang tersedia
              </p>
              <p className="text-xs sm:text-sm text-text-muted">
                Saat ini belum ada data template di dalam sistem. Hubungi administrator platform.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" role="radiogroup" aria-label="Daftar template desain">
              {templates.map((tpl) => {
                const isSelected = selectedTemplateId === tpl.id;
                const isActive = tpl.is_active;
                const themeObj = (typeof tpl.default_theme === 'object' && tpl.default_theme !== null
                  ? tpl.default_theme
                  : {}) as TemplateTheme;

                const previewBg = themeObj.color_background || '#FAF9F6';
                const previewText = themeObj.color_primary || '#292524';
                const previewBorder = themeObj.color_border || '#E7E5E0';
                const previewFont = themeObj.font_heading || 'Cormorant Garamond, serif';

                return (
                  <div
                    key={tpl.id}
                    onClick={() => {
                      if (isActive) {
                        setSelectedTemplateId(tpl.id);
                        setErrorMessage(null);
                      }
                    }}
                    className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/80 bg-surface shadow-md'
                        : isActive
                        ? 'border-border bg-surface hover:border-border-strong hover:shadow-sm'
                        : 'border-border bg-surface/50 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {/* Visual Typographic Preview Aktual (menggunakan token tema aktual template) */}
                    <div
                      className="relative p-6 border-b flex flex-col items-center justify-between text-center select-none min-h-[180px]"
                      style={{
                        backgroundColor: previewBg,
                        color: previewText,
                        borderColor: previewBorder,
                      }}
                    >
                      <div className="w-full flex items-center justify-between text-[10px] uppercase tracking-widest font-semibold opacity-70">
                        <span>Pernikahan</span>
                        <span>{tpl.category}</span>
                      </div>

                      <div className="my-auto space-y-1.5 py-4">
                        <p
                          className="text-2xl font-normal leading-tight tracking-wide"
                          style={{ fontFamily: previewFont }}
                        >
                          Sarah &amp; Rizky
                        </p>
                        <p className="text-xs opacity-75 font-sans">
                          {tpl.name}
                        </p>
                      </div>

                      <div className="w-full flex items-center justify-between text-[10px] opacity-70 font-mono">
                        <span>slug: {tpl.slug}</span>
                        {isActive ? (
                          <span className="text-emerald-700 font-semibold font-sans">Aktif</span>
                        ) : (
                          <span className="text-text-subtle font-sans">Tidak Aktif</span>
                        )}
                      </div>
                    </div>

                    {/* Metadata & Selection Button */}
                    <div className="p-4 sm:p-5 space-y-3 bg-surface">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-serif text-base sm:text-lg font-bold text-primary">
                            {tpl.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-surface-elevated border border-border text-text-subtle">
                            {tpl.category}
                          </span>
                        </div>
                        {tpl.description && (
                          <p className="text-xs text-text-muted mt-1 leading-relaxed line-clamp-2">
                            {tpl.description}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={!isActive}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isActive) {
                            setSelectedTemplateId(tpl.id);
                            setErrorMessage(null);
                          }
                        }}
                        className={`w-full py-2.5 px-4 rounded-lg text-xs font-semibold transition-colors cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5 ${
                          !isActive
                            ? 'bg-border text-text-muted cursor-not-allowed'
                            : isSelected
                            ? 'bg-primary text-primary-foreground shadow-xs'
                            : 'bg-surface border border-primary/40 text-primary hover:bg-surface-elevated'
                        }`}
                      >
                        {!isActive ? (
                          <span>Template Tidak Aktif</span>
                        ) : isSelected ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Template Terpilih</span>
                          </>
                        ) : (
                          <span>Gunakan Template Ini</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Bar */}
          <div className="pt-4 border-t border-border flex justify-end">
            <button
              type="button"
              onClick={handleNextFromStep1}
              disabled={!selectedTemplateId}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer min-h-[44px]"
            >
              <span>Lanjut ke Informasi Dasar</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </section>
      )}

      {/* STEP 2: INFORMASI DASAR */}
      {currentStep === 'info' && (
        <section aria-labelledby="step-2-heading" className="space-y-6 max-w-2xl mx-auto">
          <div className="space-y-1">
            <h2 id="step-2-heading" className="font-serif text-xl sm:text-2xl font-bold text-primary">
              Langkah 2: Informasi Dasar Undangan
            </h2>
            <p className="text-xs sm:text-sm text-text-muted">
              Isi informasi utama yang akan digunakan untuk mengidentifikasi dan membagikan undangan Anda.
            </p>
          </div>

          {/* Selected Template Badge Banner */}
          {selectedTemplate && (
            <div className="p-4 bg-surface border border-border rounded-xl flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg overflow-hidden border border-border flex items-center justify-center flex-shrink-0 bg-stone-900">
                  <img src="/favicon.svg" alt="Aurovia" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-text-primary truncate">
                    Template: {selectedTemplate.name}
                  </p>
                  <p className="text-[11px] text-text-subtle uppercase tracking-wider font-mono">
                    Kategori: {selectedTemplate.category}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep('template')}
                className="text-xs text-primary hover:underline font-semibold flex-shrink-0 cursor-pointer min-h-[40px] px-2 flex items-center"
              >
                Ganti Desain
              </button>
            </div>
          )}

          <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
            {/* Judul Undangan */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="create-title-input" className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Judul Undangan <span className="text-danger">*</span>
                </label>
                <span className="text-[11px] text-text-subtle font-mono">
                  {title.length}/120
                </span>
              </div>
              <input
                id="create-title-input"
                ref={titleInputRef}
                type="text"
                required
                maxLength={120}
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                disabled={isSubmitting}
                placeholder="Contoh: Pernikahan Sarah & Rizky"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-subtle/50 focus:border-primary focus:outline-none transition-colors disabled:opacity-60 min-h-[44px]"
              />
              <p className="text-[11px] text-text-subtle">
                Judul ini menjadi nama proyek undangan dan dapat diperbarui sewaktu-waktu di dalam editor.
              </p>
            </div>

            {/* Nama Mempelai / Tuan Rumah */}
            <div className="space-y-1.5">
              <label htmlFor="create-couple-input" className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
                Nama Mempelai / Tuan Rumah
              </label>
              <input
                id="create-couple-input"
                type="text"
                maxLength={100}
                value={coupleNames}
                onChange={(e) => setCoupleNames(e.target.value)}
                disabled={isSubmitting}
                placeholder="Contoh: Sarah & Rizky atau Keluarga Besar Sastro"
                className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-subtle/50 focus:border-primary focus:outline-none transition-colors disabled:opacity-60 min-h-[44px]"
              />
              <p className="text-[11px] text-text-subtle">
                Nama ini akan dicantumkan secara otomatis pada sampul dan sambutan pembuka undangan.
              </p>
            </div>

            {/* Jenis Acara */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
                Jenis Acara
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label="Pilihan Jenis Acara">
                {EVENT_TYPE_OPTIONS.map((opt) => {
                  const isSelected = eventType === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all min-h-[44px] ${
                        isSelected
                          ? 'border-primary bg-surface-elevated ring-1 ring-primary/80'
                          : 'border-border bg-surface hover:border-border-strong'
                      }`}
                    >
                      <input
                        type="radio"
                        name="event-type-selection"
                        value={opt.value}
                        checked={isSelected}
                        onChange={() => setEventType(opt.value)}
                        className="mt-0.5 text-primary focus:ring-primary h-4 w-4 border-border"
                      />
                      <div className="min-w-0">
                        <span className="block text-xs font-semibold text-text-primary">
                          {opt.label}
                        </span>
                        <span className="block text-[11px] text-text-muted mt-0.5 leading-snug">
                          {opt.description}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Tautan Publik (Slug) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="create-slug-input" className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Tautan Publik (Slug) <span className="text-danger">*</span>
                </label>
              </div>

              <div className="flex rounded-lg border border-border bg-background overflow-hidden focus-within:border-primary transition-colors min-h-[44px]">
                <span className="px-3.5 py-2.5 bg-surface-elevated border-r border-border text-xs text-text-subtle select-none font-mono flex items-center">
                  /i/
                </span>
                <input
                  id="create-slug-input"
                  type="text"
                  required
                  maxLength={60}
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="sarah-rizky-wedding"
                  className="w-full px-3.5 py-2 bg-transparent text-sm text-text-primary placeholder:text-text-subtle/50 font-mono focus:outline-none disabled:opacity-60"
                />
              </div>

              {/* Feedback Validasi Real-time Lokal */}
              <div className="flex items-center justify-between text-[11px] pt-0.5">
                {isSlugEmpty ? (
                  <span className="text-text-subtle">
                    Tautan publik wajib diisi (minimal 3 karakter).
                  </span>
                ) : isSlugTooShort ? (
                  <span className="text-amber-700 font-medium">
                    Panjang tautan minimal 3 karakter.
                  </span>
                ) : isSlugTooLong ? (
                  <span className="text-danger font-medium">
                    Panjang tautan maksimal 60 karakter.
                  </span>
                ) : !isSlugFormatValid ? (
                  <span className="text-danger font-medium">
                    Gunakan format huruf kecil (a-z), angka (0-9), dan tanda hubung (-).
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Format tautan publik valid</span>
                  </span>
                )}
                <span className="text-text-subtle font-mono">{slug.length}/60</span>
              </div>

              {/* Preview URL Box */}
              <div className="p-3 bg-surface-elevated border border-border rounded-xl flex items-center gap-2 text-xs">
                <span className="text-text-subtle font-sans text-[11px]">Pratinjau URL:</span>
                <span className="font-mono text-primary font-medium truncate">
                  aurovia-creative.vercel.app/i/{cleanSlug || 'tautan-anda'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep('template')}
              disabled={isSubmitting}
              className="px-4 py-2.5 border border-border hover:bg-surface-elevated text-xs sm:text-sm font-semibold text-text-primary rounded-lg transition-colors cursor-pointer min-h-[44px]"
            >
              Kembali
            </button>

            <button
              type="button"
              onClick={handleNextFromStep2}
              disabled={!title.trim() || !isSlugValid}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer min-h-[44px]"
            >
              <span>Lanjut ke Konfirmasi</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </section>
      )}

      {/* STEP 3: KONFIRMASI */}
      {currentStep === 'review' && (
        <section aria-labelledby="step-3-heading" className="space-y-6 max-w-2xl mx-auto">
          <div className="space-y-1">
            <h2 id="step-3-heading" className="font-serif text-xl sm:text-2xl font-bold text-primary">
              Langkah 3: Tinjau dan Konfirmasi
            </h2>
            <p className="text-xs sm:text-sm text-text-muted">
              Periksa ringkasan informasi sebelum membuat undangan. Undangan akan dibuat sebagai draf yang aman.
            </p>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-xs">
            {/* Ringkasan Template */}
            <div className="border-b border-border pb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-text-subtle font-sans">
                  Template Terpilih
                </span>
                <button
                  type="button"
                  onClick={() => setCurrentStep('template')}
                  disabled={isSubmitting}
                  className="text-xs text-primary hover:underline font-semibold cursor-pointer min-h-[36px] flex items-center"
                >
                  Ubah Template
                </button>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-border flex items-center justify-center flex-shrink-0 bg-stone-900">
                  <img src="/favicon.svg" alt="Aurovia" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">
                    {selectedTemplate?.name || 'Template Aurovia'}
                  </p>
                  <p className="text-xs text-text-muted">
                    Kategori: {selectedTemplate?.category || 'Pernikahan'} (slug: {selectedTemplate?.slug})
                  </p>
                </div>
              </div>
            </div>

            {/* Ringkasan Informasi Dasar */}
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-text-muted">Judul Undangan:</span>
                <span className="font-semibold text-text-primary text-right max-w-xs truncate">
                  {title}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-border pb-3">
                <span className="text-text-muted">Jenis Acara:</span>
                <span className="font-semibold text-text-primary">
                  {eventType}
                </span>
              </div>

              {coupleNames && (
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <span className="text-text-muted">Nama Pasangan / Tuan Rumah:</span>
                  <span className="font-semibold text-text-primary text-right max-w-xs truncate">
                    {coupleNames}
                  </span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-border pb-3">
                <span className="text-text-muted">Tautan Publik:</span>
                <span className="font-mono text-xs text-primary font-semibold truncate">
                  aurovia-creative.vercel.app/i/{cleanSlug}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-text-muted">Status Awal:</span>
                <span className="px-2.5 py-1 bg-surface-elevated border border-border rounded-md text-[11px] font-semibold text-text-subtle uppercase tracking-wider">
                  Draft (Belum Publik)
                </span>
              </div>
            </div>

            {/* Catatan Editor */}
            <div className="p-3.5 bg-surface-elevated border border-border rounded-xl text-xs text-text-muted leading-relaxed">
              Setelah dibuat, Anda akan langsung diarahkan ke Editor Undangan untuk melengkapi jadwal acara, kisah cinta, galeri foto, musik, dan daftar tamu undangan.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentStep('info')}
              disabled={isSubmitting}
              className="px-4 py-2.5 border border-border hover:bg-surface-elevated text-xs sm:text-sm font-semibold text-text-primary rounded-lg transition-colors cursor-pointer min-h-[44px]"
            >
              Kembali
            </button>

            <button
              type="button"
              onClick={() => handleSubmitFinal()}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer min-h-[44px]"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  <span>Sedang Menyiapkan Undangan...</span>
                </>
              ) : (
                <span>Buat Undangan</span>
              )}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
