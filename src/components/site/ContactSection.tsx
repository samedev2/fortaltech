import { useState, type FormEvent } from 'react';
import { CheckCircle2, Clock, MapPin, Phone, Send } from 'lucide-react';
import { TextArea, TextInput, SelectField } from '../ui/Field';
import { Reveal } from '../ui/Reveal';
import { SectionHeading } from '../ui/SectionHeading';
import { useToast } from '../ui/Toast';
import { formatPhoneBR, maskPhone, onlyDigits, validateContactForm } from '../../lib/utils';
import type { ContactFormState, Service } from '../../lib/types';
import { EMPTY_CONTACT_FORM } from '../../lib/types';

interface ContactSectionProps {
  services: Service[];
  whatsappNumber: string;
  onSubmit: (form: ContactFormState) => Promise<void>;
}

const INFO = [
  {
    icon: MapPin,
    title: 'Onde estamos',
    lines: ['Fortaleza, CE', 'Atendimento em domicílio e laboratório próprio.'],
  },
  {
    icon: Clock,
    title: 'Horário',
    lines: ['Segunda a sábado', 'Das 08h às 18h'],
  },
  {
    icon: Phone,
    title: 'Contato direto',
    lines: ['WhatsApp', '(85) 99991-0250'],
  },
];

export function ContactSection({
  services,
  whatsappNumber,
  onSubmit,
}: ContactSectionProps) {
  const toast = useToast();
  const [form, setForm] = useState<ContactFormState>(EMPTY_CONTACT_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const update = (key: keyof ContactFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validation = validateContactForm(form);
    setErrors(validation);

    if (Object.keys(validation).length > 0) {
      // Move focus to the first invalid field for keyboard / screen-reader users.
      const firstKey = Object.keys(validation)[0];
      document.getElementById(`field-${firstKey}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(form);
      setForm(EMPTY_CONTACT_FORM);
      setSent(true);
      toast.success('Mensagem enviada!', 'Respondemos pelo WhatsApp em breve.');
      window.setTimeout(() => setSent(false), 6000);
    } catch (error) {
      toast.error(
        'Não foi possível enviar',
        error instanceof Error ? error.message : 'Tente novamente em instantes.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contato" className="section-pad relative overflow-hidden">
      <div
        className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-accent-600/8 blur-[130px]"
        aria-hidden="true"
      />

      <div className="container-page">
        <SectionHeading
          eyebrow={
            <span className="eyebrow border border-white/10 bg-white/5 text-white/60">
              Fale com a gente
            </span>
          }
          title={
            <>
              Onde <span className="text-brand-400">estamos</span>
            </>
          }
          description="Preencha o formulário ou chame no WhatsApp. Respondemos com um orçamento rápido."
        />

        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
          {/* Info column */}
          <div className="space-y-5">
            {INFO.map((item, i) => {
              const Icon = item.icon;
              return (
                <Reveal
                  key={item.title}
                  variant="left"
                  delay={i * 80}
                  className="flex gap-4 rounded-2xl border border-white/7 bg-white/[0.02] p-6"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-brand-400/20 bg-brand-400/10 text-brand-400">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="mb-1 text-base font-bold text-white">{item.title}</h3>
                    {item.lines.map((line) => (
                      <p key={line} className="text-sm leading-relaxed text-white/45">
                        {line}
                      </p>
                    ))}
                  </div>
                </Reveal>
              );
            })}

            <div className="rounded-2xl border border-brand-400/20 bg-brand-400/[0.06] p-6">
              <p className="text-sm font-semibold leading-relaxed text-white/70">
                Prefere resolver agora? Chame no WhatsApp e resolva na hora.
              </p>
              <a
                href={`https://wa.me/${onlyDigits(whatsappNumber)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-md mt-5"
              >
                <Phone className="h-4 w-4" />
                {formatPhoneBR(whatsappNumber)}
              </a>
            </div>
          </div>

          {/* Form */}
          <Reveal
            variant="up"
            className="rounded-[2rem] border border-white/8 bg-ink-850/70 p-7 md:p-9"
          >
            <h3 className="text-xl font-bold tracking-tight text-white">
              Envie uma mensagem
            </h3>
            <p className="mt-1.5 text-sm text-white/45">
              Campos com <span className="text-brand-400">*</span> são obrigatórios.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <TextInput
                  name="name"
                  label="Nome"
                  required
                  autoComplete="name"
                  placeholder="Seu nome"
                  value={form.name}
                  error={errors.name}
                  onChange={(e) => update('name', e.target.value)}
                />
                <TextInput
                  name="whatsapp"
                  label="WhatsApp"
                  required
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="(85) 99999-0000"
                  value={form.whatsapp}
                  error={errors.whatsapp}
                  onChange={(e) => update('whatsapp', maskPhone(e.target.value))}
                />
              </div>

              <SelectField
                name="service_type"
                label="Serviço"
                required
                value={form.service_type}
                error={errors.service_type}
                onChange={(e) => update('service_type', e.target.value)}
              >
                <option value="Selecione um serviço">Selecione um serviço</option>
                {services.map((s) => (
                  <option key={s.id} value={s.title}>
                    {s.title}
                  </option>
                ))}
                <option value="Outros">Outro serviço</option>
              </SelectField>

              <TextArea
                name="message"
                label="Mensagem"
                required
                rows={5}
                placeholder="Descreva o que você precisa: modelo da máquina, sintomas, urgência..."
                value={form.message}
                error={errors.message}
                hint={`${form.message.length}/500 caracteres`}
                onChange={(e) => update('message', e.target.value.slice(0, 500))}
              />

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary btn-lg w-full"
              >
                {sent ? (
                  <>
                    <CheckCircle2 className="h-5 w-5" />
                    Mensagem enviada!
                  </>
                ) : submitting ? (
                  'Enviando...'
                ) : (
                  <>
                    Enviar solicitação
                    <Send className="h-4 w-4" />
                  </>
                )}
              </button>

              <p className="text-center text-xs leading-relaxed text-white/30">
                Seus dados são usados apenas para responder a sua solicitação.
              </p>
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
