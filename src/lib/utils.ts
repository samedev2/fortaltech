/**
 * Formatting / small helpers shared across the UI.
 */

/** Merge conditional class names (no external dependency). */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** 4599.9 -> "R$ 4.599,90" */
export function formatBRL(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? parseFloat(value) : value;
  if (typeof n !== 'number' || Number.isNaN(n)) return 'R$ 0,00';
  return n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Strip everything that is not a digit. */
export function onlyDigits(value: string): string {
  return (value || '').replace(/\D/g, '');
}

/**
 * Progressive Brazilian phone mask.
 * "(85) 99991-0250" while typing, but tolerant of partial input.
 */
export function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Normalised digits, ready for a wa.me link. */
export function toWhatsAppNumber(value: string): string {
  return onlyDigits(value);
}

/**
 * Pretty Brazilian phone number for display.
 * "5585999910250" -> "(85) 99991-0250"
 */
export function formatPhoneBR(value: string): string {
  const d = onlyDigits(value);
  if (!d) return '';
  const local = d.startsWith('55') && d.length > 11 ? d.slice(2) : d;
  return maskPhone(local);
}

/** "2024-05-04T12:00:00Z" -> "04/05/2024" */
export function formatDateBR(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR');
}

/** "2024-05-04T12:00:00Z" -> "04/05/2024 às 09:00" */
export function formatDateTimeBR(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Human "há 3 dias" style label. */
export function timeAgoBR(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'agora mesmo';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `há ${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `há ${months} mês${months > 1 ? 'es' : ''}`;
  const years = Math.floor(months / 12);
  return `há ${years} ano${years > 1 ? 's' : ''}`;
}

/**
 * Split a free-form specs blob into short chips.
 * "16GB RAM, 512GB SSD" -> ["16GB RAM", "512GB SSD"]
 */
export function specChips(specs: string): string[] {
  return (specs || '')
    .split(/[,;\n•|]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6);
}

/** Very small validator used by the public contact form. */
export function validateContactForm(form: {
  name: string;
  whatsapp: string;
  service_type: string;
  message: string;
}): Partial<Record<keyof typeof form, string>> {
  const errors: Partial<Record<keyof typeof form, string>> = {};

  if (!form.name.trim()) {
    errors.name = 'Informe seu nome.';
  } else if (form.name.trim().length < 2) {
    errors.name = 'Nome muito curto.';
  }

  const digits = onlyDigits(form.whatsapp);
  if (!digits) {
    errors.whatsapp = 'Informe seu WhatsApp.';
  } else if (digits.length < 10) {
    errors.whatsapp = 'Telefone incompleto (DDD + número).';
  }

  if (!form.service_type || form.service_type === 'Selecione um serviço') {
    errors.service_type = 'Escolha um serviço.';
  }

  if (!form.message.trim()) {
    errors.message = 'Descreva o que você precisa.';
  } else if (form.message.trim().length < 10) {
    errors.message = 'Conte um pouco mais (mínimo 10 caracteres).';
  }

  return errors;
}
