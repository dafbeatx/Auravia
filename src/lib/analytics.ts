import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type AnalyticsEventInsert = Database['public']['Tables']['analytics_events']['Insert'];

const SESSION_KEY = 'aurovia_session_id';

/**
 * Mengambil atau membuat anonymous session ID yang aman dan tersimpan di sessionStorage.
 * Tidak menyimpan data pribadi (PII) atau informasi sensitif.
 */
export function getOrCreateSessionId(): string {
  try {
    let sid = window.sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `s_${Math.random().toString(36).substring(2)}_${Date.now()}`;
      window.sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return `s_anon_${Date.now()}`;
  }
}

/**
 * Mendeteksi tipe perangkat pengguna berdasarkan user agent dan ukuran viewport.
 */
export function detectDeviceType(): 'desktop' | 'tablet' | 'mobile' | 'unknown' {
  if (typeof window === 'undefined') return 'unknown';

  const width = window.innerWidth;
  const ua = navigator.userAgent.toLowerCase();

  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua)) {
    return 'mobile';
  }
  if (/ipad|tablet/i.test(ua) || (width >= 640 && width <= 1024)) {
    return 'tablet';
  }
  if (width < 640) {
    return 'mobile';
  }
  return 'desktop';
}

/**
 * Mendeteksi browser dasar tanpa menyimpan IP atau sidik jari kompleks.
 */
export function detectBrowser(): string {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;

  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
  if (ua.includes('Firefox/')) return 'Firefox';
  return 'Other';
}

// In-memory cache untuk mencegah event duplikat pada re-render React yang berdekatan
const recentEventsCache = new Map<string, number>();
const DEDUP_INTERVAL_MS = 2500; // Minimal selisih 2.5 detik untuk event yang sama persis

export interface TrackEventOptions {
  event_name: string;
  path?: string;
  template_id?: string | null;
  invitation_id?: string | null;
  user_id?: string | null;
  referrer?: string | null;
}

/**
 * Mengirimkan event tracking internal secara asinkron dan efisien.
 * Mengabaikan error jaringan agar tidak mengganggu interaksi pengguna.
 */
export async function trackEvent({
  event_name,
  path = typeof window !== 'undefined' ? window.location.pathname : '/',
  template_id = null,
  invitation_id = null,
  user_id = null,
  referrer = typeof document !== 'undefined' ? document.referrer || null : null,
}: TrackEventOptions): Promise<void> {
  const now = Date.now();
  const cacheKey = `${event_name}:${path}:${template_id ?? ''}:${invitation_id ?? ''}`;
  const lastTime = recentEventsCache.get(cacheKey);

  if (lastTime && now - lastTime < DEDUP_INTERVAL_MS) {
    return; // Cegah duplikasi saat fast-refresh atau multi-render
  }
  recentEventsCache.set(cacheKey, now);

  // Bersihkan cache yang sudah kedaluwarsa secara berkala
  if (recentEventsCache.size > 100) {
    recentEventsCache.forEach((time, key) => {
      if (now - time > 10000) {
        recentEventsCache.delete(key);
      }
    });
  }

  const payload: AnalyticsEventInsert = {
    event_name,
    path,
    session_id: getOrCreateSessionId(),
    device_type: detectDeviceType(),
    browser: detectBrowser(),
    referrer: referrer ? referrer.slice(0, 255) : null,
    template_id,
    invitation_id,
    user_id,
  };

  try {
    await supabase.from('analytics_events').insert(payload);
  } catch {
    // Fail silently untuk analytics tanpa melempar runtime exception ke UI
  }
}

/**
 * Helper tracking page view
 */
export function trackPageView(path?: string, userId?: string | null): void {
  trackEvent({
    event_name: 'page_view',
    path,
    user_id: userId,
  });
}

/**
 * Helper tracking view demo template
 */
export function trackDemoView(
  templateId: string,
  slug: string,
  userId?: string | null
): void {
  trackEvent({
    event_name: 'template_demo_view',
    path: `/templates/${slug}/demo`,
    template_id: templateId,
    user_id: userId,
  });
}

/**
 * Helper tracking katalog template
 */
export function trackCatalogView(userId?: string | null): void {
  trackEvent({
    event_name: 'template_catalog_view',
    path: '/#template',
    user_id: userId,
  });
}
