import { ArrowRight, CheckCircle2, Gamepad2, Zap } from 'lucide-react';
import { Reveal } from '../ui/Reveal';

interface EgpuSectionProps {
  whatsappUrl: string;
}

const FEATURES = [
  {
    title: 'Kit eGPU próprio',
    text: 'Box especializada para conexão de alto desempenho, pronta para uso.',
  },
  {
    title: 'Compatibilidade total',
    text: 'Use qualquer placa de vídeo NVIDIA ou AMD no seu notebook atual.',
  },
  {
    title: 'Economia inteligente',
    text: 'Desempenho de PC gamer sem investir em um notebook novo e caro.',
  },
];

export function EgpuSection({ whatsappUrl }: EgpuSectionProps) {
  return (
    <section className="section-pad relative overflow-hidden bg-gradient-to-b from-ink-950 to-ink-900">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute -right-32 top-1/4 h-96 w-96 rounded-full bg-accent-600/12 blur-[120px]" />
      </div>

      <div className="container-page">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-20">
          <Reveal variant="left" className="order-2 lg:order-1">
            <span className="eyebrow mb-6 border border-accent-500/25 bg-accent-500/10 text-accent-300">
              <Zap className="h-3.5 w-3.5" />
              Exclusividade Fortal Tech
            </span>

            <h2 className="display text-4xl uppercase text-balance md:text-6xl">
              Transforme seu notebook em um{' '}
              <span className="text-accent-400">monstro gamer</span>
            </h2>

            <p className="mt-7 text-lg leading-relaxed text-white/60">
              Não precisa trocar de notebook! Com nosso kit próprio de{' '}
              <strong className="font-bold text-white">Placa de Vídeo Externa (eGPU)</strong>,
              você conecta qualquer GPU de desktop ao seu notebook atual.
            </p>

            <ul className="mt-10 space-y-6">
              {FEATURES.map((feature, i) => (
                <Reveal
                  key={feature.title}
                  as="li"
                  variant="up"
                  delay={i * 100}
                  className="flex gap-4"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-accent-500/20 bg-accent-500/10 text-accent-400">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">{feature.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/45">
                      {feature.text}
                    </p>
                  </div>
                </Reveal>
              ))}
            </ul>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-lg mt-10 bg-accent-600 text-white hover:bg-accent-500"
            >
              Quero meu notebook gamer
              <ArrowRight className="h-5 w-5" />
            </a>
          </Reveal>

          <Reveal variant="scale" className="relative order-1 lg:order-2">
            <div className="relative z-10 overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl shadow-accent-600/20">
              <img
                src="https://images.unsplash.com/photo-1593642702821-c8da6771f0c6?q=80&w=1000&auto=format&fit=crop"
                alt="Notebook conectado a uma placa de vídeo externa eGPU em ambiente gamer"
                className="aspect-[4/3] w-full object-cover grayscale transition-all duration-700 hover:grayscale-0"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6">
                <span className="inline-flex items-center gap-2 rounded-lg bg-accent-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white">
                  <Gamepad2 className="h-4 w-4" />
                  eGPU Power
                </span>
              </div>
            </div>

            <div
              className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent-500/20 blur-[80px]"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-brand-500/10 blur-[80px]"
              aria-hidden="true"
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
