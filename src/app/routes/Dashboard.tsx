import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  getMyInvitations,
  getActiveTemplates,
  createInvitation,
  deleteMyInvitation,
  type InvitationListItem,
  type TemplateListItem,
} from '@/lib/invitations';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [invitations, setInvitations] = useState<InvitationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State form pembuatan undangan baru & pemilihan template
  const [newTitle, setNewTitle] = useState('');
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyInvitations();
      setInvitations(data);
    } catch {
      setError('Terjadi kendala saat memuat daftar undangan. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  // Muat katalog template aktif saat pengguna membuka formulir buat undangan (hanya sekali, tanpa polling)
  useEffect(() => {
    if (showCreateForm && !templatesLoaded) {
      let isMounted = true;
      setLoadingTemplates(true);
      getActiveTemplates()
        .then((data) => {
          if (isMounted) {
            setTemplates(data);
            const firstTemplate = data[0];
            if (firstTemplate) {
              setSelectedTemplateId(firstTemplate.id);
            }
            setTemplatesLoaded(true);
          }
        })
        .catch(() => {
          if (isMounted) {
            setCreateError('Gagal memuat katalog template. Silakan coba kembali.');
          }
        })
        .finally(() => {
          if (isMounted) {
            setLoadingTemplates(false);
          }
        });

      return () => {
        isMounted = false;
      };
    }
  }, [showCreateForm, templatesLoaded]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateError(null);

    const title = newTitle.trim();
    if (!title) {
      setCreateError('Judul undangan wajib diisi.');
      return;
    }

    if (!selectedTemplateId) {
      setCreateError('Silakan pilih salah satu template sebelum melanjutkan.');
      return;
    }

    setIsCreating(true);
    try {
      const created = await createInvitation(title, selectedTemplateId);
      setNewTitle('');
      setShowCreateForm(false);
      navigate(`/dashboard/invitations/${created.id}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCreateError(err.message);
      } else {
        setCreateError('Gagal membuat undangan. Silakan coba lagi.');
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus undangan "${title}"? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    try {
      await deleteMyInvitation(id);
      setInvitations((prev) => prev.filter((item) => item.id !== id));
    } catch {
      alert('Gagal menghapus undangan. Silakan coba kembali.');
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="py-8 max-w-4xl mx-auto space-y-6">
      {/* Header Info Sesi */}
      <div className="bg-surface border border-border rounded p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-primary mb-1">
            Dasbor Undangan
          </h1>
          <p className="text-xs text-text-muted">
            Masuk sebagai <strong className="text-text-primary">{user?.email}</strong>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowCreateForm((prev) => !prev)}
            className="py-1.5 px-3 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors cursor-pointer"
          >
            {showCreateForm ? 'Tutup Formulir' : '+ Buat Undangan'}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="py-1.5 px-3 bg-surface hover:bg-surface-elevated border border-border text-xs font-semibold text-text-muted hover:text-danger rounded transition-colors cursor-pointer"
          >
            Keluar
          </button>
        </div>
      </div>

      {/* Form Buat Undangan */}
      {showCreateForm && (
        <div className="bg-surface border border-border rounded p-6 shadow-sm">
          <h2 className="font-serif text-lg font-bold text-primary mb-1">
            Buat Undangan Baru
          </h2>
          <p className="text-xs text-text-muted mb-4">
            Masukkan judul untuk memulai draf undangan.
          </p>

          {createError && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-4 p-3 bg-danger/10 border border-danger/30 rounded text-xs text-danger font-medium leading-relaxed"
            >
              {createError}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4 max-w-lg">
            <div>
              <label
                htmlFor="invitation-title"
                className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-1"
              >
                Judul Undangan
              </label>
              <input
                id="invitation-title"
                type="text"
                required
                maxLength={120}
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                disabled={isCreating}
                placeholder="Contoh: Pernikahan Kami"
                className="w-full px-3 py-2 bg-background border border-border rounded text-sm text-text-primary placeholder:text-text-subtle/50 focus:border-primary focus:outline-none transition-colors disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">
                Pilih Template
              </label>

              {loadingTemplates ? (
                <div
                  className="p-4 border border-border rounded bg-surface-elevated text-xs text-text-muted text-center"
                  role="status"
                >
                  Memuat katalog template...
                </div>
              ) : templates.length === 0 ? (
                <div
                  className="p-4 border border-border rounded bg-surface-elevated text-xs text-text-muted text-center"
                  role="alert"
                >
                  Belum ada template yang tersedia.
                </div>
              ) : (
                <div
                  className="space-y-2"
                  role="radiogroup"
                  aria-label="Pilihan template undangan"
                >
                  {templates.map((tpl) => {
                    const isSelected = selectedTemplateId === tpl.id;
                    return (
                      <label
                        key={tpl.id}
                        className={`flex items-start gap-3 p-3.5 border rounded cursor-pointer transition-colors ${
                          isSelected
                            ? 'border-primary bg-surface-elevated ring-1 ring-primary'
                            : 'border-border bg-surface hover:border-border-strong'
                        }`}
                      >
                        <input
                          type="radio"
                          name="template-selection"
                          value={tpl.id}
                          checked={isSelected}
                          onChange={() => setSelectedTemplateId(tpl.id)}
                          className="mt-0.5 text-primary focus:ring-primary h-4 w-4 border-border"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-sm text-text-primary">
                              {tpl.name}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border border-border bg-background text-text-muted">
                              {tpl.category}
                            </span>
                          </div>
                          <p className="text-xs text-text-muted leading-relaxed">
                            {tpl.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={isCreating || loadingTemplates || templates.length === 0}
                className="py-2 px-4 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
              >
                {isCreating ? 'Menyimpan Draf...' : 'Buat Draf Undangan'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateError(null);
                  setNewTitle('');
                }}
                disabled={isCreating}
                className="py-2 px-3 border border-border hover:bg-surface-elevated text-text-muted text-xs font-semibold rounded transition-colors cursor-pointer"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Konten Daftar Undangan */}
      <div className="bg-surface border border-border rounded p-6 shadow-sm">
        <h2 className="font-serif text-lg font-bold text-primary mb-4 pb-2 border-b border-border">
          Daftar Undangan Saya
        </h2>

        {loading ? (
          <p className="text-xs text-text-muted py-8 text-center" role="status">
            Memuat daftar undangan...
          </p>
        ) : error ? (
          <div
            role="alert"
            className="p-3 bg-danger/10 border border-danger/30 rounded text-xs text-danger text-center"
          >
            {error}
          </div>
        ) : invitations.length === 0 ? (
          /* Empty State yang Jujur */
          <div className="py-12 text-center max-w-sm mx-auto space-y-3">
            <p className="text-sm font-medium text-text-muted">
              Belum ada undangan.
            </p>
            <p className="text-xs text-text-subtle leading-relaxed">
              Anda belum membuat draf undangan digital apa pun. Klik tombol di bawah untuk memulai.
            </p>
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="mt-2 inline-block py-2 px-4 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded transition-colors cursor-pointer"
            >
              Mulai Buat Undangan
            </button>
          </div>
        ) : (
          /* Daftar Undangan Riil */
          <div className="divide-y divide-border">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      to={`/dashboard/invitations/${inv.id}`}
                      className="font-semibold text-sm text-text-primary hover:text-primary hover:underline transition-colors"
                    >
                      {inv.title}
                    </Link>
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded border border-border bg-surface-elevated text-text-muted">
                      {inv.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-text-subtle font-mono">
                    <span>slug: {inv.slug}</span>
                    <span>&bull;</span>
                    <span>{new Date(inv.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <Link
                    to={`/dashboard/invitations/${inv.id}`}
                    className="py-1 px-2.5 border border-border hover:bg-surface-elevated text-xs font-semibold text-text-primary rounded transition-colors"
                  >
                    Buka
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(inv.id, inv.title)}
                    className="py-1 px-2.5 border border-border hover:border-danger/30 hover:bg-danger/10 text-xs font-semibold text-danger rounded transition-colors cursor-pointer"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
