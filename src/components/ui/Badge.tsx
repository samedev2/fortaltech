import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

type Tone = 'brand' | 'accent' | 'danger' | 'warning' | 'neutral' | 'success';

const TONES: Record<Tone, string> = {
  brand: 'bg-brand-400/12 text-brand-300 border-brand-400/25',
  accent: 'bg-accent-500/12 text-accent-300 border-accent-500/25',
  danger: 'bg-red-500/12 text-red-400 border-red-500/25',
  warning: 'bg-orange-500/12 text-orange-400 border-orange-500/25',
  neutral: 'bg-white/5 text-white/60 border-white/10',
  success: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/25',
};

interface BadgeProps {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'neutral', icon, children, className }: BadgeProps) {
  return (
    <span className={cn('chip border', TONES[tone], className)}>
      {icon}
      {children}
    </span>
  );
}
