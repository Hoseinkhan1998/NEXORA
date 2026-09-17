"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Archive, ArchiveRestore } from "lucide-react";
import { toggleArchiveProjectAction } from "../actions/archive-project";
import type { ProjectStatus } from "../types";

interface ArchiveProjectButtonProps {
  projectId: string;
  workspaceId: string;
  workspaceSlug: string;
  currentStatus: ProjectStatus;
}

export function ArchiveProjectButton({
  projectId,
  workspaceId,
  workspaceSlug,
  currentStatus,
}: ArchiveProjectButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  const isArchived = currentStatus === "archived";

  async function handleToggle() {
    const targetStatus: ProjectStatus = isArchived ? "active" : "archived";
    const actionLabel = isArchived ? "restore" : "archive";

    const confirmed = window.confirm(`Are you sure you want to ${actionLabel} this project?`);
    if (!confirmed) return;

    setIsPending(true);
    try {
      const result = await toggleArchiveProjectAction(
        projectId,
        workspaceId,
        workspaceSlug,
        targetStatus
      );

      if (result.success) {
        router.refresh();
      } else {
        alert(result.error || `Failed to ${actionLabel} project.`);
      }
    } catch {
      alert("An unexpected error occurred.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      loading={isPending}
      className={`gap-1.5 ${isArchived ? "text-primary" : "text-muted-foreground hover:text-destructive"}`}
    >
      {isArchived ? (
        <>
          <ArchiveRestore className="h-4 w-4" />
          <span>Restore Project</span>
        </>
      ) : (
        <>
          <Archive className="h-4 w-4" />
          <span>Archive Project</span>
        </>
      )}
    </Button>
  );
}
