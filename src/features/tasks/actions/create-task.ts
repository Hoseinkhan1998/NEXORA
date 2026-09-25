"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceMembership } from "@/features/workspaces";
import { createTaskSchema } from "../schemas/task";
import { logActivity } from "@/features/collaboration/lib/log-activity";
import { createNotification } from "@/features/notifications";
import type { Task } from "../types";

export interface CreateTaskState {
  success: boolean;
  error?: string;
  fieldErrors?: {
    title?: string[];
    description?: string[];
    status?: string[];
    priority?: string[];
    assigneeId?: string[];
    dueDate?: string[];
  };
  task?: Task;
}

export async function createTaskAction(
  workspaceId: string,
  projectId: string,
  workspaceSlug: string,
  _prevState: CreateTaskState | null,
  formData: FormData
): Promise<CreateTaskState> {
  const title = formData.get("title")?.toString() || "";
  const description = formData.get("description")?.toString() || undefined;
  const status = formData.get("status")?.toString() || "todo";
  const priority = formData.get("priority")?.toString() || "medium";
  const rawAssigneeIds = formData
    .getAll("assigneeIds")
    .map((v) => v.toString().trim())
    .filter(Boolean);
  const singleAssigneeId = formData.get("assigneeId")?.toString().trim();
  if (
    singleAssigneeId &&
    singleAssigneeId !== "unassigned" &&
    !rawAssigneeIds.includes(singleAssigneeId)
  ) {
    rawAssigneeIds.push(singleAssigneeId);
  }
  const dueDate = formData.get("dueDate")?.toString() || undefined;
  const isPrivate = formData.get("isPrivate") === "true";
  const rawAttachments = formData.get("attachments")?.toString();
  let parsedAttachments: unknown[] = [];
  if (rawAttachments) {
    try {
      parsedAttachments = JSON.parse(rawAttachments);
    } catch {
      // ignore parse error
    }
  }

  const validated = createTaskSchema.safeParse({
    title,
    description: description || undefined,
    status,
    priority,
    assigneeId: rawAssigneeIds[0] || undefined,
    assigneeIds: rawAssigneeIds.length > 0 ? rawAssigneeIds : undefined,
    dueDate: dueDate || undefined,
    isPrivate,
    attachments: parsedAttachments,
  });

  if (!validated.success) {
    const flattened = validated.error.flatten();
    return {
      success: false,
      error: "Please correct the errors in the task form.",
      fieldErrors: {
        title: flattened.fieldErrors.title,
        description: flattened.fieldErrors.description,
        status: flattened.fieldErrors.status,
        priority: flattened.fieldErrors.priority,
        assigneeId: flattened.fieldErrors.assigneeId,
        dueDate: flattened.fieldErrors.dueDate,
      },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be authenticated to create a task.",
    };
  }

  // Verify workspace membership and permissions
  const membership = await getWorkspaceMembership(workspaceId, user.id);
  if (!membership) {
    return {
      success: false,
      error: "You do not have access to this workspace.",
    };
  }

  if (membership.role === "viewer") {
    return {
      success: false,
      error: "Viewers are not permitted to create tasks.",
    };
  }

  // Verify project belongs to this workspace
  const { data: project, error: projError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("workspace_id", workspaceId)
    .single();

  if (projError || !project) {
    return {
      success: false,
      error: "Project not found or does not belong to this workspace.",
    };
  }

  // If assignees are provided, verify all assignees belong to this workspace
  const targetAssigneeIds =
    validated.data.assigneeIds || (validated.data.assigneeId ? [validated.data.assigneeId] : []);

  if (targetAssigneeIds.length > 0) {
    const { data: assigneeMembers } = await supabase
      .from("workspace_members")
      .select("user_id")
      .eq("workspace_id", workspaceId)
      .in("user_id", targetAssigneeIds);

    const validMemberIds = new Set(assigneeMembers?.map((m) => m.user_id) || []);
    const invalidIds = targetAssigneeIds.filter((id) => !validMemberIds.has(id));

    if (invalidIds.length > 0) {
      return {
        success: false,
        error: "One or more selected assignees are not members of this workspace.",
      };
    }
  }

  const primaryAssigneeId = targetAssigneeIds[0] || null;

  const { data: newTask, error: insertError } = await supabase
    .from("tasks")
    .insert({
      workspace_id: workspaceId,
      project_id: projectId,
      title: validated.data.title.trim(),
      description: validated.data.description?.trim() || null,
      status: validated.data.status,
      priority: validated.data.priority,
      assignee_id: primaryAssigneeId,
      due_date: validated.data.dueDate || null,
      is_private: Boolean(validated.data.isPrivate),
      attachments: validated.data.attachments || [],
      created_by: user.id,
    })
    .select()
    .single();

  if (insertError || !newTask) {
    console.error("[createTaskAction] Insert error:", insertError);
    return {
      success: false,
      error: "Failed to create task. Please try again.",
    };
  }

  // Insert into task_assignees junction table
  if (targetAssigneeIds.length > 0) {
    const assigneeRows = targetAssigneeIds.map((uid) => ({
      task_id: newTask.id,
      user_id: uid,
    }));
    await supabase.from("task_assignees").insert(assigneeRows);
  }

  // Record activity audit event
  await logActivity({
    workspaceId,
    projectId,
    actorId: user.id,
    entityType: "task",
    entityId: newTask.id,
    action: "task_created",
    metadata: {
      task_title: newTask.title,
      status: newTask.status,
      priority: newTask.priority,
      assignee_id: newTask.assignee_id,
      assignee_ids: targetAssigneeIds,
      due_date: newTask.due_date,
      is_private: newTask.is_private,
    },
  });

  // Dispatch in-app notifications if assigned to other members
  for (const recipientId of targetAssigneeIds) {
    if (recipientId !== user.id) {
      await createNotification({
        workspaceId,
        recipientId,
        actorId: user.id,
        type: "task_assigned",
        title: "New task assigned",
        message: `You were assigned to task "${newTask.title}".`,
        entityType: "task",
        entityId: newTask.id,
        projectId,
      });

      if (newTask.priority === "urgent") {
        await createNotification({
          workspaceId,
          recipientId,
          actorId: user.id,
          type: "task_priority_urgent",
          title: "Urgent task assigned",
          message: `Task "${newTask.title}" is marked as Urgent priority.`,
          entityType: "task",
          entityId: newTask.id,
          projectId,
        });
      }
    }
  }

  revalidatePath(`/app/${workspaceSlug}/projects/${projectId}`);

  return {
    success: true,
    task: newTask as Task,
  };
}
