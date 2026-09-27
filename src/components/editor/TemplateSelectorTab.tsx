import React, { useEffect, useState } from 'react';
import { getAllTemplates, type TemplateListItem } from '@/lib/templates';
import type { TemplateTheme } from '@/lib/template/types';

export interface TemplateSelectorTabProps {
  currentTemplateId: string;
  onSelectTemplate: (template: TemplateListItem) => void;
  invitationTitle: string;
  coupleNames?: string;
  eventType?: string;
}

/**
 * Tab Pemilih Template (Template Selector Tab):
 * Memungkinkan pengguna melihat katalog template master dan berpindah template
 * tanpa merusak atau mengubah konten, agenda, maupun data tamu undangan.
 */
export const TemplateSelectorTab: React.FC<TemplateSelectorTabProps> = ({
  currentTemplateId,
  onSelectTemplate,
  invitationTitle,
  coupleNames,
  eventType = 'Pernikahan',
}) => {
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setFetchError(null);

    getAllTemplates()
      .then((data) => {
        if (isMounted) {
          setTemplates(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setFetchError('Gagal memuat katalog template. Silakan periksa koneksi Anda.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const displayTitle = invitationTitle.trim() || 'Judul Undangan Anda';
  const displayCouple = coupleNames?.trim() || 'Mempelai Pria & Wanita';

  return (
    <div className="p-5 space-y-5 text-xs">
      <div className="pb-3 border-b border-border">
        <h3 className="font-semibold text-text-primary text-sm">
          Pilihan Template
        </h3>
        <p className="text-[11px] text-text-muted mt-0.5">
          Pilih tema tata letak untuk undangan Anda. Pergantian template mempertahankan seluruh data acara, galeri, dan teks yang telah dimasukkan.
        </p>
      </div>

      {loading && (
        <div className="py-12 text-center space-y-2">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-text-muted text-[11px]">Memuat katalog template...</p>
        </div>
      )}

      {fetchError && !loading && (
        <div className="p-4 rounded-lg border border-danger/20 bg-danger/5 text-danger space-y-2">
          <p className="font-medium text-xs">{fetchError}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setFetchError(null);
              getAllTemplates()
                .then(setTemplates)
                .catch(() => setFetchError('Gagal memuat katalog template.'))
                .finally(() => setLoading(false));
            }}
            className="text-[11px] underline font-semibold hover:text-danger/80 cursor-pointer"
          >
            Coba lagi
          </button>
        </div>
      )}

      {!loading && !fetchError && templates.length === 0 && (
        <div className="p-6 border border-dashed border-border rounded-lg text-center text-text-muted">
          Belum ada template yang tersedia saat ini.
        </div>
      )}

      {!loading && !fetchError && templates.length > 0 && (
        <div className="space-y-4">
          {templates.map((tpl) => {
            const isSelected = tpl.id === currentTemplateId;
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
                className={`rounded-xl border transition-all overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary/80 bg-surface shadow-xs'
                    : 'border-border bg-surface hover:border-border-strong hover:shadow-xs'
                } ${!tpl.is_active ? 'opacity-60' : ''}`}
              >
                {/* Mini Preview Visual (menggunakan data aktual undangan) */}
                <div
                  className="relative p-5 border-b flex flex-col items-center justify-between text-center select-none min-h-[140px]"
                  style={{
                    backgroundColor: previewBg,
                    color: previewText,
                    borderColor: previewBorder,
                  }}
                >
                  <div className="w-full flex items-center justify-between text-[9px] uppercase tracking-wider font-semibold opacity-70">
                    <span>{eventType}</span>
                    <span>{tpl.category}</span>
                  </div>

                  <div className="my-auto space-y-1 py-2">
                    <p
                      className="text-lg sm:text-xl font-normal leading-tight tracking-wide"
                      style={{ fontFamily: previewFont }}
                    >
                      {displayCouple}
                    </p>
                    <p className="text-[10px] opacity-75 font-sans line-clamp-1">
                      {displayTitle}
                    </p>
                  </div>

                  <div className="w-full flex items-center justify-between text-[9px] opacity-60 font-mono">
                    <span>Aurovia Master Template</span>
                    {isSelected && (
                      <span className="font-bold text-primary opacity-100 flex items-center gap-1">
                        &bull; Sedang Digunakan
                      </span>
                    )}
                  </div>
                </div>

                {/* Deskripsi dan Aksi Template */}
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <h4 className="font-serif font-bold text-sm text-text-primary">
                        {tpl.name}
                      </h4>
                      <p className="text-[11px] text-text-muted mt-0.5 leading-relaxed">
                        {tpl.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {tpl.is_active ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Aktif
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-elevated text-text-subtle border border-border">
                          Tidak Tersedia
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-end">
                    {isSelected ? (
                      <button
                        type="button"
                        disabled
                        className="py-2 px-4 rounded text-xs font-semibold bg-surface-elevated text-text-muted border border-border cursor-default min-h-[44px]"
                      >
                        Template Aktif
                      </button>
                    ) : !tpl.is_active ? (
                      <button
                        type="button"
                        disabled
                        className="py-2 px-4 rounded text-xs font-semibold bg-surface-elevated text-text-subtle border border-border cursor-not-allowed min-h-[44px]"
                      >
                        Tidak Dapat Dipilih
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectTemplate(tpl)}
                        className="py-2 px-4 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors cursor-pointer min-h-[44px] shadow-xs active:scale-98"
                      >
                        Gunakan Template Ini
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
