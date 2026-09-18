import Link from "next/link";
import { Sparkles, ArrowRight, CheckCircle2, ShieldCheck, Search, Kanban, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface LandingHeroProps {
  isAuthenticated?: boolean;
}

export function LandingHero({ isAuthenticated = false }: LandingHeroProps) {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-primary/5 blur-[120px] dark:bg-primary/10"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Top Feature Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-muted/60 px-3.5 py-1 text-xs font-medium text-foreground backdrop-blur-xs mb-6 hover:bg-muted transition-colors">
          <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
          <span>AI-Powered Project Intelligence • Production-Ready</span>
          <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-muted-foreground/40" />
          <span className="hidden sm:inline text-muted-foreground">v0.1.0</span>
        </div>

        {/* Primary Headline */}
        <h1 className="mx-auto max-w-4xl text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
          AI-Powered Project Intelligence for{" "}
          <span className="bg-gradient-to-r from-foreground via-foreground/80 to-muted-foreground bg-clip-text text-transparent">
            High-Velocity Teams
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
          Orchestrate complex engineering initiatives across 5 dynamic views, sync progress with
          live multi-tenant presence, and unlock context-aware intelligence with an integrated AI
          Copilot.
        </p>

        {/* CTA Button Group */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          {isAuthenticated ? (
            <Button asChild size="lg" className="w-full sm:w-auto gap-2 px-8 h-12 shadow-md">
              <Link href="/app">
                <span>Go to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg" className="w-full sm:w-auto gap-2 px-8 h-12 shadow-md">
                <Link href="/signup">
                  <span>Start for Free</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto h-12 px-6 border-border/80"
              >
                <Link href="/login">Explore Demo / Sign In</Link>
              </Button>
            </>
          )}
        </div>

        {/* Proof / Pillars Badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground font-medium">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>Supabase RLS Tenant Isolation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Kanban className="h-4 w-4 text-blue-500" />
            <span>5 Interactive Views</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-amber-500" />
            <span>Real-Time WebSocket Sync</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <span>Context-Aware AI Copilot</span>
          </div>
        </div>

        {/* Realistic Interactive UI Mockup */}
        <div className="mt-14 relative mx-auto max-w-5xl rounded-2xl border border-border/80 bg-card p-2 sm:p-3 shadow-2xl shadow-primary/5">
          {/* Window Chrome */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/60 bg-muted/30 rounded-t-xl">
            <div className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-full bg-rose-500/80" />
              <div className="h-3 w-3 rounded-full bg-amber-500/80" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
              <span className="ml-2 text-xs font-mono text-muted-foreground hidden sm:inline">
                nexora.app/app/acme-engineering
              </span>
            </div>

            {/* Mock Topbar Trigger & Presence Stack */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-background border border-border text-[10px] text-muted-foreground">
                <Search className="h-3 w-3" />
                <span>Search or jump to...</span>
                <kbd className="font-mono bg-muted px-1 rounded text-[9px]">⌘K</kbd>
              </div>

              {/* Online presence bubbles */}
              <div className="flex -space-x-1.5 items-center">
                <div className="relative h-6 w-6 rounded-full bg-indigo-500 text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-background">
                  JD
                  <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-emerald-400 ring-1 ring-background" />
                </div>
                <div className="relative h-6 w-6 rounded-full bg-emerald-500 text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-background">
                  AL
                  <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-emerald-400 ring-1 ring-background" />
                </div>
                <div className="h-6 w-6 rounded-full bg-purple-500 text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-background">
                  SC
                </div>
              </div>

              {/* Copilot Badge */}
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary text-primary-foreground text-[10px] font-medium shadow-xs">
                <Sparkles className="h-3 w-3" />
                <span className="hidden sm:inline">Copilot</span>
                <span className="font-mono text-[9px] opacity-70">⌘J</span>
              </div>
            </div>
          </div>

          {/* Mock Board Content */}
          <div className="p-4 sm:p-6 bg-background/50 rounded-b-xl text-left">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Core Infrastructure v2
                </h3>
                <p className="text-xs text-muted-foreground">Sprint 14 • 12 of 16 completed</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-muted/40 px-2.5 py-1 rounded-md">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Sync Active</span>
              </div>
            </div>

            {/* Mock 3-Column Kanban */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Column: To Do */}
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span>To Do</span>
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">1</span>
                </div>
                <div className="rounded-lg border border-border bg-card p-3 space-y-2 shadow-2xs hover:border-primary/40 transition-colors">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 text-amber-500 border-amber-500/30"
                    >
                      Medium
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">Oct 2</span>
                  </div>
                  <h4 className="text-xs font-semibold text-foreground">
                    Telemetry & Distributed Tracing
                  </h4>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    Connect OpenTelemetry exporters to the Next.js production cluster.
                  </p>
                </div>
              </div>

              {/* Column: In Progress */}
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span className="text-blue-500">In Progress</span>
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">2</span>
                </div>
                <div className="rounded-lg border border-border bg-card p-3 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 text-red-500 border-red-500/30"
                    >
                      Urgent
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">Sep 28</span>
                  </div>
                  <h4 className="text-xs font-semibold text-foreground">
                    Vector Embedding Memory Index
                  </h4>
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1 text-[10px] text-primary">
                      <Sparkles className="h-3 w-3" />
                      <span>Copilot Analyzed</span>
                    </div>
                    <div className="h-4 w-4 rounded-full bg-blue-500 text-[8px] font-bold text-white flex items-center justify-center">
                      AL
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-3 space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 text-indigo-500 border-indigo-500/30"
                    >
                      High
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">Sep 30</span>
                  </div>
                  <h4 className="text-xs font-semibold text-foreground">
                    Supabase RLS Compound Foreign Keys
                  </h4>
                </div>
              </div>

              {/* Column: Done */}
              <div className="rounded-xl border border-border/70 bg-muted/20 p-3 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                  <span className="text-emerald-500">Done</span>
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px]">12</span>
                </div>
                <div className="rounded-lg border border-border bg-card p-3 space-y-2 shadow-2xs opacity-85">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-emerald-500 text-[10px] font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Completed</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">Today</span>
                  </div>
                  <h4 className="text-xs font-semibold text-foreground line-through opacity-75">
                    Command Palette & Global Hotkeys
                  </h4>
                  <p className="text-[10px] text-muted-foreground">Passed all automated tests</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
