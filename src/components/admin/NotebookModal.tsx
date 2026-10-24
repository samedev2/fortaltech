/**
 * Notebook editor (create / edit).
 *
 * Owns the image upload flow against the `notebooks` storage bucket and the
 * feedback for the save action, so a single save never produces two toasts.
 */

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type JSX,
} from 'react';
import { AlertCircle, CheckCircle2, Circle, Images, Loader2, Trash2, Upload, X } from 'lucide-react';

import type { Notebook } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import { cn, formatDateBR } from '../../lib/utils';
import { Button } from '../ui/Button';
import { TextArea, TextInput } from '../ui/Field';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';

export interface NotebookModalProps {
  notebook: Partial<Notebook> | null;
  onClose: () => void;
  onSave: (notebook: Partial<Notebook>) => Promise<void>;
}

const BUCKET = 'notebooks';
const GALLERY_SLOTS = 3;
const FORM_ID = 'notebook-modal-form';

interface FormErrors {
  model?: string;
  specs?: string;
  price?: string;
}

/** Unique, collision free file name (crypto only — never Math.random). */
function uniqueId(): string {
  const cryptoRef = globalThis.crypto;

  if (cryptoRef && typeof cryptoRef.randomUUID === 'function') {
    return cryptoRef.randomUUID();
  }

  const bytes = new Uint8Array(16);
  cryptoRef.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error.trim()) return error;
  return fallback;
}

/**
 * Uploads an image to the `notebooks` bucket.
 * Main images live at the bucket root, gallery images under `gallery/`.
 * The public URL is built from the exact same path that was uploaded.
 */
