import type { ReactNode } from "react";

interface WorkspaceLayoutProps {
  children: ReactNode;
  params: Promise<{ workspace: string }>;
}

export default async function WorkspaceLayout({ children, params }: WorkspaceLayoutProps) {
  const { workspace } = await params;
  return (
    <div data-workspace={workspace} className="min-h-screen">
      {children}
    </div>
  );
}
