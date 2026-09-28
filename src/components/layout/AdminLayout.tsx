import { useState, Suspense } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

export function AdminLayout() {
  const { admin, logout, isSuperAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  // Tentukan judul dan breadcrumb berdasarkan pathname saat ini
  const getPageHeaderInfo = () => {
    const path = location.pathname;
    if (path === '/admin') {
      return { title: 'Dashboard Utama', breadcrumbs: ['Admin', 'Overview'] };
    }
    if (path === '/admin/traffic' || path === '/admin/analytics') {
      return { title: 'Traffic & Analitik', breadcrumbs: ['Admin', 'Traffic'] };
    }
    if (path === '/admin/users') {
      return { title: 'Manajemen Pengguna', breadcrumbs: ['Admin', 'Users'] };
    }
    if (path === '/admin/invitations') {
      return { title: 'Manajemen Undangan', breadcrumbs: ['Admin', 'Invitations'] };
    }
    if (path === '/admin/templates') {
      return { title: 'Katalog Template', breadcrumbs: ['Admin', 'Templates'] };
    }
    if (path.startsWith('/admin/templates/')) {
      return { title: 'Editor Template', breadcrumbs: ['Admin', 'Templates', 'Edit'] };
    }
    if (path === '/admin/demo') {
      return { title: 'Manajemen Media Demo', breadcrumbs: ['Admin', 'Demo Media'] };
    }
    if (path === '/admin/settings') {
      return { title: 'Pengaturan Sistem', breadcrumbs: ['Admin', 'Settings'] };
    }
    if (path === '/admin/settings/security') {
      return { title: 'Keamanan Akun Admin', breadcrumbs: ['Admin', 'Settings', 'Security'] };
    }
    if (path === '/admin/accounts') {
      return { title: 'Manajemen Akun Admin', breadcrumbs: ['Admin', 'Admin Accounts'] };
    }
    return { title: 'Admin Aurovia', breadcrumbs: ['Admin'] };
  };

  const { title, breadcrumbs } = getPageHeaderInfo();

  const navLinks = [
    {
      to: '/admin',
      end: true,
      label: 'Overview',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      to: '/admin/traffic',
      end: false,
      label: 'Traffic',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      to: '/admin/users',
      end: false,
      label: 'Users',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      to: '/admin/invitations',
      end: false,
      label: 'Invitations',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      to: '/admin/templates',
      end: false,
      label: 'Templates',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
    },
    {
      to: '/admin/demo',
      end: false,
      label: 'Demo Media',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      to: '/admin/settings',
      end: true,
      label: 'Settings',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      to: '/admin/accounts',
      end: false,
      label: 'Admin Accounts',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ];

  const roleBadgeLabel = admin?.role === 'super_admin' ? 'Super Admin' : 'Admin';

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col md:flex-row antialiased selection:bg-accent-light/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-border shrink-0">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center border-b border-border">
          <Link
            to="/admin"
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1"
          >
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-serif font-bold text-sm shadow-xs">
              A
            </div>
            <div>
              <span className="font-serif font-bold text-base text-primary tracking-tight block">
                Aurovia Admin
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto" aria-label="Menu Admin">
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-text-muted hover:text-primary hover:bg-surface-elevated'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
              {item.to === '/admin/accounts' && isSuperAdmin && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-primary-soft text-primary font-bold">
                  Super
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Link cepat ke web publik */}
        <div className="px-4 py-3 border-t border-border">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 text-xs font-medium text-text-muted hover:text-primary rounded-lg transition-colors min-h-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span>Buka Situs Publik</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border text-center">
          <p className="text-[11px] font-semibold text-text-muted tracking-wide">
            Aurovia Platform
          </p>
          <p className="text-[10px] text-text-subtle font-mono mt-0.5">
            Admin v1
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-surface border-b border-border px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          {/* Left: Mobile trigger & Breadcrumbs / Page Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-text-muted hover:bg-surface-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Buka menu navigasi admin"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-1.5 text-[11px] text-text-subtle font-medium">
                {breadcrumbs.map((crumb, idx) => (
                  <span key={idx} className="flex items-center gap-1.5">
                    {idx > 0 && <span>/</span>}
                    <span className={idx === breadcrumbs.length - 1 ? 'text-primary font-semibold' : ''}>
                      {crumb}
                    </span>
                  </span>
                ))}
              </nav>
              {/* Judul Halaman */}
              <h1 className="text-base sm:text-lg font-serif font-bold text-primary leading-tight">
                {title}
              </h1>
            </div>
          </div>

          {/* Right: Account Info, Role & Logout */}
          <div className="flex items-center gap-3">
            {/* Header info username dan role */}
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <span className="text-xs font-semibold text-text-primary">
                {admin?.username || 'admin'}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-secondary/15 text-primary border border-secondary/30">
                {roleBadgeLabel}
              </span>
            </div>

            {/* Logout button */}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-danger hover:bg-danger/10 border border-danger/20 transition-all min-h-[38px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
              aria-label="Keluar dari akun admin"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex">
            <div className="w-64 bg-surface h-full flex flex-col p-4 shadow-xl border-r border-border">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <span className="font-serif font-bold text-base text-primary">
                  Aurovia Admin
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-text-muted hover:bg-surface-elevated rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                  aria-label="Tutup menu navigasi"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Mobile User Info */}
              <div className="py-3 px-2 border-b border-border mb-2">
                <p className="text-xs font-bold text-text-primary">
                  {admin?.username}
                </p>
                <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold rounded bg-secondary/15 text-primary border border-secondary/30">
                  {roleBadgeLabel}
                </span>
              </div>

              <nav className="flex-1 py-2 space-y-1 overflow-y-auto" aria-label="Menu Admin Mobile">
                {navLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-text-muted hover:bg-surface-elevated'
                      }`
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-danger/10 text-danger text-xs font-semibold min-h-[44px] cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Keluar (Logout)</span>
                </button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Suspense
            fallback={
              <div className="py-16 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-text-muted">Memuat halaman admin...</p>
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
