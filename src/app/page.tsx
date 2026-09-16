export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-sm text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground mb-6">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
          <span>Foundation initialized</span>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-foreground">NEXORA</h1>

        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          AI-powered project intelligence platform.
        </p>
      </div>
    </main>
  );
}
