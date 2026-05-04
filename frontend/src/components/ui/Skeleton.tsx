import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton animate-shimmer', className)} style={{ backgroundSize: '200% 100%' }} />;
}

export default Skeleton;

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('glass p-6 space-y-3', className)}>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-[rgba(99,102,241,0.06)]">
      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass overflow-hidden">
      <div className="h-12 bg-surface-700/40 border-b border-[rgba(99,102,241,0.1)] flex items-center px-4 gap-6">
        {[80, 120, 60, 100, 70].map((w, i) => (
          <Skeleton key={i} className={`h-3 w-${w}`} style={{ width: `${w}px` }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

export function SkeletonProfile() {
  return (
    <div className="space-y-6">
      <div className="glass p-6 flex items-center gap-6">
        <Skeleton className="w-20 h-20 rounded-2xl flex-shrink-0" />
        <div className="space-y-3 flex-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>
      <div className="glass p-6 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
