import type OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { generateProjectSlug, buildCandidateSlug } from "@/features/projects/lib/slug";

/**
 * Records an activity event in public.project_activity without failing if transient error occurs.
 */
async function recordToolActivity(
  supabase: SupabaseClient,
  params: {
    workspaceId: string;
    projectId: string;
    actorId: string;
    entityType: "task" | "project";
    entityId: string;
    action: string;
    metadata?: Record<string, unknown>;
  }
) {
  try {
    await supabase.from("project_activity").insert({
      workspace_id: params.workspaceId,
      project_id: params.projectId,
      actor_id: params.actorId,
      entity_type: params.entityType,
      entity_id: params.entityId,
      action: params.action,
      metadata: params.metadata || {},
    });
  } catch (err) {
    console.error("[recordToolActivity] Failed to record activity:", err);
  }
}

/**
 * OpenAI-compatible Tool Definitions for NEXORA Copilot.
 * Allows the AI to autonomously manage projects and tasks while strictly prohibiting
 * sensitive profile or account modifications.
 */
export const COPILOT_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "create_project",
      description:
        "Creates a new project in the current workspace. Use when the user requests creating a project in Persian or English.",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description:
              "The name of the project to create (e.g. 'طراحی مجدد سایت' or 'Mobile App').",
          },
          description: {
            type: "string",
            description: "Optional description explaining the scope or objective of the project.",
          },
          color: {
            type: "string",
            description:
              "Optional hex color code for project tagging, e.g. '#6366f1' or '#10b981'.",
          },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_project",
      description:
        "Updates an existing project's name, description, color, or status ('active' | 'archived').",
      parameters: {
        type: "object",
        properties: {
          projectIdOrName: {
            type: "string",
            description: "The project UUID or project name to match and update.",
          },
          name: {
            type: "string",
            description: "New name for the project.",
          },
          description: {
            type: "string",
            description: "New description for the project.",
          },
          color: {
            type: "string",
            description: "New hex color code.",
          },
          status: {
            type: "string",
            enum: ["active", "archived"],
            description: "New status for the project.",
          },
        },
        required: ["projectIdOrName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "archive_project",
      description: "Archives a project in the workspace.",
      parameters: {
        type: "object",
        properties: {
          projectIdOrName: {
            type: "string",
            description: "The project UUID or name to archive.",
          },
        },
        required: ["projectIdOrName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description:
        "Creates a new task in a project. Automatically picks the project if only one exists or if matching name is provided.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Title of the task (e.g. 'طراحی نوبار' or 'Fix database indexing').",
          },
          projectNameOrId: {
            type: "string",
            description:
              "Optional project name or UUID. If omitted, task is placed in the primary active project.",
          },
          description: {
            type: "string",
            description: "Detailed description of what needs to be done.",
          },
          status: {
            type: "string",
            enum: ["backlog", "todo", "in_progress", "in_review", "done"],
            description: "Initial status of the task. Defaults to 'todo'.",
          },
          priority: {
            type: "string",
            enum: ["urgent", "high", "medium", "low"],
            description: "Priority level of the task. Defaults to 'medium'.",
          },
          dueDate: {
            type: "string",
            description: "Due date in YYYY-MM-DD format, e.g. '2026-10-15'.",
          },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_task",
      description:
        "Updates details of an existing task including its title, description, priority, status, or due date.",
      parameters: {
        type: "object",
        properties: {
          taskIdOrTitle: {
            type: "string",
            description: "The UUID or title of the task to update.",
          },
          title: {
            type: "string",
            description: "New title for the task.",
          },
          description: {
            type: "string",
            description: "New description for the task.",
          },
          status: {
            type: "string",
            enum: ["backlog", "todo", "in_progress", "in_review", "done"],
            description: "New status column.",
          },
          priority: {
            type: "string",
            enum: ["urgent", "high", "medium", "low"],
            description: "New priority level.",
          },
          dueDate: {
            type: "string",
            description: "New due date in YYYY-MM-DD format.",
          },
        },
        required: ["taskIdOrTitle"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "move_task_status",
      description:
        "Moves a task directly to a specific board column (backlog, todo, in_progress, in_review, done). Used when user asks to finish, start, or triage a task.",
      parameters: {
        type: "object",
        properties: {
          taskIdOrTitle: {
            type: "string",
            description: "The UUID or title of the task to move.",
          },
          status: {
            type: "string",
            enum: ["backlog", "todo", "in_progress", "in_review", "done"],
            description: "Target board status column.",
          },
        },
        required: ["taskIdOrTitle", "status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_task",
      description: "Permanently deletes a task. Requires workspace owner or admin permissions.",
      parameters: {
        type: "object",
        properties: {
          taskIdOrTitle: {
            type: "string",
            description: "The UUID or title of the task to delete.",
          },
        },
        required: ["taskIdOrTitle"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_projects",
      description: "Returns all projects in the workspace with active status and details.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_tasks",
      description:
        "Searches and returns tasks in the workspace with optional project, status, or priority filtering.",
      parameters: {
        type: "object",
        properties: {
          projectNameOrId: {
            type: "string",
            description: "Filter by project name or ID.",
          },
          status: {
            type: "string",
            enum: ["backlog", "todo", "in_progress", "in_review", "done"],
            description: "Filter by status column.",
          },
        },
      },
    },
  },
];

export interface CopilotExecutionContext {
  supabase: SupabaseClient;
  workspaceId: string;
  workspaceSlug: string;
  userId: string;
  role: string;
}

export interface CopilotToolResult {
  success: boolean;
  message: string;
  data?: unknown;
  isMutation: boolean;
}

/**
 * Finds a project by exact ID or case-insensitive / substring name.
 */
async function resolveProject(supabase: SupabaseClient, workspaceId: string, identifier?: string) {
  if (!identifier) {
    // Pick the most recent active project
    const { data: defaultProj } = await supabase
      .from("projects")
      .select("id, name, slug, status")
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return defaultProj || null;
  }

  const trimmed = identifier.trim();

  // Try exact UUID
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
  if (isUuid) {
    const { data } = await supabase
      .from("projects")
      .select("id, name, slug, status")
      .eq("id", trimmed)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (data) return data;
  }

  // Search by name (case-insensitive)
  const { data: list } = await supabase
    .from("projects")
    .select("id, name, slug, status")
    .eq("workspace_id", workspaceId);

  if (!list || list.length === 0) return null;

  const lower = trimmed.toLowerCase();
  const exact = list.find((p) => p.name.toLowerCase() === lower);
  if (exact) return exact;

  const contains = list.find((p) => p.name.toLowerCase().includes(lower));
  return contains || null;
}

/**
 * Finds a task by exact ID or case-insensitive / substring title.
 */
async function resolveTask(supabase: SupabaseClient, workspaceId: string, identifier: string) {
  const trimmed = identifier.trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);

  if (isUuid) {
    const { data } = await supabase
      .from("tasks")
      .select("id, project_id, title, status, priority, description, due_date")
      .eq("id", trimmed)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (data) return data;
  }

  // Retrieve tasks in this workspace
  const { data: list } = await supabase
    .from("tasks")
    .select("id, project_id, title, status, priority, description, due_date")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!list || list.length === 0) return null;

  const lower = trimmed.toLowerCase();
  const exact = list.find((t) => t.title.toLowerCase() === lower);
  if (exact) return exact;

  const contains = list.find((t) => t.title.toLowerCase().includes(lower));
  return contains || null;
}

/**
 * Executes a tool called by the AI model with strict role checks and audit logging.
 */
export async function executeCopilotTool(
  toolName: string,
  args: Record<string, unknown>,
  context: CopilotExecutionContext
): Promise<CopilotToolResult> {
  const { supabase, workspaceId, userId, role } = context;

  // Viewers cannot perform any mutations
  const mutationTools = [
    "create_project",
    "update_project",
    "archive_project",
    "create_task",
    "update_task",
    "move_task_status",
    "delete_task",
  ];

  if (mutationTools.includes(toolName) && role === "viewer") {
    return {
      success: false,
      message: "You do not have permission to modify workspace data (Viewer role).",
      isMutation: false,
    };
  }

  try {
    switch (toolName) {
      case "create_project": {
        const name = String(args.name || "").trim();
        if (!name) {
          return { success: false, message: "Project name is required.", isMutation: false };
        }

        const description = args.description ? String(args.description).trim() : null;
        const color = args.color ? String(args.color).trim() : null;

        const baseSlug = generateProjectSlug(name);
        let slug = baseSlug;
        let counter = 1;

        // Collision check
        while (counter <= 50) {
          const { data: existing } = await supabase
            .from("projects")
            .select("id")
            .eq("workspace_id", workspaceId)
            .eq("slug", slug)
            .maybeSingle();

          if (!existing) break;
          counter++;
          slug = buildCandidateSlug(baseSlug, counter);
        }

        const { data: newProject, error } = await supabase
          .from("projects")
          .insert({
            workspace_id: workspaceId,
            name,
            slug,
            description,
            color,
            status: "active",
            created_by: userId,
          })
          .select()
          .single();

        if (error || !newProject) {
          return {
            success: false,
            message: `Failed to create project: ${error?.message || "Unknown error"}`,
            isMutation: false,
          };
        }

        await recordToolActivity(supabase, {
          workspaceId,
          projectId: newProject.id,
          actorId: userId,
          entityType: "project",
          entityId: newProject.id,
          action: "project_created",
          metadata: { project_name: newProject.name, trigger: "ai_copilot" },
        });

        return {
          success: true,
          message: `Project "${newProject.name}" created successfully.`,
          data: newProject,
          isMutation: true,
        };
      }

      case "update_project": {
        const identifier = String(args.projectIdOrName || "").trim();
        const project = await resolveProject(supabase, workspaceId, identifier);

        if (!project) {
          return {
            success: false,
            message: `Project with name or ID "${identifier}" not found.`,
            isMutation: false,
          };
        }

        const updateData: Record<string, unknown> = {};
        if (args.name !== undefined) updateData.name = String(args.name).trim();
        if (args.description !== undefined)
          updateData.description = args.description ? String(args.description).trim() : null;
        if (args.color !== undefined)
          updateData.color = args.color ? String(args.color).trim() : null;
        if (args.status !== undefined && ["active", "archived"].includes(String(args.status))) {
          updateData.status = args.status;
        }

        const { data: updatedProject, error } = await supabase
          .from("projects")
          .update(updateData)
          .eq("id", project.id)
          .eq("workspace_id", workspaceId)
          .select()
          .single();

        if (error || !updatedProject) {
          return {
            success: false,
            message: `Failed to update project: ${error?.message}`,
            isMutation: false,
          };
        }

        return {
          success: true,
          message: `Project "${updatedProject.name}" updated successfully.`,
          data: updatedProject,
          isMutation: true,
        };
      }

      case "archive_project": {
        const identifier = String(args.projectIdOrName || "").trim();
        const project = await resolveProject(supabase, workspaceId, identifier);

        if (!project) {
          return {
            success: false,
            message: `Project with name or ID "${identifier}" not found.`,
            isMutation: false,
          };
        }

        const { error } = await supabase
          .from("projects")
          .update({ status: "archived" })
          .eq("id", project.id)
          .eq("workspace_id", workspaceId);

        if (error) {
          return {
            success: false,
            message: `Failed to archive project: ${error.message}`,
            isMutation: false,
          };
        }

        return {
          success: true,
          message: `Project "${project.name}" has been archived.`,
          isMutation: true,
        };
      }

      case "create_task": {
        const title = String(args.title || "").trim();
        if (!title) {
          return { success: false, message: "Task title is required.", isMutation: false };
        }

        let project = await resolveProject(
          supabase,
          workspaceId,
          args.projectNameOrId ? String(args.projectNameOrId) : undefined
        );

        // If no project exists at all in this workspace, create a default "Main Project"
        if (!project) {
          const { data: createdProj } = await supabase
            .from("projects")
            .insert({
              workspace_id: workspaceId,
              name: "Main Project",
              slug: "main-project",
              status: "active",
              created_by: userId,
            })
            .select()
            .single();

          project = createdProj;
        }

        if (!project) {
          return {
            success: false,
            message: "A project must exist in this workspace before creating a task.",
            isMutation: false,
          };
        }

        const status = ["backlog", "todo", "in_progress", "in_review", "done"].includes(
          String(args.status)
        )
          ? String(args.status)
          : "todo";

        const priority = ["urgent", "high", "medium", "low"].includes(String(args.priority))
          ? String(args.priority)
          : "medium";

        const description = args.description ? String(args.description).trim() : null;
        const dueDate = args.dueDate ? String(args.dueDate).trim() : null;

        const { data: newTask, error } = await supabase
          .from("tasks")
          .insert({
            workspace_id: workspaceId,
            project_id: project.id,
            title,
            description,
            status,
            priority,
            due_date: dueDate,
            created_by: userId,
          })
          .select()
          .single();

        if (error || !newTask) {
          return {
            success: false,
            message: `Failed to create task: ${error?.message || "Unknown error"}`,
            isMutation: false,
          };
        }

        await recordToolActivity(supabase, {
          workspaceId,
          projectId: project.id,
          actorId: userId,
          entityType: "task",
          entityId: newTask.id,
          action: "task_created",
          metadata: {
            task_title: newTask.title,
            status: newTask.status,
            trigger: "ai_copilot",
          },
        });

        return {
          success: true,
          message: `Task "${newTask.title}" created successfully in status [${newTask.status}] under project "${project.name}".`,
          data: newTask,
          isMutation: true,
        };
      }

      case "update_task": {
        const identifier = String(args.taskIdOrTitle || "").trim();
        const task = await resolveTask(supabase, workspaceId, identifier);

        if (!task) {
          return {
            success: false,
            message: `Task with title or ID "${identifier}" not found.`,
            isMutation: false,
          };
        }

        const updateData: Record<string, unknown> = {};
        if (args.title !== undefined) updateData.title = String(args.title).trim();
        if (args.description !== undefined)
          updateData.description = args.description ? String(args.description).trim() : null;
        if (
          args.status !== undefined &&
          ["backlog", "todo", "in_progress", "in_review", "done"].includes(String(args.status))
        ) {
          updateData.status = args.status;
        }
        if (
          args.priority !== undefined &&
          ["urgent", "high", "medium", "low"].includes(String(args.priority))
        ) {
          updateData.priority = args.priority;
        }
        if (args.dueDate !== undefined)
          updateData.due_date = args.dueDate ? String(args.dueDate).trim() : null;

        const { data: updatedTask, error } = await supabase
          .from("tasks")
          .update(updateData)
          .eq("id", task.id)
          .eq("workspace_id", workspaceId)
          .select()
          .single();

        if (error || !updatedTask) {
          return {
            success: false,
            message: `Failed to update task: ${error?.message}`,
            isMutation: false,
          };
        }

        await recordToolActivity(supabase, {
          workspaceId,
          projectId: updatedTask.project_id,
          actorId: userId,
          entityType: "task",
          entityId: updatedTask.id,
          action: "task_updated",
          metadata: { task_title: updatedTask.title, trigger: "ai_copilot" },
        });

        return {
          success: true,
          message: `Task "${updatedTask.title}" updated successfully.`,
          data: updatedTask,
          isMutation: true,
        };
      }

      case "move_task_status": {
        const identifier = String(args.taskIdOrTitle || "").trim();
        const targetStatus = String(args.status || "").trim();

        if (!["backlog", "todo", "in_progress", "in_review", "done"].includes(targetStatus)) {
          return {
            success: false,
            message: `Invalid status. Allowed values: backlog, todo, in_progress, in_review, done`,
            isMutation: false,
          };
        }

        const task = await resolveTask(supabase, workspaceId, identifier);
        if (!task) {
          return {
            success: false,
            message: `Task with title or ID "${identifier}" not found.`,
            isMutation: false,
          };
        }

        const { data: movedTask, error } = await supabase
          .from("tasks")
          .update({ status: targetStatus })
          .eq("id", task.id)
          .eq("workspace_id", workspaceId)
          .select()
          .single();

        if (error || !movedTask) {
          return {
            success: false,
            message: `Failed to move task status: ${error?.message}`,
            isMutation: false,
          };
        }

        await recordToolActivity(supabase, {
          workspaceId,
          projectId: movedTask.project_id,
          actorId: userId,
          entityType: "task",
          entityId: movedTask.id,
          action: "task_moved",
          metadata: {
            task_title: movedTask.title,
            from_status: task.status,
            to_status: targetStatus,
            trigger: "ai_copilot",
          },
        });

        return {
          success: true,
          message: `Task "${movedTask.title}" moved from [${task.status}] to [${targetStatus}].`,
          data: movedTask,
          isMutation: true,
        };
      }

      case "delete_task": {
        if (role !== "owner" && role !== "admin") {
          return {
            success: false,
            message: "Only workspace owners and administrators are permitted to delete tasks.",
            isMutation: false,
          };
        }

        const identifier = String(args.taskIdOrTitle || "").trim();
        const task = await resolveTask(supabase, workspaceId, identifier);

        if (!task) {
          return {
            success: false,
            message: `Task with title or ID "${identifier}" not found.`,
            isMutation: false,
          };
        }

        const { error } = await supabase
          .from("tasks")
          .delete()
          .eq("id", task.id)
          .eq("workspace_id", workspaceId);

        if (error) {
          return {
            success: false,
            message: `Failed to delete task: ${error.message}`,
            isMutation: false,
          };
        }

        await recordToolActivity(supabase, {
          workspaceId,
          projectId: task.project_id,
          actorId: userId,
          entityType: "task",
          entityId: task.id,
          action: "task_deleted",
          metadata: { task_title: task.title, trigger: "ai_copilot" },
        });

        return {
          success: true,
          message: `Task "${task.title}" deleted successfully.`,
          isMutation: true,
        };
      }

      case "list_projects": {
        const { data: projects } = await supabase
          .from("projects")
          .select("id, name, slug, status, description, color, created_at")
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: false });

        return {
          success: true,
          message: `Found ${projects?.length || 0} projects in this workspace.`,
          data: projects || [],
          isMutation: false,
        };
      }

      case "list_tasks": {
        let query = supabase
          .from("tasks")
          .select("id, title, status, priority, due_date, project:projects(name)")
          .eq("workspace_id", workspaceId);

        if (args.projectNameOrId) {
          const project = await resolveProject(supabase, workspaceId, String(args.projectNameOrId));
          if (project) {
            query = query.eq("project_id", project.id);
          }
        }

        if (args.status && typeof args.status === "string") {
          query = query.eq("status", args.status);
        }

        const { data: tasks } = await query.order("created_at", { ascending: false }).limit(50);

        return {
          success: true,
          message: `Found ${tasks?.length || 0} tasks.`,
          data: tasks || [],
          isMutation: false,
        };
      }

      default:
        return {
          success: false,
          message: `Unknown tool: ${toolName}`,
          isMutation: false,
        };
    }
  } catch (err: unknown) {
    console.error(`[executeCopilotTool] Error executing ${toolName}:`, err);
    return {
      success: false,
      message: `System error executing command: ${err instanceof Error ? err.message : String(err)}`,
      isMutation: false,
    };
  }
}
