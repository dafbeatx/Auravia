import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { HelpModal } from '@/components/layout/HelpModal';

function HeaderNav({ onOpenHelp }: { onOpenHelp: () => void }) {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    await signOut();
    navigate('/login');
  };

  const handleNavigateUndangan = (e: React.MouseEvent) => {
    e.preventDefault();
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    if (location.pathname === '/dashboard') {
      const el = document.getElementById('undangan-saya');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/dashboard#undangan-saya');
    }
  };

  if (loading) {
    return <span className="text-xs text-text-subtle">Memuat...</span>;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <Link
          to="/login"
          className="text-xs font-semibold text-text-muted hover:text-text-primary px-3 py-1.5 rounded-lg transition-colors"
        >
          Masuk
        </Link>
        <Link
          to="/register"
          className="text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground px-3.5 py-1.5 rounded-lg transition-colors"
        >
          Daftar
        </Link>
      </div>
    );
  }

  const userEmail = user.email ?? '';
  const initial = (userEmail.charAt(0) || 'U').toUpperCase();
  const isDashboardActive = location.pathname === '/dashboard';

  return (
    <div className="flex items-center gap-4 sm:gap-6">
      {/* Desktop Navigation Links */}
      <nav className="hidden md:flex items-center gap-6" aria-label="Navigasi Utama">
        <Link
          to="/dashboard"
          className={`text-xs font-semibold transition-colors ${
            isDashboardActive
              ? 'text-primary border-b border-primary pb-0.5'
              : 'text-text-muted hover:text-text-primary'
          }`}
        >
          Dashboard
        </Link>
        <a
          href="#undangan-saya"
          onClick={handleNavigateUndangan}
          className="text-xs font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          Undangan Saya
        </a>
        <button
          type="button"
          onClick={onOpenHelp}
          className="text-xs font-semibold text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          Bantuan
        </button>
      </nav>

      {/* User Avatar & Dropdown (Desktop) */}
      <div className="relative hidden md:block" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((prev) => !prev)}
          aria-expanded={dropdownOpen}
          aria-haspopup="menu"
          aria-label="Buka menu profil akun"
          className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full border border-border bg-surface hover:bg-surface-elevated hover:border-border-strong transition-colors cursor-pointer focus-visible:outline-2"
        >
          <div className="w-7 h-7 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-xs font-bold text-primary font-serif">
            {initial}
          </div>
          <span className="text-xs font-medium text-text-primary max-w-[150px] truncate">
            {userEmail}
          </span>
          <svg
            className={`w-3.5 h-3.5 text-text-subtle transition-transform duration-200 ${
              dropdownOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {dropdownOpen && (
          <div
            role="menu"
            aria-orientation="vertical"
            className="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-xl shadow-lg py-1.5 z-40 animate-fadeIn"
          >
            <div className="px-4 py-2 border-b border-border">
              <p className="text-[10px] uppercase font-bold tracking-wider text-text-subtle">
                Sesi Terautentikasi
              </p>
              <p className="text-xs font-semibold text-text-primary truncate mt-0.5">
                {userEmail}
              </p>
            </div>

            <Link
              to="/dashboard"
              role="menuitem"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
            >
              Dashboard
            </Link>

            <a
              href="#undangan-saya"
              role="menuitem"
              onClick={handleNavigateUndangan}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
            >
              Undangan Saya
            </a>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setDropdownOpen(false);
                onOpenHelp();
              }}
              className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-medium text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors cursor-pointer"
            >
              Pusat Bantuan
            </button>

            <div className="border-t border-border my-1" />

            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs font-semibold text-danger hover:bg-danger/10 transition-colors cursor-pointer"
            >
              Keluar dari Akun
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden relative" ref={mobileMenuRef}>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
          className="p-2 rounded-lg border border-border bg-surface text-text-muted hover:text-text-primary transition-colors cursor-pointer"
        >
          {mobileMenuOpen ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {mobileMenuOpen && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-64 bg-surface border border-border rounded-xl shadow-xl py-2 z-40 animate-fadeIn"
          >
            <div className="px-4 py-2.5 border-b border-border flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-xs font-bold text-primary font-serif flex-shrink-0">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-bold tracking-wider text-text-subtle">
                  Masuk sebagai
                </p>
                <p className="text-xs font-semibold text-text-primary truncate">
                  {userEmail}
                </p>
              </div>
            </div>

            <div className="py-1">
              <Link
                to="/dashboard"
                role="menuitem"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-xs font-medium text-text-primary hover:bg-surface-elevated"
              >
                Dashboard
              </Link>
              <a
                href="#undangan-saya"
                role="menuitem"
                onClick={handleNavigateUndangan}
                className="block px-4 py-2 text-xs font-medium text-text-primary hover:bg-surface-elevated"
              >
                Undangan Saya
              </a>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenHelp();
                }}
                className="w-full text-left block px-4 py-2 text-xs font-medium text-text-primary hover:bg-surface-elevated cursor-pointer"
              >
                Pusat Bantuan
              </button>
            </div>

            <div className="border-t border-border pt-1">
              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="w-full text-left block px-4 py-2 text-xs font-semibold text-danger hover:bg-danger/10 cursor-pointer"
              >
                Keluar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LayoutContent() {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <header className="sticky top-0 z-30 border-b border-border bg-surface/95 backdrop-blur-sm px-4 sm:px-8 py-3.5 transition-shadow">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="font-serif text-2xl font-bold tracking-tight text-primary hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <span>Aurovia</span>
          </Link>
          <HeaderNav onOpenHelp={() => setHelpOpen(true)} />
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-surface px-6 py-6 text-center text-xs text-text-muted">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-serif text-sm font-semibold text-primary">Aurovia</p>
          <p className="text-text-subtle text-[11px]">
            &copy; {new Date().getFullYear()} Aurovia. Platform Undangan Digital Terstruktur.
          </p>
        </div>
      </footer>

      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
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
