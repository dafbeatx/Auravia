import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  type InvitationListItem,
  extractInvitationContent,
  getGalleryPublicUrl,
} from '@/lib/invitations';

interface InvitationCardProps {
  invitation: InvitationListItem;
  viewMode: 'grid' | 'list';
  onDeleteClick: (invitation: InvitationListItem) => void;
}

export function InvitationCard({
  invitation,
  viewMode,
  onDeleteClick,
}: InvitationCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const content = useMemo(() => {
    return extractInvitationContent(invitation.data);
  }, [invitation.data]);

  // Extract actual image if available from gallery, cover, or hosts
  const previewImageUrl = useMemo(() => {
    if (invitation.gallery && invitation.gallery.length > 0) {
      const first = invitation.gallery[0];
      if (first) {
        const rawPath = first.thumbnail_path || first.storage_path;
        if (rawPath) return getGalleryPublicUrl(rawPath);
      }
    }

    if (content?.cover?.background_image_url) {
      return getGalleryPublicUrl(content.cover.background_image_url);
    }

    if (content?.hosts && content.hosts.length > 0) {
      const hostWithPhoto = content.hosts.find((h) => h.photo_url || h.storage_path);
      if (hostWithPhoto) {
        return getGalleryPublicUrl(hostWithPhoto.photo_url || hostWithPhoto.storage_path);
      }
    }

    return null;
  }, [invitation.gallery, content]);

  // Extract couple names if available
  const coupleNames = useMemo(() => {
    if (content?.hero?.couple_names && content.hero.couple_names.trim()) {
      return content.hero.couple_names.trim();
    }
    if (content?.hosts && content.hosts.length > 0) {
      const hostNames = content.hosts
        .map((h) => h.name?.trim())
        .filter((n): n is string => Boolean(n && n.length > 0));
      if (hostNames.length > 0) {
        return hostNames.join(' & ');
      }
    }
    return null;
  }, [content]);

  const isPublished = invitation.status === 'published';

  const handleCopyLink = async () => {
    if (!isPublished) return;
    try {
      const publicUrl = `${window.location.origin}/i/${invitation.slug}`;
      await navigator.clipboard.writeText(publicUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      setMenuOpen(false);
    } catch {
      // Fallback
    }
  };

  const formattedDate = useMemo(() => {
    try {
      return new Date(invitation.created_at).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }, [invitation.created_at]);

  // RENDER GRID VIEW
  if (viewMode === 'grid') {
    return (
      <div className="bg-surface border border-border rounded-xl shadow-xs hover:shadow-md hover:border-border-strong transition-all flex flex-col overflow-hidden group">
        {/* Cover Preview Area */}
        <div className="relative h-44 sm:h-48 w-full bg-surface-elevated overflow-hidden border-b border-border flex items-center justify-center">
          {previewImageUrl ? (
            <img
              src={previewImageUrl}
              alt={invitation.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
          ) : (
            /* Typographic Monogram Empty Visual */
            <div className="w-full h-full p-6 flex flex-col items-center justify-center text-center bg-gradient-to-b from-surface to-surface-elevated select-none">
              <span className="text-[10px] tracking-widest uppercase font-semibold text-text-subtle font-sans mb-1">
                The Wedding Of
              </span>
              <p className="font-serif italic text-lg sm:text-xl text-primary font-normal line-clamp-2 px-3">
                {coupleNames || invitation.title}
              </p>
              <div className="w-8 h-[1px] bg-border-strong my-2" />
              <span className="text-[11px] font-mono text-text-subtle">
                Aurovia
              </span>
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 left-3">
            <span
              className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded shadow-xs border ${
                isPublished
                  ? 'bg-success-foreground border-success/30 text-success'
                  : 'bg-surface/95 border-border text-text-muted'
              }`}
            >
              {isPublished ? 'Dipublikasikan' : 'Draft'}
            </span>
          </div>

          {/* Toast Salin Tautan */}
          {copySuccess && (
            <div className="absolute inset-0 bg-primary/90 text-primary-foreground flex items-center justify-center text-xs font-semibold animate-fadeIn z-20">
              Tautan publik berhasil disalin!
            </div>
          )}
        </div>

        {/* Card Body */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-1">
            <h2 className="font-serif text-lg font-bold text-primary group-hover:text-primary-hover transition-colors line-clamp-1">
              {invitation.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-text-subtle font-mono truncate">
              <span className="truncate">/i/{invitation.slug}</span>
            </div>
            {formattedDate && (
              <p className="text-[11px] text-text-subtle pt-1 font-sans">
                Dibuat {formattedDate}
              </p>
            )}
          </div>

          {/* Card Actions */}
          <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Link
                to={`/dashboard/invitations/${invitation.id}`}
                className="px-3.5 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Edit
              </Link>
              {isPublished && (
                <a
                  href={`/i/${invitation.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 border border-border hover:bg-surface-elevated text-text-primary text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Lihat
                </a>
              )}
            </div>

            {/* Menu Dropdown Button */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-expanded={menuOpen}
                aria-label={`Menu opsi untuk ${invitation.title}`}
                className="p-1.5 text-text-subtle hover:text-text-primary hover:bg-surface-elevated rounded-lg border border-transparent hover:border-border transition-colors cursor-pointer"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 bottom-full mb-1.5 w-44 bg-surface border border-border rounded-xl shadow-lg py-1 z-30 animate-fadeIn"
                >
                  <Link
                    to={`/dashboard/invitations/${invitation.id}`}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3.5 py-2 text-xs font-medium text-text-primary hover:bg-surface-elevated transition-colors"
                  >
                    Edit Undangan
                  </Link>

                  {isPublished && (
                    <>
                      <a
                        href={`/i/${invitation.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="block px-3.5 py-2 text-xs font-medium text-text-primary hover:bg-surface-elevated transition-colors"
                      >
                        Lihat Undangan
                      </a>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleCopyLink}
                        className="w-full text-left px-3.5 py-2 text-xs font-medium text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
                      >
                        Salin Tautan
                      </button>
                    </>
                  )}

                  <div className="border-t border-border my-1" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onDeleteClick(invitation);
                    }}
                    className="w-full text-left px-3.5 py-2 text-xs font-semibold text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // RENDER LIST VIEW
  return (
    <div className="bg-surface border border-border rounded-xl p-4 sm:p-5 shadow-xs hover:border-border-strong transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Left: Thumbnail & Details */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-surface-elevated border border-border flex-shrink-0 overflow-hidden relative">
          {previewImageUrl ? (
            <img
              src={previewImageUrl}
              alt={invitation.title}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center bg-gradient-to-b from-surface to-surface-elevated select-none">
              <span className="text-[8px] uppercase tracking-wider font-semibold text-text-subtle">
                Aurovia
              </span>
              <p className="font-serif italic text-xs text-primary font-normal line-clamp-1">
                {coupleNames || invitation.title}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-serif text-base sm:text-lg font-bold text-primary truncate">
              {invitation.title}
            </h2>
            <span
              className={`text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${
                isPublished
                  ? 'bg-success-foreground border-success/30 text-success'
                  : 'bg-surface-elevated border-border text-text-muted'
              }`}
            >
              {isPublished ? 'Dipublikasikan' : 'Draft'}
            </span>
          </div>

          <p className="text-xs text-text-subtle font-mono truncate">
            /i/{invitation.slug}
          </p>

          {formattedDate && (
            <p className="text-[11px] text-text-subtle font-sans">
              Dibuat {formattedDate}
            </p>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
        <Link
          to={`/dashboard/invitations/${invitation.id}`}
          className="px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          Edit
        </Link>

        {isPublished && (
          <a
            href={`/i/${invitation.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 border border-border hover:bg-surface-elevated text-text-primary text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Lihat
          </a>
        )}

        {/* Menu Dropdown Button */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-expanded={menuOpen}
            aria-label={`Menu opsi untuk ${invitation.title}`}
            className="p-1.5 text-text-subtle hover:text-text-primary hover:bg-surface-elevated rounded-lg border border-border transition-colors cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 bottom-full sm:bottom-auto sm:top-full mt-1.5 mb-1.5 w-44 bg-surface border border-border rounded-xl shadow-lg py-1 z-30 animate-fadeIn"
            >
              <Link
                to={`/dashboard/invitations/${invitation.id}`}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
                className="block px-3.5 py-2 text-xs font-medium text-text-primary hover:bg-surface-elevated transition-colors"
              >
                Edit Undangan
              </Link>

              {isPublished && (
                <>
                  <a
                    href={`/i/${invitation.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block px-3.5 py-2 text-xs font-medium text-text-primary hover:bg-surface-elevated transition-colors"
                  >
                    Lihat Undangan
                  </a>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleCopyLink}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
                  >
                    Salin Tautan
                  </button>
                </>
              )}

              <div className="border-t border-border my-1" />

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDeleteClick(invitation);
                }}
                className="w-full text-left px-3.5 py-2 text-xs font-semibold text-danger hover:bg-danger/10 transition-colors cursor-pointer"
              >
                Hapus
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
