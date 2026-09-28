import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  loginAdmin,
  logoutAdmin,
  verifyAdminSession,
  getAdminToken,
  type AdminUserSession,
} from '@/lib/adminAuth';

interface AdminAuthContextType {
  admin: AdminUserSession | null;
  token: string | null;
  loading: boolean;
  isSuperAdmin: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [admin, setAdmin] = useState<AdminUserSession | null>(null);
  const [token, setToken] = useState<string | null>(getAdminToken());
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const currentToken = getAdminToken();
    if (!currentToken) {
      setAdmin(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const res = await verifyAdminSession();
      if (res.valid && res.admin) {
        setAdmin(res.admin);
        setToken(currentToken);
      } else {
        setAdmin(null);
        setToken(null);
      }
    } catch {
      setAdmin(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const handleLogin = async (username: string, password: string) => {
    setLoading(true);
    try {
      const res = await loginAdmin(username, password);
      if (res.success && res.admin) {
        setAdmin(res.admin);
        setToken(getAdminToken());
        return { success: true };
      }
      return { success: false, error: res.error || 'Username atau password salah.' };
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logoutAdmin();
      setAdmin(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const isSuperAdmin = admin?.role === 'super_admin';

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        token,
        loading,
        isSuperAdmin,
        login: handleLogin,
        logout: handleLogout,
        refreshSession,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth harus digunakan di dalam AdminAuthProvider');
  }
  return context;
}
