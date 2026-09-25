/**
 * Memvalidasi apakah URL web aman dan valid (hanya protokol HTTP atau HTTPS).
 * Aturan keamanan:
 * - Hanya mengizinkan skema http:// atau https://
 * - Menolak mutlak skema berbahaya: javascript:, data:, blob:, file:, ftp:, dsb.
 * - Menolak URL yang memuat kredensial akun (username:password@)
 * - Panjang maksimum 2000 karakter
 */
export function isValidWebUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;

  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 2000) return false;

  // Cek skema berbahaya
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('blob:') ||
    lower.startsWith('file:') ||
    lower.startsWith('ftp:')
  ) {
    return false;
  }

  // Wajib diawali http:// atau https://
  if (!/^https?:\/\//i.test(trimmed)) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    // Tolak jika URL memuat kredensial akun sensitif
    if (parsed.username || parsed.password) {
      return false;
    }
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
