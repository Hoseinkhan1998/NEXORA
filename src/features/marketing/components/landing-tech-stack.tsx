import { Database, Code2, Palette, CheckCheck, ShieldAlert, Server, Cpu } from "lucide-react";

interface TechItem {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  category: string;
  description: string;
  tech: string;
}

const techCards: TechItem[] = [
  {
    icon: Server,
    category: "Framework & SSR",
    title: "Next.js 16 App Router",
    tech: "React 19 • Server Components • Turbopack",
    description:
      "Full server-side rendering with streaming boundaries, granular layout caching, and lightning-fast route transitions.",
  },
  {
    icon: Database,
    category: "Data & Security",
    title: "Supabase & PostgreSQL RLS",
    tech: "PostgreSQL • Row-Level Security • Realtime",
    description:
      "True multi-tenancy enforced at the database kernel. Queries automatically sandbox data by tenant without cross-workspace risk.",
  },
  {
    icon: Code2,
    category: "Type Safety",
    title: "TypeScript 5 Strict Mode",
    tech: "100% Typed • Zero `any` • Zod Schemas",
    description:
      "End-to-end type guarantees from Supabase database tables to React view models and server action payloads.",
  },
  {
    icon: Palette,
    category: "Design System",
    title: "Tailwind CSS v4 & Tokens",
    tech: "CSS Variables • Dark Mode • Accessible Components",
    description:
      "Handcrafted design tokens, silky smooth contrast modes, and zero-runtime CSS footprint with sub-millisecond styling.",
  },
  {
    icon: CheckCheck,
    category: "Automated QA",
    title: "Vitest & Comprehensive Testing",
    tech: "87+ Automated Tests • 12 Suites • 100% Pass",
    description:
      "Robust test coverage covering permissions, multi-tenancy isolation, AI tool calling, command palette, and critical UX flows.",
  },
  {
    icon: ShieldAlert,
    category: "Application Security",
    title: "Production Defense-in-Depth",
    tech: "Token Bucket Rate Limiting • CSP • Sanitization",
    description:
      "Sliding-window IP and user rate limiting, strict Content Security Policy, and automated input hygiene on every endpoint.",
  },
];

export function LandingTechStack() {
  return (
    <section
      id="architecture"
      className="relative border-b border-border/50 py-24 md:py-32 overflow-hidden"
    >
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Section Heading */}
        <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 mb-4">
            <Cpu className="h-3.5 w-3.5" />
            Engineering Standards
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            Crafted for engineers who value <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              architectural integrity.
            </span>
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            No toy abstractions. NEXORA is built on a resilient, enterprise-ready foundation
            adhering to rigorous software engineering best practices.
          </p>
        </div>

        {/* Tech Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {techCards.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-border/70 bg-card/40 backdrop-blur-xs p-6 flex flex-col justify-between hover:border-primary/40 hover:bg-card/70 transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-1">{item.title}</h3>
                  <div className="text-xs font-mono text-primary font-medium mb-3">{item.tech}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Engineering Metrics Counter */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-center">
          <div className="p-6 rounded-xl border border-border/60 bg-card/30 backdrop-blur-xs">
            <div className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              100%
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">
              TypeScript Strict Mode
            </div>
          </div>

          <div className="p-6 rounded-xl border border-border/60 bg-card/30 backdrop-blur-xs">
            <div className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              87+
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">
              Automated Tests Passing
            </div>
          </div>

          <div className="p-6 rounded-xl border border-border/60 bg-card/30 backdrop-blur-xs">
            <div className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              0 Leakage
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">
              PostgreSQL RLS Sandboxing
            </div>
          </div>

          <div className="p-6 rounded-xl border border-border/60 bg-card/30 backdrop-blur-xs">
            <div className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              &lt; 50ms
            </div>
            <div className="text-xs text-muted-foreground mt-1 font-medium">
              Realtime Sync Latency
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
