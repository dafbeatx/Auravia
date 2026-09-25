interface DashboardStatsProps {
  totalCount: number;
  draftCount: number;
  publishedCount: number;
}

export function DashboardStats({
  totalCount,
  draftCount,
  publishedCount,
}: DashboardStatsProps) {
  const stats = [
    {
      label: 'Total Undangan',
      value: totalCount,
      description: 'Seluruh draf dan publikasi aktif',
    },
    {
      label: 'Draft',
      value: draftCount,
      description: 'Sedang dalam tahap penyusunan',
    },
    {
      label: 'Dipublikasikan',
      value: publishedCount,
      description: 'Tautan publik aktif dan dapat diakses',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-surface border border-border rounded-xl p-5 sm:p-6 shadow-sm flex flex-col justify-between"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              {stat.label}
            </p>
            <p className="font-serif text-3xl sm:text-4xl font-semibold text-primary mt-2">
              {stat.value}
            </p>
          </div>
          <p className="text-[11px] text-text-subtle mt-3 pt-3 border-t border-border">
            {stat.description}
          </p>
        </div>
      ))}
    </div>
  );
}
