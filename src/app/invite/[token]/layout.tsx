import type { ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/shared";

interface InviteLayoutProps {
  children: ReactNode;
}

export default function InviteLayout({ children }: InviteLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-16 items-center justify-between px-6 border-b border-border/40">
        <Link href="/" className="font-bold tracking-tight text-lg flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          <span>NEXORA</span>
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center p-4 sm:p-8">{children}</main>
    </div>
  );
}
