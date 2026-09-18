import { ShieldCheck, LayoutGrid, Users, Sparkles, Command, Zap, CheckCircle2 } from "lucide-react";

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  title: string;
  description: string;
  highlights: string[];
}

const features: FeatureCardProps[] = [
  {
    icon: ShieldCheck,
    badge: "Zero-Trust Architecture",
    title: "Multi-Tenant Row-Level Security",
    description:
      "Every workspace query is isolated at the PostgreSQL kernel level using Supabase RLS. No data leakage, strict tenant sandboxing, and role-based access control.",
    highlights: [
      "PostgreSQL RLS policies on all tables",
      "Owner, Admin, Member & Viewer granular roles",
      "Secure SSR session validation via Supabase SSR",
    ],
  },
  {
    icon: LayoutGrid,
    badge: "5 Cohesive Views",
    title: "Dynamic Project Perspectives",
    description:
      "Switch instantly between Kanban, Table, Calendar, Timeline, and List views with persistent filter criteria, sort states, and real-time synchronization.",
    highlights: [
      "Fluid drag-and-drop Kanban with persisted ordering",
      "Spreadsheet-grade editable Table with column sorting",
      "Gantt-style Timeline and interactive monthly Calendar",
    ],
  },
  {
    icon: Users,
    badge: "Real-Time Collaboration",
    title: "Live Presence & Instant Broadcast",
    description:
      "Experience synchronized workflows with presence indicators, optimistic updates, and real-time project activity feeds powered by Supabase Realtime.",
    highlights: [
      "Live active collaborator presence bubbles",
      "Instant WebSocket broadcast of task status & priority",
      "Audit-logged activity feed with actor attribution",
    ],
  },
  {
    icon: Sparkles,
    badge: "Intelligent Assistant",
    title: "Context-Aware In-App AI Copilot",
    description:
      "Query project health, draft tasks from meeting transcripts, predict delivery bottlenecks, and get instant recommendations directly inside your workspace.",
    highlights: [
      "Instant workspace & project context grounding",
      "Deep task analysis & breakdown suggestions",
      "Universal keyboard shortcut (⌘J / Ctrl+J) summon",
    ],
  },
];

export function LandingFeatures() {
  return (
    <section
      id="features"
      className="relative border-b border-border/50 py-24 md:py-32 overflow-hidden"
    >
      {/* Background ambient accents */}
      <div className="pointer-events-none absolute -top-40 right-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 mb-4">
            <Zap className="h-3.5 w-3.5" />
            Core Value Pillars
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            Engineered for velocity. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Locked down for enterprise.
            </span>
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
            NEXORA replaces fragmented tools with a single, high-performance platform. Every
            layer—from database policies to client rendering—is built for scale.
          </p>
        </div>

        {/* 4 Main Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-16">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-2xl border border-border/70 bg-card/50 backdrop-blur-xs p-8 transition-all duration-300 hover:border-primary/50 hover:bg-card/80 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-105 transition-transform">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-muted text-muted-foreground border border-border/50">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6">
                    {feature.description}
                  </p>
                </div>

                <div className="pt-5 border-t border-border/40">
                  <ul className="space-y-2.5 text-xs md:text-sm text-muted-foreground">
                    {feature.highlights.map((item, hIdx) => (
                      <li key={hIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Command-first banner highlight */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-card/50 to-primary/5 p-8 md:p-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
              <Command className="h-3.5 w-3.5" />
              Keyboard-First Productivity
            </div>
            <h4 className="text-xl md:text-2xl font-bold text-foreground">
              Operate at the speed of thought with universal keybindings
            </h4>
            <p className="text-sm text-muted-foreground max-w-xl">
              Launch projects, switch views, triage tasks, or trigger Copilot without your hands
              leaving the home row. Press{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-foreground font-mono text-xs">
                ⌘K
              </kbd>{" "}
              anywhere.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/80 border border-border/80 text-xs font-mono shadow-xs">
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground font-bold">⌘K</kbd>
              <span className="text-muted-foreground">Command Menu</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/80 border border-border/80 text-xs font-mono shadow-xs">
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground font-bold">⌘J</kbd>
              <span className="text-muted-foreground">AI Copilot</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background/80 border border-border/80 text-xs font-mono shadow-xs">
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground font-bold">C</kbd>
              <span className="text-muted-foreground">Create Task</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
