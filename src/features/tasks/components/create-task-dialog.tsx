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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiAssigneeSelect } from "./multi-assignee-select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Plus, AlertCircle, Lock } from "lucide-react";
import { createTaskAction } from "../actions/create-task";
import { createTaskSchema } from "../schemas/task";
import type { TaskStatus, TaskPriority, WorkspaceAssignee } from "../types";

interface CreateTaskDialogProps {
  workspaceId: string;
  projectId: string;
  workspaceSlug: string;
  assignees: WorkspaceAssignee[];
  trigger?: React.ReactNode;
}

export function CreateTaskDialog({
  workspaceId,
  projectId,
  workspaceSlug,
  assignees,
  trigger,
}: CreateTaskDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState<TaskStatus>("todo");
  const [priority, setPriority] = React.useState<TaskPriority>("medium");
  const [selectedAssigneeIds, setSelectedAssigneeIds] = React.useState<string[]>([]);
  const [dueDate, setDueDate] = React.useState<string>("");
  const [isPrivate, setIsPrivate] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  function resetForm() {
    setTitle("");
    setDescription("");
    setStatus("todo");
    setPriority("medium");
    setSelectedAssigneeIds([]);
    setDueDate("");
    setIsPrivate(false);
    setErrors({});
    setGeneralError(null);
    setIsPending(false);
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      resetForm();
    }
    setOpen(newOpen);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError(null);
    setErrors({});

    const validation = createTaskSchema.safeParse({
      title,
      description: description || undefined,
      status,
      priority,
      assigneeId: selectedAssigneeIds[0] || undefined,
      assigneeIds: selectedAssigneeIds.length > 0 ? selectedAssigneeIds : undefined,
      dueDate: dueDate || undefined,
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
      const formData = new FormData();
      formData.set("title", title);
      if (description) formData.set("description", description);
      formData.set("status", status);
      formData.set("priority", priority);
      selectedAssigneeIds.forEach((id) => formData.append("assigneeIds", id));
      if (selectedAssigneeIds[0]) formData.set("assigneeId", selectedAssigneeIds[0]);
      if (dueDate) formData.set("dueDate", dueDate);
      formData.set("isPrivate", isPrivate ? "true" : "false");

      const result = await createTaskAction(workspaceId, projectId, workspaceSlug, null, formData);

      if (!result.success) {
        if (result.fieldErrors) {
          const fieldErrors: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(result.fieldErrors)) {
            if (msgs?.[0]) fieldErrors[key] = msgs[0];
          }
          setErrors(fieldErrors);
        }
        setGeneralError(result.error || "Unable to create task.");
        setIsPending(false);
        return;
      }

      setOpen(false);
      resetForm();
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
          <Button size="sm" className="gap-1.5 shadow-xs">
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </Button>
        )}
      </DialogTrigger>

      {open && (
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">New Task</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Create an action item for this project.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {generalError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Creation Error</AlertTitle>
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="task-title" className="text-xs font-semibold">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="task-title"
                placeholder="e.g. Implement authentication flow"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.title;
                      return next;
                    });
                  }
                }}
                disabled={isPending}
                variant={errors.title ? "error" : "default"}
                autoFocus
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>

            {/* Status & Priority Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="task-status" className="text-xs font-semibold">
                  Status
                </Label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as TaskStatus)}
                  disabled={isPending}
                >
                  <SelectTrigger id="task-status" className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="task-priority" className="text-xs font-semibold">
                  Priority
                </Label>
                <Select
                  value={priority}
                  onValueChange={(val) => setPriority(val as TaskPriority)}
                  disabled={isPending}
                >
                  <SelectTrigger id="task-priority" className="w-full">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assignee & Due Date Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="task-assignee" className="text-xs font-semibold">
                  Assignees
                </Label>
                <MultiAssigneeSelect
                  assignees={assignees}
                  selectedIds={selectedAssigneeIds}
                  onChange={setSelectedAssigneeIds}
                  disabled={isPending}
                  placeholder="Select assignees..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="task-due-date" className="text-xs font-semibold">
                  Due Date
                </Label>
                <Input
                  id="task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={isPending}
                  className="h-9 text-xs"
                />
                {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate}</p>}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="task-desc" className="text-xs font-semibold">
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Textarea
                id="task-desc"
                placeholder="Additional details or acceptance criteria..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={isPending}
                className="resize-none min-h-[60px]"
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
            </div>

            {/* Private Task Toggle */}
            <div className="flex items-start justify-between rounded-lg border border-border/60 bg-muted/20 p-3 gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-amber-500" />
                  <Label htmlFor="task-private" className="text-xs font-semibold cursor-pointer">
                    Private Task (محرمانه / خصوصی)
                  </Label>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Visible strictly to you (the creator) and assigned members.
                </p>
              </div>
              <input
                type="checkbox"
                id="task-private"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                disabled={isPending}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary mt-0.5 cursor-pointer"
              />
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
              <Button type="submit" loading={isPending} disabled={!title.trim() || isPending}>
                Create Task
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      )}
    </Dialog>
  );
}
