import Link from "next/link";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

interface LandingCtaProps {
  isAuthenticated?: boolean;
}

export function LandingCta({ isAuthenticated = false }: LandingCtaProps) {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Background glowing gradients */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-96 w-[45rem] rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="max-w-4xl mx-auto rounded-3xl border border-primary/30 bg-gradient-to-b from-card/80 via-card/50 to-background/80 backdrop-blur-md p-8 sm:p-12 md:p-16 text-center shadow-2xl relative overflow-hidden">
          {/* Subtle top accent line */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/15 text-primary border border-primary/30 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            Zero-Friction Onboarding
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            Accelerate your engineering execution today.
          </h2>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Provision your secure, multi-tenant workspace in under 30 seconds. Collaborate in real
            time with 5 synchronized views and context-aware AI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            {isAuthenticated ? (
              <Link
                href="/app"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Go to Workspace Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Create Workspace
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold bg-card hover:bg-muted text-foreground border border-border transition-all"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              PostgreSQL RLS Sandboxing
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
              Instant multi-tenant provisioning
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
