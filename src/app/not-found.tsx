import Link from "next/link";
import { Sparkles, LayoutDashboard, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground selection:bg-primary/20 selection:text-primary relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

      <div className="w-full max-w-lg rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-8 sm:p-10 shadow-2xl text-center relative z-10">
        {/* Brand Icon & Error Badge */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/20 mb-4">
          <span>Error 404 • Resource Not Found</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3">
          Page not found
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-8">
          The requested page or workspace resource could not be found. It may have been moved,
          deleted, or you might not have access permissions.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <Link
            href="/app"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Go to Dashboard</span>
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-muted/60 hover:bg-muted text-foreground border border-border/80 transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Return Home</span>
          </Link>
        </div>

        {/* Keyboard shortcut tip */}
        <div className="pt-6 border-t border-border/50 text-xs text-muted-foreground flex items-center justify-center gap-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-foreground font-mono text-[11px] font-bold">
            ⌘K
          </kbd>
          <span>anywhere to navigate projects</span>
        </div>
      </div>
    </div>
  );
}
