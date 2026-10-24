import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/**
 * Replaces the native `confirm()` dialog with an accessible,
 * on-brand confirmation that can express an async action.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? 'Processando...' : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-4">
        {destructive && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/12 text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
        )}
        <p className="text-sm leading-relaxed text-white/65">{description}</p>
      </div>
    </Modal>
  );
}