async function uploadImage(file: File, folder: '' | 'gallery'): Promise<string> {
  const extension = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = folder ? `gallery/${uniqueId()}.${extension}` : `${uniqueId()}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export function NotebookModal({ notebook, onClose, onSave }: NotebookModalProps): JSX.Element {
  const toast = useToast();

  const [model, setModel] = useState('');
  const [specs, setSpecs] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [isPromotional, setIsPromotional] = useState(false);
  const [isSold, setIsSold] = useState(false);
  const [soldAt, setSoldAt] = useState<string | null>(null);

  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingMain, setUploadingMain] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<number | null>(null);

  /* Load the record being edited whenever a new draft arrives. */
  useEffect(() => {
    if (!notebook) return;

    setModel(notebook.model ?? '');
    setSpecs(notebook.specs ?? '');
    setPrice(notebook.price != null ? String(notebook.price) : '');
    setImageUrl(notebook.image_url ?? '');
    setGallery(
      Array.isArray(notebook.gallery_urls) ? notebook.gallery_urls.filter(Boolean) : [],
    );
    setIsPromotional(Boolean(notebook.is_promotional));
    setIsSold(Boolean(notebook.is_sold));
    setSoldAt(notebook.sold_at ?? null);
    setErrors({});
    setFormError(null);
  }, [notebook]);

  const isEditing = Boolean(notebook?.id);

  /* ------------------------------------------------------------------ *
   * Uploads
   * ------------------------------------------------------------------ */

  const handleMainUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploadingMain(true);
    try {
      const url = await uploadImage(file, '');
      setImageUrl(url);
      toast.success('Imagem enviada', 'Link preenchido automaticamente.');
    } catch (error) {
      toast.error(
        'Erro ao enviar imagem',
        errorMessage(error, 'Não foi possível enviar o arquivo.'),
      );
    } finally {
      setUploadingMain(false);
    }
  };

  const handleGalleryUpload = async (
    event: ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploadingSlot(index);
    try {
      const url = await uploadImage(file, 'gallery');
      setGallery((previous) => {
        const next = [...previous];
        while (next.length < index) next.push('');
        next[index] = url;
        return next;
      });
      toast.success('Foto enviada', `Galeria ${index + 1} atualizada.`);
    } catch (error) {
      toast.error(
        'Erro ao enviar foto',
        errorMessage(error, 'Não foi possível enviar o arquivo.'),
      );
    } finally {
      setUploadingSlot(null);
    }
  };

  const removeGalleryItem = (index: number) => {
    setGallery((previous) => previous.filter((_, position) => position !== index));
  };

  /* ------------------------------------------------------------------ *
   * Submit
   * ------------------------------------------------------------------ */

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedModel = model.trim();
    const trimmedSpecs = specs.trim();
    const parsedPrice = Number(price.trim().replace(',', '.'));

    const nextErrors: FormErrors = {};
    if (!trimmedModel) nextErrors.model = 'Informe o modelo do notebook.';
    if (!trimmedSpecs) nextErrors.specs = 'Descreva as especificações do notebook.';
    if (!price.trim() || !Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      nextErrors.price = 'Informe um preço maior que zero.';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const editing = Boolean(notebook?.id);

    const payload: Partial<Notebook> = {
      // The parent decides between update and insert from `id` and strips
      // `id`/`created_at` from the row it writes, so the identity travels
      // with the form data — everything else below is the edited record.
      ...(notebook?.id ? { id: notebook.id } : {}),
      model: trimmedModel,
      specs: trimmedSpecs,
      price: parsedPrice,
      image_url: imageUrl.trim(),
      gallery_urls: gallery.filter(Boolean),
      is_promotional: isPromotional,
      is_sold: isSold,
      sold_at: isSold ? (soldAt ?? new Date().toISOString()) : null,
    };

    setSaving(true);
    setFormError(null);

    try {
      await onSave(payload);
      toast.success(editing ? 'Notebook atualizado' : 'Notebook cadastrado', trimmedModel);
    } catch (error) {
      const message = errorMessage(error, 'Não foi possível salvar o notebook.');
      setFormError(message);
      toast.error('Erro ao salvar notebook', message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={notebook !== null}
      onClose={onClose}
      title={isEditing ? 'Editar notebook' : 'Novo notebook'}
      description="Preencha os dados do anúncio. As alterações são publicadas imediatamente no site."
      size="lg"
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

        <TextInput
          label="Modelo"
          name="model"
          required
          value={model}
          onChange={(event) => setModel(event.target.value)}
          placeholder="Ex.: Dell Latitude 5420"
          error={errors.model}
        />

        <TextArea
          label="Especificações"
          name="specs"
          required
          rows={4}
          value={specs}
          onChange={(event) => setSpecs(event.target.value)}
          placeholder="Ex.: i5 11ª geração, 16GB RAM, SSD 512GB, Tela 14 Full HD"
          error={errors.specs}
          hint="Separe os itens por vírgula para formar as etiquetas da vitrine."
        />

        <TextInput
          label="Preço"
          name="price"
          type="number"
          step="0.01"
          min="0"
          required
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder="0.00"
          className="no-spinner"
          error={errors.price}
          hint="Valor em reais (R$)."
        />

        <div className="space-y-3">
          <TextInput
            label="Imagem principal (URL)"
            name="image_url"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="https://exemplo.com/notebook.jpg"
            hint="Envie um arquivo para preencher o link automaticamente."
          />

          <div className="flex flex-wrap items-center gap-3">
            <UploadButton
              label="Enviar imagem"
              busy={uploadingMain}
              onSelect={handleMainUpload}
            />

            {imageUrl ? (
              <div className="flex items-center gap-2">
                <img
                  src={imageUrl}
                  alt="Pré-visualização da imagem principal"
                  className="h-14 w-20 rounded-xl border border-white/10 object-cover"
                  referrerPolicy="no-referrer"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  leadingIcon={<X className="h-4 w-4" />}
                  onClick={() => setImageUrl('')}
                  aria-label="Remover imagem principal"
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          <p className="field-label">Galeria (até {GALLERY_SLOTS} fotos)</p>

          <div className="grid gap-3 sm:grid-cols-3">
            {Array.from({ length: GALLERY_SLOTS }, (_, index) => {
              const url = gallery[index];

              return (
                <div
                  key={index}
                  className="rounded-2xl border border-dashed border-white/12 bg-white/[0.02] p-3"
                >
                  {url ? (
                    <div className="space-y-2">
                      <img
                        src={url}
                        alt={`Foto ${index + 1} da galeria`}
                        className="h-24 w-full rounded-xl object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex gap-2">
                        <UploadButton
                          label="Trocar"
                          busy={uploadingSlot === index}
                          onSelect={(event) => handleGalleryUpload(event, index)}
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          iconOnly
                          leadingIcon={<Trash2 className="h-4 w-4" />}
                          onClick={() => removeGalleryItem(index)}
                          aria-label={`Remover foto ${index + 1} da galeria`}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex h-24 items-center justify-center text-white/20">
                        <Images className="h-6 w-6" />
                      </div>
                      <UploadButton
                        label="Enviar"
                        busy={uploadingSlot === index}
                        onSelect={(event) => handleGalleryUpload(event, index)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
            <input
              type="checkbox"
              checked={isPromotional}
              onChange={(event) => setIsPromotional(event.target.checked)}
              className="h-4 w-4 accent-brand-400"
            />
            <span className="text-sm font-semibold text-white/80">Em Promoção</span>
          </label>

          <Button
            type="button"
            variant={isSold ? 'danger' : 'outline'}
            aria-pressed={isSold}
            onClick={() => setIsSold((previous) => !previous)}
            leadingIcon={
              isSold ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Circle className="h-4 w-4" />
              )
            }
          >
            Marcar como Vendido
          </Button>
        </div>

        <p className={cn('text-xs text-white/40', isSold ? 'text-red-300' : undefined)}>
          Status: {isSold ? 'Vendido' : 'À venda'}
          {isSold && soldAt ? ` · vendido em ${formatDateBR(soldAt)}` : ''}
        </p>
      </form>
    </Modal>
  );
}

function UploadButton({
  label,
  busy,
  onSelect,
}: {
  label: string;
  busy: boolean;
  onSelect: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={onSelect}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        leadingIcon={
          busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )
        }
      >
        {busy ? 'Enviando...' : label}
      </Button>
    </>
  );
}
