export function AdminSettings() {
  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div>
        <h2 className="font-serif text-2xl font-bold text-[#006A71]">
          Pengaturan Sistem &amp; Lingkungan
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Informasi konfigurasi arsitektur platform, penyimpanan aset, dan token desain Aurovia.
        </p>
      </div>

      {/* Kartu Keamanan Akun Admin */}
      <div className="bg-white p-6 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-serif text-base font-bold text-[#006A71]">
              Keamanan Kredensial Administrator
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed max-w-xl">
              Atur username khusus dan perbarui password autentikasi admin. Password dikelola dan dienkripsi secara aman oleh Supabase Auth.
            </p>
          </div>
          <a
            href="/admin/settings/security"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#006A71] hover:bg-[#00575d] text-white text-xs font-semibold shadow-xs min-h-[44px] transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-[#006A71]"
          >
            Kelola Username &amp; Password
          </a>
        </div>
      </div>

      {/* Kartu Status Sistem */}
      <div className="bg-white p-6 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-4">
        <h3 className="font-serif text-base font-bold text-[#006A71] border-b border-[#9ACBD0]/30 pb-3">
          Status Layanan
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[#F2FEF7] border border-[#9ACBD0]/40 flex items-center justify-between">
            <div>
              <span className="font-semibold text-gray-800 block">Supabase Database</span>
              <span className="text-[11px] text-gray-500">PostgreSQL + RLS v1.4</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              TERHUBUNG
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#F2FEF7] border border-[#9ACBD0]/40 flex items-center justify-between">
            <div>
              <span className="font-semibold text-gray-800 block">Supabase Storage</span>
              <span className="text-[11px] text-gray-500">Bucket: template-assets</span>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              AKTIF (PUBLIC)
            </span>
          </div>
        </div>
      </div>

      {/* Kartu Token Warna Global Website */}
      <div className="bg-white p-6 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-4">
        <h3 className="font-serif text-base font-bold text-[#006A71] border-b border-[#9ACBD0]/30 pb-3">
          Design Token &amp; Sistem Warna
        </h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          Seluruh halaman Aurovia menggunakan standar palet berikut sebagai fondasi visual editorial modern:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          {/* Primary Dark */}
          <div className="space-y-2">
            <div className="h-16 rounded-xl bg-[#006A71] shadow-2xs border border-black/10 flex items-end p-2">
              <span className="text-[10px] font-mono text-white font-bold">#006A71</span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Primary Dark</p>
              <p className="text-[10px] text-gray-500">Heading, CTA utama, navigasi aktif</p>
            </div>
          </div>

          {/* Primary */}
          <div className="space-y-2">
            <div className="h-16 rounded-xl bg-[#48A6A7] shadow-2xs border border-black/10 flex items-end p-2">
              <span className="text-[10px] font-mono text-white font-bold">#48A6A7</span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Primary</p>
              <p className="text-[10px] text-gray-500">Tombol sekunder, ikon, highlight</p>
            </div>
          </div>

          {/* Light */}
          <div className="space-y-2">
            <div className="h-16 rounded-xl bg-[#9ACBD0] shadow-2xs border border-black/10 flex items-end p-2">
              <span className="text-[10px] font-mono text-gray-900 font-bold">#9ACBD0</span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Light</p>
              <p className="text-[10px] text-gray-500">Border, soft card, aksen lembut</p>
            </div>
          </div>

          {/* Background */}
          <div className="space-y-2">
            <div className="h-16 rounded-xl bg-[#F2FEF7] shadow-2xs border border-gray-200 flex items-end p-2">
              <span className="text-[10px] font-mono text-gray-700 font-bold">#F2FEF7</span>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-800">Background</p>
              <p className="text-[10px] text-gray-500">Latar halaman &amp; seksi konten</p>
            </div>
          </div>
        </div>
      </div>

      {/* Kartu Informasi Aplikasi */}
      <div className="bg-white p-6 rounded-2xl border border-[#9ACBD0]/60 shadow-2xs space-y-3">
        <h3 className="font-serif text-base font-bold text-[#006A71]">
          Informasi Platform
        </h3>
        <div className="text-xs text-gray-600 space-y-2">
          <p>
            <strong>Aplikasi:</strong> Aurovia Platform
          </p>
          <p>
            <strong>Versi Admin Panel:</strong> v1
          </p>
          <p>
            <strong>Deployment:</strong> Vercel Production + Supabase
          </p>
          <p>
            <strong>Arsitektur Keamanan:</strong> Server-enforced PostgreSQL Row Level Security (RLS) &amp; Security Definer authorization.
          </p>
        </div>
      </div>
    </div>
  );
}
