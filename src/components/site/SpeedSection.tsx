import { Cpu, MessageCircle, Zap } from 'lucide-react';
import { Reveal } from '../ui/Reveal';

interface SpeedSectionProps {
  whatsappUrl: string;
}

const IMPROVEMENTS = [
  'Otimização de Unidade C (SSD/NVMe)',
  'Limpeza profunda de Placa Mãe',
  'Upgrade de Memória RAM',
  'Reparo de erros críticos do sistema',
];

const STATS = [
  { value: '10x', label: 'Mais Velocidade' },
  { value: '-20°C', label: 'Menos Calor' },
];

export function SpeedSection({ whatsappUrl }: SpeedSectionProps) {
  return (
    <section className="section-pad relative overflow-hidden">
      <div className="container-page">
        <Reveal
          variant="up"
          className="noise relative overflow-hidden rounded-[2rem] bg-brand-400 p-10 md:rounded-[2.75rem] md:p-16 lg:p-20"
        >
          <div
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 text-ink-950/10"
            aria-hidden="true"
          >
            <Cpu className="h-full w-full -rotate-12" strokeWidth={1} />
          </div>

          <div className="relative z-10 grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="display text-4xl text-ink-950 md:text-6xl">
                PC lento?
                <br />
                <span className="opacity-55 italic">Nós resolvemos.</span>
              </h2>

              <ul className="mt-9 space-y-4">
                {IMPROVEMENTS.map((item, i) => (
                  <Reveal
                    key={item}
                    as="li"
                    variant="left"
                    delay={i * 80}
                    className="flex items-center gap-3 text-base font-bold text-ink-950 md:text-lg"
                  >
                    <Zap className="h-5 w-5 shrink-0 fill-ink-950" />
                    {item}
                  </Reveal>
                ))}
              </ul>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-lg mt-10 bg-ink-950 text-white hover:bg-ink-800"
              >
                Falar com técnico
                <MessageCircle className="h-5 w-5" />
              </a>
            </div>

            <div className="hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                {STATS.map((stat, i) => (
                  <Reveal
                    key={stat.label}
                    variant="up"
                    delay={150 + i * 100}
                    className={
                      'rounded-3xl border border-ink-950/10 bg-ink-950/10 p-8 backdrop-blur-sm ' +
                      (i === 1 ? 'mt-8' : '')
                    }
                  >
                    <div className="text-4xl font-black text-ink-950 md:text-5xl">
                      {stat.value}
                    </div>
                    <div className="mt-2 text-xs font-black uppercase tracking-widest text-ink-950/55">
                      {stat.label}
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
