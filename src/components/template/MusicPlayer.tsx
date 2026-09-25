import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { InvitationContentMusic } from '@/lib/template/types';
import { isValidAudioUrl } from '@/lib/music';

export interface MusicPlayerProps {
  music?: InvitationContentMusic | null;
  className?: string;
}

/**
 * Komponen Pemutar Musik Latar (Background Music Player v1):
 * - Floating mini-player minimalis di sudut layar
 * - Mematuhi kebijakan autoplay browser modern tanpa trik memaksa
 * - Penanganan error graceful tanpa menghentikan rendering undangan
 * - Aksesibilitas penuh (keyboard, ARIA label, high contrast)
 */
export const MusicPlayer: React.FC<MusicPlayerProps> = ({ music, className = '' }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const isConfigValid = Boolean(music?.enabled && isValidAudioUrl(music?.audio_url));

  // Inisialisasi audio element dan manajemen autoplay
  useEffect(() => {
    if (!isConfigValid || !music) {
      setIsPlaying(false);
      setIsLoaded(false);
      setHasError(false);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    // Terapkan konfigurasi volume (0.0 sampai 1.0) dan loop
    const safeVolume = Math.max(0, Math.min(1, typeof music.volume === 'number' ? music.volume : 0.5));
    audio.volume = safeVolume;
    audio.loop = music.loop !== false;

    // Atur start time jika ditentukan
    if (typeof music.start_time === 'number' && music.start_time > 0) {
      try {
        audio.currentTime = music.start_time;
      } catch {
        // Abaikan jika currentTime belum siap
      }
    }

    // Tangani autoplay secara patuh terhadap kebijakan izin browser
    if (music.autoplay) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            // Autoplay dicegah oleh kebijakan browser tanpa gestur pengguna
            setIsPlaying(false);
          });
      }
    }

    // Mulai pemutaran pada interaksi pertama pengguna pada dokumen jika autoplay diinginkan namun sempat tertunda
    const handleFirstUserGesture = () => {
      if (music.autoplay && audio && audio.paused && !hasError) {
        audio
          .play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            // Abaikan jika pemutaran manual belum diizinkan
          });
      }
    };

    // Tangani pemicu resmi dari tombol "Buka Undangan" pada CoverEnvelope
    const handleCoverTrigger = () => {
      if (audio && !hasError) {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch(() => {
              // Gracefully tangani penolakan browser tanpa memicu uncaught promise rejection
              setIsPlaying(false);
            });
        }
      }
    };

    window.addEventListener('click', handleFirstUserGesture, { once: true });
    window.addEventListener('touchstart', handleFirstUserGesture, { once: true });
    window.addEventListener('aurovia:play-music', handleCoverTrigger);

    return () => {
      window.removeEventListener('click', handleFirstUserGesture);
      window.removeEventListener('touchstart', handleFirstUserGesture);
      window.removeEventListener('aurovia:play-music', handleCoverTrigger);
      audio.pause();
    };
  }, [isConfigValid, music, hasError]);

  // Handler toggle Play / Pause
  const handleTogglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || hasError) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(() => {
            setHasError(true);
            setIsPlaying(false);
          });
      }
    }
  }, [isPlaying, hasError]);

  if (!isConfigValid || !music) {
    return null;
  }

  const labelText = music.title?.trim() || 'Musik Latar';
  const statusDescription = hasError
    ? 'Audio tidak dapat dimuat'
    : isPlaying
    ? `Memutar ${labelText}`
    : `Jeda ${labelText}`;

  return (
    <aside
      aria-label="Pemutar Musik Latar Undangan"
      className={`fixed bottom-5 right-5 z-40 sm:bottom-7 sm:right-7 flex items-center gap-2 select-none ${className}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Hidden native audio element */}
      <audio
        ref={audioRef}
        src={music.audio_url}
        preload="metadata"
        onCanPlay={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsPlaying(false);
        }}
        onEnded={() => {
          if (!music.loop) {
            setIsPlaying(false);
          }
        }}
      />

      {/* Label / Judul Lagu yang Muncul saat Hover atau Fokus */}
      {music.title && (
        <div
          className={`py-1.5 px-3 rounded-full border border-[var(--theme-color-border)] bg-[var(--theme-color-surface)]/95 backdrop-blur-md shadow-sm text-xs text-[var(--theme-color-primary)] font-medium transition-all duration-300 pointer-events-none hidden sm:flex items-center gap-1.5 max-w-[200px] truncate ${
            isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--theme-color-primary)] animate-pulse" />
          <span className="truncate">{music.title}</span>
        </div>
      )}

      {/* Floating Button Play / Pause */}
      <button
        type="button"
        onClick={handleTogglePlay}
        onFocus={() => setIsExpanded(true)}
        onBlur={() => setIsExpanded(false)}
        disabled={hasError}
        aria-label={hasError ? 'Audio tidak dapat dimuat' : isPlaying ? 'Jeda musik latar' : 'Putar musik latar'}
        title={statusDescription}
        className={`w-12 h-12 rounded-full border border-[var(--theme-color-border)] bg-[var(--theme-color-surface)]/95 backdrop-blur-md shadow-md text-[var(--theme-color-primary)] flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--theme-color-primary)] focus:ring-offset-2 active:scale-95 ${
          hasError
            ? 'opacity-60 cursor-not-allowed border-danger/40'
            : isPlaying
            ? 'hover:scale-105 shadow-lg border-[var(--theme-color-primary)]/40'
            : 'hover:scale-105'
        }`}
      >
        {hasError ? (
          // Icon audio error
          <svg
            className="w-5 h-5 text-danger"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : isPlaying ? (
          // Icon sedang diputar: Gelombang audio beranimasi
          <span className="flex items-end justify-center gap-0.5 h-4 w-4" aria-hidden="true">
            <span className="w-1 bg-[var(--theme-color-primary)] rounded-full animate-bounce [animation-delay:0ms] h-4" />
            <span className="w-1 bg-[var(--theme-color-primary)] rounded-full animate-bounce [animation-delay:150ms] h-2.5" />
            <span className="w-1 bg-[var(--theme-color-primary)] rounded-full animate-bounce [animation-delay:300ms] h-3.5" />
          </span>
        ) : (
          // Icon jeda / play: Segitiga Play
          <svg
            className="w-5 h-5 ml-0.5"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        )}

        {/* Aksesibilitas pembaca layar (Screen Reader Only) */}
        <span className="sr-only">
          {statusDescription} {!isLoaded && !hasError ? '(Memuat berkas audio)' : ''}
        </span>
      </button>
    </aside>
  );
};
