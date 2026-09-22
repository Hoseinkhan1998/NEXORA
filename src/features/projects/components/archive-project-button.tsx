"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Archive, ArchiveRestore, AlertTriangle } from "lucide-react";
import { toggleArchiveProjectAction } from "../actions/archive-project";
import { toast } from "sonner";
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
  const [open, setOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const isArchived = currentStatus === "archived";

  async function handleConfirm() {
    const targetStatus: ProjectStatus = isArchived ? "active" : "archived";
    const actionLabel = isArchived ? "restored" : "archived";

    setIsPending(true);
    try {
      const result = await toggleArchiveProjectAction(
        projectId,
        workspaceId,
        workspaceSlug,
        targetStatus
      );

      if (result.success) {
        toast.success(`Project ${actionLabel} successfully.`);
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || `Failed to ${isArchived ? "restore" : "archive"} project.`);
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`gap-1.5 ${
            isArchived
              ? "text-primary hover:text-primary hover:bg-primary/10"
              : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          }`}
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
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-lg ${
                isArchived
                  ? "bg-primary/10 text-primary"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
              }`}
            >
              {isArchived ? (
                <ArchiveRestore className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
            </div>
            <DialogTitle>
              {isArchived ? "Restore Project" : "Archive Project"}
            </DialogTitle>
          </div>
          <DialogDescription className="pt-2 text-sm">
            {isArchived
              ? "Restoring this project will reactivate it and make it visible in active project listings and reports."
              : "Are you sure you want to archive this project? It will be marked as archived, hidden from active filters, but all tasks and history will be preserved."}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant={isArchived ? "default" : "destructive"}
            onClick={handleConfirm}
            loading={isPending}
          >
            {isArchived ? "Restore Project" : "Archive Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
