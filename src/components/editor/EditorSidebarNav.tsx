import React from 'react';

export type EditorTabId =
  | 'settings'
  | 'template'
  | 'design'
  | 'cover'
  | 'hero'
  | 'content'
  | 'story'
  | 'events'
  | 'gallery'
  | 'gift'
  | 'music'
  | 'sections'
  | 'guests';

export interface EditorSidebarNavProps {
  activeTab: EditorTabId;
  onSelectTab: (tab: EditorTabId) => void;
  badges: {
    storyCount: number;
    eventCount: number;
    galleryCount: number;
    giftCount: number;
    guestCount: number;
    coverEnabled: boolean;
    musicEnabled: boolean;
  };
}

interface NavItemConfig {
  id: EditorTabId;
  label: string;
  icon: (active: boolean) => React.ReactNode;
  badge?: string | number | null;
}

interface NavGroupConfig {
  title: string;
  items: NavItemConfig[];
}

export const EditorSidebarNav: React.FC<EditorSidebarNavProps> = ({
  activeTab,
  onSelectTab,
  badges,
}) => {
  const groups: NavGroupConfig[] = [
    {
      title: 'Dasar & Tampilan',
      items: [
        {
          id: 'settings',
          label: 'Pengaturan',
          icon: () => (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
        {
          id: 'template',
          label: 'Pilihan Template',
          icon: () => (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          ),
        },
        {
          id: 'design',
          label: 'Kustomisasi Desain',
          icon: () => (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 21a4 4 0 01-4-4 11.042 11.042 0 014.286-8.714l6.428-6.429a2.121 2.121 0 013 3L10.286 11.286A11.042 11.042 0 016 15.571 4 4 0 017 21z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12.5 6.5l5 5" />
            </svg>
          ),
        },
        {
          id: 'cover',
          label: 'Cover Pembuka',
          badge: badges.coverEnabled ? 'Aktif' : null,
          icon: () => (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          id: 'hero',
          label: 'Hero & Sampul',
          icon: () => (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          id: 'sections',
          label: 'Tata Letak Seksi',
          icon: () => (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Mempelai & Cerita',
      items: [
        {
          id: 'content',
          label: 'Profil Mempelai',
          icon: () => (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          ),
        },
        {
          id: 'story',
          label: 'Kisah Kami',
          badge: badges.storyCount > 0 ? badges.storyCount : null,
          icon: () => (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          ),
        },
        {
          id: 'events',
          label: 'Agenda Acara',
          badge: badges.eventCount > 0 ? badges.eventCount : null,
          icon: () => (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
        },
        {
          id: 'gallery',
          label: 'Galeri Foto',
          badge: badges.galleryCount > 0 ? badges.galleryCount : null,
          icon: () => (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'Fitur & Tamu',
      items: [
        {
          id: 'guests',
          label: 'Tamu & RSVP',
          badge: badges.guestCount > 0 ? badges.guestCount : null,
          icon: () => (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          ),
        },
        {
          id: 'gift',
          label: 'Tanda Kasih',
          badge: badges.giftCount > 0 ? badges.giftCount : null,
          icon: () => (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 01-2-2V7a2 2 0 012-2h14a2 2 0 012 2v3a2 2 0 01-2 2H5z" />
            </svg>
          ),
        },
        {
          id: 'music',
          label: 'Musik Latar',
          badge: badges.musicEnabled ? 'Aktif' : null,
          icon: () => (
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12 0c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          ),
        },
      ],
    },
  ];

  const allItems = groups.flatMap((g) => g.items);

  return (
    <>
      {/* A. NAVIGASI DESKTOP (Sticky Left Sidebar, fixed width) */}
      <nav
        aria-label="Navigasi Seksi Editor"
        className="hidden lg:flex flex-col w-56 shrink-0 bg-surface border-r border-border h-full overflow-y-auto select-none py-3"
      >
        <div className="space-y-4 px-2.5">
          {groups.map((group) => (
            <div key={group.title} className="space-y-0.5">
              <span className="block px-2.5 text-[10px] uppercase font-semibold text-text-subtle tracking-wider mb-1">
                {group.title}
              </span>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded text-xs transition-colors cursor-pointer text-left min-h-[38px] ${
                        isActive
                          ? 'bg-surface-elevated text-primary font-semibold border-l-2 border-primary pl-2'
                          : 'text-text-muted hover:text-text-primary hover:bg-surface-elevated/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.icon(isActive)}
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge !== null && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono shrink-0 ${
                            isActive
                              ? 'bg-primary text-primary-foreground font-medium'
                              : 'bg-border/60 text-text-subtle'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* B. NAVIGASI MOBILE / TABLET (< lg): Horizontal scroll bar yang nyaman */}
      <nav
        aria-label="Navigasi Seksi Mobile"
        className="lg:hidden w-full bg-surface border-b border-border overflow-x-auto scrollbar-none py-1.5 px-3 flex items-center gap-1.5 shrink-0 z-10"
      >
        {allItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-1.5 py-2 px-3 rounded-full text-xs whitespace-nowrap transition-colors cursor-pointer shrink-0 min-h-[44px] ${
                isActive
                  ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                  : 'bg-surface-elevated text-text-muted hover:text-text-primary border border-border'
              }`}
            >
              {item.icon(isActive)}
              <span>{item.label}</span>
              {item.badge !== undefined && item.badge !== null && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-border text-text-subtle'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
