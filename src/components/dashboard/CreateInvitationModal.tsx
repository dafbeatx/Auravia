import React, { useState, useEffect, useRef } from 'react';
import {
  type TemplateListItem,
  getActiveTemplates,
  createInvitation,
} from '@/lib/invitations';

interface CreateInvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newInvitationId: string) => void;
}

export function CreateInvitationModal({
  isOpen,
  onClose,
  onCreated,
}: CreateInvitationModalProps) {
  const [title, setTitle] = useState('');
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Load templates once when modal opens
  useEffect(() => {
    if (isOpen && !templatesLoaded) {
      let isMounted = true;
      setLoadingTemplates(true);
      getActiveTemplates()
        .then((data) => {
          if (isMounted) {
            setTemplates(data);
            const first = data[0];
            if (first) {
              setSelectedTemplateId(first.id);
            }
            setTemplatesLoaded(true);
          }
        })
        .catch(() => {
          if (isMounted) {
            setErrorMessage('Gagal memuat katalog template. Silakan coba kembali.');
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
    }
  }, [isOpen, templatesLoaded]);

  // Focus title input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 50);
    } else {
      setTitle('');
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrorMessage('Judul undangan wajib diisi.');
      return;
    }

    if (!selectedTemplateId) {
      setErrorMessage('Silakan pilih salah satu template sebelum melanjutkan.');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createInvitation(cleanTitle, selectedTemplateId);
      onCreated(created.id);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Gagal membuat undangan. Silakan coba kembali.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-invitation-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6">
        <div className="flex items-start justify-between pb-4 border-b border-border">
          <div>
            <h2
              id="create-invitation-modal-title"
              className="font-serif text-2xl font-bold text-primary"
            >
              Buat Undangan Baru
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Pilih template dan masukkan judul untuk memulai draf undangan pernikahan Anda.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Tutup formulir"
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {errorMessage && (
          <div
            role="alert"
            aria-live="polite"
            className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-xs text-danger font-medium leading-relaxed"
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Judul Input */}
          <div className="space-y-1.5">
            <label
              htmlFor="create-title-input"
              className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted"
            >
              Judul Undangan
            </label>
            <input
              id="create-title-input"
              ref={titleInputRef}
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              placeholder="Contoh: Pernikahan Sarah & Rizky"
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm text-text-primary placeholder:text-text-subtle/50 focus:border-primary focus:outline-none transition-colors disabled:opacity-60"
            />
            <p className="text-[11px] text-text-subtle">
              Maksimal 120 karakter. Judul dapat diubah sewaktu-waktu di editor.
            </p>
          </div>

          {/* Template Selection */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              Pilih Template Desain
            </label>

            {loadingTemplates ? (
              <div
                className="p-6 border border-border rounded-lg bg-surface-elevated text-xs text-text-muted text-center"
                role="status"
              >
                Memuat katalog template...
              </div>
            ) : templates.length === 0 ? (
              <div
                className="p-6 border border-border rounded-lg bg-surface-elevated text-xs text-text-muted text-center"
                role="alert"
              >
                Belum ada template aktif yang tersedia.
              </div>
            ) : (
              <div
                className="space-y-2.5 max-h-60 overflow-y-auto pr-1"
                role="radiogroup"
                aria-label="Pilihan template undangan"
              >
                {templates.map((tpl) => {
                  const isSelected = selectedTemplateId === tpl.id;
                  return (
                    <label
                      key={tpl.id}
                      className={`flex items-start gap-3 p-3.5 border rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-surface-elevated ring-1 ring-primary'
                          : 'border-border bg-surface hover:border-border-strong'
                      }`}
                    >
                      <input
                        type="radio"
                        name="template-selection"
                        value={tpl.id}
                        checked={isSelected}
                        onChange={() => setSelectedTemplateId(tpl.id)}
                        className="mt-0.5 text-primary focus:ring-primary h-4 w-4 border-border"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-sm text-text-primary">
                            {tpl.name}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded border border-border bg-background text-text-muted">
                            {tpl.category}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed">
                          {tpl.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-border hover:bg-surface-elevated text-text-muted text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loadingTemplates || templates.length === 0}
              className="px-5 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Menyimpan Draf...' : 'Buat Draf Undangan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
