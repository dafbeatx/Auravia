import React, { useState, useEffect, useCallback, useMemo, type FormEvent } from 'react';
import {
  getInvitationGuests,
  createGuest,
  updateGuest,
  deleteGuest,
  normalizeGuestSlug,
  buildGuestInvitationUrl,
  generateWhatsAppShareUrl,
  type GuestItem,
} from '@/lib/guests';
import {
  getInvitationRsvps,
  toggleRsvpHidden,
  deleteRsvp,
  calculateRsvpSummary,
  type RsvpItem,
  type RsvpStatus,
} from '@/lib/rsvps';
import { ValidationError, DatabaseError } from '@/lib/errors';

export interface GuestManagementTabProps {
  invitationId: string;
  invitationSlug: string;
  invitationTitle: string;
  onGuestCountChange?: (count: number) => void;
}

function formatRelativeDate(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const GuestManagementTab: React.FC<GuestManagementTabProps> = ({
  invitationId,
  invitationSlug,
  invitationTitle,
  onGuestCountChange,
}) => {
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [rsvps, setRsvps] = useState<RsvpItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sub-navigasi internal: Respons RSVP | Doa & Ucapan | Buku Tamu
  const [subView, setSubView] = useState<'rsvp' | 'wishes' | 'guests'>('rsvp');

  // Filter & Search states
  const [guestSearch, setGuestSearch] = useState('');
  const [rsvpStatusFilter, setRsvpStatusFilter] = useState<RsvpStatus | 'all'>('all');
  const [rsvpSearch, setRsvpSearch] = useState('');

  // Modal Tambah / Edit Tamu
  const [guestModalOpen, setGuestModalOpen] = useState(false);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [guestForm, setGuestForm] = useState({
    name: '',
    phone: '',
    pax_limit: 1,
    slug: '',
  });
  const [isSavingGuest, setIsSavingGuest] = useState(false);
  const [guestModalError, setGuestModalError] = useState<string | null>(null);

  // Modal Hapus Tamu
  const [deleteGuestModalOpen, setDeleteGuestModalOpen] = useState(false);
  const [guestToDelete, setGuestToDelete] = useState<GuestItem | null>(null);
  const [isDeletingGuest, setIsDeletingGuest] = useState(false);

  // Modal Hapus RSVP
  const [deleteRsvpModalOpen, setDeleteRsvpModalOpen] = useState(false);
  const [rsvpToDelete, setRsvpToDelete] = useState<RsvpItem | null>(null);
  const [isDeletingRsvp, setIsDeletingRsvp] = useState(false);

  // State umpan balik salin tautan personal
  const [copiedGuestSlug, setCopiedGuestSlug] = useState<string | null>(null);
  const [togglingRsvpId, setTogglingRsvpId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [guestsData, rsvpsData] = await Promise.all([
        getInvitationGuests(invitationId),
        getInvitationRsvps(invitationId),
      ]);
      setGuests(guestsData);
      setRsvps(rsvpsData);
      if (onGuestCountChange) {
        onGuestCountChange(guestsData.length);
      }
    } catch {
      setErrorMessage('Gagal memuat data tamu dan RSVP. Silakan periksa koneksi internet.');
    } finally {
      setLoading(false);
    }
  }, [invitationId, onGuestCountChange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Statistik aktual RSVP murni dari database tanpa angka tiruan
  const summary = useMemo(() => calculateRsvpSummary(rsvps), [rsvps]);

  // Filter daftar tamu berdasarkan pencarian
  const filteredGuests = useMemo(() => {
    const q = guestSearch.trim().toLowerCase();
    if (!q) return guests;
    return guests.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        (g.phone && g.phone.includes(q)) ||
        g.slug.toLowerCase().includes(q)
    );
  }, [guests, guestSearch]);

  // Filter daftar respons RSVP berdasarkan status dan pencarian
  const filteredRsvps = useMemo(() => {
    return rsvps.filter((r) => {
      const matchStatus = rsvpStatusFilter === 'all' || r.status === rsvpStatusFilter;
      const q = rsvpSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        r.guest_name.toLowerCase().includes(q) ||
        (r.wishes && r.wishes.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [rsvps, rsvpStatusFilter, rsvpSearch]);

  // Daftar respons yang memiliki ucapan/doa
  const wishesList = useMemo(
    () => rsvps.filter((r) => Boolean(r.wishes && r.wishes.trim())),
    [rsvps]
  );

  const filteredWishes = useMemo(() => {
    const q = rsvpSearch.trim().toLowerCase();
    return wishesList.filter(
      (r) =>
        !q ||
        r.guest_name.toLowerCase().includes(q) ||
        (r.wishes && r.wishes.toLowerCase().includes(q))
    );
  }, [wishesList, rsvpSearch]);

  // Handler modal tambah tamu
  const handleOpenAddGuestModal = () => {
    setEditingGuestId(null);
    setGuestForm({
      name: '',
      phone: '',
      pax_limit: 1,
      slug: '',
    });
    setGuestModalError(null);
    setGuestModalOpen(true);
  };

  // Handler modal edit tamu
  const handleOpenEditGuestModal = (guest: GuestItem) => {
    setEditingGuestId(guest.id);
    setGuestForm({
      name: guest.name,
      phone: guest.phone || '',
      pax_limit: guest.pax_limit,
      slug: guest.slug,
    });
    setGuestModalError(null);
    setGuestModalOpen(true);
  };

  // Auto-generate slug ketika nama tamu diketik pada form penambahan baru
  const handleGuestNameChange = (newName: string) => {
    setGuestForm((prev) => ({
      ...prev,
      name: newName,
      slug: editingGuestId ? prev.slug : normalizeGuestSlug(newName),
    }));
  };

  // Simpan data tamu (tambah atau edit)
  const handleSaveGuest = async (e: FormEvent) => {
    e.preventDefault();
    setGuestModalError(null);

    const cleanName = guestForm.name.trim();
    if (!cleanName) {
      setGuestModalError('Nama tamu wajib diisi.');
      return;
    }

    if (guestForm.pax_limit < 1 || guestForm.pax_limit > 20) {
      setGuestModalError('Batas jumlah tamu (pax) harus antara 1 sampai 20 orang.');
      return;
    }

    setIsSavingGuest(true);
    try {
      if (editingGuestId) {
        await updateGuest(editingGuestId, invitationId, {
          name: cleanName,
          phone: guestForm.phone.trim() || null,
          pax_limit: guestForm.pax_limit,
          slug: guestForm.slug.trim() || undefined,
        });
        setSuccessMessage('Data tamu berhasil diperbarui.');
      } else {
        await createGuest(invitationId, {
          name: cleanName,
          phone: guestForm.phone.trim() || null,
          pax_limit: guestForm.pax_limit,
          slug: guestForm.slug.trim() || undefined,
        });
        setSuccessMessage('Tamu baru berhasil ditambahkan.');
      }

      setGuestModalOpen(false);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof ValidationError || err instanceof DatabaseError) {
        setGuestModalError(err.message);
      } else {
        setGuestModalError('Terjadi kesalahan saat menyimpan data tamu.');
      }
    } finally {
      setIsSavingGuest(false);
    }
  };

  // Konfirmasi hapus tamu
  const handleConfirmDeleteGuest = async () => {
    if (!guestToDelete) return;
    setIsDeletingGuest(true);
    try {
      await deleteGuest(guestToDelete.id, invitationId);
      setSuccessMessage(`Tamu "${guestToDelete.name}" berhasil dihapus.`);
      setDeleteGuestModalOpen(false);
      setGuestToDelete(null);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof DatabaseError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Gagal menghapus data tamu.');
      }
    } finally {
      setIsDeletingGuest(false);
    }
  };

  // Salin link undangan personal tamu
  const handleCopyPersonalLink = (guestSlug: string) => {
    const origin = window.location.origin;
    const personalUrl = buildGuestInvitationUrl(invitationSlug, guestSlug, origin);
    navigator.clipboard.writeText(personalUrl).then(() => {
      setCopiedGuestSlug(guestSlug);
      setTimeout(() => setCopiedGuestSlug(null), 2500);
    });
  };

  // Bagikan undangan via WhatsApp
  const handleShareWhatsApp = (guest: GuestItem) => {
    const origin = window.location.origin;
    const personalUrl = buildGuestInvitationUrl(invitationSlug, guest.slug, origin);
    const waUrl = generateWhatsAppShareUrl({
      phone: guest.phone,
      guestName: guest.name,
      invitationTitle,
      invitationUrl: personalUrl,
    });
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // Moderasi ucapan: toggle sembunyikan/tampilkan
  const handleToggleWishHidden = async (rsvp: RsvpItem) => {
    setTogglingRsvpId(rsvp.id);
    try {
      const updated = await toggleRsvpHidden(rsvp.id, invitationId, !rsvp.is_hidden);
      setRsvps((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setSuccessMessage(
        updated.is_hidden
          ? 'Ucapan disembunyikan dari halaman publik.'
          : 'Ucapan berhasil ditampilkan di halaman publik.'
      );
    } catch {
      setErrorMessage('Gagal mengubah status moderasi ucapan.');
    } finally {
      setTogglingRsvpId(null);
    }
  };

  // Konfirmasi hapus RSVP
  const handleConfirmDeleteRsvp = async () => {
    if (!rsvpToDelete) return;
    setIsDeletingRsvp(true);
    try {
      await deleteRsvp(rsvpToDelete.id, invitationId);
      setSuccessMessage('Data RSVP berhasil dihapus.');
      setDeleteRsvpModalOpen(false);
      setRsvpToDelete(null);
      await loadData();
    } catch {
      setErrorMessage('Gagal menghapus data RSVP.');
    } finally {
      setIsDeletingRsvp(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-text-muted">
        Memuat data tamu dan respons RSVP...
      </div>
    );
  }

  return (
    <div className="p-5 space-y-8 text-xs">
      {/* Pesan Notifikasi Sukses / Gagal */}
      {successMessage && (
        <div
          role="status"
          className="p-3 bg-success/10 border border-success/30 rounded text-xs text-success font-medium flex items-center justify-between"
        >
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-success hover:underline text-xs"
          >
            Tutup
          </button>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="p-3 bg-danger/10 border border-danger/30 rounded text-xs text-danger font-medium flex items-center justify-between"
        >
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-danger hover:underline text-xs"
          >
            Tutup
          </button>
        </div>
      )}

      {/* 1. KARTU REKAPITULASI RSVP (RSVP SUMMARY) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-text-primary text-xs uppercase tracking-wider">
            Ringkasan Kehadiran (RSVP)
          </h3>
          <span className="text-[11px] text-text-subtle font-mono">
            {summary.totalResponses} tanggapan masuk
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 rounded border border-border bg-surface-elevated/40 space-y-1">
            <span className="text-[11px] text-text-subtle block">Total Respons</span>
            <span className="text-xl font-bold text-text-primary block font-mono">
              {summary.totalResponses}
            </span>
          </div>

          <div className="p-3 rounded border border-success/30 bg-success/5 space-y-1">
            <span className="text-[11px] text-success font-medium block">Hadir</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-success font-mono">
                {summary.attendingCount}
              </span>
              <span className="text-[11px] text-success/80">({summary.attendingPax} pax)</span>
            </div>
          </div>

          <div className="p-3 rounded border border-danger/30 bg-danger/5 space-y-1">
            <span className="text-[11px] text-danger font-medium block">Tidak Hadir</span>
            <span className="text-xl font-bold text-danger font-mono">
              {summary.declinedCount}
            </span>
          </div>

          <div className="p-3 rounded border border-amber-300 bg-amber-50 space-y-1">
            <span className="text-[11px] text-amber-800 font-medium block">Masih Ragu</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-amber-800 font-mono">
                {summary.tentativeCount}
              </span>
              <span className="text-[11px] text-amber-700">({summary.tentativePax} pax)</span>
            </div>
          </div>

          <div className="p-3 rounded border border-border bg-surface-elevated/40 space-y-1 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-text-subtle block">Total Pax Hadir</span>
            <span className="text-xl font-bold text-primary block font-mono">
              {summary.attendingPax}
            </span>
          </div>
        </div>
      </div>

      {/* SUB-NAVIGASI TABEL: RSVP, UCAPAN, TAMU */}
      <div className="pt-2 border-t border-border">
        <div className="flex border-b border-border bg-surface-elevated text-xs font-semibold overflow-x-auto rounded-t">
          <button
            type="button"
            onClick={() => setSubView('rsvp')}
            className={`py-2.5 px-4 text-center border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              subView === 'rsvp'
                ? 'border-primary text-primary bg-surface'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Tabel Respons RSVP ({rsvps.length})
          </button>
          <button
            type="button"
            onClick={() => setSubView('wishes')}
            className={`py-2.5 px-4 text-center border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              subView === 'wishes'
                ? 'border-primary text-primary bg-surface'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Doa &amp; Ucapan ({wishesList.length})
          </button>
          <button
            type="button"
            onClick={() => setSubView('guests')}
            className={`py-2.5 px-4 text-center border-b-2 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              subView === 'guests'
                ? 'border-primary text-primary bg-surface'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            Daftar Tamu Undangan ({guests.length})
          </button>
        </div>

        {/* 1. TAMPILAN RESPONS RSVP */}
        {subView === 'rsvp' && (
          <div className="p-4 bg-surface border border-t-0 border-border rounded-b space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-text-primary text-xs uppercase tracking-wider">
                  Daftar Konfirmasi Kehadiran
                </h3>
                <p className="text-[11px] text-text-subtle mt-0.5">
                  Rekapitulasi resmi kehadiran para tamu undangan berdasarkan data langsung dari formulir RSVP.
                </p>
              </div>

              {/* Filter Status */}
              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { label: 'Semua', val: 'all' },
                    { label: 'Hadir', val: 'attending' },
                    { label: 'Tidak Hadir', val: 'declined' },
                    { label: 'Masih Ragu', val: 'tentative' },
                  ] as const
                ).map((filterOpt) => (
                  <button
                    key={filterOpt.val}
                    type="button"
                    onClick={() => setRsvpStatusFilter(filterOpt.val)}
                    className={`py-1 px-2.5 rounded text-xs font-semibold transition-colors cursor-pointer border ${
                      rsvpStatusFilter === filterOpt.val
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-surface text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {filterOpt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Pencarian RSVP */}
            {rsvps.length > 0 && (
              <div className="max-w-xs">
                <input
                  type="text"
                  value={rsvpSearch}
                  onChange={(e) => setRsvpSearch(e.target.value)}
                  placeholder="Cari nama tamu atau kata dalam doa..."
                  className="w-full py-1.5 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>
            )}

            {/* Tabel Minimal RSVP */}
            {rsvps.length === 0 ? (
              <div className="p-8 border border-dashed border-border rounded text-center space-y-2">
                <p className="text-xs text-text-muted font-medium">
                  Belum ada respons RSVP dari tamu undangan.
                </p>
                <p className="text-[11px] text-text-subtle">
                  Ketika tamu mengisi konfirmasi kehadiran pada tautan undangan publik, data akan dicatat secara otomatis.
                </p>
              </div>
            ) : filteredRsvps.length === 0 ? (
              <div className="p-6 border border-border rounded bg-surface-elevated/20 text-center text-xs text-text-muted">
                Tidak ada data RSVP yang cocok dengan filter atau kata pencarian.
              </div>
            ) : (
              <div className="overflow-x-auto border border-border rounded-lg bg-surface">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-surface-elevated border-b border-border text-[11px] text-text-muted uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-3">Nama Tamu</th>
                      <th className="py-2.5 px-3">Kehadiran</th>
                      <th className="py-2.5 px-3">Jumlah</th>
                      <th className="py-2.5 px-3">Waktu Respons</th>
                      <th className="py-2.5 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredRsvps.map((rsvp) => {
                      const statusBadge =
                        rsvp.status === 'attending' ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-success/30 bg-success/10 text-success">
                            Hadir
                          </span>
                        ) : rsvp.status === 'declined' ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-danger/30 bg-danger/10 text-danger">
                            Tidak Hadir
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-800">
                            Masih Ragu
                          </span>
                        );

                      return (
                        <tr key={rsvp.id} className="hover:bg-surface-elevated/30 transition-colors">
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-text-primary">
                              {rsvp.guest_name}
                            </div>
                            {rsvp.wishes ? (
                              <p className="text-[11px] text-text-muted mt-0.5 line-clamp-1 italic max-w-xs">
                                &quot;{rsvp.wishes}&quot;
                              </p>
                            ) : null}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {statusBadge}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-mono text-text-primary">
                            {rsvp.status === 'declined' ? '-' : `${rsvp.pax_count} pax`}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap text-[11px] text-text-subtle font-mono">
                            {formatRelativeDate(rsvp.created_at)}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setRsvpToDelete(rsvp);
                                setDeleteRsvpModalOpen(true);
                              }}
                              className="py-1 px-2.5 rounded text-xs font-semibold text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 transition-colors cursor-pointer"
                            >
                              Hapus
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 2. TAMPILAN DOA & UCAPAN (DENGAN MODERASI) */}
        {subView === 'wishes' && (
          <div className="p-4 bg-surface border border-t-0 border-border rounded-b space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-text-primary text-xs uppercase tracking-wider">
                  Buku Doa &amp; Ucapan ({wishesList.length})
                </h3>
                <p className="text-[11px] text-text-subtle mt-0.5">
                  Kelola dan moderasi doa restu tamu agar hanya ucapan yang pantas yang tampil di halaman publik undangan.
                </p>
              </div>

              {wishesList.length > 0 && (
                <div className="max-w-xs">
                  <input
                    type="text"
                    value={rsvpSearch}
                    onChange={(e) => setRsvpSearch(e.target.value)}
                    placeholder="Cari dalam ucapan..."
                    className="w-full py-1.5 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                  />
                </div>
              )}
            </div>

            {wishesList.length === 0 ? (
              <div className="p-8 border border-dashed border-border rounded text-center space-y-2">
                <p className="text-xs text-text-muted font-medium">
                  Belum ada doa atau ucapan dari tamu undangan.
                </p>
                <p className="text-[11px] text-text-subtle">
                  Ucapan yang dikirimkan oleh para tamu melalui halaman publik undangan akan muncul di sini.
                </p>
              </div>
            ) : filteredWishes.length === 0 ? (
              <div className="p-6 border border-border rounded bg-surface-elevated/20 text-center text-xs text-text-muted">
                Tidak ada ucapan yang cocok dengan pencarian &quot;{rsvpSearch}&quot;.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredWishes.map((rsvp) => {
                  const isToggling = togglingRsvpId === rsvp.id;

                  return (
                    <div
                      key={rsvp.id}
                      className="p-4 border border-border rounded bg-surface space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-text-primary text-xs">
                            {rsvp.guest_name}
                          </span>
                          {rsvp.is_hidden ? (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-100 border border-neutral-300 text-neutral-600 font-medium">
                              Disembunyikan dari Publik
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 border border-emerald-300 text-emerald-800 font-medium">
                              Tampil di Publik
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-text-subtle font-mono">
                          {formatRelativeDate(rsvp.created_at)}
                        </span>
                      </div>

                      <p className="text-xs text-text-primary/90 leading-relaxed whitespace-pre-wrap bg-surface-elevated/30 p-2.5 rounded border border-border/40">
                        &quot;{rsvp.wishes}&quot;
                      </p>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleToggleWishHidden(rsvp)}
                          disabled={isToggling}
                          className={`py-1 px-3 rounded text-xs font-semibold border transition-colors cursor-pointer disabled:opacity-50 ${
                            rsvp.is_hidden
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                              : 'border-border bg-surface text-text-muted hover:text-text-primary'
                          }`}
                        >
                          {isToggling
                            ? 'Memproses...'
                            : rsvp.is_hidden
                            ? 'Tampilkan di Publik'
                            : 'Sembunyikan dari Publik'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setRsvpToDelete(rsvp);
                            setDeleteRsvpModalOpen(true);
                          }}
                          className="py-1 px-2.5 rounded text-xs font-semibold text-danger hover:bg-danger/10 border border-transparent hover:border-danger/20 transition-colors cursor-pointer"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. TAMPILAN DAFTAR TAMU UNDANGAN */}
        {subView === 'guests' && (
          <div className="p-4 bg-surface border border-t-0 border-border rounded-b space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-text-primary text-xs uppercase tracking-wider">
                  Daftar Tamu Undangan ({guests.length})
                </h3>
                <p className="text-[11px] text-text-subtle mt-0.5">
                  Kelola nama tamu dan bagikan tautan undangan personal untuk masing-masing kerabat.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddGuestModal}
                className="py-1.5 px-3 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors cursor-pointer self-start sm:self-auto inline-flex items-center gap-1.5"
              >
                + Tambah Tamu
              </button>
            </div>

            {/* Input Pencarian Tamu */}
            {guests.length > 0 && (
              <div className="max-w-xs">
                <input
                  type="text"
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  placeholder="Cari nama atau telepon..."
                  className="w-full py-1.5 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>
            )}

            {/* Daftar / Tabel Tamu */}
            {guests.length === 0 ? (
              <div className="p-8 border border-dashed border-border rounded text-center space-y-2">
                <p className="text-xs text-text-muted font-medium">
                  Belum ada tamu yang ditambahkan.
                </p>
                <p className="text-[11px] text-text-subtle">
                  Tambahkan nama tamu untuk mendapatkan tautan khusus personal dengan batas pax terkelola.
                </p>
              </div>
            ) : filteredGuests.length === 0 ? (
              <div className="p-6 border border-border rounded bg-surface-elevated/20 text-center text-xs text-text-muted">
                Tidak ada tamu yang cocok dengan pencarian &quot;{guestSearch}&quot;.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredGuests.map((guest) => {
                  const isCopied = copiedGuestSlug === guest.slug;
                  return (
                    <div
                      key={guest.id}
                      className="p-3.5 border border-border rounded bg-surface hover:bg-surface-elevated/20 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-text-primary text-xs">
                            {guest.name}
                          </span>
                          <span className="text-[10px] text-text-muted px-1.5 py-0.5 rounded bg-surface-elevated border border-border font-mono">
                            Batas {guest.pax_limit} pax
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-text-subtle">
                          {guest.phone && <span>WhatsApp: {guest.phone}</span>}
                          <span className="font-mono text-[10px]">
                            ?to={guest.slug}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleCopyPersonalLink(guest.slug)}
                          className="py-1 px-2.5 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-primary rounded transition-colors cursor-pointer"
                        >
                          {isCopied ? 'Tautan Disalin!' : 'Salin Tautan'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleShareWhatsApp(guest)}
                          className="py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold rounded transition-colors cursor-pointer"
                        >
                          WhatsApp
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditGuestModal(guest)}
                          className="py-1 px-2 text-text-muted hover:text-text-primary rounded cursor-pointer"
                          title="Edit Tamu"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setGuestToDelete(guest);
                            setDeleteGuestModalOpen(true);
                          }}
                          className="py-1 px-2 text-danger hover:bg-danger/10 rounded cursor-pointer"
                          title="Hapus Tamu"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* MODAL: TAMBAH / EDIT TAMU                                    */}
      {/* ============================================================ */}
      {guestModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-primary">
                {editingGuestId ? 'Edit Data Tamu' : 'Tambah Tamu Baru'}
              </h2>
              <button
                type="button"
                onClick={() => setGuestModalOpen(false)}
                disabled={isSavingGuest}
                className="text-text-muted hover:text-text-primary p-1 rounded cursor-pointer disabled:opacity-40"
              >
                &times;
              </button>
            </div>

            {guestModalError && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded text-xs text-danger">
                {guestModalError}
              </div>
            )}

            <form onSubmit={handleSaveGuest} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label htmlFor="guest-name-input" className="font-semibold text-text-primary block">
                  Nama Tamu <span className="text-red-500">*</span>
                </label>
                <input
                  id="guest-name-input"
                  type="text"
                  value={guestForm.name}
                  onChange={(e) => handleGuestNameChange(e.target.value)}
                  placeholder="Contoh: Budi Santoso, S.T."
                  maxLength={100}
                  required
                  className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="guest-phone-input" className="font-semibold text-text-primary block">
                  Nomor WhatsApp / Telepon
                </label>
                <input
                  id="guest-phone-input"
                  type="text"
                  value={guestForm.phone}
                  onChange={(e) => setGuestForm({ ...guestForm, phone: e.target.value })}
                  placeholder="Contoh: 081234567890"
                  maxLength={30}
                  className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
                <p className="text-[11px] text-text-subtle">
                  Format lokal (08xx) otomatis dikonversi ke kode internasional untuk tombol kirim WhatsApp.
                </p>
              </div>

              <div className="space-y-1">
                <label htmlFor="guest-pax-input" className="font-semibold text-text-primary block">
                  Batas Jumlah Kehadiran (Pax Limit)
                </label>
                <input
                  id="guest-pax-input"
                  type="number"
                  min={1}
                  max={20}
                  value={guestForm.pax_limit}
                  onChange={(e) =>
                    setGuestForm({ ...guestForm, pax_limit: parseInt(e.target.value, 10) || 1 })
                  }
                  required
                  className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs font-mono"
                />
                <p className="text-[11px] text-text-subtle">
                  Batas maksimal tamu yang dapat dipilih saat tamu mengisi RSVP di tautan personalnya.
                </p>
              </div>

              <div className="space-y-1">
                <label htmlFor="guest-slug-input" className="font-semibold text-text-primary block">
                  Slug Tautan Personal (?to=...)
                </label>
                <input
                  id="guest-slug-input"
                  type="text"
                  value={guestForm.slug}
                  onChange={(e) =>
                    setGuestForm({
                      ...guestForm,
                      slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                    })
                  }
                  placeholder="budi-santoso"
                  maxLength={60}
                  className="w-full py-2 px-3 border border-border rounded bg-surface focus:outline-none focus:ring-1 focus:ring-primary text-xs font-mono"
                />
                <p className="text-[11px] text-text-subtle">
                  Gunakan huruf kecil, angka, dan tanda hubung (-). Jika dikosongkan, otomatis dibuat dari nama tamu.
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGuestModalOpen(false)}
                  disabled={isSavingGuest}
                  className="py-1.5 px-3 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-muted rounded transition-colors cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingGuest}
                  className="py-1.5 px-4 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSavingGuest ? 'Menyimpan...' : 'Simpan Tamu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: KONFIRMASI HAPUS TAMU                                 */}
      {/* ============================================================ */}
      {deleteGuestModalOpen && guestToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 shadow-lg space-y-4">
            <h2 className="font-serif text-xl font-bold text-danger">Hapus Tamu Ini?</h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Tamu <strong className="text-text-primary">{guestToDelete.name}</strong> akan dihapus dari daftar undangan. Tautan personal tamu tersebut tidak lagi dapat digunakan.
            </p>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteGuestModalOpen(false);
                  setGuestToDelete(null);
                }}
                disabled={isDeletingGuest}
                className="py-1.5 px-3 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-muted rounded transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteGuest}
                disabled={isDeletingGuest}
                className="py-1.5 px-4 bg-danger hover:bg-danger/90 text-danger-foreground text-xs font-semibold rounded transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeletingGuest ? 'Menghapus...' : 'Ya, Hapus Tamu'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: KONFIRMASI HAPUS RSVP                                 */}
      {/* ============================================================ */}
      {deleteRsvpModalOpen && rsvpToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs"
        >
          <div className="bg-surface border border-border rounded-lg max-w-md w-full p-6 shadow-lg space-y-4">
            <h2 className="font-serif text-xl font-bold text-danger">Hapus Data RSVP Ini?</h2>
            <p className="text-xs text-text-muted leading-relaxed">
              Konfirmasi kehadiran dari <strong className="text-text-primary">{rsvpToDelete.guest_name}</strong> akan dihapus permanen dari rekapitulasi kehadiran dan buku ucapan.
            </p>

            <div className="pt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleteRsvpModalOpen(false);
                  setRsvpToDelete(null);
                }}
                disabled={isDeletingRsvp}
                className="py-1.5 px-3 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-muted rounded transition-colors cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRsvp}
                disabled={isDeletingRsvp}
                className="py-1.5 px-4 bg-danger hover:bg-danger/90 text-danger-foreground text-xs font-semibold rounded transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeletingRsvp ? 'Menghapus...' : 'Ya, Hapus RSVP'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
