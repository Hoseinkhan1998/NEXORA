# NEXORA

AI-powered project intelligence and collaboration platform.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Library:** React
- **Language:** TypeScript
- **Styling:** Tailwind CSS (CSS variables token architecture)
- **Linting & Formatting:** ESLint & Prettier

## Requirements

- Node.js: >= 20.x
- npm: >= 10.x

## Getting Started

### 1. Installation

Install project dependencies:

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment template to create your local environment configuration:

```bash
cp .env.example .env.local
```

### 3. Development Server

Run the development server locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application shell.

### 4. Production Build

Validate TypeScript and compile the production build:

```bash
npm run build
```

Run the production server:

```bash
npm run start
```

### 5. Linting & Code Quality

Check and format code:

```bash
npm run lint
npx prettier --check .
```

## Project Architecture

```text
src/
├── app/          # Next.js App Router (routes, layouts, root config)
├── components/   # UI & Shared presentation components
│   ├── ui/
│   └── shared/
├── features/     # Domain-specific modules (auth, workspace, projects, tasks, etc.)
├── lib/          # Core utilities and infrastructure helpers
├── hooks/        # Reusable React hooks
├── types/        # Shared TypeScript interfaces & types
├── config/       # Application configuration & metadata
└── constants/    # Global constants & route paths
```

## Current Project Status

- **Status:** Technical Foundation Initialized (TASK 001)
- **Scope:** Clean technical architecture, strict TypeScript configuration, Tailwind CSS token system, ESLint/Prettier setup, and App Router foundation.
