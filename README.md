# NEXORA

> **Enterprise-grade AI-powered project intelligence & multi-tenant collaborative SaaS.**  
> Built with Next.js 16 App Router, TypeScript Strict, Supabase PostgreSQL RLS, Tailwind CSS v4, and reactive real-time architecture.

[![Next.js](https://img.shields.io/badge/Next.js-16.3_App_Router-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5_Strict-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_RLS-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4_Tokens-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](<https://img.shields.io/badge/Vitest-100%20Tests%20Passing%20(12%20Suites)-brightgreen?style=flat&logo=vitest>)](https://vitest.dev/)
[![Security](https://img.shields.io/badge/Security-Multi--Tenant%20Isolated-success?style=flat)](#multi-tenant-row-level-security-rls)
[![License](https://img.shields.io/badge/License-MIT-lightgrey?style=flat)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Core Capabilities](#core-capabilities)
  - [Multi-Tenant Row-Level Security (RLS)](#multi-tenant-row-level-security-rls)
  - [5 Synchronized Dynamic Perspectives](#5-synchronized-dynamic-perspectives)
  - [Real-Time Collaboration & Presence Engine](#real-time-collaboration--presence-engine)
  - [Context-Aware In-App AI Copilot](#context-aware-in-app-ai-copilot)
  - [Command-First UX & Keyboard Navigation](#command-first-ux--keyboard-navigation)
  - [Lightweight Pure SVG Analytics](#lightweight-pure-svg-analytics)
- [System Architecture](#system-architecture)
  - [Tenancy & Authorization Model](#tenancy--authorization-model)
  - [Data Flow & Realtime Sync](#data-flow--realtime-sync)
- [Tech Stack](#tech-stack)
- [Repository Structure](#repository-structure)
- [Local Setup & Quickstart](#local-setup--quickstart)
  - [Prerequisites](#prerequisites)
  - [Step 1: Clone & Install](#step-1-clone--install)
  - [Step 2: Environment Variables](#step-2-environment-variables)
  - [Step 3: Database Migrations](#step-3-database-migrations)
  - [Step 4: Run Development Server](#step-4-run-development-server)
- [Automated Testing & Quality Gates](#automated-testing--quality-gates)
- [Deep-Dive Documentation](#deep-dive-documentation)
- [License](#license)

---

## Overview

**NEXORA** is a full-stack, enterprise-grade project management SaaS engineered for high-velocity software teams. Rather than relying on toy abstractions or monolithic mocks, NEXORA is built upon a hardened multi-tenant foundation where security, real-time state, and AI capabilities are unified.

- **Zero-Trust Multi-Tenancy**: Data isolation is guaranteed at the PostgreSQL kernel layer via Row-Level Security (RLS) policies—not in application memory.
- **5 Dynamic Perspectives**: Instant, frictionless perspective switching between Kanban (with fractional indexing drag-and-drop), spreadsheet Data Table, Calendar, Gantt Timeline, and minimal Linear List.
- **Sub-50ms Real-Time Replication**: Broadcast task updates, active collaborator presence indicators, audit activity streams, and real-time in-app notification dispatchers.
- **In-App AI Copilot**: Grounded strictly within the authenticated user's workspace context, featuring prompt-injection defense and token budget guards.

---

## Core Capabilities

### Multi-Tenant Row-Level Security (RLS)

- Every query is partitioned by `workspace_id`.
- Granular Role-Based Access Control (RBAC): `owner`, `admin`, `member`, and `viewer`.
- Database helper functions (`is_workspace_member`, `can_modify_workspace_projects`, `is_workspace_owner`) prevent cross-tenant data leakage.
- Server-side session verification via `@supabase/ssr` with cryptographic cookie handling.

### 5 Synchronized Dynamic Perspectives

All views read from and mutate the exact same underlying task model in real time:

1. **Kanban Board**: Drag-and-drop workflow powered by `@dnd-kit` and fractional indexing (`calculateTaskPosition`) for $O(1)$ reordering without cascade updates.
2. **Data Table**: High-density view featuring multi-column sorting, priority/status filtering, and inline editing.
3. **Monthly & Weekly Calendar**: Temporal delivery visualization with collision avoidance and due date milestones.
4. **Timeline / Gantt View**: Milestone roadmapping, sprint duration tracking, and progress bar indicators.
5. **Linear List**: Minimalist, distraction-free checklist tailored for rapid individual execution.

### Real-Time Collaboration & Presence Engine

- **Active Member Presence**: Dynamic collaborator avatars with live status indicators broadcasting room presence.
- **Real-Time WebSockets**: Instant updates across connected team members when task status, priority, or content changes.
- **Audit-Logged Activity Feed**: Immutable event stream logging task mutations with actor attribution (`created`, `moved`, `updated`, `deleted`).
- **In-App Notification Center**: Real-time bell popover with unread counters, mark-as-read, and batch dismissal.

### Context-Aware In-App AI Copilot

- **Universal Shortcut (`⌘J` / `Ctrl+J`)**: Instant slide-over assistant accessible from any view.
- **Authenticated Context Grounding**: The AI model (OpenAI `gpt-4o-mini`) is provided with live workspace metrics, active sprint blockers, and project states.
- **Prompt-Injection Defense**: Client inputs are sanitized, stripped of system-role override markers, and bounded by token budgets.
- **Practical Engineering Tools**: Natural language task generation, sprint risk prediction, and automated task decomposition.

### Command-First UX & Keyboard Navigation

- **Global Command Palette (`⌘K` / `Ctrl+K`)**: Rapid navigation across projects, tasks, and system actions powered by `cmdk`.
- **Keyboard Shortcuts**: Quick-create tasks (`C`), navigate to Projects (`G` then `P`), navigate to Timeline (`G` then `T`), and toggle theme.
- **Accessible & Responsive**: Built with Radix UI headless primitives and full keyboard focus rings.

### Lightweight Pure SVG Analytics

- Custom SVG sparklines, sprint velocity bars, and status distributions.
- **Zero Heavy Charting Bundles**: Replaced 150KB+ chart dependencies with pure mathematical SVG components, reducing bundle overhead and hydration cost.

---

## System Architecture

### Tenancy & Authorization Model

```text
               +-----------------------------+
               |       auth.users (Auth)     |
               +-----------------------------+
                              |
                              v
               +-----------------------------+
               |      public.profiles        |
               +-----------------------------+
                              |
              +---------------+---------------+
              |                               |
              v                               v
+---------------------------+   +---------------------------+
|     public.workspaces     |   | public.workspace_members  |
|  (id, name, slug, owner)  |<--| (workspace_id, user_id,   |
+---------------------------+   |  role: owner/admin/etc.)  |
              |                 +---------------------------+
              |                               ^
              v                               | (enforces RLS)
+---------------------------+                 |
|      public.projects      |-----------------+
| (id, workspace_id, title) |
+---------------------------+
              |
              v
+---------------------------+
|       public.tasks        |
| (id, project_id, status,  |
|  priority, position, etc.)|
+---------------------------+
        |             |
        v             v
+---------------+  +--------------------------+
|  activity_log |  | in_app_notifications     |
+---------------+  +--------------------------+
```

### Data Flow & Realtime Sync

```text
[ Client Browser ]
   │
   ├── Next.js App Router (SSR & Server Components)
   │     └── @supabase/ssr (Session Cookie Validation)
   │           └── PostgreSQL Kernel (RLS Policy Enforcement)
   │
   ├── Server Actions & API Mutations
   │     ├── Zod Validation Schemas
   │     ├── Sliding-Window Token Bucket Rate Limiter
   │     └── PostgreSQL Atomic Transaction
   │
   └── Supabase Realtime (WebSockets)
         ├── Channel: `workspace:{id}:tasks` (Broadcast Updates)
         ├── Channel: `workspace:{id}:presence` (Live Member Cursors)
         └── Channel: `workspace:{id}:notifications` (In-App Alerts)
```

---

## Tech Stack

| Domain                   | Technology                                                                      | Version   | Description                                                           |
| ------------------------ | ------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------- |
| **Framework**            | [Next.js](https://nextjs.org/)                                                  | `16.3.5`  | React 19 App Router with Turbopack, Streaming SSR, and Server Actions |
| **Language**             | [TypeScript](https://www.typescriptlang.org/)                                   | `5.x`     | Strict typing mode, zero `any` tolerance, shared schema types         |
| **Database & Auth**      | [Supabase](https://supabase.com/)                                               | `2.116.0` | PostgreSQL with Row-Level Security, Auth SSR, and Realtime Engine     |
| **Styling**              | [Tailwind CSS](https://tailwindcss.com/)                                        | `v4`      | Modern CSS variables token architecture, fluid responsiveness         |
| **Component Primitives** | [Radix UI](https://www.radix-ui.com/)                                           | Latest    | Accessible headless dialogs, dropdowns, tooltips, tabs, and slots     |
| **Command Palette**      | [cmdk](https://cmdk.paco.me/)                                                   | `1.1.1`   | Fast, accessible, unstyled command menu                               |
| **Drag and Drop**        | [@dnd-kit](https://dndkit.com/)                                                 | `6.3.1`   | Lightweight, accessible drag-and-drop toolkit for Kanban boards       |
| **AI Integration**       | [OpenAI Node SDK](https://github.com/openai/openai-node)                        | `7.18.0`  | Context-bounded LLM completion with system prompt isolation           |
| **Testing**              | [Vitest](https://vitest.dev/) & [Testing Library](https://testing-library.com/) | `5.0.1`   | Lightning-fast JSDOM unit, component, and security testing            |
| **Code Quality**         | ESLint 9 & Prettier 3                                                           | Latest    | Standardized linting and automated formatting pipelines               |

---

## Repository Structure

```text
NEXORA/
├── docs/                       # Comprehensive engineering documentation
│   ├── architecture.md         # In-depth architectural patterns & algorithms
│   └── case-study.md           # Engineering case study, trade-offs & metrics
├── public/                     # Static public assets & brand icons
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Login, signup, and authentication layouts
│   │   ├── api/                # Protected API routes (rate limited)
│   │   ├── app/                # Authenticated application shell & views
│   │   │   ├── [workspace]/    # Multi-tenant workspace scoped routes
│   │   │   │   ├── analytics/  # Analytics & sprint velocity dashboards
│   │   │   │   ├── projects/   # Project views (Kanban, Table, Calendar, Timeline, List)
│   │   │   │   └── settings/   # Workspace & member management
│   │   │   └── onboarding/     # First-time workspace creation wizard
│   │   ├── auth/callback/      # OAuth & email verification callback route
│   │   └── page.tsx            # High-converting SaaS landing page (SSR)
│   ├── components/             # Reusable design system primitives (Radix + Tailwind)
│   │   ├── layout/             # Topbar, sidebar, and workspace shell
│   │   └── ui/                 # Accessible button, dialog, dropdown, input, table, etc.
│   ├── features/               # Domain-driven feature modules
│   │   ├── ai/                 # AI Copilot slide-over, tool calls, and prompt guards
│   │   ├── analytics/          # Pure SVG charts, sprint metrics, and velocity math
│   │   ├── auth/               # Login, registration forms, and Zod schemas
│   │   ├── collaboration/      # Realtime presence, broadcast hooks, and activity
│   │   ├── command-palette/    # Cmd+K registry, global keybindings, and search
│   │   ├── marketing/          # Landing page sections, hero, views showcase, CTA
│   │   ├── notifications/      # In-app notification center, bell popover, and dispatcher
│   │   ├── projects/           # Project CRUD, view switchers, and settings
│   │   ├── tasks/              # 5 dynamic views, fractional index positioning, dialogs
│   │   └── workspaces/         # Workspace switcher, member invitations, and roles
│   ├── lib/                    # Shared utilities, Supabase clients, and security
│   │   ├── security/           # Token bucket rate limiter & defense-in-depth headers
│   │   └── supabase/           # Server, client, and middleware Supabase factories
│   ├── test/                   # Test configuration and mock setup
│   └── types/                  # Global TypeScript definitions & Supabase DB types
├── supabase/
│   └── migrations/             # Idempotent SQL migrations for all schemas & RLS
├── .env.example                # Documented template for local and production environment
├── package.json                # Project dependencies and script definitions
├── tsconfig.json               # Strict TypeScript configuration
└── vitest.config.mts           # Vitest and JSDOM configuration
```

---

## Local Setup & Quickstart

### Prerequisites

- **Node.js**: `20.x` or higher
- **npm**: `10.x` or higher (or `pnpm` / `yarn`)
- **Supabase Account**: A free or self-hosted Supabase project

### Step 1: Clone & Install

```bash
git clone https://github.com/Hoseinkhan1998/NEXORA.git
cd NEXORA
npm install
```

### Step 2: Environment Variables

Copy the example template to create your local `.env.local`:

```bash
cp .env.example .env.local
```

Configure your `.env.local` according to this matrix:

| Variable                               | Scope           | Required | Description                                              |
| -------------------------------------- | --------------- | -------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | Client & Server | **Yes**  | Your Supabase Project URL (`https://xyz.supabase.co`)    |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client & Server | **Yes**  | Supabase anonymous public publishable API key            |
| `NEXT_PUBLIC_APP_URL`                  | Client & Server | **Yes**  | Public app origin (default: `http://localhost:3000`)     |
| `NEXT_PUBLIC_APP_ENV`                  | Client & Server | No       | Environment tag (`development`, `staging`, `production`) |
| `OPENAI_API_KEY`                       | **Server-Only** | Optional | Required for In-App AI Copilot (`sk-...`)                |
| `OPENAI_MODEL`                         | **Server-Only** | No       | Model override (defaults to `gpt-4o-mini`)               |

> [!WARNING]
> Never prefix secret keys like `OPENAI_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` with `NEXT_PUBLIC_`. Next.js strictly isolates non-prefixed variables on the server side.

### Step 3: Database Migrations

Apply the migration scripts located in `supabase/migrations/` to your Supabase PostgreSQL instance in sequential order:

1. `20260917000000_create_profiles.sql` — Profiles table and auto-provisioning trigger on `auth.users`.
2. `20260917010000_create_workspaces.sql` — Workspaces, workspace members, and membership RLS.
3. `20260917020000_create_projects.sql` — Projects schema with multi-tenant workspace ownership.
4. `20260917030000_create_tasks.sql` — Tasks table with status, priority, and fractional position indices.
5. `20260918000000_create_project_activity.sql` — Immutable project activity audit log with actor attribution.
6. `20260918010000_create_notifications.sql` — In-app notification center table and dispatch policies.

_You can apply these directly using the Supabase CLI (`supabase db push`) or by pasting them into the Supabase Dashboard SQL Editor._

### Step 4: Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the landing page, register a new account, and provision your first workspace.

---

## Automated Testing & Quality Gates

NEXORA adheres to rigorous automated quality standards. Every PR must pass all 5 verification gates before deployment:

```bash
# 1. Run all 100 automated Vitest tests across 12 suites
npm test

# 2. Verify strict TypeScript compliance (zero type errors)
npx tsc --noEmit

# 3. Check code for ESLint errors and warnings
npm run lint

# 4. Check code formatting with Prettier
npm run format:check

# 5. Execute production Turbopack compilation and route optimization
npm run build
```

### Test Suites Overview (100% Pass Rate)

| Test Suite                                                   | Focus Area                                                   | Tests         |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------- |
| `src/lib/security/rate-limit.test.ts`                        | Sliding-window token bucket limiter & sliding windows        | 9             |
| `src/features/workspaces/utils/slug.test.ts`                 | Workspace slug sanitization and collision mitigation         | 7             |
| `src/features/auth/schemas/auth.test.ts`                     | Email and password Zod validation schemas                    | 9             |
| `src/features/tasks/lib/position.test.ts`                    | Fractional indexing math & $O(1)$ reordering logic           | 11            |
| `src/features/tasks/lib/table-sort.test.ts`                  | Multi-column table sorting algorithms                        | 8             |
| `src/features/tasks/lib/table-filter.test.ts`                | Dense table multi-predicate filtering                        | 8             |
| `src/features/tasks/lib/timeline.test.ts`                    | Gantt timeline sprint span & coordinate calculations         | 9             |
| `src/features/tasks/lib/calendar.test.ts`                    | Monthly/weekly temporal task distribution                    | 10            |
| `src/features/analytics/lib/analytics-calculations.test.ts`  | Pure SVG velocity, completion, and backlog metrics           | 6             |
| `src/features/notifications/lib/create-notification.test.ts` | Real-time notification dispatch and payload hygiene          | 5             |
| `src/features/command-palette/lib/command-registry.test.ts`  | Cmd+K registry item retrieval, filtering, and scoring        | 5             |
| `src/features/marketing/components/landing-page.test.tsx`    | Landing page smoke test, view switcher, and SSR auth buttons | 13            |
| **Total**                                                    | **12 Suites Passing**                                        | **100 Tests** |

---

## Deep-Dive Documentation

For advanced technical evaluation and architectural deep dives:

- 📖 **[Architecture Guide](docs/architecture.md)**: Deep dive into the RLS helper security model, the fractional indexing positioning algorithm, optimistic updates, and performance optimizations.
- 🔬 **[Engineering Case Study](docs/case-study.md)**: Product engineering breakdown detailing real-world trade-offs, pure SVG chart optimization, headless UI primitives, and scalability metrics.

---

## License

This project is licensed under the [MIT License](LICENSE). Built for high-velocity teams and portfolio review.
