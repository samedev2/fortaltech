import {
  Monitor,
  Laptop,
  Settings,
  Zap,
  Cpu,
  HardDrive,
  Gamepad2,
  Wrench,
  ShieldCheck,
  MemoryStick,
  Fan,
  Database,
  Server,
  CircuitBoard,
  Sparkles,
  Palette,
  Gauge,
  type LucideIcon,
} from 'lucide-react';

/**
 * Registry of icons a service can be assigned to from the admin panel.
 * Keys match the `icon_name` column stored in Supabase, so the values
 * here must stay stable — renaming a key orphans existing records.
 */
export const serviceIcons: Record<string, LucideIcon> = {
  Monitor,
  Laptop,
  Settings,
  Zap,
  Cpu,
  HardDrive,
  Gamepad2,
  Wrench,
  ShieldCheck,
  MemoryStick,
  Fan,
  Database,
  Server,
  CircuitBoard,
  Sparkles,
  Palette,
  Gauge,
};

/** Human readable labels for the admin icon picker. */
export const serviceIconLabels: Record<string, string> = {
  Monitor: 'Monitor / Desktop',
  Laptop: 'Notebook',
  Settings: 'Configurações',
  Zap: 'Energia / Performance',
  Cpu: 'Processador',
  HardDrive: 'Armazenamento',
  Gamepad2: 'Games',
  Wrench: 'Ferramentas / Reparo',
  ShieldCheck: 'Segurança',
  MemoryStick: 'Memória RAM',
  Fan: 'Refrigeração',
  Database: 'Banco de Dados',
  Server: 'Servidor',
  CircuitBoard: 'Placa Mãe',
  Sparkles: 'Premium',
  Palette: 'Design',
  Gauge: 'Performance',
};

export function getServiceIcon(name?: string | null): LucideIcon {
  return serviceIcons[name ?? ''] ?? Monitor;
}

/** The brand mark — a CPU die with a subtle pulse. */
export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <span
      className={`relative inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-300 via-brand-400 to-brand-600 text-ink-950 shadow-lg shadow-brand-500/25 ${className}`}
      aria-hidden="true"
    >
      <Cpu className="h-[55%] w-[55%]" strokeWidth={2.5} />
    </span>
  );
}
