import { Outlet } from 'react-router-dom';

/**
 * RootLayout: Shell dasar aplikasi Aurovia.
 * Menyediakan kerangka semantik dasar tanpa dekorasi visual yang tidak perlu.
 */
export function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-text-primary">
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="font-serif text-xl font-bold tracking-tight text-primary">
            Aurovia
          </span>
          <span className="text-xs uppercase tracking-wider text-text-subtle border border-border px-2 py-0.5 rounded">
            Foundation v0.1
          </span>
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
