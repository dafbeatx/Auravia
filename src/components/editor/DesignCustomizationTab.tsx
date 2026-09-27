import React, { useState } from 'react';
import type {
  InvitationThemeOverride,
  ButtonRadiusStyle,
  CardRadiusStyle,
  DecorativeStyle,
  NormalizedTheme,
} from '@/lib/template/types';

export interface DesignCustomizationTabProps {
  themeOverride: InvitationThemeOverride;
  activeTheme: NormalizedTheme;
  defaultTheme?: unknown;
  onChangeThemeOverride: (next: InvitationThemeOverride) => void;
  onResetDesign: () => void;
}

const HEADING_FONT_OPTIONS = [
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond', style: 'Serif Klasik Elegan' },
  { value: 'Playfair Display', label: 'Playfair Display', style: 'Serif Modern Berkarakter' },
  { value: 'Cinzel', label: 'Cinzel', style: 'Serif Megah & Formal' },
  { value: 'Great Vibes', label: 'Great Vibes', style: 'Kaligrafi Romantis' },
];

const BODY_FONT_OPTIONS = [
  { value: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', style: 'Sans-serif Bersih & Nyaman' },
  { value: 'Inter', label: 'Inter', style: 'Sans-serif Presisi Netral' },
  { value: 'Lora', label: 'Lora', style: 'Serif Hangat Editorial' },
  { value: 'Montserrat', label: 'Montserrat', style: 'Sans-serif Geometris Tegas' },
];

const PALETTE_PRESETS = [
  {
    name: 'Alabaster & Charcoal',
    description: 'Hangat, tenang, editorial klasik',
    colors: {
      color_background: '#FAF9F6',
      color_primary: '#292524',
      color_foreground: '#292524',
      color_surface: '#FFFFFF',
      color_border: '#E7E5E0',
      color_accent: '#78716C',
    },
  },
  {
    name: 'Botanical Sage',
    description: 'Sentuhan nuansa alam kehijauan segar',
    colors: {
      color_background: '#F4F7F4',
      color_primary: '#1C2E24',
      color_foreground: '#1C2E24',
      color_surface: '#FFFFFF',
      color_border: '#DDE5DE',
      color_accent: '#3B5E49',
    },
  },
  {
    name: 'Rose Dust',
    description: 'Kelembutan rona mawar hangat romantis',
    colors: {
      color_background: '#FAF6F6',
      color_primary: '#2E1C22',
      color_foreground: '#2E1C22',
      color_surface: '#FFFFFF',
      color_border: '#E8DCDC',
      color_accent: '#8C5363',
    },
  },
  {
    name: 'Midnight Editorial',
    description: 'Nuansa gelap khidmat dan dramatis',
    colors: {
      color_background: '#1C1917',
      color_primary: '#F5F5F4',
      color_foreground: '#F5F5F4',
      color_surface: '#292524',
      color_border: '#44403C',
      color_accent: '#D6D3D1',
    },
  },
];

export const DesignCustomizationTab: React.FC<DesignCustomizationTabProps> = ({
  themeOverride,
  activeTheme,
  onChangeThemeOverride,
  onResetDesign,
}) => {
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const updateField = <K extends keyof InvitationThemeOverride>(
    key: K,
    val: InvitationThemeOverride[K]
  ) => {
    onChangeThemeOverride({
      ...themeOverride,
      [key]: val,
    });
  };

  const applyPreset = (presetColors: Record<string, string>) => {
    onChangeThemeOverride({
      ...themeOverride,
      ...presetColors,
    });
  };

  // Apakah user memiliki kustomisasi aktif
  const hasCustomizations = Object.keys(themeOverride).length > 0;

  return (
    <div className="p-5 space-y-6 text-xs">
      {/* Header Tab */}
      <div className="flex items-center justify-between pb-3 border-b border-border gap-2 flex-wrap">
        <div>
          <h3 className="font-semibold text-text-primary text-sm">
            Kustomisasi Desain
          </h3>
          <p className="text-[11px] text-text-muted mt-0.5">
            Atur tipografi, palet warna, dan gaya komponen secara visual tanpa mengubah isi undangan.
          </p>
        </div>

        {hasCustomizations && (
          <button
            type="button"
            onClick={() => setResetModalOpen(true)}
            className="text-[11px] font-semibold text-danger hover:text-danger/80 transition-colors py-1.5 px-3 rounded border border-danger/30 hover:border-danger/60 cursor-pointer shrink-0"
          >
            Reset ke Bawaan
          </button>
        )}
      </div>

      {/* 1. TIPOGRAFI */}
      <div className="space-y-4 p-4 border border-border rounded-lg bg-surface">
        <h4 className="font-semibold text-text-primary text-xs uppercase tracking-wider">
          1. Tipografi
        </h4>

        {/* Font Judul / Display */}
        <div className="space-y-1.5">
          <label htmlFor="fontHeadingSelect" className="font-medium text-text-primary block">
            Font Judul &amp; Headline
          </label>
          <select
            id="fontHeadingSelect"
            value={themeOverride.font_heading || activeTheme.fontHeading}
            onChange={(e) => updateField('font_heading', e.target.value)}
            className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
          >
            {HEADING_FONT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} ({opt.style})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-text-subtle">
            Digunakan pada nama mempelai, tajuk seksi, dan headline utama.
          </p>
        </div>

        {/* Font Isi Teks */}
        <div className="space-y-1.5">
          <label htmlFor="fontBodySelect" className="font-medium text-text-primary block">
            Font Isi / Konten
          </label>
          <select
            id="fontBodySelect"
            value={themeOverride.font_body || activeTheme.fontBody}
            onChange={(e) => updateField('font_body', e.target.value)}
            className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs cursor-pointer"
          >
            {BODY_FONT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} ({opt.style})
              </option>
            ))}
          </select>
          <p className="text-[11px] text-text-subtle">
            Digunakan pada deskripsi acara, kisah, dan pesan penutup.
          </p>
        </div>
      </div>

      {/* 2. PALET WARNA */}
      <div className="space-y-4 p-4 border border-border rounded-lg bg-surface">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-text-primary text-xs uppercase tracking-wider">
            2. Palet Warna
          </h4>
        </div>

        {/* Preset Palet Siap Pakai */}
        <div className="space-y-2">
          <label className="font-medium text-text-primary block text-[11px]">
            Inspirasi Palet Harmonis
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PALETTE_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset.colors)}
                className="p-2.5 rounded-lg border border-border hover:border-primary/60 text-left transition-all bg-surface-elevated/40 hover:bg-surface-elevated cursor-pointer group"
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div
                    className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: preset.colors.color_background }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: preset.colors.color_primary }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: preset.colors.color_accent }}
                  />
                  <span className="font-semibold text-text-primary text-xs ml-1 group-hover:text-primary transition-colors">
                    {preset.name}
                  </span>
                </div>
                <p className="text-[10px] text-text-muted leading-tight">
                  {preset.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Pemilih Warna Individual */}
        <div className="space-y-3 pt-2 border-t border-border/60">
          <label className="font-medium text-text-primary block text-[11px]">
            Penyesuaian Warna Terperinci
          </label>

          {/* Latar Belakang */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="font-medium text-text-primary block">Warna Latar Belakang</span>
              <span className="text-[10px] text-text-subtle">Kanvas utama halaman undangan</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={themeOverride.color_background || activeTheme.colorBackground}
                onChange={(e) => updateField('color_background', e.target.value)}
                className="w-8 h-8 rounded border border-border cursor-pointer p-0.5 bg-surface shrink-0"
                aria-label="Pilih warna latar belakang"
              />
              <span className="font-mono text-[11px] text-text-muted w-16 text-right">
                {themeOverride.color_background || activeTheme.colorBackground}
              </span>
            </div>
          </div>

          {/* Teks Utama */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="font-medium text-text-primary block">Warna Teks &amp; Judul</span>
              <span className="text-[10px] text-text-subtle">Warna primer tipografi dan heading</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={themeOverride.color_primary || activeTheme.colorPrimary}
                onChange={(e) => {
                  updateField('color_primary', e.target.value);
                  updateField('color_foreground', e.target.value);
                }}
                className="w-8 h-8 rounded border border-border cursor-pointer p-0.5 bg-surface shrink-0"
                aria-label="Pilih warna teks utama"
              />
              <span className="font-mono text-[11px] text-text-muted w-16 text-right">
                {themeOverride.color_primary || activeTheme.colorPrimary}
              </span>
            </div>
          </div>

          {/* Kartu / Permukaan */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="font-medium text-text-primary block">Warna Kartu &amp; Panel</span>
              <span className="text-[10px] text-text-subtle">Latar kotak agenda, rsvp, dan form</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={themeOverride.color_surface || activeTheme.colorSurface}
                onChange={(e) => updateField('color_surface', e.target.value)}
                className="w-8 h-8 rounded border border-border cursor-pointer p-0.5 bg-surface shrink-0"
                aria-label="Pilih warna kartu dan panel"
              />
              <span className="font-mono text-[11px] text-text-muted w-16 text-right">
                {themeOverride.color_surface || activeTheme.colorSurface}
              </span>
            </div>
          </div>

          {/* Garis Batas */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="font-medium text-text-primary block">Warna Garis Pembatas</span>
              <span className="text-[10px] text-text-subtle">Garis sekat kartu dan pembatas seksi</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={themeOverride.color_border || activeTheme.colorBorder}
                onChange={(e) => updateField('color_border', e.target.value)}
                className="w-8 h-8 rounded border border-border cursor-pointer p-0.5 bg-surface shrink-0"
                aria-label="Pilih warna garis pembatas"
              />
              <span className="font-mono text-[11px] text-text-muted w-16 text-right">
                {themeOverride.color_border || activeTheme.colorBorder}
              </span>
            </div>
          </div>

          {/* Warna Aksen */}
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="font-medium text-text-primary block">Warna Aksen Penegas</span>
              <span className="text-[10px] text-text-subtle">Sorotan tanggal dan tombol interaksi</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={themeOverride.color_accent || activeTheme.colorAccent}
                onChange={(e) => updateField('color_accent', e.target.value)}
                className="w-8 h-8 rounded border border-border cursor-pointer p-0.5 bg-surface shrink-0"
                aria-label="Pilih warna aksen"
              />
              <span className="font-mono text-[11px] text-text-muted w-16 text-right">
                {themeOverride.color_accent || activeTheme.colorAccent}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. GAYA KOMPONEN & SUDUT */}
      <div className="space-y-4 p-4 border border-border rounded-lg bg-surface">
        <h4 className="font-semibold text-text-primary text-xs uppercase tracking-wider">
          3. Gaya Bentuk &amp; Sudut Komponen
        </h4>

        {/* Gaya Sudut Tombol */}
        <div className="space-y-1.5">
          <label className="font-medium text-text-primary block">
            Gaya Sudut Tombol
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'pill', label: 'Kapsul (Pill)', desc: 'Melingkar lembut' },
              { id: 'rounded', label: 'Lengkung', desc: 'Sudut modern 8px' },
              { id: 'sharp', label: 'Tegas', desc: 'Sudut siku-siku' },
            ].map((item) => {
              const isSelected =
                (themeOverride.button_radius || activeTheme.buttonRadius) === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateField('button_radius', item.id as ButtonRadiusStyle)}
                  className={`p-2.5 rounded border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary ring-1 ring-primary bg-primary/5 text-primary font-semibold'
                      : 'border-border hover:border-border-strong text-text-primary'
                  }`}
                >
                  <p className="text-xs">{item.label}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gaya Sudut Kartu */}
        <div className="space-y-1.5 pt-2">
          <label className="font-medium text-text-primary block">
            Gaya Sudut Kartu &amp; Panel
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'rounded', label: 'Melengkung', desc: 'Radius 16px' },
              { id: 'subtle', label: 'Halus', desc: 'Radius 8px' },
              { id: 'sharp', label: 'Tegas', desc: 'Sudut tajam 0px' },
            ].map((item) => {
              const isSelected =
                (themeOverride.card_radius || activeTheme.cardRadius) === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateField('card_radius', item.id as CardRadiusStyle)}
                  className={`p-2.5 rounded border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary ring-1 ring-primary bg-primary/5 text-primary font-semibold'
                      : 'border-border hover:border-border-strong text-text-primary'
                  }`}
                >
                  <p className="text-xs">{item.label}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gaya Dekorasi Batas */}
        <div className="space-y-1.5 pt-2">
          <label className="font-medium text-text-primary block">
            Dekorasi Pembatas Seksi
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'classic', label: 'Klasik', desc: 'Aksen garis tipis' },
              { id: 'minimal', label: 'Minimalis', desc: 'Tanpa sekat tebal' },
              { id: 'bordered', label: 'Berbingkai', desc: 'Batas kontur rapi' },
            ].map((item) => {
              const isSelected =
                (themeOverride.decorative_style || activeTheme.decorativeStyle) === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => updateField('decorative_style', item.id as DecorativeStyle)}
                  className={`p-2.5 rounded border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-primary ring-1 ring-primary bg-primary/5 text-primary font-semibold'
                      : 'border-border hover:border-border-strong text-text-primary'
                  }`}
                >
                  <p className="text-xs">{item.label}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">{item.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Konfirmasi Reset Desain */}
      {resetModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="resetDesignTitle"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setResetModalOpen(false);
          }}
        >
          <div className="max-w-sm w-full bg-surface border border-border rounded-xl p-6 shadow-xl space-y-4">
            <h4 id="resetDesignTitle" className="font-serif font-bold text-base text-text-primary">
              Reset Kustomisasi Desain?
            </h4>
            <p className="text-xs text-text-muted leading-relaxed">
              Seluruh penyesuaian font, palet warna, dan gaya sudut akan dikembalikan ke tema bawaan template master. Data teks, acara, dan foto undangan Anda tetap tersimpan utuh.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="py-2 px-3.5 rounded text-xs font-semibold border border-border hover:bg-surface-elevated text-text-primary transition-colors cursor-pointer min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setResetModalOpen(false);
                  onResetDesign();
                }}
                className="py-2 px-4 rounded text-xs font-semibold bg-danger hover:bg-danger/90 text-white transition-colors cursor-pointer min-h-[44px]"
              >
                Ya, Reset ke Bawaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
