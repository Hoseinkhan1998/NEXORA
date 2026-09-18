"use client";

import { useState } from "react";
import { Sparkles, Bot, CheckCircle2, ArrowRight, ListPlus, ShieldCheck, Zap } from "lucide-react";

type CapabilityKey = "risk" | "breakdown" | "query";

interface Capability {
  key: CapabilityKey;
  label: string;
  badge: string;
  title: string;
  description: string;
  prompt: string;
  response: {
    status: string;
    headline: string;
    points: string[];
    actionLabel?: string;
  };
}

const capabilities: Capability[] = [
  {
    key: "risk",
    label: "Sprint Risk Prediction",
    badge: "Predictive Analytics",
    title: "Proactively flag milestone slippage before release day",
    description:
      "Copilot continuously evaluates task completion velocity, unassigned critical bugs, and due date proximity to forecast delivery bottlenecks.",
    prompt: "Analyze current sprint risks and highlight tasks blocking the v1.2 release milestone.",
    response: {
      status: "Risk Level: Moderate",
      headline: "2 Critical Path Blockers Detected",
      points: [
        "NX-112 (RLS custom fields audit) is marked Urgent with due date in 24 hours.",
        "Sprint velocity is currently at 78% of target capacity with 4 unassigned backlog items.",
        "Recommendation: Reassign research spike NX-104 to balance Marcus's workload.",
      ],
      actionLabel: "Automate Reassignment",
    },
  },
  {
    key: "breakdown",
    label: "Task Decomposition",
    badge: "Engineering Workflow",
    title: "Convert architectural specs into structured task graphs",
    description:
      "Type a high-level feature requirement and let Copilot generate prioritized, tagged, and estimated tasks ready to inject into your Kanban board.",
    prompt:
      "Decompose 'Implement token-bucket rate limiting for public REST endpoints' into subtasks.",
    response: {
      status: "Generated 3 Subtasks",
      headline: "Structured Engineering Breakdown",
      points: [
        "[High] Create sliding-window rate limit utility in src/lib/security (Est: 2h)",
        "[High] Attach IP-based rate limiter middleware to /api/projects and /api/notifications (Est: 1h)",
        "[Normal] Author Vitest unit tests verifying window expiry and burst tolerances (Est: 1.5h)",
      ],
      actionLabel: "Add Tasks to Kanban",
    },
  },
  {
    key: "query",
    label: "Natural Language Triage",
    badge: "Instant Context",
    title: "Query your workspace without writing SQL or complex filters",
    description:
      "Ask questions in natural language. Copilot searches project states, task assignees, and activity feeds to give instant, grounded answers.",
    prompt:
      "Who has the highest workload in the frontend sprint, and what are their active blockers?",
    response: {
      status: "Query Result: 1 Team Member",
      headline: "Workload Distribution Summary",
      points: [
        "Alex K. is currently assigned 5 active tasks across Kanban columns.",
        "Active blocker: Waiting on design sign-off for timeline sprint milestone markers (#NX-108).",
        "Suggested rebalance: Transfer 2 medium-priority tasks to Elena V.",
      ],
      actionLabel: "Open Workload Chart",
    },
  },
];

export function LandingIntelligence() {
  const [activeTab, setActiveTab] = useState<CapabilityKey>("risk");
  const current = capabilities.find((c) => c.key === activeTab) || capabilities[0]!;

  return (
    <section
      id="intelligence"
      className="relative border-b border-border/50 py-24 md:py-32 overflow-hidden bg-background"
    >
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-primary/10 blur-[130px]" />

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Section Heading */}
        <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Context-Aware AI Engine
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            Project intelligence that actually <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              understands your codebase & velocity.
            </span>
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed">
            NEXORA’s integrated AI Copilot (⌘J) doesn’t just chat. It analyzes active task models,
            detects delivery bottlenecks, and generates actionable project breakdowns with
            prompt-injection defense.
          </p>
        </div>

        {/* 3 Capability Selector Pills */}
        <div className="flex items-center justify-start md:justify-center overflow-x-auto pb-4 mb-10 scrollbar-none gap-2">
          {capabilities.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-semibold"
                    : "bg-card/70 hover:bg-card text-muted-foreground hover:text-foreground border border-border/60"
                }`}
              >
                <Bot
                  className={`h-4 w-4 ${isActive ? "text-primary-foreground" : "text-primary"}`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Interactive Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch max-w-6xl mx-auto">
          {/* Left Column: Feature Highlights */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                {current.badge}
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                {current.title}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {current.description}
              </p>
            </div>

            <div className="space-y-3 pt-4 border-t border-border/60">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Bounded Token Grounding (&lt; 2,500 tokens)</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>Sub-second streaming responses via OpenAI API</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Prompt-injection sanitization & XML isolation</span>
              </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-foreground">Universal Copilot Trigger</div>
                <div className="text-xs text-muted-foreground">Press from anywhere in NEXORA</div>
              </div>
              <kbd className="px-2.5 py-1 rounded bg-muted border border-border text-foreground font-mono text-xs font-bold shadow-xs">
                ⌘J
              </kbd>
            </div>
          </div>

          {/* Right Column: Live Chat Interface Simulation */}
          <div className="lg:col-span-7 rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden flex flex-col justify-between">
            {/* Window Header */}
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-destructive/60" />
                <span className="h-3 w-3 rounded-full bg-amber-500/60" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/60" />
                <span className="text-muted-foreground font-mono ml-2 font-medium">
                  NEXORA AI Copilot • Project Assistant
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-mono text-[11px] font-semibold">
                Context Grounded
              </span>
            </div>

            {/* Conversation Flow */}
            <div className="p-5 sm:p-6 space-y-4 flex-1">
              {/* User Message */}
              <div className="flex items-start justify-end gap-3">
                <div className="rounded-2xl rounded-tr-xs bg-primary text-primary-foreground p-3.5 text-xs sm:text-sm max-w-md shadow-xs">
                  {current.prompt}
                </div>
              </div>

              {/* Copilot Response Card */}
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/15 text-primary border border-primary/20 shrink-0 mt-1">
                  <Sparkles className="h-4 w-4" />
                </div>

                <div className="space-y-3 rounded-2xl rounded-tl-xs border border-border/60 bg-muted/30 p-4 sm:p-5 text-xs sm:text-sm flex-1">
                  <div className="flex items-center justify-between pb-2 border-b border-border/40">
                    <span className="font-bold text-foreground text-xs uppercase tracking-wider">
                      {current.response.headline}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-medium text-[11px]">
                      {current.response.status}
                    </span>
                  </div>

                  <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                    {current.response.points.map((point, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>

                  {current.response.actionLabel && (
                    <div className="pt-2">
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs transition-colors cursor-pointer">
                        <ListPlus className="h-3.5 w-3.5" />
                        <span>{current.response.actionLabel}</span>
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Input Bar Mockup */}
            <div className="p-3 border-t border-border/60 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-mono text-[11px] truncate">
                Ask Copilot anything about active tasks, blockers, or sprints...
              </span>
              <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border font-mono text-[10px]">
                Return ↵
              </kbd>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
