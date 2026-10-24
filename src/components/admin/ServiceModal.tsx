/**
 * Service editor (create / edit) with a live preview of the selected icon.
 */

import { useEffect, useState, type FormEvent, type JSX } from 'react';
import { AlertCircle } from 'lucide-react';

import type { Service } from '../../lib/types';
import { getServiceIcon, serviceIconLabels, serviceIcons } from '../../lib/icons';
import { Button } from '../ui/Button';
import { SelectField, TextArea, TextInput } from '../ui/Field';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';

export interface ServiceModalProps {
  service: Partial<Service> | null;
  onClose: () => void;
  onSave: (service: Partial<Service>) => Promise<void>;
}

const FORM_ID = 'service-modal-form';

interface FormErrors {
  title?: string;
  description?: string;
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}

export function ServiceModal({ service, onClose, onSave }: ServiceModalProps): JSX.Element {
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [iconName, setIconName] = useState('Monitor');
  const [orderIndex, setOrderIndex] = useState('0');
  const [tagsInput, setTagsInput] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!service) return;

    setTitle(service.title ?? '');
    setDescription(service.description ?? '');
    setIconName(service.icon_name ?? 'Monitor');
    setOrderIndex(String(service.order_index ?? 0));
    setTagsInput((service.tags ?? []).join(', '));
    setErrors({});
    setFormError(null);
  }, [service]);

  const isEditing = Boolean(service?.id);
  const PreviewIcon = getServiceIcon(iconName);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    const nextErrors: FormErrors = {};
    if (!trimmedTitle) nextErrors.title = 'Informe o título do serviço.';
    if (!trimmedDescription) nextErrors.description = 'Descreva o serviço prestado.';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const editing = Boolean(service?.id);
    const parsedOrder = Number(orderIndex.trim().replace(',', '.'));
    const tags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    const payload: Partial<Service> = {
      // The parent decides between update and insert from `id` and removes it
      // from the row it writes, so the identity travels with the form data.
      ...(service?.id ? { id: service.id } : {}),
      title: trimmedTitle,
      description: trimmedDescription,
      icon_name: iconName,
      tags,
      order_index: Number.isFinite(parsedOrder) ? parsedOrder : 0,
    };

    setSaving(true);
    setFormError(null);

    try {
      await onSave(payload);
      toast.success(editing ? 'Serviço atualizado' : 'Serviço criado', trimmedTitle);
    } catch (error) {
      const message = errorMessage(error, 'Não foi possível salvar o serviço.');
      setFormError(message);
      toast.error('Erro ao salvar serviço', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={service !== null}
      onClose={onClose}
      title={isEditing ? 'Editar serviço' : 'Novo serviço'}
      description="Defina como o serviço aparece na seção de serviços do site."
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
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-6" noValidate>
        {formError && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {formError}
          </p>
        )}

        <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-400/10 text-brand-300">
            <PreviewIcon className="h-7 w-7" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/40">
              Pré-visualização do ícone
            </p>
            <p className="mt-1 truncate text-sm font-bold text-white">
              {serviceIconLabels[iconName] ?? iconName}
            </p>
          </div>
        </div>

        <TextInput
          label="Título"
          name="title"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Ex.: Manutenção de Desktop"
          error={errors.title}
        />

        <TextArea
          label="Descrição"
          name="description"
          required
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Ex.: Preventiva, corretiva e aditiva para manter seu PC voando."
          error={errors.description}
        />

        <SelectField
          label="Ícone"
          name="icon_name"
          required
          value={iconName}
          onChange={(event) => setIconName(event.target.value)}
        >
          {Object.keys(serviceIcons).map((name) => (
            <option key={name} value={name}>
              {serviceIconLabels[name] ?? name}
            </option>
          ))}
        </SelectField>

        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput
            label="Ordem"
            name="order_index"
            type="number"
            step="1"
            value={orderIndex}
            onChange={(event) => setOrderIndex(event.target.value)}
            className="no-spinner"
            hint="Menor aparece primeiro."
          />

          <TextInput
            label="Tags"
            name="tags"
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            placeholder="Reparo, Telas, Baterias"
            hint="Separe as tags por vírgula."
          />
        </div>
      </form>
    </Modal>
  );
}
