import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LandingNavbar } from "./landing-navbar";
import { LandingHero } from "./landing-hero";
import { LandingFeatures } from "./landing-features";
import { LandingViewsShowcase } from "./landing-views-showcase";
import { LandingTechStack } from "./landing-tech-stack";
import { LandingCta } from "./landing-cta";
import { LandingFooter } from "./landing-footer";

describe("LandingNavbar Component", () => {
  it("renders brand mark and navigation links", () => {
    render(<LandingNavbar isAuthenticated={false} />);
    expect(screen.getByText("NEXORA")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /features/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /views/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /architecture/i })).toBeInTheDocument();
  });

  it("renders guest authentication buttons when not logged in", () => {
    render(<LandingNavbar isAuthenticated={false} />);
    expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /get started/i })).toBeInTheDocument();
  });

  it("renders dashboard link when user is authenticated", () => {
    render(<LandingNavbar isAuthenticated={true} />);
    expect(screen.getByRole("link", { name: /go to dashboard/i })).toBeInTheDocument();
  });
});

describe("LandingHero Component", () => {
  it("renders primary value proposition headline and action buttons", () => {
    render(<LandingHero isAuthenticated={false} />);
    expect(
      screen.getByRole("heading", {
        name: /AI-Powered Project Intelligence for High-Velocity Teams/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /start for free/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /explore demo \/ sign in/i })).toBeInTheDocument();
  });

  it("displays dashboard button when authenticated", () => {
    render(<LandingHero isAuthenticated={true} />);
    expect(screen.getByRole("link", { name: /go to dashboard/i })).toBeInTheDocument();
  });
});

describe("LandingFeatures Component", () => {
  it("renders the 4 core architecture pillars", () => {
    render(<LandingFeatures />);
    expect(screen.getByText(/Multi-Tenant Row-Level Security/i)).toBeInTheDocument();
    expect(screen.getByText(/Dynamic Project Perspectives/i)).toBeInTheDocument();
    expect(screen.getByText(/Live Presence & Instant Broadcast/i)).toBeInTheDocument();
    expect(screen.getByText(/Context-Aware In-App AI Copilot/i)).toBeInTheDocument();
  });

  it("displays keyboard productivity shortcuts", () => {
    render(<LandingFeatures />);
    expect(screen.getByText("Command Menu")).toBeInTheDocument();
    expect(screen.getByText("AI Copilot")).toBeInTheDocument();
  });
});

describe("LandingViewsShowcase Component", () => {
  it("renders all 5 view tabs and defaults to Kanban Board", () => {
    render(<LandingViewsShowcase />);
    expect(screen.getByRole("button", { name: /kanban board/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /data table/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /calendar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /timeline/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /linear list/i })).toBeInTheDocument();

    // Default active view is Kanban
    expect(screen.getByText(/Drag-and-drop workflow with persisted ordering/i)).toBeInTheDocument();
  });

  it("switches active view mockup when tab is clicked", () => {
    render(<LandingViewsShowcase />);
    const tableButton = screen.getByRole("button", { name: /data table/i });
    fireEvent.click(tableButton);

    expect(screen.getByText(/Spreadsheet-speed batch triaging and sorting/i)).toBeInTheDocument();

    const calendarButton = screen.getByRole("button", { name: /calendar/i });
    fireEvent.click(calendarButton);
    expect(screen.getByText(/Monthly and weekly deadline visibility/i)).toBeInTheDocument();
  });
});

describe("LandingTechStack Component", () => {
  it("renders key stack components and metrics", () => {
    render(<LandingTechStack />);
    expect(screen.getByText(/Next.js 16 App Router/i)).toBeInTheDocument();
    expect(screen.getByText(/Supabase & PostgreSQL RLS/i)).toBeInTheDocument();
    expect(screen.getByText(/TypeScript 5 Strict Mode/i)).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText("87+")).toBeInTheDocument();
  });
});

describe("LandingCta Component", () => {
  it("renders conversion headline and link to register for guest", () => {
    render(<LandingCta isAuthenticated={false} />);
    expect(
      screen.getByRole("heading", { name: /Accelerate your engineering execution today/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /create workspace/i })).toBeInTheDocument();
  });

  it("renders link to dashboard when authenticated", () => {
    render(<LandingCta isAuthenticated={true} />);
    expect(screen.getByRole("link", { name: /go to workspace dashboard/i })).toBeInTheDocument();
  });
});

describe("LandingFooter Component", () => {
  it("renders footer brand, links, and operational status", () => {
    render(<LandingFooter />);
    expect(screen.getByText(/All Systems Operational/i)).toBeInTheDocument();
    expect(screen.getByText(/GitHub Repository/i)).toBeInTheDocument();
    expect(screen.getByText(/Multi-tenant isolated/i)).toBeInTheDocument();
  });
});
