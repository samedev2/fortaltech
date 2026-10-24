import { CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react';
import { getServiceIcon } from '../../lib/icons';
import type { Service } from '../../lib/types';
import { Reveal } from '../ui/Reveal';
import { SectionHeading } from '../ui/SectionHeading';
import { ServiceCardSkeleton } from '../ui/Skeleton';

interface ServicesSectionProps {
  services: Service[];
  loading?: boolean;
  isAdmin?: boolean;
  onEditService?: (service: Service) => void;
  onDeleteService?: (service: Service) => void;
  onAddService?: () => void;
}

const BENEFITS = [
  'Atendimento em toda Fortaleza',
  'Garantia em todos os serviços',
  'Peças de primeira linha',
  'Orçamento rápido via WhatsApp',
];

export function ServicesSection({
  services,
  loading = false,
  isAdmin = false,
  onEditService,
  onDeleteService,
  onAddService,
}: ServicesSectionProps) {
  return (
    <section id="servicos" className="section-pad relative border-y border-white/5 bg-ink-900/40">
      <div className="container-page">
        <SectionHeading
          eyebrow={
            <span className="eyebrow border border-white/10 bg-white/5 text-white/60">
              O que fazemos
            </span>
          }
          title={
            <>
              Nossos <span className="text-brand-400">serviços</span>
            </>
          }
          description="Soluções completas para hardware e software. Do básico ao avançado, cuidamos da sua máquina com peças de primeira linha e garantia."
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading &&
            Array.from({ length: 6 }).map((_, i) => <ServiceCardSkeleton key={i} />)}

          {!loading &&
            services.map((service, i) => {
              const Icon = getServiceIcon(service.icon_name);
              return (
                <Reveal
                  key={service.id}
                  as="article"
                  variant="up"
                  delay={(i % 3) * 80}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/7 bg-white/[0.02] p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-400/30 hover:bg-white/[0.045]"
                >
                  {/* Hover glow */}
                  <div
                    className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-400/0 blur-3xl transition-all duration-500 group-hover:bg-brand-400/15"
                    aria-hidden="true"
                  />

                  <div className="relative flex items-start justify-between">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-400/20 bg-brand-400/10 text-brand-400 transition-transform duration-300 group-hover:scale-110 group-hover:border-brand-400/40">
                      <Icon className="h-8 w-8" strokeWidth={1.75} />
                    </div>
                    <span className="font-mono text-xs font-bold tracking-widest text-white/15">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <h3 className="relative mt-7 text-xl font-bold leading-snug tracking-tight text-white">
                    {service.title}
                  </h3>
                  <p className="relative mt-3 flex-1 text-sm leading-relaxed text-white/50">
                    {service.description}
                  </p>

                  {service.tags && service.tags.length > 0 && (
                    <div className="relative mt-6 flex flex-wrap gap-2">
                      {service.tags.map((tag, j) => (
                        <span
                          key={`${tag}-${j}`}
                          className="chip border border-white/8 bg-white/[0.04] text-white/45"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {isAdmin && (
                    <div className="relative mt-6 flex gap-2 border-t border-white/8 pt-5">
                      <button
                        type="button"
                        onClick={() => onEditService?.(service)}
                        className="btn btn-outline btn-sm flex-1"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteService?.(service)}
                        className="btn btn-danger btn-sm"
                        aria-label={`Excluir serviço ${service.title}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </Reveal>
              );
            })}

          {!loading && services.length === 0 && (
            <div className="col-span-full flex flex-col items-center rounded-3xl border border-dashed border-white/10 py-16 text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-white/25">
                Nenhum serviço cadastrado ainda.
              </p>
            </div>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={onAddService}
              className="flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-white/10 p-8 text-white/25 transition-all hover:border-brand-400/50 hover:text-brand-400"
            >
              <Plus className="h-10 w-10" />
              <span className="text-xs font-bold uppercase tracking-widest">
                Adicionar serviço
              </span>
            </button>
          )}
        </div>

        {/* Benefits */}
        <ul className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-white/8 bg-white/8 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((benefit, i) => (
            <Reveal
              key={benefit}
              as="li"
              variant="up"
              delay={i * 70}
              className="flex items-center gap-3 bg-ink-900 px-6 py-5"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-400" />
              <span className="text-sm font-semibold text-white/70">{benefit}</span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
