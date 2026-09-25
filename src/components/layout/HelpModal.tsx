import { useEffect, useRef } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6"
      >
        <div className="flex items-start justify-between pb-4 border-b border-border">
          <div>
            <h2
              id="help-modal-title"
              className="font-serif text-2xl font-bold text-primary"
            >
              Pusat Bantuan Aurovia
            </h2>
            <p className="text-xs text-text-muted mt-1">
              Panduan lengkap mengelola dan mempublikasikan undangan digital Anda.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pusat bantuan"
            className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-5 text-xs text-text-muted leading-relaxed">
          <section className="space-y-1.5">
            <h3 className="font-semibold text-sm text-text-primary flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-[10px] font-bold text-text-primary">
                1
              </span>
              Membuat Undangan Baru
            </h3>
            <p className="pl-7">
              Klik tombol <strong>+ Buat Undangan</strong> di dashboard, tentukan judul undangan, dan pilih salah satu template desain yang tersedia. Draf baru akan otomatis disiapkan untuk diedit.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-semibold text-sm text-text-primary flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-[10px] font-bold text-text-primary">
                2
              </span>
              Menyesuaikan Konten & Pasangan
            </h3>
            <p className="pl-7">
              Pada halaman editor undangan, Anda dapat mengisi data kedua mempelai, cerita perjalanan cinta, agenda acara (akad nikah dan resepsi), peta lokasi acara via Google Maps, hingga nomor rekening hadiah digital.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-semibold text-sm text-text-primary flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-[10px] font-bold text-text-primary">
                3
              </span>
              Ketentuan Unggah Foto Galeri
            </h3>
            <p className="pl-7">
              Aurovia mendukung unggahan foto berformat <strong>JPG, JPEG, PNG, dan WebP</strong> dengan ukuran berkas maksimal <strong>5 MB</strong> per foto untuk memastikan performa undangan tetap cepat dan hemat data bagi para tamu.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-semibold text-sm text-text-primary flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-[10px] font-bold text-text-primary">
                4
              </span>
              Publikasi & Tautan Undangan
            </h3>
            <p className="pl-7">
              Setelah seluruh konten terisi dengan lengkap, klik tombol <strong>Publikasikan</strong> di halaman editor. Tautan publik Anda akan aktif dan dapat dibuka langsung melalui format <code>/i/:slug</code>.
            </p>
          </section>

          <section className="space-y-1.5">
            <h3 className="font-semibold text-sm text-text-primary flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-[10px] font-bold text-text-primary">
                5
              </span>
              Manajemen Tamu & RSVP
            </h3>
            <p className="pl-7">
              Gunakan tab Manajemen Tamu untuk menambahkan nama penerima undangan khusus, mendapatkan tautan personal, dan memantau status konfirmasi kehadiran tamu secara terstruktur.
            </p>
          </section>
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Mengerti, Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
}
