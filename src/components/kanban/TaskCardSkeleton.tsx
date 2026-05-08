export function TaskCardSkeleton() {
  return (
    <div className="task-card animate-pulse">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-surface-2 rounded w-3/4" />
          <div className="h-3 bg-surface-2 rounded w-1/2" />
        </div>
        <div className="h-6 w-6 bg-surface-2 rounded" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-6 bg-surface-2 rounded-full w-16" />
        <div className="h-6 bg-surface-2 rounded-full w-16" />
      </div>
    </div>
  );
}