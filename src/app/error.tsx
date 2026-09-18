"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard, Home } from "lucide-react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log error to monitoring/reporting service in production without exposing sensitive credentials
    console.error("[NEXORA Error Boundary]", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-foreground selection:bg-primary/20 selection:text-primary relative overflow-hidden">
      {/* Background ambient accent */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-destructive/10 blur-3xl" />

      <div className="w-full max-w-lg rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-8 sm:p-10 shadow-2xl text-center relative z-10">
        {/* Warning Icon */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 shadow-xs">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/20 mb-4">
          <span>Application Exception</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-3">
          Something went wrong
        </h1>

        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
          An unexpected error occurred while processing this view. State has been preserved to
          prevent data loss. You can retry the operation or return to your dashboard.
        </p>

        {error.digest && (
          <div className="mb-6 p-2.5 rounded-lg bg-muted/50 border border-border/60 text-xs font-mono text-muted-foreground break-all">
            Reference ID: <span className="text-foreground font-semibold">{error.digest}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/app"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-muted/60 hover:bg-muted text-foreground border border-border/80 transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Go to Dashboard</span>
          </Link>
        </div>

        <div className="pt-6 border-t border-border/50 text-xs text-muted-foreground">
          <Link
            href="/"
            className="hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Return to NEXORA Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
