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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Trash2, Edit2 } from "lucide-react";
import { updateTaskAction } from "../actions/update-task";
import { deleteTaskAction } from "../actions/delete-task";
import { updateTaskSchema } from "../schemas/task";
import type { TaskWithDetails, TaskStatus, TaskPriority, WorkspaceAssignee } from "../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

interface EditTaskDialogProps {
  task: TaskWithDetails;
  workspaceId: string;
  projectId: string;
  workspaceSlug: string;
  assignees: WorkspaceAssignee[];
  userRole: WorkspaceRole;
  trigger?: React.ReactNode;
}

export function EditTaskDialog({
  task,
  workspaceId,
  projectId,
  workspaceSlug,
  assignees,
  userRole,
  trigger,
}: EditTaskDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState(task.title);
  const [description, setDescription] = React.useState(task.description || "");
  const [status, setStatus] = React.useState<TaskStatus>(task.status);
  const [priority, setPriority] = React.useState<TaskPriority>(task.priority);
  const [assigneeId, setAssigneeId] = React.useState<string>(task.assignee_id || "unassigned");
  const [dueDate, setDueDate] = React.useState<string>(task.due_date || "");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const canDelete = userRole === "owner" || userRole === "admin";

  function handleOpenChange(newOpen: boolean) {
    if (newOpen) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setAssigneeId(task.assignee_id || "unassigned");
      setDueDate(task.due_date || "");
      setErrors({});
      setGeneralError(null);
    }
    setOpen(newOpen);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError(null);
    setErrors({});

    const chosenAssigneeId = assigneeId === "unassigned" ? null : assigneeId;

    const validation = updateTaskSchema.safeParse({
      title,
      description: description || null,
      status,
      priority,
      assigneeId: chosenAssigneeId,
      dueDate: dueDate || null,
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
      const result = await updateTaskAction(
        task.id,
        workspaceId,
        projectId,
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
        setGeneralError(result.error || "Unable to update task.");
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

  async function handleDelete() {
    const confirmed = window.confirm("Are you sure you want to permanently delete this task?");
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const result = await deleteTaskAction(task.id, workspaceId, projectId, workspaceSlug);
      if (!result.success) {
        setGeneralError(result.error || "Failed to delete task.");
        setIsDeleting(false);
        return;
      }
      setOpen(false);
      setIsDeleting(false);
      router.refresh();
    } catch {
      setGeneralError("Failed to delete task.");
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
          >
            <Edit2 className="h-3.5 w-3.5" />
            <span className="sr-only">Edit task</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Edit Task</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Update task details, state, priority, or assignee.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {generalError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Action Failed</AlertTitle>
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-task-title" className="text-xs font-semibold">
              Title
            </Label>
            <Input
              id="edit-task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isPending || isDeleting}
              variant={errors.title ? "error" : "default"}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-task-status" className="text-xs font-semibold">
                Status
              </Label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as TaskStatus)}
                disabled={isPending || isDeleting}
              >
                <SelectTrigger id="edit-task-status" className="w-full">
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
              <Label htmlFor="edit-task-priority" className="text-xs font-semibold">
                Priority
              </Label>
              <Select
                value={priority}
                onValueChange={(val) => setPriority(val as TaskPriority)}
                disabled={isPending || isDeleting}
              >
                <SelectTrigger id="edit-task-priority" className="w-full">
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
              <Label htmlFor="edit-task-assignee" className="text-xs font-semibold">
                Assignee
              </Label>
              <Select
                value={assigneeId}
                onValueChange={setAssigneeId}
                disabled={isPending || isDeleting}
              >
                <SelectTrigger id="edit-task-assignee" className="w-full">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {assignees.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      <span className="truncate">
                        {member.fullName || member.email.split("@")[0]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit-task-due-date" className="text-xs font-semibold">
                Due Date
              </Label>
              <Input
                id="edit-task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isPending || isDeleting}
                className="h-9 text-xs"
              />
              {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate}</p>}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-task-desc" className="text-xs font-semibold">
              Description
            </Label>
            <Textarea
              id="edit-task-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending || isDeleting}
              className="resize-none min-h-[60px]"
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          <DialogFooter className="pt-2 flex items-center justify-between gap-2 sm:justify-between">
            {canDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                loading={isDeleting}
                disabled={isPending || isDeleting}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                <span>Delete</span>
              </Button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending || isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={isPending}
                disabled={!title.trim() || isPending || isDeleting}
              >
                Save
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
