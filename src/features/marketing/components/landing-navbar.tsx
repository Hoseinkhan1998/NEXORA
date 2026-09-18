"use client";

import * as React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/shared";

interface LandingNavbarProps {
  isAuthenticated?: boolean;
  userEmail?: string | null;
}

export function LandingNavbar({ isAuthenticated = false }: LandingNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navLinks = [
    { label: "Features", href: "#features" },
    { label: "Views", href: "#views" },
    { label: "Intelligence", href: "#intelligence" },
    { label: "Architecture", href: "#architecture" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/85 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs group-hover:scale-105 transition-transform">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-base tracking-tight text-foreground">NEXORA</span>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider -mt-1 hidden sm:inline">
              Project Intelligence
            </span>
          </div>
        </Link>

        {/* Desktop Anchor Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="hover:text-foreground transition-colors hover:underline underline-offset-4 decoration-primary/40"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Desktop Right CTA Section */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />

          {isAuthenticated ? (
            <Button asChild size="sm" className="gap-1.5 shadow-xs">
              <Link href="/app">
                <span>Go to Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="text-xs font-medium">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="gap-1.5 shadow-xs text-xs font-medium">
                <Link href="/signup">
                  <span>Get Started</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="h-9 w-9"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border bg-background px-4 py-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col space-y-2.5 text-sm font-medium">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-2 py-1.5 rounded-md hover:bg-muted text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <div className="pt-3 border-t border-border/60 flex flex-col gap-2">
            {isAuthenticated ? (
              <Button asChild className="w-full justify-center gap-2">
                <Link href="/app" onClick={() => setMobileMenuOpen(false)}>
                  <span>Go to Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline" className="w-full justify-center">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button asChild className="w-full justify-center gap-2">
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <span>Get Started</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
