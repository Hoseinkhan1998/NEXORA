import type { ReactNode } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/shared";

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex h-16 items-center justify-between px-6 border-b border-border/40">
        <Link href="/" className="font-bold tracking-tight text-lg">
          NEXORA
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 items-center justify-center p-4 sm:p-8">{children}</main>
    </div>
  );
}
