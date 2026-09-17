import * as React from "react";
import { CheckSquare } from "lucide-react";

interface TaskEmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function TaskEmptyState({
  title = "No tasks yet",
  description = "Get started by adding the first task to this project.",
  action,
}: TaskEmptyStateProps) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-6 text-center bg-card/40">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3 shadow-xs">
        <CheckSquare className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-foreground tracking-tight">{title}</h3>
      <p className="mt-1 text-xs text-muted-foreground max-w-xs">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
