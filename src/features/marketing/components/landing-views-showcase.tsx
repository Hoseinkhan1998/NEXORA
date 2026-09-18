"use client";

import { useState } from "react";
import {
  Kanban,
  Table as TableIcon,
  Calendar as CalendarIcon,
  Clock,
  ListTodo,
  CheckCircle2,
  Sparkles,
  Flame,
  User,
} from "lucide-react";

type ViewKey = "kanban" | "table" | "calendar" | "timeline" | "list";

interface ViewConfig {
  key: ViewKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
  tagline: string;
  description: string;
}

const views: ViewConfig[] = [
  {
    key: "kanban",
    label: "Kanban Board",
    icon: Kanban,
    badge: "Agile Flow",
    tagline: "Drag-and-drop workflow with persisted ordering",
    description:
      "Visualize work in flight, enforce WIP limits, and optimize sprint velocity with real-time multi-column boards.",
  },
  {
    key: "table",
    label: "Data Table",
    icon: TableIcon,
    badge: "Dense & Filterable",
    tagline: "Spreadsheet-speed batch triaging and sorting",
    description:
      "Filter by priority, group by sprint, inline edit status, and export project states with zero lag.",
  },
  {
    key: "calendar",
    label: "Calendar",
    icon: CalendarIcon,
    badge: "Temporal Planning",
    tagline: "Monthly and weekly deadline visibility",
    description:
      "Spot conflicting delivery dates, orchestrate client release milestones, and balance team bandwidth visually.",
  },
  {
    key: "timeline",
    label: "Timeline / Gantt",
    icon: Clock,
    badge: "Milestone Roadmaps",
    tagline: "Dependency-aware roadmap and duration tracking",
    description:
      "Track multi-week phase execution, evaluate critical path risks, and align engineering sprints with product roadmaps.",
  },
  {
    key: "list",
    label: "Linear List",
    icon: ListTodo,
    badge: "High-Focus Execution",
    tagline: "Minimalist task checklist for deep work",
    description:
      "Clear clutter and focus on what matters today with keyboard-driven task completion and inline subtasks.",
  },
];

