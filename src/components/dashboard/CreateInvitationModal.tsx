import React, { useState, useEffect, useRef } from 'react';
import {
  type TemplateListItem,
  getActiveTemplates,
  createInvitation,
  suggestSlugFromTitle,
} from '@/lib/invitations';

interface CreateInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newInvitationId: string) => void;
}

export type WizardStep = 'template' | 'info' | 'review';

export const EVENT_TYPE_OPTIONS = [
  { value: 'Pernikahan', label: 'Pernikahan', description: 'Akad nikah, pemberkatan, dan resepsi pernikahan' },
  { value: 'Pertunangan / Lamaran', label: 'Pertunangan / Lamaran', description: 'Acara tunangan, lamaran, atau sangjit' },
  { value: 'Ulang Tahun', label: 'Ulang Tahun', description: 'Peringatan hari lahir, sweet seventeen, atau syukuran' },
  { value: 'Resepsi', label: 'Resepsi', description: 'Jamuan makan dan perayaan bersama keluarga & kolega' },
  { value: 'Acara Khusus', label: 'Acara Khusus', description: 'Syukuran, gathering, perayaan dinas, atau peringatan khusus' },
] as const;

export function CreateInvitationModal({
  isOpen,
  onClose,
  onCreated,
}: CreateInvitationModalProps) {
  // Wizard Step State
  const [currentStep, setCurrentStep] = useState<WizardStep>('template');

  // Step 1: Template State
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [templateFetchError, setTemplateFetchError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Step 2: Basic Info State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [eventType, setEventType] = useState<string>('Pernikahan');

  // Submission & Validation State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Load active templates from Supabase
  const fetchTemplates = () => {
    let isMounted = true;
    setLoadingTemplates(true);
    setTemplateFetchError(null);

    getActiveTemplates()
      .then((data) => {
        if (isMounted) {
          setTemplates(data);
          if (data.length > 0) {
            setSelectedTemplateId((prev) => prev || data[0]?.id || '');
          }
          setTemplatesLoaded(true);
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
    if (isOpen && !templatesLoaded) {
      const cleanup = fetchTemplates();
      return cleanup;
    }
  }, [isOpen, templatesLoaded]);

  // Reset form when modal opens or closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentStep('template');
      setTitle('');
      setSlug('');
      setIsSlugManuallyEdited(false);
      setEventType('Pernikahan');
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Focus title input when moving to Step 2
  useEffect(() => {
    if (isOpen && currentStep === 'info') {
      const timer = setTimeout(() => {
        titleInputRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentStep]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isSubmitting]);

  // Auto-generate slug suggestion from title if not manually edited
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

  // Selected template object
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || null;

  // Step Validation Logic
  const validateStep1 = (): boolean => {
    setErrorMessage(null);
    if (!selectedTemplateId) {
      setErrorMessage('Silakan pilih salah satu template desain yang tersedia.');
      return false;
    }
    const target = templates.find((t) => t.id === selectedTemplateId);
    if (!target || !target.is_active) {
      setErrorMessage('Template yang dipilih sedang tidak aktif.');
      return false;
    }
    return true;
  };

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

    const cleanSlug = slug.trim().toLowerCase();
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!cleanSlug) {
      setErrorMessage('Tautan (slug) undangan wajib diisi.');
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
    }
  };

  const handleNextFromStep2 = () => {
    if (validateStep2()) {
      setCurrentStep('review');
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
      });

      onCreated(created.id);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Terjadi kendala saat membuat undangan. Silakan coba kembali.');
      }
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleIn">
        {/* Modal Header */}
        <div className="px-6 py-4 sm:px-8 sm:py-5 border-b border-border flex items-center justify-between bg-surface">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-border/80 flex items-center justify-center shadow-2xs flex-shrink-0">
              <img src="/favicon.svg" alt="Aurovia" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 id="wizard-title" className="font-serif text-lg sm:text-xl font-bold text-primary">
                Buat Undangan Baru
              </h2>
              <p className="text-[11px] text-text-subtle font-sans">
                Langkah {currentStep === 'template' ? '1' : currentStep === 'info' ? '2' : '3'} dari 3
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Tutup pembuatan undangan"
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Step Indicator Progress Bar */}
        <div className="bg-surface-elevated border-b border-border px-6 sm:px-8 py-3">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto" role="tablist" aria-label="Langkah Pembuatan Undangan">
            {/* Step 1 Pill */}
            <button
              type="button"
              role="tab"
              aria-selected={currentStep === 'template'}
              onClick={() => !isSubmitting && setCurrentStep('template')}
              className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all text-left ${
                currentStep === 'template'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 'template'
                  ? 'bg-primary-foreground text-primary'
                  : 'bg-border text-text-muted'
              }`}>
                1
              </span>
              <span className="truncate hidden sm:inline">Pilih Desain</span>
              <span className="truncate sm:hidden">Desain</span>
            </button>

            {/* Step 2 Pill */}
            <button
              type="button"
              role="tab"
              aria-selected={currentStep === 'info'}
              onClick={() => !isSubmitting && validateStep1() && setCurrentStep('info')}
              disabled={!selectedTemplateId}
              className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all text-left ${
                currentStep === 'info'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 'info'
                  ? 'bg-primary-foreground text-primary'
                  : 'bg-border text-text-muted'
              }`}>
                2
              </span>
              <span className="truncate hidden sm:inline">Informasi Dasar</span>
              <span className="truncate sm:hidden">Info</span>
            </button>

            {/* Step 3 Pill */}
            <button
              type="button"
              role="tab"
              aria-selected={currentStep === 'review'}
              onClick={() => !isSubmitting && validateStep1() && validateStep2() && setCurrentStep('review')}
              disabled={!selectedTemplateId || !title.trim() || !slug.trim()}
              className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all text-left ${
                currentStep === 'review'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-text-muted hover:text-text-primary hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                currentStep === 'review'
                  ? 'bg-primary-foreground text-primary'
                  : 'bg-border text-text-muted'
              }`}>
                3
              </span>
              <span className="truncate hidden sm:inline">Konfirmasi</span>
              <span className="truncate sm:hidden">Review</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          {/* Global Step Error Notice */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="polite"
              className="p-3.5 bg-danger/10 border border-danger/30 rounded-xl text-xs text-danger font-medium leading-relaxed flex items-start gap-2 animate-fadeIn"
            >
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 1: PILIH DESAIN TEMPLATE                             */}
          {/* ======================================================== */}
          {currentStep === 'template' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="space-y-1">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-primary">
                  Langkah 1: Pilih Desain Undangan
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Pilih salah satu template dasar dari katalog resmi Aurovia untuk memulai undangan digital Anda.
                </p>
              </div>

              {loadingTemplates ? (
                <div
                  className="py-16 text-center space-y-3 bg-surface-elevated border border-border rounded-xl"
                  role="status"
                >
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-text-muted">Memuat katalog template resmi...</p>
                </div>
              ) : templateFetchError ? (
                <div
                  role="alert"
                  className="p-6 bg-danger/10 border border-danger/30 rounded-xl text-center space-y-3"
                >
                  <p className="text-xs text-danger font-medium">{templateFetchError}</p>
                  <button
                    type="button"
                    onClick={fetchTemplates}
                    className="px-4 py-1.5 bg-surface border border-danger/40 text-danger text-xs font-semibold rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer"
                  >
                    Coba Lagi
                  </button>
                </div>
              ) : templates.length === 0 ? (
                <div
                  className="p-8 border border-border rounded-xl bg-surface-elevated text-center space-y-2"
                  role="alert"
                >
                  <p className="font-serif text-base font-semibold text-primary">
                    Belum ada template aktif
                  </p>
                  <p className="text-xs text-text-muted">
                    Saat ini belum ada template undangan yang dapat dipilih. Hubungi pengelola platform.
                  </p>
                </div>
              ) : (
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
                  role="radiogroup"
                  aria-label="Daftar template desain"
                >
                  {templates.map((tpl) => {
                    const isSelected = selectedTemplateId === tpl.id;
                    const isActive = tpl.is_active;

                    return (
                      <div
                        key={tpl.id}
                        onClick={() => {
                          if (isActive) {
                            setSelectedTemplateId(tpl.id);
                            setErrorMessage(null);
                          }
                        }}
                        className={`group relative flex flex-col justify-between rounded-xl border transition-all cursor-pointer overflow-hidden ${
                          isSelected
                            ? 'border-primary ring-2 ring-primary/80 bg-surface shadow-md'
                            : 'border-border bg-surface hover:border-border-strong hover:shadow-xs'
                        } ${!isActive ? 'opacity-60 cursor-not-allowed' : ''}`}
                      >
                        {/* Visual Preview Container */}
                        <div className="relative h-44 w-full bg-gradient-to-b from-[#FAF9F6] to-[#F5F4F0] border-b border-border flex flex-col items-center justify-center p-4 text-center select-none overflow-hidden">
                          {/* Selected Checkmark Badge */}
                          {isSelected && (
                            <div className="absolute top-2.5 right-2.5 bg-primary text-primary-foreground px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase shadow-xs flex items-center gap-1 z-10">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Terpilih</span>
                            </div>
                          )}

                          {/* Typographic Preview Representation */}
                          <div className="w-9 h-9 rounded-lg overflow-hidden border border-stone-300 shadow-2xs mb-2 flex items-center justify-center bg-stone-900">
                            <img src="/favicon.svg" alt="Aurovia" className="w-full h-full object-cover" />
                          </div>
                          <span className="text-[9px] uppercase tracking-widest font-semibold text-text-subtle font-sans mb-0.5">
                            Koleksi Desain
                          </span>
                          <p className="font-serif italic text-lg text-primary font-normal line-clamp-1 px-2">
                            {tpl.name}
                          </p>
                          <span className="text-[10px] text-text-muted mt-1 font-mono">
                            /{tpl.slug}
                          </span>
                        </div>

                        {/* Card Information */}
                        <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <h4 className="font-serif font-bold text-base text-primary">
                                {tpl.name}
                              </h4>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Aktif
                                </span>
                                <span className="text-[9px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-surface-elevated text-text-muted border border-border">
                                  {tpl.category}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-text-muted leading-relaxed line-clamp-2">
                              {tpl.description}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isActive) {
                                setSelectedTemplateId(tpl.id);
                                setErrorMessage(null);
                              }
                            }}
                            className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-center ${
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-surface-elevated hover:bg-border text-text-primary border border-border'
                            }`}
                          >
                            {isSelected ? 'Desain Terpilih' : 'Pilih Template Ini'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 2: INFORMASI DASAR                                   */}
          {/* ======================================================== */}
          {currentStep === 'info' && (
            <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto">
              <div className="space-y-1">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-primary">
                  Langkah 2: Informasi Dasar Undangan
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Masukkan judul, tautan kustom (slug), serta kategori acara Anda.
                </p>
              </div>

              {/* Template Shortcut Banner */}
              {selectedTemplate && (
                <div className="p-3.5 bg-surface-elevated border border-border rounded-xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md overflow-hidden border border-border flex items-center justify-center flex-shrink-0 bg-stone-900">
                      <img src="/favicon.svg" alt="Aurovia" className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-text-primary truncate">
                        {selectedTemplate.name}
                      </p>
                      <p className="text-[10px] text-text-subtle uppercase tracking-wider">
                        Kategori: {selectedTemplate.category}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep('template')}
                    className="text-xs text-primary hover:underline font-semibold flex-shrink-0 cursor-pointer"
                  >
                    Ganti Desain
                  </button>
                </div>
              )}

              <div className="space-y-5">
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
                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-subtle/50 focus:border-primary focus:outline-none transition-colors disabled:opacity-60"
                  />
                  <p className="text-[11px] text-text-subtle">
                    Judul ini dapat diubah sewaktu-waktu di dalam editor undangan.
                  </p>
                </div>

                {/* Tautan Kustom (Slug) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="create-slug-input" className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
                      Tautan Publik (Slug) <span className="text-danger">*</span>
                    </label>
                    <span className="text-[11px] text-text-subtle font-mono">
                      {slug.length}/60
                    </span>
                  </div>
                  <div className="flex rounded-lg border border-border bg-background overflow-hidden focus-within:border-primary transition-colors">
                    <span className="px-3 py-2.5 bg-surface-elevated border-r border-border text-xs text-text-subtle select-none font-mono flex items-center">
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
                      placeholder="rizky-sarah-wedding"
                      className="w-full px-3 py-2 bg-transparent text-sm text-text-primary placeholder:text-text-subtle/50 font-mono focus:outline-none disabled:opacity-60"
                    />
                  </div>
                  <p className="text-[11px] text-text-subtle">
                    Hanya gunakan huruf kecil (a-z), angka (0-9), dan tanda hubung (-). Panjang 3 sampai 60 karakter.
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
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
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
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* STEP 3: KONFIRMASI & TINJAU                               */}
          {/* ======================================================== */}
          {currentStep === 'review' && (
            <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto">
              <div className="space-y-1">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-primary">
                  Langkah 3: Konfirmasi Pembuatan Undangan
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Tinjau ringkasan informasi undangan sebelum dibuat sebagai draf baru.
                </p>
              </div>

              {/* Review Summary Card */}
              <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-border pb-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-text-subtle">
                      Template Desain
                    </span>
                    <p className="font-serif text-base font-bold text-primary mt-0.5">
                      {selectedTemplate?.name || 'Classic Elegance'}
                    </p>
                    <span className="inline-block mt-1 text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-surface-elevated border border-border text-text-muted">
                      {selectedTemplate?.category || 'Wedding'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-text-subtle">
                      Jenis Acara
                    </span>
                    <p className="text-sm font-semibold text-text-primary mt-0.5">
                      {eventType}
                    </p>
                    <span className="inline-block mt-1 text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Status Awal: Draf
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-text-subtle">
                      Judul Undangan
                    </span>
                    <p className="font-serif text-lg font-bold text-primary mt-0.5">
                      {title}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-text-subtle">
                      Tautan Publik yang Disediakan
                    </span>
                    <p className="text-xs font-mono text-primary font-semibold mt-0.5 bg-surface-elevated p-2 rounded-lg border border-border truncate">
                      /i/{slug}
                    </p>
                    <p className="text-[10px] text-text-subtle mt-1">
                      Undangan hanya dapat diakses melalui tautan ini setelah Anda mempublikasikannya nanti dari editor.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-surface-elevated border border-border rounded-xl text-xs text-text-muted">
                <span>Ingin mengubah judul atau tautan sebelum menyimpan?</span>
                <button
                  type="button"
                  onClick={() => setCurrentStep('info')}
                  disabled={isSubmitting}
                  className="font-semibold text-primary hover:underline cursor-pointer"
                >
                  Ubah Informasi
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 sm:px-8 border-t border-border flex items-center justify-between bg-surface">
          <div>
            {currentStep === 'template' ? (
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-border hover:bg-surface-elevated text-text-muted text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 min-h-[38px]"
              >
                Batal
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 'review') setCurrentStep('info');
                  else if (currentStep === 'info') setCurrentStep('template');
                }}
                disabled={isSubmitting}
                className="px-4 py-2 border border-border hover:bg-surface-elevated text-text-primary text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 min-h-[38px] inline-flex items-center gap-1.5"
              >
                &larr; Kembali
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {currentStep === 'template' && (
              <button
                type="button"
                onClick={handleNextFromStep1}
                disabled={!selectedTemplateId || loadingTemplates || templates.length === 0}
                className="px-5 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[38px] inline-flex items-center gap-1.5"
              >
                <span>Lanjut: Informasi Dasar</span>
                <span>&rarr;</span>
              </button>
            )}

            {currentStep === 'info' && (
              <button
                type="button"
                onClick={handleNextFromStep2}
                disabled={!title.trim() || !slug.trim()}
                className="px-5 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[38px] inline-flex items-center gap-1.5"
              >
                <span>Lanjut: Konfirmasi</span>
                <span>&rarr;</span>
              </button>
            )}

            {currentStep === 'review' && (
              <button
                type="button"
                onClick={() => handleSubmitFinal()}
                disabled={isSubmitting}
                className="px-6 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 min-h-[38px] inline-flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                    <span>Membuat Draf Undangan...</span>
                  </>
                ) : (
                  <span>Buat Undangan</span>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
