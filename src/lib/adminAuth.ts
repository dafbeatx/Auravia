import { supabase } from '@/lib/supabase';

const ADMIN_TOKEN_KEY = 'aurovia_admin_session_token';
const ADMIN_USER_KEY = 'aurovia_admin_session_user';

export interface AdminUserSession {
  id: string;
  username: string;
  display_name?: string;
  role: 'super_admin' | 'admin';
  last_login_at?: string | null;
  is_active?: boolean;
}

export interface AdminAccountItem {
  id: string;
  username: string;
  role: 'super_admin' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

/**
 * Mengambil data ringkas sesi admin aktif dari sessionStorage.
 */
export function getAdminUser(): AdminUserSession | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.sessionStorage.getItem(ADMIN_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Mengambil token sesi admin aktif dari sessionStorage.
 */
export function getAdminToken(): string | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.sessionStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Menyimpan token sesi admin aktif ke sessionStorage.
 */
export function setAdminToken(token: string, user?: AdminUserSession): void {
  try {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
      if (user) {
        window.sessionStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
      }
    }
  } catch {
    // Abaikan jika storage dinonaktifkan di browser pengguna
  }
}

/**
 * Menghapus token sesi admin dari sessionStorage.
 */
export function clearAdminToken(): void {
  try {
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
      window.sessionStorage.removeItem(ADMIN_USER_KEY);
    }
  } catch {
    // Abaikan jika storage dinonaktifkan
  }
}

/**
 * Autentikasi administrator melalui username dan password.
 * Verifikasi hash bcrypt dilakukan secara aman di server PostgreSQL.
 * Mengembalikan pesan generik 'Username atau password salah.' pada semua kegagalan.
 */
export async function loginAdmin(
  usernameInput: string,
  passwordInput: string
): Promise<{ success: boolean; admin?: AdminUserSession; error?: string }> {
  const cleanUsername = usernameInput.trim();
  if (!cleanUsername || !passwordInput) {
    return { success: false, error: 'Username atau password salah.' };
  }

  try {
    const { data, error } = await supabase.rpc('admin_login', {
      p_username: cleanUsername,
      p_password: passwordInput,
      p_client_ip: null,
      p_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
    });

    if (error || !data) {
      // Artificial delay untuk mencegah timing analysis attack
      await new Promise((resolve) => setTimeout(resolve, 350));
      return { success: false, error: 'Username atau password salah.' };
    }

    const res = data as unknown as {
      success: boolean;
      token?: string;
      admin?: AdminUserSession;
      error?: string;
    };

    if (!res.success || !res.token || !res.admin) {
      return { success: false, error: res.error || 'Username atau password salah.' };
    }

    setAdminToken(res.token, res.admin);
    return { success: true, admin: res.admin };
  } catch {
    return { success: false, error: 'Username atau password salah.' };
  }
}

/**
 * Memverifikasi validitas sesi admin yang sedang aktif.
 */
export async function verifyAdminSession(): Promise<{
  valid: boolean;
  admin?: AdminUserSession;
}> {
  const token = getAdminToken();
  if (!token) {
    return { valid: false };
  }

  try {
    const { data, error } = await supabase.rpc('admin_verify_session', {
      p_token: token,
    });

    if (error || !data) {
      clearAdminToken();
      return { valid: false };
    }

    const res = data as unknown as { valid: boolean; admin?: AdminUserSession };
    if (!res.valid || !res.admin) {
      clearAdminToken();
      return { valid: false };
    }

    if (res.admin) {
      setAdminToken(token, res.admin);
    }

    return { valid: true, admin: res.admin };
  } catch {
    clearAdminToken();
    return { valid: false };
  }
}

/**
 * Mengakhiri sesi administrator dan menginvalidasi token di server.
 */
export async function logoutAdmin(): Promise<void> {
  const token = getAdminToken();
  if (token) {
    try {
      await supabase.rpc('admin_logout', { p_token: token });
    } catch {
      // Fail-safe jika jaringan offline
    }
  }
  clearAdminToken();
}

