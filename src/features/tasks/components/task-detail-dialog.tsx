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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MultiAssigneeSelect } from "./multi-assignee-select";
import { TaskStatusBadge } from "./task-status-badge";
import { TaskPriorityBadge } from "./task-priority-badge";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Edit3,
  Trash2,
  Calendar,
  Clock,
  User,
  Users,
  AlertCircle,
  ShieldAlert,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { updateTaskAction } from "../actions/update-task";
import { deleteTaskAction } from "../actions/delete-task";
import { updateTaskSchema } from "../schemas/task";
import { TaskAttachments } from "./task-attachments";
import { TaskChatSection } from "./task-chat-section";
import type { TaskWithDetails, TaskStatus, TaskPriority, WorkspaceAssignee, TaskAttachment } from "../types";
import type { WorkspaceRole } from "@/features/workspaces/types";

export interface TaskDetailDialogProps {
  task: TaskWithDetails;
  workspaceId: string;
  projectId: string;
  workspaceSlug: string;
  assignees: WorkspaceAssignee[];
  userRole: WorkspaceRole;
  currentUserId?: string;
  trigger?: React.ReactNode;
  initialMode?: "view" | "edit";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function getInitialAssigneeIds(t: TaskWithDetails): string[] {
  if (t.assignees && t.assignees.length > 0) {
    return t.assignees.map((a) => a.id);
  }
  return t.assignee_id ? [t.assignee_id] : [];
}

export function TaskDetailDialog({
  task,
  workspaceId,
  projectId,
  workspaceSlug,
  assignees,
  userRole,
  currentUserId,
  trigger,
  initialMode = "view",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: TaskDetailDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const [mode, setMode] = React.useState<"view" | "edit">(initialMode);

  // Edit form state
  const [title, setTitle] = React.useState(task.title);
  const [description, setDescription] = React.useState(task.description || "");
  const [status, setStatus] = React.useState<TaskStatus>(task.status);
  const [priority, setPriority] = React.useState<TaskPriority>(task.priority);
  const [selectedAssigneeIds, setSelectedAssigneeIds] = React.useState<string[]>(() =>
    getInitialAssigneeIds(task)
  );
  const [dueDate, setDueDate] = React.useState<string>(task.due_date || "");
  const [isPrivate, setIsPrivate] = React.useState(Boolean(task.is_private));
  const [attachments, setAttachments] = React.useState<TaskAttachment[]>(task.attachments || []);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Security & Permission Logic:
  // Allowed to edit if:
  // 1. Workspace Owner or Admin
  // 2. Task Creator (created_by === currentUserId)
  // 3. One of the assigned members
  const isCreator = Boolean(currentUserId && task.created_by === currentUserId);
  const isAssignee = Boolean(
    currentUserId &&
      (task.assignee_id === currentUserId || task.assignees?.some((a) => a.id === currentUserId))
  );
  const isPrivilegedRole = userRole === "owner" || userRole === "admin";
  const canEdit = userRole !== "viewer" && (isPrivilegedRole || isCreator || isAssignee);
  const canDelete = isPrivilegedRole || isCreator;

  function resetForm() {
    setTitle(task.title);
    setDescription(task.description || "");
    setStatus(task.status);
    setPriority(task.priority);
    setSelectedAssigneeIds(getInitialAssigneeIds(task));
    setDueDate(task.due_date || "");
    setIsPrivate(Boolean(task.is_private));
    setAttachments(task.attachments || []);
    setErrors({});
    setGeneralError(null);
    setMode("view");
  }

  function handleOpenChange(newOpen: boolean) {
    if (newOpen) {
      resetForm();
    }
    setOpen(newOpen);
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canEdit) return;

    setGeneralError(null);
    setErrors({});

    const validation = updateTaskSchema.safeParse({
      title,
      description: description || null,
      status,
      priority,
      assigneeIds: selectedAssigneeIds,
      dueDate: dueDate || null,
      isPrivate,
      attachments,
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

      setIsPending(false);
      setMode("view");
      router.refresh();
    } catch {
      setGeneralError("An unexpected connection error occurred. Please try again.");
      setIsPending(false);
    }
  }

  async function handleDelete() {
    if (!canDelete) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete "${task.title}"?`);
    if (!confirmDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteTaskAction(task.id, workspaceId, projectId, workspaceSlug);
      if (!result.success) {
        setGeneralError(result.error || "Failed to delete task.");
        setIsDeleting(false);
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setGeneralError("An unexpected error occurred while deleting the task.");
      setIsDeleting(false);
    }
  }

  const formattedDueDate = task.due_date
    ? new Date(task.due_date + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const formattedCreatedAt = new Date(task.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const creatorName = task.creator?.full_name || task.creator?.email?.split("@")[0] || "Member";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        {mode === "view" ? (
          /* ============================================================
             1. VIEW MODE (Read Details)
             ============================================================ */
          <div className="space-y-5">
            {/* Top row: Badges + Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-1 border-b border-border/50 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <TaskStatusBadge status={task.status} />
                <TaskPriorityBadge priority={task.priority} />
                {task.is_private && (
                  <Badge
                    variant="outline"
                    className="text-amber-500 border-amber-500/30 bg-amber-500/10 gap-1 text-[11px] font-medium"
                  >
                    <Lock className="h-3 w-3" />
                    <span>Private</span>
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {canEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setMode("edit")}
                    className="h-8 gap-1.5 text-xs font-medium"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit Task</span>
                  </Button>
                )}

                {canDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Delete task"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>

            {/* Task Title */}
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground leading-snug">
                {task.title}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Detailed view of task {task.title}
              </DialogDescription>
            </div>

            {/* Task Description */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Description
              </h4>
              <div className="rounded-lg bg-muted/20 border border-border/50 p-3.5 text-sm">
                {task.description ? (
                  <p className="whitespace-pre-wrap leading-relaxed text-foreground">
                    {task.description}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground italic">No description provided.</p>
                )}
              </div>
            </div>

            {/* Task Attributes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 border-t border-border/40 text-xs">
              {/* Assignees */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                  <Users className="h-3.5 w-3.5" />
                  <span>Assignees</span>
                </div>
                {task.assignees && task.assignees.length > 0 ? (
                  <div className="flex flex-col gap-1.5 pl-1">
                    {task.assignees.map((assignee) => {
                      const name = assignee.full_name || assignee.email?.split("@")[0] || "Member";
                      const initials = name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();
                      return (
                        <div key={assignee.id} className="flex items-center gap-2">
                          <Avatar className="h-5 w-5 text-[9px]">
                            {assignee.avatar_url && (
                              <AvatarImage src={assignee.avatar_url} alt={name} />
                            )}
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground truncate">{name}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : task.assignee ? (
                  <div className="flex items-center gap-2 pl-1">
                    <Avatar className="h-5 w-5 text-[9px]">
                      {task.assignee.avatar_url && (
                        <AvatarImage src={task.assignee.avatar_url} alt={task.assignee.full_name || ""} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {(task.assignee.full_name || task.assignee.email || "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground truncate">
                      {task.assignee.full_name || task.assignee.email}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground/70 italic pl-1">Unassigned</span>
                )}
              </div>

              {/* Due Date */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Due Date</span>
                </div>
                <div className="pl-1">
                  {formattedDueDate ? (
                    <span className="font-medium text-foreground">{formattedDueDate}</span>
                  ) : (
                    <span className="text-muted-foreground/70 italic">No due date set</span>
                  )}
                </div>
              </div>

              {/* Created By */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                  <User className="h-3.5 w-3.5" />
                  <span>Created By</span>
                </div>
                <p className="font-medium text-foreground pl-1">{creatorName}</p>
              </div>

              {/* Created At */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Created On</span>
                </div>
                <p className="font-medium text-foreground pl-1">{formattedCreatedAt}</p>
              </div>
            </div>

            {/* Task-Level File Attachments */}
            <div className="pt-2 border-t border-border/40">
              <TaskAttachments
                attachments={attachments}
                workspaceId={workspaceId}
                taskId={task.id}
                isEditable={false}
              />
            </div>

            {/* Read-Only Notice for unauthorized members / viewers */}
            {!canEdit && (
              <div className="flex items-center gap-2 rounded-md bg-muted/40 p-2.5 text-[11px] text-muted-foreground border border-border/40">
                <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />
                <span>
                  {userRole === "viewer"
                    ? "Viewer Mode: Read-only access to task properties. You can actively participate in the discussion below."
                    : "Read-only: Only workspace admins, the task creator, or assigned members can edit this task. You can still participate in the discussion below."}
                </span>
              </div>
            )}

            {/* Real-time Task Comments & Discussion Feed */}
            <div className="pt-2 border-t border-border/40">
              <TaskChatSection
                taskId={task.id}
                workspaceId={workspaceId}
                currentUserId={currentUserId}
                currentUserRole={userRole}
              />
            </div>
          </div>
        ) : (
          /* ============================================================
             2. EDIT MODE (Form)
             ============================================================ */
          <form onSubmit={handleSave} className="space-y-4">
            <DialogHeader className="pb-2 border-b border-border/40">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-semibold">Edit Task</DialogTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode("view")}
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3 w-3" />
                  <span>Back to details</span>
                </Button>
              </div>
              <DialogDescription className="text-xs">
                Update details, assignees, status, or deadline for this task.
              </DialogDescription>
            </DialogHeader>

            {generalError && (
              <Alert variant="destructive" className="py-2 text-xs">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{generalError}</AlertDescription>
              </Alert>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="task-edit-title" className="text-xs font-semibold">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="task-edit-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title"
                disabled={isPending}
                className="h-9 text-xs"
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
            </div>

            {/* Status & Priority Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="task-edit-status" className="text-xs font-semibold">
                  Status
                </Label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as TaskStatus)}
                  disabled={isPending}
                >
                  <SelectTrigger id="task-edit-status" className="w-full">
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
                <Label htmlFor="task-edit-priority" className="text-xs font-semibold">
                  Priority
                </Label>
                <Select
                  value={priority}
                  onValueChange={(val) => setPriority(val as TaskPriority)}
                  disabled={isPending}
                >
                  <SelectTrigger id="task-edit-priority" className="w-full">
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

            {/* Multi-Assignees & Due Date Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="task-edit-assignees" className="text-xs font-semibold">
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
                <Label htmlFor="task-edit-due-date" className="text-xs font-semibold">
                  Due Date
                </Label>
                <Input
                  id="task-edit-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  disabled={isPending}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="task-edit-description" className="text-xs font-semibold">
                Description
              </Label>
              <Textarea
                id="task-edit-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details about this task..."
                rows={3}
                disabled={isPending}
                className="text-xs resize-none"
              />
            </div>

            {/* Task-Level Attachments */}
            <div className="pt-1">
              <TaskAttachments
                attachments={attachments}
                onChange={setAttachments}
                workspaceId={workspaceId}
                taskId={task.id}
                isEditable={true}
              />
            </div>

            {/* Private Task Toggle */}
            <div className="flex items-start justify-between rounded-lg border border-border/60 bg-muted/20 p-3 gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-amber-500" />
                  <Label htmlFor="task-edit-private" className="text-xs font-semibold cursor-pointer">
                    Private Task
                  </Label>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  When enabled, this task is confidential and visible only to the creator and assignees.
                </p>
              </div>
              <input
                type="checkbox"
                id="task-edit-private"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                disabled={isPending}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary mt-0.5 cursor-pointer"
              />
            </div>

            <DialogFooter className="pt-2 flex items-center justify-between sm:justify-between">
              <div>
                {canDelete && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isPending || isDeleting}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs h-8 px-2"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    <span>Delete</span>
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMode("view")}
                  disabled={isPending}
                  className="h-8 text-xs"
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" loading={isPending} className="h-8 text-xs">
                  Save Changes
                </Button>
              </div>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Re-export as EditTaskDialog for complete backward compatibility
export const EditTaskDialog = TaskDetailDialog;
