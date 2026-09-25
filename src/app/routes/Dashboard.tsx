import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  getMyInvitations,
  deleteMyInvitation,
  type InvitationListItem,
} from '@/lib/invitations';
import { DashboardHero } from '@/components/dashboard/DashboardHero';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { InvitationCard } from '@/components/dashboard/InvitationCard';
import { CreateInvitationModal } from '@/components/dashboard/CreateInvitationModal';
import { DeleteConfirmationModal } from '@/components/dashboard/DeleteConfirmationModal';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [invitations, setInvitations] = useState<InvitationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter (Local in-memory, no Supabase requests on typing)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal Dialogs
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingInvitation, setDeletingInvitation] = useState<InvitationListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const greetingName = useMemo(() => {
    if (!user) return '';
    const metaName = user.user_metadata?.full_name || user.user_metadata?.name;
    if (metaName && typeof metaName === 'string') return metaName;
    if (user.email) return user.email.split('@')[0];
    return '';
  }, [user]);

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

  // Statistics derived purely from actual database data
  const totalCount = invitations.length;
  const draftCount = useMemo(
    () => invitations.filter((inv) => inv.status === 'draft').length,
    [invitations]
  );
  const publishedCount = useMemo(
    () => invitations.filter((inv) => inv.status === 'published').length,
    [invitations]
  );

  // In-memory filtered list
  const filteredInvitations = useMemo(() => {
    return invitations.filter((inv) => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = inv.title.toLowerCase().includes(q);
        const matchSlug = inv.slug.toLowerCase().includes(q);
        const matchTemplate = inv.template?.name?.toLowerCase().includes(q) || false;
        return matchTitle || matchSlug || matchTemplate;
      }
      return true;
    });
  }, [invitations, statusFilter, searchQuery]);

  const handleConfirmDelete = async () => {
    if (!deletingInvitation) return;
    setIsDeleting(true);
    try {
      await deleteMyInvitation(deletingInvitation.id);
      setInvitations((prev) => prev.filter((item) => item.id !== deletingInvitation.id));
      setDeletingInvitation(null);
    } catch {
      alert('Gagal menghapus undangan. Silakan coba kembali.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  return (
    <div className="space-y-8 sm:space-y-10 pb-12">
      {/* Welcome / Editorial Hero */}
      <DashboardHero
        userName={greetingName}
        onCreateClick={() => setShowCreateModal(true)}
      />

      {/* Actual Statistics Cards */}
      <DashboardStats
        totalCount={totalCount}
        draftCount={draftCount}
        publishedCount={publishedCount}
      />

      {/* Section "Undangan Saya" */}
      <section
        id="undangan-saya"
        aria-labelledby="undangan-saya-heading"
        className="space-y-6 pt-2"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2
              id="undangan-saya-heading"
              className="font-serif text-2xl sm:text-3xl font-bold text-primary"
            >
              Undangan Saya
            </h2>
            <p className="text-xs sm:text-sm text-text-muted mt-1">
              Daftar undangan digital yang telah Anda buat dan kelola.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="self-start md:self-auto inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-lg transition-colors cursor-pointer min-h-[40px]"
          >
            <span>+ Buat Undangan</span>
          </button>
        </div>

        {/* Search, Filter, and View Mode Toolbar */}
        <div className="bg-surface border border-border rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          {/* Left: Search input */}
          <div className="relative flex-1 max-w-md">
            <svg
              className="w-4 h-4 text-text-subtle absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan judul, slug, atau template..."
              className="w-full pl-9 pr-8 py-2 bg-background border border-border rounded-lg text-xs sm:text-sm text-text-primary placeholder:text-text-subtle/60 focus:border-primary focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Bersihkan pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text-primary p-0.5 rounded cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Center / Right: Filter tabs & View Mode toggles */}
          <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
            {/* Status Filter Segmented Control */}
            <div
              className="inline-flex rounded-lg border border-border p-0.5 bg-surface-elevated text-xs font-medium"
              role="group"
              aria-label="Filter status undangan"
            >
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer min-h-[36px] flex items-center ${
                  statusFilter === 'all'
                    ? 'bg-surface text-primary font-semibold shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Semua ({totalCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('draft')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer min-h-[36px] flex items-center ${
                  statusFilter === 'draft'
                    ? 'bg-surface text-primary font-semibold shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Draft ({draftCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('published')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer min-h-[36px] flex items-center ${
                  statusFilter === 'published'
                    ? 'bg-surface text-primary font-semibold shadow-xs'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                Dipublikasikan ({publishedCount})
              </button>
            </div>

            {/* View Mode Toggle: Grid vs List */}
            <div
              className="inline-flex rounded-lg border border-border p-0.5 bg-surface-elevated"
              role="group"
              aria-label="Pilihan tampilan"
            >
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-pressed={viewMode === 'grid'}
                aria-label="Tampilan Grid"
                className={`p-2 rounded-md transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center ${
                  viewMode === 'grid'
                    ? 'bg-surface text-primary shadow-xs'
                    : 'text-text-subtle hover:text-text-primary'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                aria-label="Tampilan Daftar"
                className={`p-2 rounded-md transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center ${
                  viewMode === 'list'
                    ? 'bg-surface text-primary shadow-xs'
                    : 'text-text-subtle hover:text-text-primary'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div
            className="py-16 text-center space-y-3 bg-surface border border-border rounded-xl"
            role="status"
          >
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-text-muted">Memuat daftar undangan...</p>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="p-6 bg-danger/10 border border-danger/30 rounded-xl text-center space-y-3"
          >
            <p className="text-xs text-danger font-medium">{error}</p>
            <button
              type="button"
              onClick={fetchInvitations}
              className="px-4 py-1.5 bg-surface border border-danger/40 text-danger text-xs font-semibold rounded-lg hover:bg-surface-elevated transition-colors cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        ) : invitations.length === 0 ? (
          /* Empty State (User has no invitations yet) */
          <div className="bg-surface border border-border rounded-xl p-8 sm:p-12 text-center max-w-md mx-auto space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-surface-elevated border border-border flex items-center justify-center mx-auto text-primary">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-xl font-bold text-primary">
                Belum ada undangan
              </h3>
              <p className="text-xs text-text-muted leading-relaxed">
                Mulai buat undangan digital pertama Anda.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer min-h-[44px]"
            >
              <span>+ Buat Undangan</span>
            </button>
          </div>
        ) : filteredInvitations.length === 0 ? (
          /* No Search Results */
          <div className="bg-surface border border-border rounded-xl p-8 text-center space-y-3 max-w-sm mx-auto shadow-sm">
            <p className="font-serif text-lg font-semibold text-primary">
              Tidak ada undangan yang cocok
            </p>
            <p className="text-xs text-text-muted">
              Tidak ditemukan undangan yang sesuai dengan kata kunci atau filter status yang dipilih.
            </p>
            <button
              type="button"
              onClick={handleResetSearch}
              className="px-3.5 py-1.5 border border-border hover:bg-surface-elevated text-xs font-semibold text-primary rounded-lg transition-colors cursor-pointer min-h-[36px]"
            >
              Atur Ulang Pencarian
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {filteredInvitations.map((inv) => (
              <InvitationCard
                key={inv.id}
                invitation={inv}
                viewMode="grid"
                onDeleteClick={(target) => setDeletingInvitation(target)}
              />
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {filteredInvitations.map((inv) => (
              <InvitationCard
                key={inv.id}
                invitation={inv}
                viewMode="list"
                onDeleteClick={(target) => setDeletingInvitation(target)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Create Invitation Modal */}
      <CreateInvitationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={(id) => {
          setShowCreateModal(false);
          navigate(`/dashboard/invitations/${id}`);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        invitation={deletingInvitation}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingInvitation(null)}
      />
    </div>
  );
}
