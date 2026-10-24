import { cn } from '../../lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-xl bg-gradient-to-r from-white/[0.04] via-white/[0.09] to-white/[0.04]',
        className,
      )}
      aria-hidden="true"
    />
  );
}

/** Placeholder that mirrors the notebook card layout while data loads. */
export function NotebookCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/7 bg-ink-850/50">
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="space-y-4 p-7">
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-end justify-between pt-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-32" />
          </div>
          <Skeleton className="h-12 w-12 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="rounded-3xl border border-white/7 bg-white/[0.02] p-8">
      <Skeleton className="mb-6 h-16 w-16 rounded-2xl" />
      <Skeleton className="mb-3 h-6 w-2/3" />
      <Skeleton className="mb-2 h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  );
}
