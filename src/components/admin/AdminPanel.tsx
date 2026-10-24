/**
 * Admin back-office.
 *
 * Full screen environment (not an overlay on the public site) with an
 * ARIA compliant tab switcher. Feedback lives here only for the destructive
 * actions this component owns (deletes) — the save modals toast their own
 * results, so a single action never produces two toasts.
 */

import {
  useCallback,
  useRef,
  useState,
  type KeyboardEvent,
  type JSX,
  type ReactNode,
} from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileText,
  Flame,
  Images,
  Inbox,
  Laptop,
  LogOut,
  MessageCircle,
  Package,
  Pencil,
  Phone,
  Plus,
  Trash2,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

import type { AdminTab, Contact, Notebook, Service, SiteContent } from '../../lib/types';
import {
  cn,
  formatBRL,
  formatDateTimeBR,
  specChips,
  timeAgoBR,
  toWhatsAppNumber,
} from '../../lib/utils';
import { BrandMark, getServiceIcon } from '../../lib/icons';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { useToast } from '../ui/Toast';
import { ContentModal } from './ContentModal';
import { NotebookModal } from './NotebookModal';
import { ServiceModal } from './ServiceModal';

export interface AdminPanelProps {
  notebooks: Notebook[];
  services: Service[];
  contacts: Contact[];
  siteContent: SiteContent;
  onSaveNotebook: (notebook: Partial<Notebook>) => Promise<void>;
  onDeleteNotebook: (id: string) => Promise<void>;
  onSaveService: (service: Partial<Service>) => Promise<void>;
  onDeleteService: (id: string) => Promise<void>;
  onSaveContent: (payload: { key: string; value: string }) => Promise<void>;
  onDeleteContact: (id: string) => Promise<void>;
  onLogout: () => void;
  onBackToSite: () => void;
}

interface TabDefinition {
  id: AdminTab;
  label: string;
  icon: LucideIcon;
}

interface PendingDelete {
  kind: 'notebook' | 'service' | 'contact';
  id: string;
  title: string;
  description: string;
  /** Name of the record, used as the toast description. */
  label: string;
}

const TABS: TabDefinition[] = [
  { id: 'notebooks', label: 'Notebooks', icon: Laptop },
  { id: 'services', label: 'Serviços', icon: Wrench },
  { id: 'content', label: 'Conteúdo', icon: FileText },
  { id: 'messages', label: 'Mensagens', icon: MessageCircle },
];

const PANEL_ID = 'admin-tabpanel';

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

