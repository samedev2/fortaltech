import { useEffect, useRef, useState } from 'react';
import { ShoppingBag } from 'lucide-react';

const NAMES = [
  'João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Juliana', 'Ricardo', 'Fernanda',
  'Lucas', 'Beatriz', 'Marcos', 'Camila', 'Gabriel', 'Larissa', 'Thiago',
  'Amanda', 'Bruno', 'Letícia', 'Felipe', 'Vanessa',
];

const CITIES = [
  'Fortaleza', 'Caucaia', 'Maracanaú', 'Eusébio', 'Aquiraz',
  'Maranguape', 'Pacatuba', 'Itaitinga',
];

const MODELS = [
  'Dell Latitude', 'Lenovo ThinkPad', 'MacBook Air', 'HP EliteBook',
  'Acer Nitro 5', 'Dell G15', 'Samsung Book', 'Lenovo Ideapad',
  'Asus Vivobook', 'MacBook Pro',
];

const MIN_VISIBLE_MS = 5000;
const MIN_INTERVAL_MS = 15000;
const MAX_INTERVAL_MS = 25000;

interface SalesNotificationState {
  name: string;
  city: string;
  model: string;
  minutesAgo: number;
}

/**
 * Social-proof toast. The random values are generated ONCE per cycle and
 * stored in state — generating them during render would make the text
 * flicker on every re-render.
 */
export function SalesNotification() {
  const [state, setState] = useState<SalesNotificationState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const schedule = () => {
      timerRef.current = setTimeout(() => {
        const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
        setState({
          name: pick(NAMES),
          city: pick(CITIES),
          model: pick(MODELS),
          minutesAgo: Math.floor(Math.random() * 9) + 1,
        });

        hideTimerRef.current = setTimeout(() => setState(null), MIN_VISIBLE_MS);

        schedule();
      }, MIN_INTERVAL_MS + Math.random() * (MAX_INTERVAL_MS - MIN_INTERVAL_MS));
    };

    schedule();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (!state) return null;

  return (
    <div
      className="slide-in-left fixed bottom-6 left-4 z-[80] flex max-w-[calc(100vw-2rem)] items-center gap-3.5 rounded-2xl border border-brand-400/25 bg-ink-850/95 p-4 shadow-2xl shadow-black/60 backdrop-blur-xl sm:left-6 sm:max-w-xs"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-brand-400/25 bg-brand-400/12 text-brand-400">
        <ShoppingBag className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-brand-400">
          Nova venda
        </p>
        <p className="text-sm font-medium leading-snug text-white/85">
          <span className="font-bold text-white">{state.name}</span> de {state.city} acabou de
          comprar um <span className="font-semibold text-brand-400">{state.model}</span>.
        </p>
        <p className="mt-1 text-[11px] text-white/35">há {state.minutesAgo} min</p>
      </div>
    </div>
  );
}
