export default function WorkspaceLoading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading workspace content">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-muted/70" />
            <div className="h-7 w-48 rounded bg-muted/70" />
            <div className="h-5 w-16 rounded bg-muted/50" />
          </div>
          <div className="h-4 w-72 rounded bg-muted/40" />
        </div>
        <div className="h-9 w-32 rounded bg-muted/60" />
      </div>

      {/* Cards row skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-28 rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
          <div className="h-3 w-24 rounded bg-muted/60" />
          <div className="h-6 w-16 rounded bg-muted/80" />
          <div className="h-2.5 w-32 rounded bg-muted/40" />
        </div>
        <div className="h-28 rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
          <div className="h-3 w-24 rounded bg-muted/60" />
          <div className="h-6 w-16 rounded bg-muted/80" />
          <div className="h-2.5 w-32 rounded bg-muted/40" />
        </div>
        <div className="h-28 rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
          <div className="h-3 w-24 rounded bg-muted/60" />
          <div className="h-6 w-16 rounded bg-muted/80" />
          <div className="h-2.5 w-32 rounded bg-muted/40" />
        </div>
        <div className="h-28 rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
          <div className="h-3 w-24 rounded bg-muted/60" />
          <div className="h-6 w-16 rounded bg-muted/80" />
          <div className="h-2.5 w-32 rounded bg-muted/40" />
        </div>
      </div>

      {/* Main content block skeleton */}
      <div className="h-80 rounded-xl border border-border/60 bg-muted/15 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-40 rounded bg-muted/60" />
          <div className="h-4 w-20 rounded bg-muted/40" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 pt-2">
          <div className="h-44 rounded-lg bg-muted/25 border border-border/40" />
          <div className="h-44 rounded-lg bg-muted/25 border border-border/40" />
          <div className="h-44 rounded-lg bg-muted/25 border border-border/40" />
        </div>
      </div>
    </div>
  );
}
