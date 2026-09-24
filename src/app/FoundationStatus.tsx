/**
 * FoundationStatus: Tampilan verifikasi teknis untuk tahap Foundation Aurovia.
 * Tidak memuat konten marketing palsu, data dummy, atau testimonial fiktif.
 */
export function FoundationStatus() {
  return (
    <div className="py-12 max-w-xl mx-auto">
      <div className="bg-surface border border-border rounded p-6 shadow-sm">
        <h1 className="font-serif text-2xl font-bold text-primary mb-2">
          Inisialisasi Fondasi Teknis
        </h1>
        <p className="text-sm text-text-muted mb-6 leading-relaxed">
          Fondasi aplikasi Aurovia telah aktif dengan arsitektur modular, mode TypeScript ketat,
          dan sistem token desain editorial.
        </p>

        <div className="space-y-3 border-t border-border pt-4 text-xs font-mono">
          <div className="flex justify-between py-1 border-b border-border">
            <span className="text-text-subtle">Engine & Bundler</span>
            <span className="font-semibold text-text-primary">React 18 + Vite</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border">
            <span className="text-text-subtle">TypeScript Check</span>
            <span className="font-semibold text-success">Strict Mode Enabled</span>
          </div>
          <div className="flex justify-between py-1 border-b border-border">
            <span className="text-text-subtle">Design Tokens</span>
            <span className="font-semibold text-text-primary">Editorial Palette Active</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-text-subtle">Database Status</span>
            <span className="font-semibold text-text-muted">Awaiting Migration Phase</span>
          </div>
        </div>
      </div>
    </div>
  );
}
