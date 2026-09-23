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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle, Check, Settings2 } from "lucide-react";
import { updateProjectAction } from "../actions/update-project";
import { updateProjectSchema, PROJECT_COLOR_PALETTE } from "../schemas/project";
import { ProjectMembersSelect } from "./project-members-select";
import type { ProjectWithCreator, ProjectStatus } from "../types";
import type { WorkspaceAssignee } from "@/features/tasks/types";

interface EditProjectDialogProps {
  project: ProjectWithCreator;
  workspaceSlug: string;
  workspaceMembers?: WorkspaceAssignee[];
  initialMemberIds?: string[];
  trigger?: React.ReactNode;
}

export function EditProjectDialog({
  project,
  workspaceSlug,
  workspaceMembers = [],
  initialMemberIds = [],
  trigger,
}: EditProjectDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(project.name);
  const [description, setDescription] = React.useState(project.description || "");
  const [color, setColor] = React.useState<string>(
    project.color || PROJECT_COLOR_PALETTE[0] || "#3B82F6"
  );
  const [status, setStatus] = React.useState<ProjectStatus>(project.status);
  const [selectedMemberIds, setSelectedMemberIds] = React.useState<string[]>(initialMemberIds);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  function handleOpenChange(newOpen: boolean) {
    if (newOpen) {
      setName(project.name);
      setDescription(project.description || "");
      setColor(project.color || PROJECT_COLOR_PALETTE[0] || "#3B82F6");
      setStatus(project.status);
      setSelectedMemberIds(initialMemberIds);
      setErrors({});
      setGeneralError(null);
    }
    setOpen(newOpen);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError(null);
    setErrors({});

    const validation = updateProjectSchema.safeParse({
      name,
      description: description || null,
      color,
      status,
      memberIds: selectedMemberIds,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      const flattened = validation.error.flatten().fieldErrors;
      for (const [key, msgs] of Object.entries(flattened)) {
        if (msgs?.[0]) fieldErrors[key] = msgs[0];
      }
      setErrors(fieldErrors);
      return;
    }

    setIsPending(true);

    try {
      const result = await updateProjectAction(
        project.id,
        project.workspace_id,
        workspaceSlug,
        validation.data
      );

      if (!result.success) {
        if (result.fieldErrors) {
          const fieldErrors: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(result.fieldErrors)) {
            if (msgs?.[0]) fieldErrors[key] = msgs[0];
          }
          setErrors(fieldErrors);
        }
        setGeneralError(result.error || "Unable to update project.");
        setIsPending(false);
        return;
      }

      setOpen(false);
      setIsPending(false);
      router.refresh();
    } catch {
      setGeneralError("An unexpected connection error occurred. Please try again.");
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Settings2 className="h-4 w-4" />
            <span>Edit Project</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Project</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Update project details, status, and theme color.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {generalError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Update Failed</AlertTitle>
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}

          {/* Project Name */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-project-name" className="text-xs font-semibold">
              Project Name
            </Label>
            <Input
              id="edit-project-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.name;
                    return next;
                  });
                }
              }}
              disabled={isPending}
              variant={errors.name ? "error" : "default"}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          {/* Status Select */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-project-status" className="text-xs font-semibold">
              Lifecycle Status
            </Label>
            <Select
              value={status}
              onValueChange={(val) => setStatus(val as ProjectStatus)}
              disabled={isPending}
            >
              <SelectTrigger id="edit-project-status" className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-project-desc" className="text-xs font-semibold">
              Description
            </Label>
            <Textarea
              id="edit-project-desc"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.description;
                    return next;
                  });
                }
              }}
              disabled={isPending}
              className="resize-none min-h-[70px]"
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          {/* Project Members Selection */}
          {workspaceMembers.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Project Members</Label>
              <ProjectMembersSelect
                workspaceMembers={workspaceMembers}
                selectedIds={selectedMemberIds}
                onChange={setSelectedMemberIds}
                disabled={isPending}
                placeholder="Assign workspace members to project..."
              />
              <p className="text-[11px] text-muted-foreground">
                Only assigned members can view and access this project and its tasks.
              </p>
            </div>
          )}

          {/* Color Palette Picker */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Color Accent</Label>
            <div
              className="flex items-center gap-2 pt-1 flex-wrap"
              role="radiogroup"
              aria-label="Project accent color"
            >
              {PROJECT_COLOR_PALETTE.map((c) => {
                const isSelected = color.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`Color ${c}`}
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full flex items-center justify-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      isSelected ? "scale-110 ring-2 ring-primary ring-offset-2" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 text-white drop-shadow-xs" />}
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isPending} disabled={!name.trim() || isPending}>
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
