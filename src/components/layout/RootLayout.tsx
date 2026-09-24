import { Link, Outlet, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function HeaderNav() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="flex items-center gap-4">
      {loading ? (
        <span className="text-xs text-text-subtle">...</span>
      ) : user ? (
        <>
          <Link
            to="/dashboard"
            className="text-xs font-semibold text-text-primary hover:text-primary transition-colors"
          >
            Dashboard
          </Link>
          <span className="text-xs text-text-subtle hidden sm:inline">
            {user.email}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-semibold text-text-muted hover:text-danger border border-border hover:border-border-strong px-2.5 py-1 rounded transition-colors cursor-pointer"
          >
            Keluar
          </button>
        </>
      ) : (
        <>
          <Link
            to="/login"
            className="text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
          >
            Masuk
          </Link>
          <Link
            to="/register"
            className="text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground px-3 py-1 rounded transition-colors"
          >
            Daftar
          </Link>
        </>
      )}
    </div>
  );
}

function LayoutContent() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="font-serif text-xl font-bold tracking-tight text-primary hover:opacity-90 transition-opacity"
          >
            Aurovia
          </Link>
          <HeaderNav />
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto p-6">
        <Outlet />
      </main>
      <footer className="border-t border-border bg-surface px-6 py-4 text-center text-xs text-text-muted">
        <p>&copy; {new Date().getFullYear()} Aurovia. Platform Undangan Digital Terstruktur.</p>
      </footer>
    </div>
  );
}

export function RootLayout() {
  return (
    <AuthProvider>
      <LayoutContent />
    </AuthProvider>
  );
}
