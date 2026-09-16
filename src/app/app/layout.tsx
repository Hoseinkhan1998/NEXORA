import type { ReactNode } from "react";

interface AppShellLayoutProps {
  children: ReactNode;
}

export default function AppShellLayout({ children }: AppShellLayoutProps) {
  return <div className="min-h-screen">{children}</div>;
}
