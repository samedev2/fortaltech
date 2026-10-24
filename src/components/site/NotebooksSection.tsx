import { useEffect, useState } from 'react';
import { Flame, Pencil, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { formatBRL, specChips } from '../../lib/utils';
import type { Notebook } from '../../lib/types';
import { Reveal } from '../ui/Reveal';
import { SectionHeading } from '../ui/SectionHeading';
import { NotebookCardSkeleton } from '../ui/Skeleton';

interface NotebooksSectionProps {
  notebooks: Notebook[];
  loading?: boolean;
  isAdmin?: boolean;
  onEditNotebook?: (notebook: Notebook) => void;
  onDeleteNotebook?: (id: string) => void;
  onAddNotebook?: () => void;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=1000&auto=format&fit=crop';

interface NotebookCardProps {
  notebook: Notebook;
  isAdmin: boolean;
  onEdit: (n: Notebook) => void;
  onDelete: (id: string) => void;
}

function NotebookCard({ notebook, isAdmin, onEdit, onDelete }: NotebookCardProps) {
  const gallery = notebook.gallery_urls ?? [];
  const allImages = [notebook.image_url, ...gallery].filter(Boolean);
  const [activeIndex, setActiveIndex] = useState(0);

  // Keep the selected thumbnail valid if the gallery changes.
  useEffect(() => {
    setActiveIndex((i) => (i < allImages.length ? i : 0));
  }, [allImages.length]);

  const activeImage = allImages[activeIndex] ?? FALLBACK_IMAGE;
  const chips = specChips(notebook.specs);
  const whatsappHref = `https://wa.me/5585999910250?text=${encodeURIComponent(
    `Olá! Tenho interesse no notebook ${notebook.model}.`,
  )}`;

  return (
    <Reveal
      as="article"
      variant="up"
      className="group flex h-full flex-col overflow-hidden rounded-3xl border border-white/7 bg-ink-850/60 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-400/25 hover:shadow-2xl hover:shadow-brand-500/10"
    >
      {/* Media */}
      <div className="relative aspect-[4/3] overflow-hidden bg-black">
        <img
          src={activeImage}
          alt={`Notebook ${notebook.model}`}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/70 via-transparent to-transparent" />

        {notebook.is_promotional && !notebook.is_sold && (
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-orange-600 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-orange-600/40">
            <Flame className="h-3 w-3" />
            Oferta de fogo
          </span>
        )}

        {notebook.is_sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[2px]">
            <span className="-rotate-12 rounded-full border-4 border-white/25 bg-red-600 px-7 py-2.5 text-lg font-black uppercase tracking-[0.2em] text-white shadow-2xl">
              Vendido
            </span>
          </div>
        )}

        {isAdmin && (
          <div className="absolute right-3 top-3 flex gap-2">
            <button
              type="button"
              onClick={() => onEdit(notebook)}
              className="btn btn-ghost btn-icon bg-black/55 backdrop-blur-md hover:bg-black/80"
              aria-label={`Editar ${notebook.model}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onDelete(notebook.id)}
              className="btn btn-icon bg-red-500/80 text-white backdrop-blur-md hover:bg-red-500"
              aria-label={`Excluir ${notebook.model}`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-7">
        <h3 className="text-xl font-bold leading-snug tracking-tight text-white">
          {notebook.model}
        </h3>

        {chips.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {chips.map((chip, i) => (
              <span
                key={`${chip}-${i}`}
                className="chip border border-white/8 bg-white/[0.04] text-white/55"
              >
                {chip}
              </span>
            ))}
          </div>
        )}

        {chips.length === 0 && notebook.specs && (
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-white/45">
            {notebook.specs}
          </p>
        )}

        {allImages.length > 1 && (
          <div className="mt-6 flex gap-2" role="group" aria-label="Galeria de imagens">
            {allImages.map((img, i) => (
              <button
                key={`${img}-${i}`}
                type="button"
                onClick={() => setActiveIndex(i)}
                onMouseEnter={() => setActiveIndex(i)}
                onFocus={() => setActiveIndex(i)}
                aria-label={`Ver imagem ${i + 1} de ${notebook.model}`}
                aria-pressed={activeIndex === i}
                className={`h-12 w-12 overflow-hidden rounded-lg border-2 transition-all ${
                  activeIndex === i
                    ? 'border-brand-400 opacity-100'
                    : 'border-white/10 opacity-50 hover:opacity-100'
                }`}
              >
                <img
                  src={img}
                  alt=""
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-end justify-between gap-4 pt-7">
          <div>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-white/35">
              Preço especial
            </span>
            <div
              className={`mt-1 text-2xl font-black tracking-tight ${
                notebook.is_sold ? 'text-white/25 line-through' : 'text-brand-400'
              }`}
            >
              {formatBRL(notebook.price)}
            </div>
          </div>

          {notebook.is_sold ? (
            <span className="chip border border-white/8 bg-white/[0.03] text-white/30">
              Indisponível
            </span>
          ) : (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-icon"
              aria-label={`Comprar ${notebook.model} pelo WhatsApp`}
            >
              <ShoppingBag className="h-5 w-5" />
            </a>
          )}
        </div>
      </div>
    </Reveal>
  );
}

export function NotebooksSection({
  notebooks,
  loading = false,
  isAdmin = false,
  onEditNotebook,
  onDeleteNotebook,
  onAddNotebook,
}: NotebooksSectionProps) {
  return (
    <section id="notebooks" className="section-pad relative overflow-hidden bg-ink-950">
      <div
        className="pointer-events-none absolute -left-40 top-1/3 h-96 w-96 rounded-full bg-brand-600/8 blur-[130px]"
        aria-hidden="true"
      />

      <div className="container-page">
        <SectionHeading
          eyebrow={
            <span className="eyebrow border border-white/10 bg-white/5 text-white/60">
              Vitrine
            </span>
          }
          title={
            <>
              Notebooks <span className="text-brand-400">seminovos</span>
            </>
          }
          description="Máquinas revisadas, com garantia e prontas para o uso. Economia e performance garantidas."
          action={
            isAdmin ? (
              <button
                type="button"
                onClick={onAddNotebook}
                className="btn btn-primary btn-lg"
              >
                <Plus className="h-5 w-5" />
                Novo notebook
              </button>
            ) : undefined
          }
        />

        {loading ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <NotebookCardSkeleton key={i} />
            ))}
          </div>
        ) : notebooks.length > 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {notebooks.map((notebook) => (
              <NotebookCard
                key={notebook.id}
                notebook={notebook}
                isAdmin={isAdmin}
                onEdit={onEditNotebook ?? (() => {})}
                onDelete={onDeleteNotebook ?? (() => {})}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-[2rem] border-2 border-dashed border-white/8 py-20 text-center">
            <ShoppingBag className="mb-5 h-14 w-14 text-white/10" />
            <p className="text-sm font-bold uppercase tracking-widest text-white/25">
              Nenhum notebook disponível no momento.
            </p>
            <p className="mt-2 max-w-sm text-sm text-white/35">
              Fale com a gente pelo WhatsApp para avisar quando chegar estoque novo.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
