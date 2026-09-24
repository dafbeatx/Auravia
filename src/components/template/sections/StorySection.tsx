import React from 'react';
import type { SectionRendererProps } from '@/lib/template/types';

export const StorySection: React.FC<SectionRendererProps> = ({ content }) => {
  const storyList = Array.isArray(content?.story) ? content.story : [];

  return (
    <section aria-labelledby="section-story-heading" className="py-16 px-6 max-w-2xl mx-auto space-y-8">
      <h2
        id="section-story-heading"
        className="text-2xl sm:text-3xl font-normal text-center text-[var(--theme-color-primary)]"
        style={{ fontFamily: 'var(--theme-font-heading)' }}
      >
        Kisah Kami
      </h2>

      {storyList.length === 0 ? (
        <div className="p-6 border border-[var(--theme-color-border)] rounded bg-[var(--theme-color-surface)] text-center text-xs text-[var(--theme-color-primary)]/70">
          Kisah perjalanan belum dibagikan.
        </div>
      ) : (
        <div className="space-y-6">
          {storyList.map((item, idx) => (
            <div
              key={idx}
              className="p-6 border border-[var(--theme-color-border)] rounded bg-[var(--theme-color-surface)] space-y-2"
            >
              <h3 className="font-semibold text-sm text-[var(--theme-color-primary)]">
                {item.title}
              </h3>
              {item.date && (
                <span className="text-[11px] text-[var(--theme-color-primary)]/60">
                  {item.date}
                </span>
              )}
              <p className="text-xs text-[var(--theme-color-primary)]/80 leading-relaxed pt-1">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
