import React from 'react';
import type { SectionRendererProps } from '@/lib/template/types';

export const StorySection: React.FC<SectionRendererProps> = ({ content }) => {
  const rawStoryList = Array.isArray(content?.story) ? content.story : [];

  // Filter hanya cerita yang diaktifkan dan urutkan berdasarkan display_order
  const visibleStories = rawStoryList
    .filter((item) => item.is_enabled !== false)
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

  return (
    <section aria-labelledby="section-story-heading" className="py-16 px-6 max-w-2xl mx-auto space-y-10">
      <div className="text-center space-y-2">
        <h2
          id="section-story-heading"
          className="text-2xl sm:text-3xl font-normal text-[var(--theme-color-primary)]"
          style={{ fontFamily: 'var(--theme-font-heading)' }}
        >
          Kisah Kami
        </h2>
        <div className="w-10 h-px bg-[var(--theme-color-border)] mx-auto" />
      </div>

      {visibleStories.length === 0 ? (
        <div className="p-6 border border-[var(--theme-color-border)] rounded bg-[var(--theme-color-surface)] text-center text-xs text-[var(--theme-color-primary)]/70">
          Kisah perjalanan belum dibagikan.
        </div>
      ) : (
        <div className="relative border-l border-[var(--theme-color-border)] ml-4 sm:ml-6 pl-6 sm:pl-8 space-y-8">
          {visibleStories.map((item, idx) => (
            <div key={item.id || idx} className="relative group">
              {/* Titik penanda timeline */}
              <div
                className="absolute -left-[31px] sm:-left-[39px] top-1.5 w-3 h-3 rounded-full bg-[var(--theme-color-surface)] border-2 border-[var(--theme-color-primary)]"
                aria-hidden="true"
              />

              <div className="p-5 border border-[var(--theme-color-border)] rounded-lg bg-[var(--theme-color-surface)] space-y-2 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3
                    className="font-medium text-base sm:text-lg text-[var(--theme-color-primary)]"
                    style={{ fontFamily: 'var(--theme-font-heading)' }}
                  >
                    {item.title}
                  </h3>
                  {item.date ? (
                    <span className="text-[11px] font-medium tracking-wider uppercase text-[var(--theme-color-primary)]/70 px-2 py-0.5 rounded border border-[var(--theme-color-border)] bg-[var(--theme-color-background)]/50">
                      {item.date}
                    </span>
                  ) : null}
                </div>

                <p className="text-xs sm:text-sm text-[var(--theme-color-primary)]/80 leading-relaxed pt-1 whitespace-pre-line">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
