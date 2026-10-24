/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RotateCw, Terminal } from 'lucide-react';
import { configError, supabase } from './lib/supabase';
import {
  DEFAULT_SITE_CONTENT,
  type Contact,
  type ContactFormState,
  type Notebook,
  type Service,
  type SiteContent,
} from './lib/types';
import { onlyDigits } from './lib/utils';
import { ToastProvider, useToast } from './components/ui/Toast';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { AdminPanel } from './components/admin/AdminPanel';
import { LoginModal } from './components/admin/LoginModal';
import { NotebookModal } from './components/admin/NotebookModal';
import { ServiceModal } from './components/admin/ServiceModal';
import { Navbar } from './components/site/Navbar';
import { Hero } from './components/site/Hero';
import { ServicesSection } from './components/site/ServicesSection';
import { EgpuSection } from './components/site/EgpuSection';
import { NotebooksSection } from './components/site/NotebooksSection';
import { SpeedSection } from './components/site/SpeedSection';
import { ContactSection } from './components/site/ContactSection';
import { Footer } from './components/site/Footer';
import { SalesNotification } from './components/site/SalesNotification';
import { FloatingActions } from './components/site/FloatingActions';

type PendingDelete =
  | { kind: 'notebook'; id: string; label: string }
  | { kind: 'service'; id: string; label: string }
  | { kind: 'contact'; id: string; label: string };

/** Rejects instead of hanging forever when the backend is unreachable. */
function withTimeout<T>(promise: Promise<T>, ms = 9000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Tempo de resposta excedido.')), ms),
    ),
  ]);
}

