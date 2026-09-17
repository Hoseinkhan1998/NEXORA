"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getWorkspaceMembership } from "@/features/workspaces";
import { createTaskSchema } from "../schemas/task";
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
  const assigneeId = formData.get("assigneeId")?.toString() || undefined;
  const dueDate = formData.get("dueDate")?.toString() || undefined;

  const validated = createTaskSchema.safeParse({
    title,
    description: description || undefined,
    status,
    priority,
    assigneeId: assigneeId || undefined,
    dueDate: dueDate || undefined,
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

  // If assigneeId is provided, verify assignee belongs to this workspace
  if (validated.data.assigneeId) {
    const { data: assigneeMember } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", validated.data.assigneeId)
      .single();

    if (!assigneeMember) {
      return {
        success: false,
        error: "Selected assignee is not a member of this workspace.",
      };
    }
  }

  const { data: newTask, error: insertError } = await supabase
    .from("tasks")
    .insert({
      workspace_id: workspaceId,
      project_id: projectId,
      title: validated.data.title.trim(),
      description: validated.data.description?.trim() || null,
      status: validated.data.status,
      priority: validated.data.priority,
      assignee_id: validated.data.assigneeId || null,
      due_date: validated.data.dueDate || null,
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

  revalidatePath(`/app/${workspaceSlug}/projects/${projectId}`);

  return {
    success: true,
    task: newTask as Task,
  };
}
