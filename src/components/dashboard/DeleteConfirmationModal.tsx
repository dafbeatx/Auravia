import { useEffect } from 'react';
import { type InvitationListItem } from '@/lib/invitations';

interface DeleteConfirmationModalProps {
  invitation: InvitationListItem | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmationModal({
  invitation,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  useEffect(() => {
    if (!invitation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDeleting) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [invitation, isDeleting, onCancel]);

  if (!invitation) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      aria-describedby="delete-modal-description"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDeleting) onCancel();
      }}
    >
      <div className="bg-surface border border-border rounded-xl shadow-xl w-full max-w-md p-6 sm:p-7 space-y-4">
        <div className="space-y-2">
          <h2
            id="delete-modal-title"
            className="font-serif text-xl font-bold text-primary"
          >
            Hapus undangan?
          </h2>
          <p
            id="delete-modal-description"
            className="text-xs text-text-muted leading-relaxed"
          >
            Undangan <strong className="text-text-primary">"{invitation.title}"</strong> ini akan dihapus dan tindakan ini tidak dapat dibatalkan.
          </p>
        </div>

        <div className="pt-4 border-t border-border flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 border border-border hover:bg-surface-elevated text-text-muted text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-danger hover:bg-danger/90 text-danger-foreground text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Menghapus...' : 'Hapus Undangan'}
          </button>
        </div>
      </div>
    </div>
  );
}
