import type { CSSProperties } from 'react';
import { ArrowRight, MessageCircle, ShieldCheck, Star, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

interface HeroProps {
  title: string;
  description: string;
  whatsappUrl: string;
  /** Reduces the top padding when a banner sits above the hero. */
  compact?: boolean;
}

const TRUST_STATS = [
  { value: '+500', label: 'Clientes atendidos' },
  { value: '24h', label: 'Resposta de orçamento' },
  { value: '100%', label: 'Garantia nos serviços' },
  { value: '10x', label: 'Ganho de performance' },
];

/**
 * Renders the admin-managed hero title without depending on its exact
 * wording: the final word is always highlighted, and a line break is
 * inserted when the title has three or more words.
 */
function HeroTitle({ title }: { title: string }) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  const last = words[words.length - 1];
  const head = words.slice(0, -1);
  const highlight = (
    <span className="bg-gradient-to-br from-brand-300 to-brand-500 bg-clip-text text-transparent italic">
      {last}
    </span>
  );

  if (head.length === 0) return <>{highlight}</>;

  return (
    <>
      {head.join(' ')}
      {head.length >= 2 && <br />}
      {highlight}
    </>
  );
}

export function Hero({ title, description, whatsappUrl, compact = false }: HeroProps) {
  return (
    <section
      id="topo"
      className={cn(
        'relative overflow-hidden pb-16 pt-32 md:pb-24 md:pt-40',
        compact && 'pt-16 md:pt-20',
      )}
    >
      {/* Backdrop */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 grid-pattern opacity-[0.55]" />
        <div className="absolute -left-40 -top-32 h-[34rem] w-[34rem] rounded-full bg-brand-500/12 blur-[130px]" />
        <div className="absolute -right-40 top-24 h-[30rem] w-[30rem] rounded-full bg-accent-500/10 blur-[130px]" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-ink-950" />
      </div>

      <div className="container-page">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          {/* Copy */}
          <div
            className="reveal reveal-in"
            style={{ '--reveal-delay': '0ms' } as CSSProperties}
          >
            <span className="eyebrow mb-7 border border-brand-400/25 bg-brand-400/10 text-brand-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Especialista em Fortaleza
            </span>

            <h1 className="display text-5xl text-balance sm:text-6xl md:text-7xl xl:text-[5.5rem]">
              <HeroTitle title={title} />
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/60 md:text-xl">
              {description}
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-inverse btn-lg group"
              >
                Solicitar agora
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </a>

              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3.5">
                <div className="flex -space-x-2.5" aria-hidden="true">
                  {['JF', 'MC', 'RS'].map((initials, i) => (
                    <span
                      key={initials}
                      className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink-950 text-[10px] font-black text-ink-950',
                        [
                          'bg-brand-300',
                          'bg-accent-400',
                          'bg-orange-400',
                        ][i],
                      )}
                    >
                      {initials}
                    </span>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5 text-amber-400" aria-hidden="true">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3 w-3 fill-current" />
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-white/50">
                    +500 clientes satisfeitos
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div
            className="reveal reveal-scale reveal-in relative"
            style={{ '--reveal-delay': '150ms' } as CSSProperties}
          >
            <div className="noise relative aspect-square overflow-hidden rounded-[2rem] border border-white/10 bg-ink-850">
              <img
                src="https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?q=80&w=1000&auto=format&fit=crop"
                alt="Técnico trabalhando em uma placa-mãe durante manutenção de hardware"
                className="h-full w-full object-cover grayscale transition-all duration-700 hover:grayscale-0"
                referrerPolicy="no-referrer"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/10 to-transparent" />
              <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-ink-950/70 to-transparent" />

              <div className="absolute left-7 top-7 max-w-[62%]">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                  <Zap className="h-4 w-4 shrink-0 text-brand-400" />
                  Manutenção de alta performance
                </div>
              </div>
            </div>

            <div
              className="reveal reveal-left reveal-in absolute -bottom-5 -left-3 rounded-2xl bg-brand-400 px-6 py-5 text-ink-950 shadow-2xl shadow-brand-500/25 sm:-left-6"
              style={{ '--reveal-delay': '480ms' } as CSSProperties}
            >
              <div className="text-3xl font-black leading-none">100%</div>
              <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] opacity-70">
                Garantia
              </div>
            </div>

            <div
              className="reveal reveal-left reveal-in absolute -right-3 -top-5 rounded-2xl bg-white px-6 py-5 text-ink-950 shadow-2xl sm:-right-6"
              style={{ '--reveal-delay': '600ms' } as CSSProperties}
            >
              <div className="text-3xl font-black leading-none">24h</div>
              <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] opacity-60">
                Orçamento
              </div>
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <dl
          className="reveal reveal-in mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/8 bg-white/8 md:mt-20 md:grid-cols-4"
          style={{ '--reveal-delay': '450ms' } as CSSProperties}
        >
          {TRUST_STATS.map((stat) => (
            <div key={stat.label} className="bg-ink-900 px-6 py-7">
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="block text-3xl font-black tracking-tight text-brand-400 md:text-4xl">
                  {stat.value}
                </span>
                <span className="mt-1.5 block text-[11px] font-bold uppercase leading-snug tracking-[0.14em] text-white/45">
                  {stat.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
