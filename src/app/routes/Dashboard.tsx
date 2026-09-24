import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Dashboard: Komponen placeholder terlindungi untuk fase autentikasi.
 * Menampilkan status otentikasi nyata tanpa metrik tiruan atau data fiktif.
 */
export function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="py-12 max-w-xl mx-auto">
      <div className="bg-surface border border-border rounded p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
          <div>
            <h1 className="font-serif text-2xl font-bold text-primary mb-1">
              Area Pengguna (Dashboard)
            </h1>
            <p className="text-sm text-text-muted">
              Sesi terautentikasi aktif melalui Supabase Auth.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="py-1.5 px-3 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-muted hover:text-danger rounded transition-colors cursor-pointer"
          >
            Keluar Sesi
          </button>
        </div>

        <div className="space-y-3 text-xs font-mono">
          <div className="flex justify-between py-1.5 border-b border-border">
            <span className="text-text-subtle font-sans">Alamat Email</span>
            <span className="font-semibold text-text-primary">{user?.email ?? '-'}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-border">
            <span className="text-text-subtle font-sans">Identitas Pengguna (ID)</span>
            <span className="font-semibold text-text-primary text-[11px]">{user?.id ?? '-'}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-border">
            <span className="text-text-subtle font-sans">Status Sesi</span>
            <span className="font-semibold text-success">Aktif (Terverifikasi)</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-text-subtle font-sans">Role Akses Database</span>
            <span className="font-semibold text-text-primary">{user?.role ?? 'authenticated'}</span>
          </div>
        </div>

        <div className="mt-6 p-4 bg-background border border-border rounded text-xs text-text-muted leading-relaxed">
          <strong className="text-text-primary block mb-1">Status Fondasi Autentikasi:</strong>
          Sesi Anda tersimpan dengan aman pada storage peramban dan akan dipulihkan secara otomatis saat halaman disegarkan (session restoration).
        </div>
      </div>
    </div>
  );
}