export function AdminPanel({
  notebooks,
  services,
  contacts,
  siteContent,
  onSaveNotebook,
  onDeleteNotebook,
  onSaveService,
  onDeleteService,
  onSaveContent,
  onDeleteContact,
  onLogout,
  onBackToSite,
}: AdminPanelProps): JSX.Element {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('notebooks');
  const [notebookDraft, setNotebookDraft] = useState<Partial<Notebook> | null>(null);
  const [serviceDraft, setServiceDraft] = useState<Partial<Service> | null>(null);
  const [contentDraft, setContentDraft] = useState<{ key: string; value: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const tabRefs = useRef<Partial<Record<AdminTab, HTMLButtonElement | null>>>({});

  const counts: Record<AdminTab, number> = {
    notebooks: notebooks.length,
    services: services.length,
    content: Object.keys(siteContent).length,
    messages: contacts.length,
  };

  /* ------------------------------------------------------------------ *
   * Save handlers — close the modal only after the promise resolves,
   * so a rejected write keeps the form open with its error message.
   * ------------------------------------------------------------------ */

  const handleSaveNotebook = useCallback(
    async (notebook: Partial<Notebook>) => {
      await onSaveNotebook(notebook);
      setNotebookDraft(null);
    },
    [onSaveNotebook],
  );

  const handleSaveService = useCallback(
    async (service: Partial<Service>) => {
      await onSaveService(service);
      setServiceDraft(null);
    },
    [onSaveService],
  );

  const handleSaveContent = useCallback(
    async (entry: { key: string; value: string }) => {
      await onSaveContent(entry);
      setContentDraft(null);
    },
    [onSaveContent],
  );

  /* ------------------------------------------------------------------ *
   * Delete flow — ConfirmDialog, never the native browser dialog.
   * ------------------------------------------------------------------ */

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return;

    const { kind, id, label } = pendingDelete;

    try {
      if (kind === 'notebook') {
        await onDeleteNotebook(id);
        toast.success('Notebook excluído', label);
      } else if (kind === 'service') {
        await onDeleteService(id);
        toast.success('Serviço excluído', label);
      } else {
        await onDeleteContact(id);
        toast.success('Mensagem excluída', label);
      }
    } catch (error) {
      toast.error(
        'Erro ao excluir',
        errorMessage(error, 'Não foi possível concluir a exclusão.'),
      );
    } finally {
      setPendingDelete(null);
    }
  }, [onDeleteContact, onDeleteNotebook, onDeleteService, pendingDelete, toast]);

  /* ------------------------------------------------------------------ *
   * Tab keyboard navigation (Left / Right / Home / End).
   * ------------------------------------------------------------------ */

  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = TABS.findIndex((tab) => tab.id === activeTab);
      let nextIndex = -1;

      if (event.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % TABS.length;
      } else if (event.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = TABS.length - 1;
      }

      if (nextIndex < 0) return;

      event.preventDefault();
      const nextTab = TABS[nextIndex];
      setActiveTab(nextTab.id);
      tabRefs.current[nextTab.id]?.focus();
    },
    [activeTab],
  );

  /* ------------------------------------------------------------------ *
   * Render
   * ------------------------------------------------------------------ */

  return (
    <div className="relative min-h-screen bg-ink-950 text-white">
      <div className="pointer-events-none fixed inset-0 grid-pattern opacity-50" aria-hidden="true" />

      <header className="sticky top-0 z-40 border-b border-white/7 bg-ink-950/90 backdrop-blur-xl">
        <div className="container-page flex flex-col gap-4 py-4 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark className="h-10 w-10 shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-400">
                Fortal Tech
              </p>
              <h1 className="truncate text-lg font-extrabold tracking-tight text-white">
                Painel Admin
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2 lg:ml-auto">
            <Button
              variant="outline"
              size="sm"
              leadingIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={onBackToSite}
            >
              Voltar ao Site
            </Button>
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              leadingIcon={<LogOut className="h-4 w-4" />}
              onClick={onLogout}
              aria-label="Sair do painel administrativo"
            />
          </div>
        </div>

        <div className="container-page pb-3">
          <div
            role="tablist"
            aria-label="Seções do painel administrativo"
            onKeyDown={handleTabKeyDown}
            className="flex gap-2 overflow-x-auto scrollbar-none"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              const TabIcon = tab.icon;

              return (
                <button
                  key={tab.id}
                  ref={(node) => {
                    tabRefs.current[tab.id] = node;
                  }}
                  type="button"
                  role="tab"
                  id={`admin-tab-${tab.id}`}
                  aria-selected={isActive}
                  aria-controls={PANEL_ID}
                  tabIndex={isActive ? 0 : -1}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.12em] transition-colors',
                    isActive
                      ? 'bg-brand-400 text-ink-950'
                      : 'border border-white/8 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white',
                  )}
                >
                  <TabIcon className="h-4 w-4" />
                  {tab.label}
                  <span
                    className={cn(
                      'rounded-md px-1.5 py-0.5 text-[10px] font-black tabular-nums',
                      isActive ? 'bg-ink-950/15 text-ink-950' : 'bg-white/8 text-white/50',
                    )}
                  >
                    {counts[tab.id]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main
        role="tabpanel"
        id={PANEL_ID}
        aria-labelledby={`admin-tab-${activeTab}`}
        tabIndex={0}
        className="container-page relative py-10 pb-24"
      >
        <div key={activeTab} className="tab-panel-in">
          {activeTab === 'notebooks' && (
            <NotebooksTab
              notebooks={notebooks}
              onAdd={() => setNotebookDraft({})}
              onEdit={(notebook) => setNotebookDraft(notebook)}
              onRequestDelete={(notebook) =>
                setPendingDelete({
                  kind: 'notebook',
                  id: notebook.id,
                  title: 'Excluir notebook',
                  label: notebook.model,
                  description: `O notebook "${notebook.model}" será removido permanentemente do catálogo. Esta ação não pode ser desfeita.`,
                })
              }
            />
          )}

          {activeTab === 'services' && (
            <ServicesTab
              services={services}
              onAdd={() => setServiceDraft({})}
              onEdit={(service) => setServiceDraft(service)}
              onRequestDelete={(service) =>
                setPendingDelete({
                  kind: 'service',
                  id: service.id,
                  title: 'Excluir serviço',
                  label: service.title,
                  description: `O serviço "${service.title}" será removido permanentemente. Esta ação não pode ser desfeita.`,
                })
              }
            />
          )}

          {activeTab === 'content' && (
            <ContentTab
              siteContent={siteContent}
              onEdit={(key) => setContentDraft({ key, value: siteContent[key] ?? '' })}
            />
          )}

          {activeTab === 'messages' && (
            <MessagesTab
              contacts={contacts}
              onRequestDelete={(contact) =>
                setPendingDelete({
                  kind: 'contact',
                  id: contact.id,
                  title: 'Excluir mensagem',
                  label: contact.name,
                  description: `A mensagem de "${contact.name}" será removida permanentemente. Esta ação não pode ser desfeita.`,
                })
              }
            />
          )}
        </div>
      </main>

      <NotebookModal
        notebook={notebookDraft}
        onClose={() => setNotebookDraft(null)}
        onSave={handleSaveNotebook}
      />

      <ServiceModal
        service={serviceDraft}
        onClose={() => setServiceDraft(null)}
        onSave={handleSaveService}
      />

      <ContentModal
        entry={contentDraft}
        onClose={() => setContentDraft(null)}
        onSave={handleSaveContent}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={pendingDelete?.title ?? 'Confirmar exclusão'}
        description={pendingDelete?.description ?? ''}
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

/* ==================================================================== *
 * Tabs
 * ==================================================================== */

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/12 bg-white/[0.02] px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-white/35">
        <Icon className="h-6 w-6" />
      </div>
      <p className="mt-4 text-base font-extrabold text-white">{title}</p>
      <p className="mt-1 max-w-md text-sm leading-relaxed text-white/45">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

interface NotebooksTabProps {
  notebooks: Notebook[];
  onAdd: () => void;
  onEdit: (notebook: Notebook) => void;
  onRequestDelete: (notebook: Notebook) => void;
}

function NotebooksTab({ notebooks, onAdd, onEdit, onRequestDelete }: NotebooksTabProps) {
  return (
    <section aria-label="Notebooks">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow border border-brand-400/25 bg-brand-400/10 text-brand-300">
            Catálogo
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
            Notebooks
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/45">
            {notebooks.length} {notebooks.length === 1 ? 'notebook cadastrado' : 'notebooks cadastrados'} no
            catálogo.
          </p>
        </div>

        <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={onAdd}>
          Adicionar
        </Button>
      </div>

      {notebooks.length === 0 ? (
        <EmptyState
          icon={Laptop}
          title="Nenhum notebook cadastrado"
          description="Cadastre o primeiro notebook do catálogo para que ele apareça na vitrine do site."
          action={
            <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={onAdd}>
              Adicionar notebook
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {notebooks.map((notebook) => (
            <NotebookAdminCard
              key={notebook.id}
              notebook={notebook}
              onEdit={() => onEdit(notebook)}
              onDelete={() => onRequestDelete(notebook)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function NotebookAdminCard({
  notebook,
  onEdit,
  onDelete,
}: {
  notebook: Notebook;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const gallery = notebook.gallery_urls ?? [];
  const chips = specChips(notebook.specs);

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-white/7 bg-ink-850/70">
      <div className="relative aspect-video overflow-hidden bg-ink-900">
        {notebook.image_url ? (
          <img
            src={notebook.image_url}
            alt={`Foto do notebook ${notebook.model}`}
            className="h-full w-full object-cover"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/20">
            <Laptop className="h-10 w-10" />
          </div>
        )}

        {notebook.is_sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <Badge tone="danger" icon={<CheckCircle2 className="h-3 w-3" />}>
              Vendido
            </Badge>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3 className="text-lg font-extrabold leading-tight text-white">{notebook.model}</h3>

        <div className="flex flex-wrap gap-2">
          {notebook.is_sold && <Badge tone="danger">Vendido</Badge>}
          {notebook.is_promotional && (
            <Badge tone="warning" icon={<Flame className="h-3 w-3" />}>
              Promoção
            </Badge>
          )}
          {gallery.length > 0 && (
            <Badge tone="accent" icon={<Images className="h-3 w-3" />}>
              +{gallery.length} Fotos
            </Badge>
          )}
        </div>

        {chips.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <li
                key={chip}
                className="chip border border-white/10 bg-white/5 text-white/55"
              >
                {chip}
              </li>
            ))}
          </ul>
        )}

        <p className="text-2xl font-black tracking-tight text-brand-400">
          {formatBRL(notebook.price)}
        </p>

        <div className="mt-auto flex items-center gap-2 border-t border-white/7 pt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            leadingIcon={<Pencil className="h-4 w-4" />}
            onClick={onEdit}
          >
            Editar
          </Button>
          <Button
            variant="danger"
            size="sm"
            iconOnly
            leadingIcon={<Trash2 className="h-4 w-4" />}
            onClick={onDelete}
            aria-label={`Excluir notebook ${notebook.model}`}
          />
        </div>
      </div>
    </article>
  );
}

interface ServicesTabProps {
  services: Service[];
  onAdd: () => void;
  onEdit: (service: Service) => void;
  onRequestDelete: (service: Service) => void;
}

function ServicesTab({ services, onAdd, onEdit, onRequestDelete }: ServicesTabProps) {
  return (
    <section aria-label="Serviços">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow border border-accent-500/25 bg-accent-500/10 text-accent-300">
            Ofertas
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
            Serviços
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/45">
            {services.length} {services.length === 1 ? 'serviço publicado' : 'serviços publicados'} no site.
          </p>
        </div>

        <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={onAdd}>
          Adicionar
        </Button>
      </div>

      {services.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="Nenhum serviço cadastrado"
          description="Cadastre os serviços que você oferece para que apareçam na seção de serviços do site."
          action={
            <Button leadingIcon={<Plus className="h-4 w-4" />} onClick={onAdd}>
              Adicionar serviço
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {services.map((service) => (
            <ServiceAdminCard
              key={service.id}
              service={service}
              onEdit={() => onEdit(service)}
              onDelete={() => onRequestDelete(service)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function ServiceAdminCard({
  service,
  onEdit,
  onDelete,
}: {
  service: Service;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const Icon = getServiceIcon(service.icon_name);
  const tags = service.tags ?? [];

  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-white/7 bg-white/[0.02] p-6 sm:flex-row sm:items-start">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-400/10 text-brand-300">
        <Icon className="h-6 w-6" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-extrabold leading-tight text-white">{service.title}</h3>
          {tags.map((tag) => (
            <span
              key={tag}
              className="chip border border-white/10 bg-white/5 text-white/55"
            >
              {tag}
            </span>
          ))}
        </div>

        <p className="mt-2 text-sm leading-relaxed text-white/55">{service.description}</p>

        <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-white/30">
          Ordem {service.order_index} · ícone {service.icon_name}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          leadingIcon={<Pencil className="h-4 w-4" />}
          onClick={onEdit}
        >
          Editar
        </Button>
        <Button
          variant="danger"
          size="sm"
          iconOnly
          leadingIcon={<Trash2 className="h-4 w-4" />}
          onClick={onDelete}
          aria-label={`Excluir serviço ${service.title}`}
        />
      </div>
    </article>
  );
}

interface ContentTabProps {
  siteContent: SiteContent;
  onEdit: (key: string) => void;
}

function ContentTab({ siteContent, onEdit }: ContentTabProps) {
  const entries = Object.entries(siteContent);

  return (
    <section aria-label="Conteúdo do site">
      <div className="mb-8">
        <p className="eyebrow border border-white/12 bg-white/5 text-white/55">Textos</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
          Conteúdo
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/45">
          Blocos de texto editáveis do site. Cada chave é salva na tabela de conteúdo do Supabase.
        </p>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhum bloco de conteúdo"
          description="Não há blocos de texto disponíveis para edição no momento."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {entries.map(([key, value]) => (
            <ContentAdminCard key={key} entryKey={key} value={value} onEdit={() => onEdit(key)} />
          ))}
        </div>
      )}
    </section>
  );
}

function ContentAdminCard({
  entryKey,
  value,
  onEdit,
}: {
  entryKey: string;
  value: string;
  onEdit: () => void;
}) {
  const label = humanizeKey(entryKey);

  return (
    <article className="flex flex-col gap-3 rounded-3xl border border-white/7 bg-white/[0.02] p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-extrabold leading-tight text-white">{label}</h3>
          <p className="mt-1 font-mono text-[11px] text-white/35">{entryKey}</p>
        </div>

        <Button
          variant="outline"
          size="sm"
          iconOnly
          leadingIcon={<Pencil className="h-4 w-4" />}
          onClick={onEdit}
          aria-label={`Editar ${label}`}
        />
      </div>

      <p className="line-clamp-3 text-sm leading-relaxed text-white/55">
        {value?.trim() ? value : '—'}
      </p>
    </article>
  );
}

interface MessagesTabProps {
  contacts: Contact[];
  onRequestDelete: (contact: Contact) => void;
}

function MessagesTab({ contacts, onRequestDelete }: MessagesTabProps) {
  return (
    <section aria-label="Mensagens recebidas">
      <div className="mb-8">
        <p className="eyebrow border border-brand-400/25 bg-brand-400/10 text-brand-300">
          Contato
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
          Mensagens
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/45">
          {contacts.length} {contacts.length === 1 ? 'mensagem recebida' : 'mensagens recebidas'} pelo formulário
          do site.
        </p>
      </div>

      {contacts.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nenhuma mensagem recebida"
          description="As mensagens enviadas pelo formulário de contato aparecerão aqui."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {contacts.map((contact) => (
            <MessageAdminCard
              key={contact.id}
              contact={contact}
              onDelete={() => onRequestDelete(contact)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function MessageAdminCard({
  contact,
  onDelete,
}: {
  contact: Contact;
  onDelete: () => void;
}) {
  const digits = toWhatsAppNumber(contact.whatsapp);
  const waUrl = `https://wa.me/${digits}`;
  const waReplyUrl = `${waUrl}?text=${encodeURIComponent(
    `Olá ${contact.name}! Recebemos a sua mensagem pelo site da Fortal Tech. Podemos falar agora?`,
  )}`;

  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-white/7 bg-white/[0.02] p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-extrabold leading-tight text-white">
            {contact.name}
          </h3>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-400 transition-colors hover:text-brand-300"
          >
            <Phone className="h-3.5 w-3.5" />
            {contact.whatsapp}
          </a>
        </div>

        {contact.status ? <Badge tone="neutral">{contact.status}</Badge> : null}
      </div>

      <Badge tone="brand" icon={<Package className="h-3 w-3" />}>
        {contact.service_type}
      </Badge>

      <p className="whitespace-pre-line text-sm leading-relaxed text-white/60">{contact.message}</p>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-white/7 pt-4">
        <p className="flex flex-wrap items-center gap-1.5 text-xs text-white/40">
          <Clock className="h-3.5 w-3.5" />
          {formatDateTimeBR(contact.created_at)}
          <span className="text-white/20">•</span>
          {timeAgoBR(contact.created_at)}
        </p>

        <div className="flex items-center gap-2">
          <a
            href={waReplyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
          >
            Responder WhatsApp
          </a>
          <Button
            variant="danger"
            size="sm"
            iconOnly
            leadingIcon={<Trash2 className="h-4 w-4" />}
            onClick={onDelete}
            aria-label={`Excluir mensagem de ${contact.name}`}
          />
        </div>
      </div>
    </article>
  );
}
