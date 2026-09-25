interface DashboardHeroProps {
  userName?: string;
  onCreateClick: () => void;
}

export function DashboardHero({ userName, onCreateClick }: DashboardHeroProps) {
  return (
    <section
      aria-labelledby="dashboard-welcome-heading"
      className="bg-surface border border-border rounded-xl p-6 sm:p-10 shadow-sm relative overflow-hidden"
    >
      <div className="max-w-2xl space-y-3">
        <p className="text-[11px] uppercase tracking-widest font-semibold text-text-subtle font-sans">
          Selamat Datang Kembali{userName ? `, ${userName}` : ''}
        </p>
        <h1
          id="dashboard-welcome-heading"
          className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-primary tracking-tight leading-snug"
        >
          Kelola undangan digital Anda dengan lebih mudah.
        </h1>
        <p className="text-xs sm:text-sm text-text-muted leading-relaxed font-sans pt-1">
          Buat, sesuaikan, dan publikasikan undangan digital pernikahan Anda dalam satu tempat terstruktur.
        </p>

        <div className="pt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={onCreateClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors cursor-pointer min-h-[44px]"
          >
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
          </button>
        </div>
      </div>
    </section>
  );
}
