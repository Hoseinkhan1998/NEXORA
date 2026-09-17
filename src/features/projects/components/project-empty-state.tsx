import * as React from "react";
import { FolderKanban } from "lucide-react";

interface ProjectEmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function ProjectEmptyState({
  title = "No projects found",
  description = "Get started by creating your first project in this workspace.",
  action,
}: ProjectEmptyStateProps) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center bg-card/40">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 shadow-xs">
        <FolderKanban className="h-6 w-6" />
      </div>
      <h3 className="text-base font-semibold text-foreground tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
