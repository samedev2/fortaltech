/**
 * Editor for a single site content entry (key -> value).
 */

import { useEffect, useState, type FormEvent, type JSX } from 'react';
import { AlertCircle } from 'lucide-react';

import { Button } from '../ui/Button';
import { TextArea } from '../ui/Field';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';

export interface ContentModalProps {
  entry: { key: string; value: string } | null;
  onClose: () => void;
  onSave: (entry: { key: string; value: string }) => Promise<void>;
}

const FORM_ID = 'content-modal-form';

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}

/** "hero_title" -> "Hero title" */
function humanizeKey(key: string): string {
  const words = key.replace(/[_-]+/g, ' ').trim();
  if (!words) return key;
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function ContentModal({ entry, onClose, onSave }: ContentModalProps): JSX.Element {
  const toast = useToast();

  const [value, setValue] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!entry) return;

    setValue(entry.value ?? '');
    setFormError(null);
  }, [entry]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!entry) return;

    const key = entry.key;

    setSaving(true);
    setFormError(null);

    try {
      await onSave({ key, value });
      toast.success('Conteúdo atualizado', key);
    } catch (error) {
      const message = errorMessage(error, 'Não foi possível salvar o conteúdo.');
      setFormError(message);
      toast.error('Erro ao salvar conteúdo', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={entry !== null}
      onClose={onClose}
      title="Editar conteúdo"
      description={entry ? humanizeKey(entry.key) : undefined}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form={FORM_ID} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </>
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-5" noValidate>
        {formError && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {formError}
          </p>
        )}

        <p className="font-mono text-xs text-white/35">Chave: {entry?.key}</p>

        <TextArea
          label={entry?.key ?? 'Conteúdo'}
          name={entry ? `content-${entry.key}` : 'content'}
          rows={9}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Digite o conteúdo do site..."
        />
      </form>
    </Modal>
  );
}
