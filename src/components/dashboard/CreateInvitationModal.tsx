import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  type TemplateListItem,
  getActiveTemplates,
  createInvitation,
  suggestSlugFromTitle,
} from '@/lib/invitations';
import { TemplatePreviewModal } from './TemplatePreviewModal';

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

  // Modal Preview Template Terpilih
  const [previewingTemplate, setPreviewingTemplate] = useState<TemplateListItem | null>(null);

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
      setPreviewingTemplate(null);
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

  // Handle Escape key on main modal (if not previewing)
  useEffect(() => {
    if (!isOpen || previewingTemplate) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isSubmitting, previewingTemplate]);

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
  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || null;
  }, [templates, selectedTemplateId]);

  // Evaluasi slug real-time secara lokal tanpa request network
  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  const cleanSlug = slug.trim().toLowerCase();
  const isSlugEmpty = cleanSlug.length === 0;
  const isSlugTooShort = cleanSlug.length > 0 && cleanSlug.length < 3;
  const isSlugTooLong = cleanSlug.length > 60;
  const isSlugFormatValid = slugRegex.test(cleanSlug);
  const isSlugValid = !isSlugEmpty && !isSlugTooShort && !isSlugTooLong && isSlugFormatValid;

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
    <>
      <div
        className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs animate-fadeIn"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wizard-title"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isSubmitting) onClose();
        }}
      >
        <div className="bg-surface border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-scaleIn">
          {/* Modal Header */}
          <div className="px-6 py-4 sm:px-8 sm:py-5 border-b border-border flex items-center justify-between bg-surface flex-shrink-0">
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
              className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Step Indicator Progress Bar */}
          <div className="bg-surface-elevated border-b border-border px-6 sm:px-8 py-3 flex-shrink-0">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl mx-auto" role="tablist" aria-label="Langkah Pembuatan Undangan">
              {/* Step 1 Pill */}
              <button
                type="button"
                role="tab"
                aria-selected={currentStep === 'template'}
                onClick={() => !isSubmitting && setCurrentStep('template')}
                className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all text-left min-h-[40px] cursor-pointer ${
                  currentStep === 'template'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : selectedTemplateId
                    ? 'text-text-primary hover:bg-surface'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface'
                }`}
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
                className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all text-left min-h-[40px] ${
                  currentStep === 'info'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : isSlugValid && title.trim().length > 0
                    ? 'text-text-primary hover:bg-surface cursor-pointer'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentStep === 'info'
                    ? 'bg-primary-foreground text-primary'
                    : isSlugValid && title.trim().length > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-border text-text-muted'
                }`}>
                  {isSlugValid && title.trim().length > 0 && currentStep === 'review' ? '✓' : '2'}
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
                disabled={!selectedTemplateId || !title.trim() || !isSlugValid}
                className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all text-left min-h-[40px] ${
                  currentStep === 'review'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-text-muted hover:text-text-primary hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentStep === 'review'
                    ? 'bg-primary-foreground text-primary'
                    : 'bg-border text-text-muted'
                }`}>
                  3
                </span>
                <span className="truncate hidden sm:inline">Review & Simpan</span>
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
                    Pilih Desain Undangan
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Setiap template Aurovia dirancang dengan tipografi editorial dan estetika abadi untuk momen pernikahan Anda.
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
                      className="px-4 py-2 bg-surface border border-danger/40 text-danger text-xs font-semibold rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer min-h-[44px]"
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
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
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
                          {/* Visual Preview Canvas */}
                          <div
                            className="relative h-48 w-full border-b border-border flex flex-col items-center justify-between p-4 text-center select-none overflow-hidden transition-all duration-300"
                            style={{
                              backgroundColor:
                                typeof tpl.default_theme === 'object' && tpl.default_theme !== null && 'color_background' in tpl.default_theme
                                  ? String((tpl.default_theme as Record<string, unknown>).color_background || '#FAF9F6')
                                  : '#FAF9F6',
                            }}
                          >
                            {/* Selected Checkmark Badge */}
                            {isSelected && (
                              <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase shadow-xs flex items-center gap-1 z-10">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Terpilih</span>
                              </div>
                            )}

                            {/* Header ornament */}
                            <div className="pt-1">
                              <span className="text-[9px] uppercase tracking-widest font-medium text-stone-500 font-sans">
                                Koleksi Aurovia
                              </span>
                            </div>

                            {/* Center couple headline */}
                            <div className="space-y-1 my-auto">
                              <p className="font-serif italic text-2xl text-stone-900 font-normal tracking-wide">
                                Sarah &amp; Rizky
                              </p>
                              <div className="w-8 h-[1px] bg-stone-300 mx-auto" />
                              <p className="text-[10px] text-stone-500 uppercase tracking-widest font-sans">
                                The Wedding Celebration
                              </p>
                            </div>

                            {/* Bottom footer text */}
                            <div className="w-full flex items-center justify-between text-[10px] text-stone-400 font-mono pt-1">
                              <span>10.10.2026</span>
                              <span className="capitalize">{tpl.category}</span>
                            </div>

                            {/* Hover/Focus overlay to preview */}
                            <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity flex items-center justify-center p-4">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewingTemplate(tpl);
                                }}
                                className="px-4 py-2 bg-white text-stone-900 hover:bg-stone-100 text-xs font-semibold rounded-lg shadow-md transition-transform transform group-hover:scale-105 cursor-pointer inline-flex items-center gap-1.5 min-h-[40px]"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>Lihat Pratinjau Desain</span>
                              </button>
                            </div>
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

                            {/* Dual action buttons */}
                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewingTemplate(tpl);
                                }}
                                className="py-2 px-2 bg-surface-elevated hover:bg-border text-text-primary text-xs font-semibold rounded-lg border border-border transition-colors cursor-pointer text-center min-h-[44px] flex items-center justify-center gap-1"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span>Pratinjau</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isActive) {
                                    setSelectedTemplateId(tpl.id);
                                    setErrorMessage(null);
                                  }
                                }}
                                className={`py-2 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer text-center min-h-[44px] flex items-center justify-center gap-1 ${
                                  isSelected
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-surface hover:bg-surface-elevated text-primary border border-primary/40'
                                }`}
                              >
                                {isSelected ? (
                                  <>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Terpilih</span>
                                  </>
                                ) : (
                                  <span>Pilih Desain</span>
                                )}
                              </button>
                            </div>
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
                    Informasi Dasar Undangan
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Tentukan judul undangan, tautan publik yang elegan, serta kategori acara Anda.
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
                      className="text-xs text-primary hover:underline font-semibold flex-shrink-0 cursor-pointer min-h-[36px] flex items-center"
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
                      className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-subtle/50 focus:border-primary focus:outline-none transition-colors disabled:opacity-60 min-h-[44px]"
                    />
                    <p className="text-[11px] text-text-subtle">
                      Judul ini menjadi nama proyek undangan dan dapat diubah sewaktu-waktu di dalam editor.
                    </p>
                  </div>

                  {/* Tautan Kustom (Slug) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label htmlFor="create-slug-input" className="block text-xs font-semibold uppercase tracking-wider text-text-muted">
                        Tautan Publik (Slug) <span className="text-danger">*</span>
                      </label>
                    </div>

                    <div className="flex rounded-lg border border-border bg-background overflow-hidden focus-within:border-primary transition-colors min-h-[44px]">
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
                        placeholder="sarah-rizky-wedding"
                        className="w-full px-3 py-2 bg-transparent text-sm text-text-primary placeholder:text-text-subtle/50 font-mono focus:outline-none disabled:opacity-60"
                      />
                    </div>

                    {/* Feedback Validasi Real-time Lokal */}
                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      {isSlugEmpty ? (
                        <span className="text-text-subtle">
                          Tautan publik wajib diisi (minimal 3 karakter).
                        </span>
                      ) : isSlugTooShort ? (
                        <span className="text-amber-600 font-medium">
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
                          <span>Tautan publik valid dan siap digunakan</span>
                        </span>
                      )}
                      <span className="text-text-subtle font-mono">{slug.length}/60</span>
                    </div>

                    {/* Preview URL Box */}
                    <div className="p-2.5 bg-surface-elevated border border-border rounded-lg flex items-center gap-2 text-xs">
                      <span className="text-text-subtle font-sans text-[11px]">Pratinjau Tautan:</span>
                      <span className="font-mono text-primary font-medium truncate">
                        aurovia-creative.vercel.app/i/{cleanSlug || 'tautan-anda'}
                      </span>
                    </div>
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
                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all min-h-[44px] ${
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
                    Review &amp; Konfirmasi
                  </h3>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Tinjau ringkasan informasi undangan sebelum draf baru dibuat dan diarahkan ke editor.
                  </p>
                </div>

                {/* Review Summary Card */}
                <div className="bg-surface border border-border rounded-xl p-5 sm:p-6 space-y-5 shadow-xs">
                  {/* Desain Box */}
                  <div className="border-b border-border pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-text-subtle">
                        Desain Template
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep('template')}
                        disabled={isSubmitting}
                        className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                      >
                        Ubah Desain
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-4 p-3 bg-surface-elevated rounded-lg border border-border">
                      <div className="min-w-0">
                        <p className="font-serif text-base font-bold text-primary truncate">
                          {selectedTemplate?.name || 'Classic Elegance'}
                        </p>
                        <p className="text-[11px] text-text-muted line-clamp-1 mt-0.5">
                          {selectedTemplate?.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-surface border border-border text-text-muted">
                          {selectedTemplate?.category || 'Wedding'}
                        </span>
                        {selectedTemplate && (
                          <button
                            type="button"
                            onClick={() => setPreviewingTemplate(selectedTemplate)}
                            className="p-1.5 text-text-muted hover:text-text-primary rounded border border-border bg-surface transition-colors cursor-pointer"
                            aria-label="Lihat pratinjau desain"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Detail Undangan Box */}
                  <div className="space-y-4 border-b border-border pb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-text-subtle">
                        Informasi Undangan
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep('info')}
                        disabled={isSubmitting}
                        className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                      >
                        Ubah Informasi
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-text-subtle uppercase">Judul Undangan</span>
                        <p className="font-serif text-lg font-bold text-primary mt-0.5">
                          {title}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] text-text-subtle uppercase">Jenis Acara</span>
                        <p className="text-sm font-semibold text-text-primary mt-0.5">
                          {eventType}
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-text-subtle uppercase">Tautan Publik Disediakan</span>
                      <p className="text-xs font-mono text-primary font-semibold mt-1 bg-surface-elevated p-2 rounded-lg border border-border truncate">
                        aurovia-creative.vercel.app/i/{slug}
                      </p>
                    </div>
                  </div>

                  {/* Keterangan Transparan Alur Pengerjaan */}
                  <div className="p-3.5 bg-surface-elevated border border-border rounded-xl space-y-2 text-xs text-text-muted">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Status: Draf Pribadi
                      </span>
                      <span className="text-[11px] text-text-subtle">Aman dan belum dipublikasikan</span>
                    </div>
                    <p className="leading-relaxed text-[11px]">
                      Setelah dibuat, undangan disimpan sebagai draf pribadi dan Anda akan langsung diarahkan ke Editor Undangan untuk melengkapi jadwal acara, lokasi peta, dan galeri foto.
                    </p>
                    <p className="leading-relaxed text-[11px] text-text-subtle">
                      Tautan publik belum dapat diakses oleh umum sampai Anda memilih untuk mempublikasikannya nanti dari editor.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="px-6 py-4 sm:px-8 border-t border-border flex items-center justify-between bg-surface flex-shrink-0">
            <div>
              {currentStep === 'template' ? (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-border hover:bg-surface-elevated text-text-muted text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 min-h-[44px]"
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
                  className="px-4 py-2 border border-border hover:bg-surface-elevated text-text-primary text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 min-h-[44px] inline-flex items-center gap-1.5"
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
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] inline-flex items-center gap-1.5"
                >
                  <span>Lanjut: Informasi Dasar</span>
                  <span>&rarr;</span>
                </button>
              )}

              {currentStep === 'info' && (
                <button
                  type="button"
                  onClick={handleNextFromStep2}
                  disabled={!title.trim() || !isSlugValid}
                  className="px-5 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] inline-flex items-center gap-1.5"
                >
                  <span>Lanjut: Review &amp; Simpan</span>
                  <span>&rarr;</span>
                </button>
              )}

              {currentStep === 'review' && (
                <button
                  type="button"
                  onClick={() => handleSubmitFinal()}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 min-h-[44px] inline-flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      <span>Menyiapkan Undangan...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Buat Undangan</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal Pratinjau Desain Interaktif */}
      <TemplatePreviewModal
        isOpen={Boolean(previewingTemplate)}
        template={previewingTemplate}
        onClose={() => setPreviewingTemplate(null)}
        onSelectTemplate={(tplId) => {
          setSelectedTemplateId(tplId);
          setErrorMessage(null);
        }}
        isSelected={selectedTemplateId === previewingTemplate?.id}
      />
    </>
  );
}
