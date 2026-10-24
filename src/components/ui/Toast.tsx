import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
  exiting?: boolean;
}

interface ToastContextValue {
  toast: (variant: ToastVariant, title: string, description?: string) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_META: Record<
  ToastVariant,
  { icon: typeof Info; ring: string; iconColor: string; bar: string }
> = {
  success: {
    icon: CheckCircle2,
    ring: 'border-brand-400/35',
    iconColor: 'text-brand-400',
    bar: 'bg-brand-400',
  },
  error: {
    icon: AlertTriangle,
    ring: 'border-red-400/35',
    iconColor: 'text-red-400',
    bar: 'bg-red-400',
  },
  info: {
    icon: Info,
    ring: 'border-accent-400/35',
    iconColor: 'text-accent-400',
    bar: 'bg-accent-400',
  },
};

const DURATION = 4200;
const EXIT_MS = 200;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.length = 0;
    };
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    const timer = setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, EXIT_MS);
    timers.current.push(timer);
  }, []);

  const toast = useCallback(
    (variant: ToastVariant, title: string, description?: string) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((prev) => [...prev.slice(-3), { id, variant, title, description }]);

      const timer = setTimeout(() => dismiss(id), DURATION);
      timers.current.push(timer);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, description) => toast('success', title, description),
      error: (title, description) => toast('error', title, description),
      info: (title, description) => toast('info', title, description),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-[200] flex flex-col items-center gap-2 px-4 pt-20 sm:items-end sm:px-6 sm:pt-24"
        role="region"
        aria-label="Notificações"
      >
        {toasts.map((item) => {
          const meta = VARIANT_META[item.variant];
          const Icon = meta.icon;
          return (
            <div
              key={item.id}
              className={cn(
                'pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-2xl border bg-ink-850/95 shadow-2xl shadow-black/60 backdrop-blur-xl',
                item.exiting ? 'toast-out' : 'toast-in',
                meta.ring,
              )}
            >
              <div className="flex items-start gap-3 p-4 pr-3">
                <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', meta.iconColor)} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-snug text-white">{item.title}</p>
                  {item.description && (
                    <p className="mt-0.5 text-xs leading-relaxed text-white/55 break-words">
                      {item.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  className="-m-1 rounded-lg p-1.5 text-white/35 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Fechar notificação"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className={cn('h-0.5', meta.bar)} />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast precisa estar dentro de <ToastProvider>.');
  return ctx;
}