export function LandingViewsShowcase() {
  const [activeView, setActiveView] = useState<ViewKey>("kanban");

  return (
    <section
      id="views"
      className="relative border-b border-border/50 py-24 md:py-32 overflow-hidden bg-muted/20"
    >
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        {/* Section Heading */}
        <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20 mb-4">
            <Sparkles className="h-3.5 w-3.5" />5 Synchronized Perspectives
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            One source of truth. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Every way your team thinks.
            </span>
          </h2>
          <p className="mt-4 text-base md:text-lg text-muted-foreground">
            No matter how your engineers, designers, or product managers prefer to work, NEXORA
            keeps state perfectly synchronized across all 5 perspectives in real-time.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-start md:justify-center overflow-x-auto pb-4 mb-8 scrollbar-none gap-2">
          {views.map((view) => {
            const Icon = view.icon;
            const isActive = activeView === view.key;
            return (
              <button
                key={view.key}
                onClick={() => setActiveView(view.key)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 font-semibold"
                    : "bg-card/70 hover:bg-card text-muted-foreground hover:text-foreground border border-border/60"
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${isActive ? "text-primary-foreground" : "text-primary"}`}
                />
                <span>{view.label}</span>
              </button>
            );
          })}
        </div>

        {/* Current View Description Banner */}
        {(() => {
          const current = views.find((v) => v.key === activeView) ?? views[0]!;
          return (
            <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left px-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {current.badge}
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-sm font-semibold text-foreground">{current.tagline}</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">{current.description}</p>
              </div>
            </div>
          );
        })()}

        {/* Dynamic Mockup Viewport */}
        <div className="max-w-5xl mx-auto rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden">
          {/* Mock Window Top Bar */}
          <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-4 py-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-destructive/60 inline-block" />
              <span className="h-3 w-3 rounded-full bg-amber-500/60 inline-block" />
              <span className="h-3 w-3 rounded-full bg-emerald-500/60 inline-block" />
              <span className="text-muted-foreground font-mono ml-2 hidden sm:inline">
                NEXORA / Projects / Q3 Deliverables /{" "}
                {views.find((v) => v.key === activeView)?.label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>
          </div>

          {/* View Mockup Content */}
          <div className="p-4 sm:p-6 md:p-8 min-h-[380px] bg-background/50">
            {activeView === "kanban" && <KanbanMockup />}
            {activeView === "table" && <TableMockup />}
            {activeView === "calendar" && <CalendarMockup />}
            {activeView === "timeline" && <TimelineMockup />}
            {activeView === "list" && <ListMockup />}
          </div>
        </div>
      </div>
    </section>
  );
}

/* 1. Kanban Mockup */
function KanbanMockup() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Column 1: Backlog */}
      <div className="rounded-xl border border-border/60 bg-muted/30 p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-border/40 text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            BACKLOG
          </span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs">2</span>
        </div>

        <div className="rounded-lg border border-border/60 bg-card p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-medium">
              Research
            </span>
            <span className="text-xs text-muted-foreground font-mono">#NX-104</span>
          </div>
          <p className="text-sm font-semibold text-foreground">
            Evaluate WebRTC data channels for cursor sync
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/30">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" /> Elena V.
            </span>
            <span className="text-amber-500 font-medium">Medium</span>
          </div>
        </div>

        <div className="rounded-lg border border-border/60 bg-card p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 font-medium">
              Design
            </span>
            <span className="text-xs text-muted-foreground font-mono">#NX-108</span>
          </div>
          <p className="text-sm font-semibold text-foreground">
            Timeline sprint milestone markers revamp
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/30">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" /> Marcus C.
            </span>
            <span className="text-emerald-500 font-medium">Low</span>
          </div>
        </div>
      </div>

      {/* Column 2: In Progress */}
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-border/40 text-xs font-semibold text-primary">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            IN PROGRESS
          </span>
          <span className="rounded bg-primary/20 px-1.5 py-0.5 text-xs text-primary font-bold">
            2
          </span>
        </div>

        <div className="rounded-lg border border-primary/40 bg-card p-3 shadow-md space-y-2 relative">
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs px-2 py-0.5 rounded bg-rose-500/10 text-rose-500 font-medium">
              Security
            </span>
            <span className="text-xs text-muted-foreground font-mono">#NX-112</span>
          </div>
          <p className="text-sm font-semibold text-foreground">
            Audit multi-tenant RLS policies on custom fields
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/30">
            <span className="flex items-center gap-1 font-medium text-foreground">
              <User className="h-3 w-3 text-primary" /> Alex K.
            </span>
            <span className="text-rose-500 font-bold flex items-center gap-1">
              <Flame className="h-3 w-3" /> Urgent
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-border/60 bg-card p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-medium">
              AI Engine
            </span>
            <span className="text-xs text-muted-foreground font-mono">#NX-115</span>
          </div>
          <p className="text-sm font-semibold text-foreground">
            Streaming task breakdown with Copilot ⌘J
          </p>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/30">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" /> Sarah D.
            </span>
            <span className="text-amber-500 font-medium">High</span>
          </div>
        </div>
      </div>

      {/* Column 3: Done */}
      <div className="rounded-xl border border-border/60 bg-muted/30 p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between pb-2 border-b border-border/40 text-xs font-semibold text-emerald-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            COMPLETED
          </span>
          <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">3</span>
        </div>

        <div className="rounded-lg border border-border/40 bg-card/60 p-3 shadow-xs space-y-2 opacity-85">
          <div className="flex items-center justify-between">
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-medium">
              Architecture
            </span>
            <span className="text-xs text-muted-foreground font-mono line-through">#NX-099</span>
          </div>
          <p className="text-sm font-medium text-foreground line-through opacity-70">
            Supabase Auth with PKCE and session middleware
          </p>
          <div className="flex items-center justify-between text-xs text-emerald-500 pt-1 border-t border-border/30 font-medium">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Shipped
            </span>
            <span className="text-muted-foreground">Yesterday</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 2. Table Mockup */
function TableMockup() {
  return (
    <div className="rounded-xl border border-border/60 overflow-hidden bg-card text-xs">
      <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-muted/50 border-b border-border/60 font-semibold text-muted-foreground uppercase tracking-wider">
        <div className="col-span-5 sm:col-span-6">Task Title</div>
        <div className="col-span-3 sm:col-span-2">Status</div>
        <div className="col-span-2 hidden sm:block">Priority</div>
        <div className="col-span-4 sm:col-span-2 text-right">Assignee</div>
      </div>

      <div className="divide-y divide-border/40 font-medium">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
          <div className="col-span-5 sm:col-span-6 font-semibold text-foreground flex items-center gap-2 truncate">
            <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
            Audit multi-tenant RLS policies on custom fields
          </div>
          <div className="col-span-3 sm:col-span-2">
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold text-[11px]">
              In Progress
            </span>
          </div>
          <div className="col-span-2 hidden sm:block">
            <span className="text-rose-500 font-bold">Urgent</span>
          </div>
          <div className="col-span-4 sm:col-span-2 text-right text-muted-foreground flex items-center justify-end gap-1.5">
            <span className="h-5 w-5 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-[10px]">
              AK
            </span>
            <span className="truncate">Alex K.</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
          <div className="col-span-5 sm:col-span-6 font-semibold text-foreground flex items-center gap-2 truncate">
            <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
            Streaming task breakdown with Copilot ⌘J
          </div>
          <div className="col-span-3 sm:col-span-2">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-semibold text-[11px]">
              In Review
            </span>
          </div>
          <div className="col-span-2 hidden sm:block">
            <span className="text-amber-500 font-semibold">High</span>
          </div>
          <div className="col-span-4 sm:col-span-2 text-right text-muted-foreground flex items-center justify-end gap-1.5">
            <span className="h-5 w-5 rounded-full bg-indigo-500/20 text-indigo-500 font-bold flex items-center justify-center text-[10px]">
              SD
            </span>
            <span className="truncate">Sarah D.</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-muted/30 transition-colors">
          <div className="col-span-5 sm:col-span-6 font-semibold text-foreground flex items-center gap-2 truncate">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            Supabase Auth with PKCE and session middleware
          </div>
          <div className="col-span-3 sm:col-span-2">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-semibold text-[11px]">
              Completed
            </span>
          </div>
          <div className="col-span-2 hidden sm:block">
            <span className="text-muted-foreground">Normal</span>
          </div>
          <div className="col-span-4 sm:col-span-2 text-right text-muted-foreground flex items-center justify-end gap-1.5">
            <span className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-500 font-bold flex items-center justify-center text-[10px]">
              EV
            </span>
            <span className="truncate">Elena V.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* 3. Calendar Mockup */
function CalendarMockup() {
  const days = ["Mon 15", "Tue 16", "Wed 17", "Thu 18", "Fri 19", "Sat 20", "Sun 21"];
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3 text-xs">
      <div className="grid grid-cols-7 gap-1 text-center font-semibold text-muted-foreground pb-2 border-b border-border/50">
        {days.map((day, i) => (
          <div key={i} className="p-1 rounded bg-muted/30">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 pt-2 min-h-[160px]">
        <div className="p-1 rounded border border-border/30 bg-muted/10 h-24 flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground font-mono">09:00</span>
          <div className="p-1 rounded bg-blue-500/10 border border-blue-500/30 text-[10px] text-blue-500 font-semibold truncate">
            Sprint Sync
          </div>
        </div>
        <div className="p-1 rounded border border-border/30 bg-muted/10 h-24 flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground font-mono">14:00</span>
          <div className="p-1 rounded bg-purple-500/10 border border-purple-500/30 text-[10px] text-purple-500 font-semibold truncate">
            UI Review
          </div>
        </div>
        <div className="col-span-2 p-1 rounded border border-primary/40 bg-primary/5 h-24 flex flex-col gap-1 relative">
          <span className="text-[10px] text-primary font-mono font-bold">Today • 18th</span>
          <div className="p-1.5 rounded bg-primary text-primary-foreground text-[11px] font-bold shadow-xs truncate">
            🔥 RLS Penetration Test & Sign-off
          </div>
        </div>
        <div className="p-1 rounded border border-border/30 bg-muted/10 h-24 flex flex-col gap-1">
          <span className="text-[10px] text-muted-foreground font-mono">11:00</span>
          <div className="p-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] text-emerald-500 font-semibold truncate">
            v1.2 Release
          </div>
        </div>
        <div className="col-span-2 p-1 rounded border border-border/30 bg-muted/5 h-24 flex items-center justify-center text-muted-foreground/50">
          Weekend
        </div>
      </div>
    </div>
  );
}

/* 4. Timeline Mockup */
function TimelineMockup() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 text-xs space-y-4">
      <div className="flex items-center justify-between text-muted-foreground border-b border-border/50 pb-2">
        <span className="font-semibold text-foreground">
          Sprint 24 — Architecture & Copilot Launch
        </span>
        <div className="flex items-center gap-4 font-mono text-[11px]">
          <span>Week 1</span>
          <span>Week 2</span>
          <span>Week 3</span>
          <span>Week 4</span>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="font-medium text-foreground">RLS Security Hardening</span>
            <span className="text-emerald-500 font-semibold">100% Done</span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
            <div className="h-full bg-emerald-500 rounded-full w-full" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="font-medium text-foreground">AI Copilot & Tool Calling</span>
            <span className="text-primary font-semibold">78% In Progress</span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
            <div className="h-full bg-primary rounded-full w-[78%]" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="font-medium text-foreground">Command Palette & Global Shortcuts</span>
            <span className="text-amber-500 font-semibold">45% In Progress</span>
          </div>
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
            <div className="h-full bg-amber-500 rounded-full w-[45%]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* 5. List Mockup */
function ListMockup() {
  return (
    <div className="rounded-xl border border-border/60 bg-card divide-y divide-border/50 text-xs">
      <div className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            defaultChecked
            className="h-4 w-4 rounded text-primary focus:ring-primary accent-primary"
          />
          <span className="font-semibold line-through text-muted-foreground">
            Setup Next.js 16 App Router & Supabase Auth
          </span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
          Infrastructure
        </span>
      </div>

      <div className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors bg-primary/5">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded text-primary focus:ring-primary accent-primary"
          />
          <span className="font-semibold text-foreground">
            Optimize client bundle with dynamic view imports
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-semibold">
            Performance
          </span>
          <span className="text-rose-500 font-bold">Urgent</span>
        </div>
      </div>

      <div className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded text-primary focus:ring-primary accent-primary"
          />
          <span className="font-semibold text-foreground">
            Ship responsive SaaS landing page with dark mode
          </span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-semibold">
          Marketing
        </span>
      </div>
    </div>
  );
}
