import * as React from "react";
import { Button } from "@/components/ui/button";
import { CreateTaskDialog } from "../create-task-dialog";
import { Inbox, FilterX } from "lucide-react";
import type { WorkspaceAssignee } from "../../types";

interface TaskTableEmptyProps {
  isFiltered: boolean;
  onClearFilters?: () => void;
  canCreate: boolean;
  workspaceId: string;
  projectId: string;
  workspaceSlug: string;
  assignees: WorkspaceAssignee[];
}

export function TaskTableEmpty({
  isFiltered,
  onClearFilters,
  canCreate,
  workspaceId,
  projectId,
  workspaceSlug,
  assignees,
}: TaskTableEmptyProps) {
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground mb-3 ring-8 ring-muted/20">
          <FilterX className="h-6 w-6" />
        </div>
        <h4 className="text-sm font-semibold text-foreground mb-1">No matching tasks found</h4>
        <p className="text-xs text-muted-foreground max-w-sm mb-4">
          No tasks match your current filter and search criteria. Try adjusting or clearing your
          filters.
        </p>
        {onClearFilters && (
          <Button variant="outline" size="sm" onClick={onClearFilters} className="text-xs h-8">
            Clear all filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3 ring-8 ring-primary/5">
        <Inbox className="h-6 w-6" />
      </div>
      <h4 className="text-sm font-semibold text-foreground mb-1">No tasks in this project yet</h4>
      <p className="text-xs text-muted-foreground max-w-sm mb-4">
        Get started by breaking down your project deliverables into actionable tasks.
      </p>
      {canCreate && (
        <CreateTaskDialog
          workspaceId={workspaceId}
          projectId={projectId}
          workspaceSlug={workspaceSlug}
          assignees={assignees}
        />
      )}
    </div>
  );
}
