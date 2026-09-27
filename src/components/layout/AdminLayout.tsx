import { useState, Suspense } from 'react';
import { NavLink, Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function AdminLayout() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/admin/login');
  };

  // Tentukan judul dan breadcrumb berdasarkan pathname saat ini
  const getPageHeaderInfo = () => {
    const path = location.pathname;
    if (path === '/admin') {
      return { title: 'Dashboard Utama', breadcrumbs: ['Admin', 'Dashboard'] };
    }
    if (path === '/admin/templates') {
      return { title: 'Katalog Template', breadcrumbs: ['Admin', 'Template'] };
    }
    if (path.startsWith('/admin/templates/')) {
      return { title: 'Editor Template', breadcrumbs: ['Admin', 'Template', 'Edit'] };
    }
    if (path === '/admin/analytics') {
      return { title: 'Traffic & Analitik', breadcrumbs: ['Admin', 'Traffic'] };
    }
    if (path === '/admin/users') {
      return { title: 'Manajemen Pengguna', breadcrumbs: ['Admin', 'Pengguna'] };
    }
    if (path === '/admin/settings/security') {
      return { title: 'Keamanan Akun Admin', breadcrumbs: ['Admin', 'Pengaturan', 'Keamanan'] };
    }
    if (path === '/admin/settings') {
      return { title: 'Pengaturan Sistem', breadcrumbs: ['Admin', 'Pengaturan'] };
    }
    return { title: 'Admin Aurovia', breadcrumbs: ['Admin'] };
  };

  const { title, breadcrumbs } = getPageHeaderInfo();

  const navLinks = [
    {
      to: '/admin',
      end: true,
      label: 'Dashboard',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      to: '/admin/templates',
      end: false,
      label: 'Template',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
    },
    {
      to: '/admin/analytics',
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
      label: 'Pengguna',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      to: '/admin/settings',
      end: false,
      label: 'Pengaturan',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#F2FEF7] flex flex-col md:flex-row text-gray-800">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-[#9ACBD0]/60 shrink-0">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center border-b border-[#9ACBD0]/40">
          <Link to="/admin" className="flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-[#006A71] rounded-lg p-1">
            <div className="w-8 h-8 rounded-lg bg-[#006A71] text-white flex items-center justify-center font-serif font-bold text-sm shadow-xs">
              A
            </div>
            <div>
              <span className="font-serif font-bold text-base text-[#006A71] tracking-tight block">
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
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] focus:outline-none focus:ring-2 focus:ring-[#006A71] ${
                  isActive
                    ? 'bg-[#006A71] text-white shadow-xs'
                    : 'text-gray-600 hover:text-[#006A71] hover:bg-[#F2FEF7]'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Link cepat ke web publik */}
        <div className="px-4 py-3 border-t border-[#9ACBD0]/40">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 text-xs font-medium text-gray-500 hover:text-[#006A71] rounded-lg transition-colors min-h-[44px]"
          >
            <span>Buka Situs Publik</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#9ACBD0]/40 text-center">
          <p className="text-[11px] font-semibold text-gray-500 tracking-wide">
            Aurovia Admin
          </p>
          <p className="text-[10px] text-gray-400 font-mono mt-0.5">
            v1
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-[#9ACBD0]/60 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          {/* Left: Mobile trigger & Breadcrumbs / Page Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-[#F2FEF7] focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Buka menu navigasi admin"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              {/* Breadcrumbs */}
              <nav className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                {breadcrumbs.map((crumb, idx) => (
                  <span key={idx} className="flex items-center gap-1.5">
                    {idx > 0 && <span>/</span>}
                    <span className={idx === breadcrumbs.length - 1 ? 'text-[#006A71] font-semibold' : ''}>
                      {crumb}
                    </span>
                  </span>
                ))}
              </nav>
              {/* Judul Halaman */}
              <h1 className="text-base sm:text-lg font-serif font-bold text-[#006A71] leading-tight">
                {title}
              </h1>
            </div>
          </div>

          {/* Right: Account Menu & Logout */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-[#F2FEF7] border border-transparent hover:border-[#9ACBD0]/40 transition-all focus:outline-none focus:ring-2 focus:ring-[#006A71] min-h-[44px]"
              aria-expanded={userDropdownOpen}
              aria-label="Menu akun administrator"
            >
              <div className="w-8 h-8 rounded-full bg-[#48A6A7] text-white flex items-center justify-center text-xs font-bold uppercase shadow-2xs">
                {profile?.full_name ? profile.full_name[0] : user?.email ? user.email[0] : 'A'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-gray-800 leading-tight">
                  {profile?.full_name || 'Administrator'}
                </p>
                <p className="text-[10px] text-gray-500 truncate max-w-[130px]">
                  {user?.email}
                </p>
              </div>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {userDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-[#9ACBD0]/60 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                role="menu"
              >
                <div className="px-4 py-2 border-b border-[#9ACBD0]/30">
                  <span className="inline-block px-2 py-0.5 text-[9px] uppercase font-bold tracking-wider rounded-md bg-[#006A71]/10 text-[#006A71]">
                    Super Admin
                  </span>
                  <p className="text-xs font-medium text-gray-700 truncate mt-1">
                    {user?.email}
                  </p>
                </div>

                <div className="py-1">
                  <Link
                    to="/admin/settings/security"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs text-gray-600 hover:text-[#006A71] hover:bg-[#F2FEF7] min-h-[44px]"
                    role="menuitem"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Keamanan Akun Admin</span>
                  </Link>

                  <Link
                    to="/dashboard"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs text-gray-600 hover:text-[#006A71] hover:bg-[#F2FEF7] min-h-[44px]"
                    role="menuitem"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>Dashboard Pengguna</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 min-h-[44px] cursor-pointer"
                    role="menuitem"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Keluar (Logout)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs flex">
            <div className="w-64 bg-white h-full flex flex-col p-4 shadow-xl border-r border-[#9ACBD0]">
              <div className="flex items-center justify-between pb-4 border-b border-[#9ACBD0]/40">
                <span className="font-serif font-bold text-base text-[#006A71]">
                  Aurovia Admin
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Tutup menu navigasi"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <nav className="flex-1 py-4 space-y-1 overflow-y-auto" aria-label="Menu Admin Mobile">
                {navLinks.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
                        isActive
                          ? 'bg-[#006A71] text-white'
                          : 'text-gray-600 hover:bg-[#F2FEF7]'
                      }`
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>

              <div className="pt-4 border-t border-[#9ACBD0]/40 text-center text-xs text-gray-400">
                <p className="font-semibold text-gray-600">Aurovia Admin</p>
                <p className="font-mono text-[10px]">v1</p>
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
                <div className="w-8 h-8 border-2 border-[#006A71] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-500">Memuat halaman admin...</p>
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
