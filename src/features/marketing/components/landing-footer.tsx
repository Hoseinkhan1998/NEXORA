import Link from "next/link";
import { Sparkles, Shield, Terminal } from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-muted/20 py-12 md:py-16 text-xs text-muted-foreground">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-12">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <Link
              href="/"
              className="flex items-center gap-2.5 font-black text-lg tracking-tight text-foreground"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
                NEXORA
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Multi-tenant, AI-powered project management platform engineered with Next.js 16,
              Supabase PostgreSQL RLS, and reactive client architecture.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://github.com/Hoseinkhan1998/NEXORA"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-border/80 bg-card hover:bg-muted text-foreground transition-colors font-medium text-xs"
              >
                <GithubIcon className="h-3.5 w-3.5" />
                <span>GitHub Repository</span>
              </a>
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[11px] font-semibold">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>All Systems Operational</span>
              </div>
            </div>
          </div>

          {/* Col 2: Platform */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Platform</h4>
            <ul className="space-y-2">
              <li>
                <Link href="#features" className="hover:text-foreground transition-colors">
                  Core Capabilities
                </Link>
              </li>
              <li>
                <Link href="#views" className="hover:text-foreground transition-colors">
                  5 Dynamic Views
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-foreground transition-colors">
                  Real-time Collaboration
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-foreground transition-colors">
                  AI Copilot (⌘J)
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-foreground transition-colors">
                  Command Center (⌘K)
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Architecture */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Architecture
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="#architecture" className="hover:text-foreground transition-colors">
                  Next.js 16 App Router
                </Link>
              </li>
              <li>
                <Link href="#architecture" className="hover:text-foreground transition-colors">
                  Supabase PostgreSQL RLS
                </Link>
              </li>
              <li>
                <Link href="#architecture" className="hover:text-foreground transition-colors">
                  TypeScript 5 Strict
                </Link>
              </li>
              <li>
                <Link href="#architecture" className="hover:text-foreground transition-colors">
                  Tailwind CSS v4
                </Link>
              </li>
              <li>
                <Link href="#architecture" className="hover:text-foreground transition-colors">
                  Vitest Quality Gates
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Account & Auth */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Workspace Access
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  Sign In to Workspace
                </Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-foreground transition-colors">
                  Register New Account
                </Link>
              </li>
              <li>
                <Link href="/app" className="hover:text-foreground transition-colors">
                  Go to Dashboard
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/Hoseinkhan1998/NEXORA"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Terminal className="h-3 w-3" />
                  Documentation
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p>© {currentYear} NEXORA. Designed and engineered for high-velocity software teams.</p>
          <div className="flex items-center gap-4 text-muted-foreground text-xs">
            <span className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-primary" />
              Multi-tenant isolated
            </span>
            <span>•</span>
            <span>Zero cross-tenant leakage</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
