import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface SectionHeadingProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  action?: ReactNode;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'left',
  action,
  className,
}: SectionHeadingProps) {
  const centered = align === 'center';

  return (
    <div
      className={cn(
        'mb-12 flex flex-col gap-6 md:mb-16',
        !centered && action && 'md:flex-row md:items-end md:justify-between',
        centered && 'items-center text-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl', centered && 'mx-auto')}>
        {eyebrow && (
          <div className="mb-5 flex justify-center md:justify-start">{eyebrow}</div>
        )}
        <h2 className="display text-4xl uppercase md:text-6xl">{title}</h2>
        {description && (
          <p className="mt-5 text-base leading-relaxed text-white/50 md:text-lg">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