/**
 * Mengambil daftar seluruh akun administrator (Khusus Super Admin).
 */
export async function listAdminAccounts(): Promise<AdminAccountItem[]> {
  const token = getAdminToken();
  if (!token) {
    throw new Error('Sesi admin tidak ditemukan. Silakan login kembali.');
  }

  const { data, error } = await supabase.rpc('admin_list_accounts', {
    p_token: token,
  });

  if (error) {
    throw new Error(error.message || 'Gagal memuat daftar akun admin.');
  }

  return (data ?? []) as AdminAccountItem[];
}

/**
 * Membuat akun administrator baru (Khusus Super Admin).
 */
export async function createAdminAccount(
  username: string,
  password: string,
  role: 'super_admin' | 'admin'
): Promise<{ success: boolean; id: string; username: string }> {
  const token = getAdminToken();
  if (!token) {
    throw new Error('Sesi admin tidak ditemukan.');
  }

  const { data, error } = await supabase.rpc('admin_create_account', {
    p_token: token,
    p_new_username: username,
    p_new_password: password,
    p_new_role: role,
  });

  if (error) {
    throw new Error(error.message || 'Gagal membuat akun admin baru.');
  }

  const res = data as unknown as { success: boolean; id: string; username: string };
  return res;
}

/**
 * Memperbarui data akun administrator (Khusus Super Admin).
 */
export async function updateAdminAccount(
  targetId: string,
  username: string,
  role: 'super_admin' | 'admin',
  isActive: boolean
): Promise<void> {
  const token = getAdminToken();
  if (!token) {
    throw new Error('Sesi admin tidak ditemukan.');
  }

  const { error } = await supabase.rpc('admin_update_account', {
    p_token: token,
    p_target_id: targetId,
    p_username: username,
    p_role: role,
    p_is_active: isActive,
  });

  if (error) {
    throw new Error(error.message || 'Gagal memperbarui akun admin.');
  }
}

/**
 * Mereset password akun administrator secara aman (Khusus Super Admin).
 */
export async function resetAdminPassword(
  targetId: string,
  newPassword: string
): Promise<void> {
  const token = getAdminToken();
  if (!token) {
    throw new Error('Sesi admin tidak ditemukan.');
  }

  const { error } = await supabase.rpc('admin_reset_account_password', {
    p_token: token,
    p_target_id: targetId,
    p_new_password: newPassword,
  });

  if (error) {
    throw new Error(error.message || 'Gagal mereset kata sandi admin.');
  }
}

/**
 * Mengubah password akun sendiri dengan verifikasi password lama.
 */
export async function changeAdminOwnPassword(
  oldPassword: string,
  newPassword: string
): Promise<void> {
  const token = getAdminToken();
  if (!token) {
    throw new Error('Sesi admin tidak ditemukan.');
  }

  const { error } = await supabase.rpc('admin_change_own_password', {
    p_token: token,
    p_old_password: oldPassword,
    p_new_password: newPassword,
  });

  if (error) {
    throw new Error(error.message || 'Gagal memperbarui kata sandi admin.');
  }
}

/**
 * Memperbarui profil akun admin sendiri (username dan display name).
 */
export async function updateAdminProfile(
  newUsername: string,
  displayName: string
): Promise<{ success: boolean; username: string; display_name: string }> {
  const token = getAdminToken();
  if (!token) {
    throw new Error('Sesi admin tidak ditemukan.');
  }

  const { data, error } = await supabase.rpc('admin_update_profile', {
    p_token: token,
    p_new_username: newUsername,
    p_display_name: displayName,
  });

  if (error) {
    throw new Error(error.message || 'Gagal memperbarui profil admin.');
  }

  const res = data as unknown as { success: boolean; username: string; display_name: string };

  // Update session user di sessionStorage
  const currentUser = getAdminUser();
  if (currentUser) {
    currentUser.username = res.username;
    currentUser.display_name = res.display_name;
    setAdminToken(token, currentUser);
  }

  return res;
}
