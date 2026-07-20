export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border-[1.5px] border-ink bg-surface-muted p-4 ${className}`}
      aria-hidden
    >
      <div className="h-5 w-2/3 rounded bg-white" />
      <div className="mt-3 h-3 w-1/3 rounded bg-white" />
      <div className="mt-6 h-10 rounded-xl bg-white" />
      <div className="mt-4 h-3 w-full rounded-full bg-white" />
    </div>
  );
}
