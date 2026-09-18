import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import {
  LandingNavbar,
  LandingHero,
  LandingFeatures,
  LandingViewsShowcase,
  LandingIntelligence,
  LandingTechStack,
  LandingCta,
  LandingFooter,
} from "@/features/marketing";

export const metadata: Metadata = {
  title: "NEXORA — AI-Powered Project Intelligence for High-Velocity Teams",
  description:
    "Production-grade B2B SaaS project management platform featuring 5 dynamic views, real-time collaboration, PostgreSQL RLS isolation, and an in-app AI Copilot.",
  keywords: [
    "project management",
    "AI copilot",
    "kanban",
    "Gantt timeline",
    "realtime collaboration",
    "SaaS",
    "Next.js",
    "Supabase",
  ],
  openGraph: {
    title: "NEXORA — AI-Powered Project Intelligence for High-Velocity Teams",
    description:
      "Enterprise project management engineered for velocity. 5 synchronized views, live presence, PostgreSQL RLS, and AI Copilot.",
    type: "website",
  },
};

export default async function HomePage() {
  let isAuthenticated = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    isAuthenticated = !!user;
  } catch {
    // If Supabase is unreachable or unconfigured during build, default gracefully to guest state
    isAuthenticated = false;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
      <LandingNavbar isAuthenticated={isAuthenticated} />
      <main className="flex-1">
        <LandingHero isAuthenticated={isAuthenticated} />
        <LandingFeatures />
        <LandingViewsShowcase />
        <LandingIntelligence />
        <LandingTechStack />
        <LandingCta isAuthenticated={isAuthenticated} />
      </main>
      <LandingFooter />
    </div>
  );
}