function AppShell() {
  const toast = useToast();

  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);

  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Modals used by the admin affordances rendered on the public site.
  const [editingNotebook, setEditingNotebook] = useState<Partial<Notebook> | null>(null);
  const [editingService, setEditingService] = useState<Partial<Service> | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  /* ------------------------------------------------------------------ *
   * Data loading
   * ------------------------------------------------------------------ */

  const fetchNotebooks = useCallback(async () => {
    const { data, error } = await supabase
      .from('notebooks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    setNotebooks(data || []);
  }, []);

  /**
   * Arquiva notebooks vendidos após 2 dias.
   *
   * Roda SOMENTE com sessão de admin: a RLS permite SELECT público, mas
   * DELETE exige a política de administrador — com a anon key a chamada
   * seria sempre negada (e não-falha silenciosa a cada visita).
   */
  const cleanupSoldNotebooks = useCallback(async () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const { error } = await supabase
      .from('notebooks')
      .delete()
      .eq('is_sold', true)
      .lt('sold_at', twoDaysAgo.toISOString());

    if (error) {
      console.warn('Não foi possível arquivar notebooks vendidos:', error.message);
    }
  }, []);

  const fetchServices = useCallback(async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('order_index', { ascending: true });
    if (error) throw error;
    setServices(data || []);
  }, []);

  const fetchSiteContent = useCallback(async () => {
    const { data, error } = await supabase.from('site_content').select('*');
    if (error) throw error;
    if (data) {
      const content: SiteContent = {};
      data.forEach((item) => {
        content[item.key] = item.value;
      });
      setSiteContent((prev) => ({ ...prev, ...content }));
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    setContacts(data || []);
  }, []);

  /**
   * Incrementa o contador de visitas via RPC `increment_visits` (SECURITY
   * DEFINER no banco) — a tabela site_content é somente leitura para o
   * público, então um UPDATE direto seria sempre negado pela RLS.
   */
  const incrementVisits = useCallback(async () => {
    const { data, error } = await supabase.rpc('increment_visits');
    if (error || data === null || data === undefined) return;
    setSiteContent((prev) => ({ ...prev, visits: String(data) }));
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      await Promise.all([
        withTimeout(fetchNotebooks()),
        withTimeout(fetchServices()),
        withTimeout(fetchSiteContent()),
        withTimeout(fetchContacts()),
      ]);
    } catch (error) {
      console.error('Falha ao carregar os dados do site:', error);
      setLoadError(
        error instanceof Error
          ? error.message
          : 'Não foi possível conectar ao banco de dados.',
      );
    } finally {
      setLoading(false);
    }
  }, [fetchNotebooks, fetchServices, fetchSiteContent, fetchContacts]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await loadAll();
      if (!cancelled) incrementVisits();
    })();

    return () => {
      cancelled = true;
    };
  }, [loadAll, incrementVisits]);

  // Arquiva notebooks vendidos apenas quando há sessão de admin.
  useEffect(() => {
    if (!isAdmin) return;
    cleanupSoldNotebooks();
  }, [isAdmin, cleanupSoldNotebooks]);

  // Deep links: the browser tries to jump to the anchor before React has
  // mounted the sections, so the scroll is silently dropped. Repeat it once
  // the DOM exists.
  useEffect(() => {
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;

    const target = document.querySelector(hash);
    if (!target) return;

    target.scrollIntoView({ block: 'start' });
  }, []);

  /* ------------------------------------------------------------------ *
   * Authentication
   * ------------------------------------------------------------------ */

  useEffect(() => {
    const adminEmailConfig = import.meta.env.VITE_ADMIN_EMAIL;

    if (!adminEmailConfig) {
      console.warn(
        'AVISO: a variável VITE_ADMIN_EMAIL não está configurada. O painel admin ficará desabilitado.',
      );
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const authorized = adminEmailConfig
        ? session?.user?.email === adminEmailConfig
        : false;
      setIsAdmin(authorized);
      if (authorized) setShowAdminPanel(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const authorized = adminEmailConfig
        ? session?.user?.email === adminEmailConfig
        : false;
      setIsAdmin(authorized);
      if (authorized) {
        setShowAdminPanel(true);
        setShowAdminLogin(false);
      } else {
        setShowAdminPanel(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /* ------------------------------------------------------------------ *
   * Derived values
   * ------------------------------------------------------------------ */

  const whatsappNumber = siteContent.whatsapp_number || DEFAULT_SITE_CONTENT.whatsapp_number;
  const adminAvailable = Boolean(import.meta.env.VITE_ADMIN_EMAIL);
  const whatsappUrl = useMemo(
    () =>
      `https://wa.me/${onlyDigits(whatsappNumber)}?text=${encodeURIComponent(
        'Olá! Gostaria de um orçamento para manutenção do meu computador.',
      )}`,
    [whatsappNumber],
  );

  useEffect(() => {
    const title = siteContent.site_title || DEFAULT_SITE_CONTENT.site_title;
    document.title = `${title} — Assistência e Sistemas`;
  }, [siteContent.site_title]);

  /* ------------------------------------------------------------------ *
   * Mutations
   *
   * These handlers are the data layer: they perform the Supabase write and
   * RE-THROW on failure. Feedback (toasts) belongs to the UI layer that
   * triggered the action, so no message is ever shown twice.
   * ------------------------------------------------------------------ */

  const handleSaveNotebook = useCallback(
    async (notebook: Partial<Notebook>) => {
      const { id, created_at: _createdAt, ...rest } = notebook as Partial<Notebook> & {
        created_at?: string;
      };
      void _createdAt;

      const payload: Record<string, unknown> = { ...rest };
      if (payload.is_sold) {
        if (!payload.sold_at) payload.sold_at = new Date().toISOString();
      } else {
        payload.sold_at = null;
      }

      const { error } = id
        ? await supabase.from('notebooks').update(payload).eq('id', id)
        : await supabase.from('notebooks').insert([payload]);

      if (error) throw error;

      await fetchNotebooks();
    },
    [fetchNotebooks],
  );

  const handleDeleteNotebook = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('notebooks').delete().eq('id', id);
      if (error) throw error;
      await fetchNotebooks();
    },
    [fetchNotebooks],
  );

  const handleSaveService = useCallback(
    async (service: Partial<Service>) => {
      const { id, ...rest } = service;
      const payload = { ...rest, tags: rest.tags ?? [] };

      const { error } = id
        ? await supabase.from('services').update(payload).eq('id', id)
        : await supabase.from('services').insert([payload]);

      if (error) throw error;

      await fetchServices();
    },
    [fetchServices],
  );

  const handleDeleteService = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      await fetchServices();
    },
    [fetchServices],
  );

  const handleSaveContent = useCallback(
    async (entry: { key: string; value: string }) => {
      const { error } = await supabase.from('site_content').upsert(entry);
      if (error) throw error;
      await fetchSiteContent();
    },
    [fetchSiteContent],
  );

  const handleDeleteContact = useCallback(
    async (id: string) => {
      const { error } = await supabase.from('contacts').delete().eq('id', id);
      if (error) throw error;
      await fetchContacts();
    },
    [fetchContacts],
  );

  const handleContactSubmit = useCallback(
    async (form: ContactFormState) => {
      const { error } = await supabase.from('contacts').insert([form]);
      if (error) throw error;
      if (isAdmin) fetchContacts();
    },
    [isAdmin, fetchContacts],
  );

  const handleAdminLogin = useCallback(async (email: string, password: string) => {
    const adminEmailConfig = import.meta.env.VITE_ADMIN_EMAIL;

    if (!adminEmailConfig) {
      throw new Error(
        'Configuração incompleta: a variável VITE_ADMIN_EMAIL não está definida no projeto.',
      );
    }
    if (email !== adminEmailConfig) {
      throw new Error('Acesso negado: este e-mail não tem permissões de administrador.');
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    setShowAdminLogin(false);
    setShowAdminPanel(true);
  }, []);

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error('Erro ao sair', error.message);
      return;
    }
    setIsAdmin(false);
    setShowAdminPanel(false);
    toast.info('Sessão encerrada');
  }, [toast]);

  const confirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    try {
      if (pendingDelete.kind === 'notebook') {
        await handleDeleteNotebook(pendingDelete.id);
      } else if (pendingDelete.kind === 'service') {
        await handleDeleteService(pendingDelete.id);
      } else {
        await handleDeleteContact(pendingDelete.id);
      }
    } finally {
      setPendingDelete(null);
    }
  }, [
    pendingDelete,
    handleDeleteNotebook,
    handleDeleteService,
    handleDeleteContact,
  ]);

  /* ------------------------------------------------------------------ *
   * Render
   * ------------------------------------------------------------------ */

  const isAdminView = isAdmin && showAdminPanel;

  // Configuração ausente: melhor uma tela de setup explícita do que um
  // "não foi possível conectar ao banco" que não diz o que fazer.
  if (configError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 px-5 py-16 text-white">
        <div className="w-full max-w-2xl">
          <div className="rounded-3xl border border-orange-500/30 bg-orange-500/[0.07] p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
                <Terminal className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold tracking-tight">
                  Configuração do Supabase pendente
                </h1>
                <p className="text-sm text-white/50">{configError}</p>
              </div>
            </div>

            <p className="mt-6 text-sm leading-relaxed text-white/60">
              Crie um arquivo <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-xs text-brand-300">.env.local</code>{' '}
              na raiz do projeto com as credenciais da sua instância self-hosted e
              reinicie o servidor de desenvolvimento:
            </p>

            <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-black/50 p-4 font-mono text-xs leading-relaxed text-white/80">
{`VITE_SUPABASE_URL="https://supabase.seudominio.com"
VITE_SUPABASE_ANON_KEY="sua-chave-anon-da-instancia"
VITE_ADMIN_EMAIL="seu-email@exemplo.com"`}
            </pre>

            <p className="mt-5 text-xs leading-relaxed text-white/35">
              O modelo de <code className="font-mono">.env.example</code> tem os detalhes de
              CORS, Auth e Storage específicos do Supabase self-hosted.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 text-white antialiased">
      {isAdminView ? (
        <AdminPanel
          notebooks={notebooks}
          services={services}
          contacts={contacts}
          siteContent={siteContent}
          onSaveNotebook={handleSaveNotebook}
          onDeleteNotebook={handleDeleteNotebook}
          onSaveService={handleSaveService}
          onDeleteService={handleDeleteService}
          onSaveContent={handleSaveContent}
          onDeleteContact={handleDeleteContact}
          onLogout={handleLogout}
          onBackToSite={() => setShowAdminPanel(false)}
        />
      ) : (
        <>
          <Navbar siteTitle={siteContent.site_title} whatsappUrl={whatsappUrl} />

          <main id="conteudo">
            {loadError && (
              <div className="container-page pt-24 md:pt-28">
                <div
                  role="alert"
                  className="flex flex-col gap-4 rounded-2xl border border-orange-500/30 bg-orange-500/10 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-bold text-orange-300">
                      Não foi possível carregar o conteúdo do site
                    </p>
                    <p className="mt-1 text-sm text-white/55">{loadError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={loadAll}
                    className="btn btn-outline btn-md shrink-0"
                  >
                    <RotateCw className="h-4 w-4" />
                    Tentar novamente
                  </button>
                </div>
              </div>
            )}

            <Hero
              title={siteContent.hero_title}
              description={siteContent.hero_description}
              whatsappUrl={whatsappUrl}
              compact={loadError !== null}
            />

            <ServicesSection
              services={services}
              loading={loading}
              isAdmin={isAdmin}
              onEditService={(service) => setEditingService(service)}
              onDeleteService={(service) =>
                setPendingDelete({ kind: 'service', id: service.id, label: service.title })
              }
              onAddService={() =>
                setEditingService({
                  title: '',
                  description: '',
                  icon_name: 'Monitor',
                  tags: [],
                  order_index: services.length + 1,
                })
              }
            />

            <EgpuSection whatsappUrl={whatsappUrl} />

            <NotebooksSection
              notebooks={notebooks}
              loading={loading}
              isAdmin={isAdmin}
              onEditNotebook={(notebook) => setEditingNotebook(notebook)}
              onDeleteNotebook={(id) => {
                const nb = notebooks.find((n) => n.id === id);
                setPendingDelete({
                  kind: 'notebook',
                  id,
                  label: nb?.model ?? 'notebook',
                });
              }}
              onAddNotebook={() => setEditingNotebook({})}
            />

            <SpeedSection whatsappUrl={whatsappUrl} />

            <ContactSection
              services={services}
              whatsappNumber={whatsappNumber}
              onSubmit={handleContactSubmit}
            />
          </main>

          <Footer
            siteTitle={siteContent.site_title}
            footerText={siteContent.footer_text}
            visits={siteContent.visits}
            whatsappNumber={whatsappNumber}
            isAdmin={isAdmin}
            adminAvailable={adminAvailable}
            onAdminLogin={() => setShowAdminLogin(true)}
            onAdminLogout={handleLogout}
          />

          <SalesNotification />
          <FloatingActions whatsappUrl={whatsappUrl} />
        </>
      )}

      {/* Login */}
      <LoginModal
        open={showAdminLogin}
        onClose={() => setShowAdminLogin(false)}
        onLogin={handleAdminLogin}
      />

      {/* Admin modals used from the public-site admin affordances.
          The modals own their own success/error toasts, so these wrappers
          only translate a resolved promise into "close". */}
      <NotebookModal
        notebook={editingNotebook}
        onClose={() => setEditingNotebook(null)}
        onSave={async (notebook) => {
          await handleSaveNotebook(notebook);
          setEditingNotebook(null);
        }}
      />

      <ServiceModal
        service={editingService}
        onClose={() => setEditingService(null)}
        onSave={async (service) => {
          await handleSaveService(service);
          setEditingService(null);
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Confirmar exclusão"
        description={`Tem certeza que deseja excluir “${pendingDelete?.label ?? ''}”? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppShell />
    </ToastProvider>
  );
}
