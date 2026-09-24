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
          isPrivate: {
            type: "boolean",
            description:
              "Set to true if this task is confidential and private. Visible only to creator and assignees.",
          },
          assigneeNameOrEmail: {
            type: "string",
            description: "Optional full name, email, or user ID of the team member to assign this task to.",
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
        "Updates details of an existing task including its title, description, priority, status, due date, or privacy.",
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
          isPrivate: {
            type: "boolean",
            description: "Set to true to make confidential/private, or false for public to project.",
          },
          assigneeNameOrEmail: {
            type: "string",
            description: "Name or email of team member to assign or reassign.",
          },
        },
        required: ["taskIdOrTitle"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "assign_task",
      description: "Assigns a task to a workspace member by matching their name, email, or user ID.",
      parameters: {
        type: "object",
        properties: {
          taskIdOrTitle: {
            type: "string",
            description: "The UUID or title of the task to assign.",
          },
          memberNameOrEmail: {
            type: "string",
            description: "Full name, email, or user ID of the member to assign.",
          },
        },
        required: ["taskIdOrTitle", "memberNameOrEmail"],
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
      description:
        "Permanently deletes a task. Workspace owners and administrators can delete any task. Standard members can delete tasks they created.",
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
  {
    type: "function",
    function: {
      name: "list_workspace_members",
      description:
        "Lists all members of the workspace along with their roles (owner, admin, member, viewer), full names, and emails.",
      parameters: {
        type: "object",
        properties: {},
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_project_member",
      description:
        "Adds a workspace member to a specific project. Requires workspace owner/admin or project lead permissions.",
      parameters: {
        type: "object",
        properties: {
          projectIdOrName: {
            type: "string",
            description: "The project UUID or project name.",
          },
          memberNameOrEmail: {
            type: "string",
            description: "Name or email of the workspace member to add to the project.",
          },
          role: {
            type: "string",
            enum: ["member", "lead"],
            description: "Role within project: 'member' or 'lead'. Defaults to 'member'.",
          },
        },
        required: ["projectIdOrName", "memberNameOrEmail"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "remove_project_member",
      description:
        "Removes a member from a project. Requires workspace owner/admin or project lead permissions.",
      parameters: {
        type: "object",
        properties: {
          projectIdOrName: {
            type: "string",
            description: "The project UUID or project name.",
          },
          memberNameOrEmail: {
            type: "string",
            description: "Name or email of the project member to remove.",
          },
        },
        required: ["projectIdOrName", "memberNameOrEmail"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_project_members",
      description: "Lists all members assigned to a specific project.",
      parameters: {
        type: "object",
        properties: {
          projectIdOrName: {
            type: "string",
            description: "The project UUID or project name.",
          },
        },
        required: ["projectIdOrName"],
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
      .select("id, project_id, title, status, priority, description, due_date, created_by")
      .eq("id", trimmed)
      .eq("workspace_id", workspaceId)
      .maybeSingle();
    if (data) return data;
  }

  // Retrieve tasks in this workspace
  const { data: list } = await supabase
    .from("tasks")
    .select("id, project_id, title, status, priority, description, due_date, created_by")
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
 * Resolves a workspace member by UUID, exact email, or substring name.
 */
async function resolveWorkspaceMember(
  supabase: SupabaseClient,
  workspaceId: string,
  identifier: string
) {
  const trimmed = identifier.trim();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);

  const { data: members } = await supabase
    .from("workspace_members")
    .select(
      `
      user_id,
      role,
      profile:profiles (
        id,
        email,
        full_name
      )
    `
    )
    .eq("workspace_id", workspaceId);

  if (!members || members.length === 0) return null;

  if (isUuid) {
    const match = members.find((m) => m.user_id === trimmed);
    if (match) return match;
  }

  const lower = trimmed.toLowerCase();
  // Exact email match
  const emailMatch = members.find((m) => {
    const prof = Array.isArray(m.profile) ? m.profile[0] : m.profile;
    return prof?.email?.toLowerCase() === lower;
  });
  if (emailMatch) return emailMatch;

  // Partial name / email match
  const nameMatch = members.find((m) => {
    const prof = Array.isArray(m.profile) ? m.profile[0] : m.profile;
    return (
      prof?.full_name?.toLowerCase().includes(lower) ||
      prof?.email?.toLowerCase().includes(lower)
    );
  });
  return nameMatch || null;
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
    "assign_task",
    "move_task_status",
    "delete_task",
    "add_project_member",
    "remove_project_member",
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
        const isPrivate = Boolean(args.isPrivate);

        let assigneeId: string | null = null;
        let assigneeName: string | null = null;

        if (args.assigneeNameOrEmail) {
          const matchedMember = await resolveWorkspaceMember(
            supabase,
            workspaceId,
            String(args.assigneeNameOrEmail)
          );
          if (matchedMember) {
            assigneeId = matchedMember.user_id;
            const prof = Array.isArray(matchedMember.profile)
              ? matchedMember.profile[0]
              : matchedMember.profile;
            assigneeName = prof?.full_name || prof?.email;
          }
        }

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
            is_private: isPrivate,
            assignee_id: assigneeId,
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

        if (assigneeId) {
          await supabase
            .from("task_assignees")
            .upsert(
              { task_id: newTask.id, user_id: assigneeId },
              { onConflict: "task_id,user_id" }
            );
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
            is_private: isPrivate,
            assignee_id: assigneeId,
            trigger: "ai_copilot",
          },
        });

        return {
          success: true,
          message: `Task "${newTask.title}" created successfully in status [${newTask.status}] under project "${project.name}"${assigneeName ? ` and assigned to ${assigneeName}` : ""}${isPrivate ? " (Confidential/Private)" : ""}.`,
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
        if (args.isPrivate !== undefined)
          updateData.is_private = Boolean(args.isPrivate);

        let newAssigneeName: string | null = null;
        if (args.assigneeNameOrEmail) {
          const matchedMember = await resolveWorkspaceMember(
            supabase,
            workspaceId,
            String(args.assigneeNameOrEmail)
          );
          if (matchedMember) {
            updateData.assignee_id = matchedMember.user_id;
            const prof = Array.isArray(matchedMember.profile)
              ? matchedMember.profile[0]
              : matchedMember.profile;
            newAssigneeName = prof?.full_name || prof?.email;

            await supabase
              .from("task_assignees")
              .upsert(
                { task_id: task.id, user_id: matchedMember.user_id },
                { onConflict: "task_id,user_id" }
              );
          }
        }

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
          metadata: {
            task_title: updatedTask.title,
            is_private: updatedTask.is_private,
            trigger: "ai_copilot",
          },
        });

        return {
          success: true,
          message: `Task "${updatedTask.title}" updated successfully.${newAssigneeName ? ` Assigned to ${newAssigneeName}.` : ""}${args.isPrivate !== undefined ? ` Confidentiality: ${args.isPrivate ? "Private" : "Public"}.` : ""}`,
          data: updatedTask,
          isMutation: true,
        };
      }

      case "assign_task": {
        const identifier = String(args.taskIdOrTitle || "").trim();
        const memberQuery = String(args.memberNameOrEmail || "").trim();

        const task = await resolveTask(supabase, workspaceId, identifier);
        if (!task) {
          return {
            success: false,
            message: `Task with title or ID "${identifier}" not found.`,
            isMutation: false,
          };
        }

        const member = await resolveWorkspaceMember(supabase, workspaceId, memberQuery);
        if (!member) {
          return {
            success: false,
            message: `Workspace member matching "${memberQuery}" was not found.`,
            isMutation: false,
          };
        }

        const { data: updatedTask, error } = await supabase
          .from("tasks")
          .update({ assignee_id: member.user_id })
          .eq("id", task.id)
          .eq("workspace_id", workspaceId)
          .select()
          .single();

        if (error || !updatedTask) {
          return {
            success: false,
            message: `Failed to assign task: ${error?.message}`,
            isMutation: false,
          };
        }

        await supabase
          .from("task_assignees")
          .upsert(
            { task_id: task.id, user_id: member.user_id },
            { onConflict: "task_id,user_id" }
          );

        const memberName = Array.isArray(member.profile)
          ? member.profile[0]?.full_name || member.profile[0]?.email
          : (member.profile as any)?.full_name || (member.profile as any)?.email;

        await recordToolActivity(supabase, {
          workspaceId,
          projectId: updatedTask.project_id,
          actorId: userId,
          entityType: "task",
          entityId: updatedTask.id,
          action: "task_assigned",
          metadata: {
            task_title: updatedTask.title,
            new_assignee_id: member.user_id,
            assignee_name: memberName,
            is_private: updatedTask.is_private,
            trigger: "ai_copilot",
          },
        });

        return {
          success: true,
          message: `Task "${updatedTask.title}" successfully assigned to ${memberName || "member"}.`,
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
            is_private: movedTask.is_private,
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
        const identifier = String(args.taskIdOrTitle || "").trim();
        const task = await resolveTask(supabase, workspaceId, identifier);

        if (!task) {
          return {
            success: false,
            message: `Task with title or ID "${identifier}" not found.`,
            isMutation: false,
          };
        }

        const isPrivileged = role === "owner" || role === "admin";
        const isCreator = (task as any).created_by === userId;

        if (!isPrivileged && !isCreator) {
          return {
            success: false,
            message:
              "Only workspace owners and administrators are permitted to delete other members' tasks. Members can only delete tasks they personally created.",
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
          metadata: {
            task_title: task.title,
            is_private: (task as any).is_private,
            trigger: "ai_copilot",
          },
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
          .select("id, title, status, priority, due_date, is_private, project:projects(name)")
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

      case "list_workspace_members": {
        const { data: members, error } = await supabase
          .from("workspace_members")
          .select(
            `
            user_id,
            role,
            created_at,
            profile:profiles (
              id,
              email,
              full_name
            )
          `
          )
          .eq("workspace_id", workspaceId)
          .order("role", { ascending: true });

        if (error) {
          return {
            success: false,
            message: `Failed to list workspace members: ${error.message}`,
            isMutation: false,
          };
        }

        const formatted = (members || []).map((m) => {
          const prof = Array.isArray(m.profile) ? m.profile[0] : m.profile;
          return {
            userId: m.user_id,
            role: m.role,
            name: prof?.full_name || prof?.email?.split("@")[0] || "Member",
            email: prof?.email || "",
          };
        });

        return {
          success: true,
          message: `Workspace has ${formatted.length} members.`,
          data: formatted,
          isMutation: false,
        };
      }

      case "add_project_member": {
        const projectIdentifier = String(args.projectIdOrName || "").trim();
        const memberQuery = String(args.memberNameOrEmail || "").trim();
        const roleInProject = args.role === "lead" ? "lead" : "member";

        const project = await resolveProject(supabase, workspaceId, projectIdentifier);
        if (!project) {
          return {
            success: false,
            message: `Project "${projectIdentifier}" not found.`,
            isMutation: false,
          };
        }

        const isWorkspacePrivileged = role === "owner" || role === "admin";
        if (!isWorkspacePrivileged) {
          const { data: leadCheck } = await supabase
            .from("project_members")
            .select("role")
            .eq("project_id", project.id)
            .eq("user_id", userId)
            .eq("role", "lead")
            .maybeSingle();

          if (!leadCheck) {
            return {
              success: false,
              message:
                "Only workspace administrators or project leads can add members to projects.",
              isMutation: false,
            };
          }
        }

        const member = await resolveWorkspaceMember(supabase, workspaceId, memberQuery);
        if (!member) {
          return {
            success: false,
            message: `Workspace member matching "${memberQuery}" not found.`,
            isMutation: false,
          };
        }

        const { error: insertErr } = await supabase.from("project_members").upsert(
          {
            project_id: project.id,
            user_id: member.user_id,
            role: roleInProject,
          },
          { onConflict: "project_id,user_id" }
        );

        if (insertErr) {
          return {
            success: false,
            message: `Failed to add member to project: ${insertErr.message}`,
            isMutation: false,
          };
        }

        const prof = Array.isArray(member.profile) ? member.profile[0] : member.profile;
        const memberName = prof?.full_name || prof?.email || "Member";

        return {
          success: true,
          message: `${memberName} successfully added to project "${project.name}" as [${roleInProject}].`,
          isMutation: true,
        };
      }

      case "remove_project_member": {
        const projectIdentifier = String(args.projectIdOrName || "").trim();
        const memberQuery = String(args.memberNameOrEmail || "").trim();

        const project = await resolveProject(supabase, workspaceId, projectIdentifier);
        if (!project) {
          return {
            success: false,
            message: `Project "${projectIdentifier}" not found.`,
            isMutation: false,
          };
        }

        const isWorkspacePrivileged = role === "owner" || role === "admin";
        if (!isWorkspacePrivileged) {
          const { data: leadCheck } = await supabase
            .from("project_members")
            .select("role")
            .eq("project_id", project.id)
            .eq("user_id", userId)
            .eq("role", "lead")
            .maybeSingle();

          if (!leadCheck) {
            return {
              success: false,
              message:
                "Only workspace administrators or project leads can remove members from projects.",
              isMutation: false,
            };
          }
        }

        const member = await resolveWorkspaceMember(supabase, workspaceId, memberQuery);
        if (!member) {
          return {
            success: false,
            message: `Workspace member matching "${memberQuery}" not found.`,
            isMutation: false,
          };
        }

        const { error: deleteErr } = await supabase
          .from("project_members")
          .delete()
          .eq("project_id", project.id)
          .eq("user_id", member.user_id);

        if (deleteErr) {
          return {
            success: false,
            message: `Failed to remove member: ${deleteErr.message}`,
            isMutation: false,
          };
        }

        const prof = Array.isArray(member.profile) ? member.profile[0] : member.profile;
        const memberName = prof?.full_name || prof?.email || "Member";

        return {
          success: true,
          message: `${memberName} removed from project "${project.name}".`,
          isMutation: true,
        };
      }

      case "list_project_members": {
        const projectIdentifier = String(args.projectIdOrName || "").trim();
        const project = await resolveProject(supabase, workspaceId, projectIdentifier);
        if (!project) {
          return {
            success: false,
            message: `Project "${projectIdentifier}" not found.`,
            isMutation: false,
          };
        }

        const { data: members, error } = await supabase
          .from("project_members")
          .select(
            `
            user_id,
            role,
            created_at,
            profile:profiles (
              id,
              email,
              full_name
            )
          `
          )
          .eq("project_id", project.id);

        if (error) {
          return {
            success: false,
            message: `Failed to query project members: ${error.message}`,
            isMutation: false,
          };
        }

        const formatted = (members || []).map((m) => {
          const prof = Array.isArray(m.profile) ? m.profile[0] : m.profile;
          return {
            userId: m.user_id,
            role: m.role,
            name: prof?.full_name || prof?.email?.split("@")[0] || "Member",
            email: prof?.email || "",
          };
        });

        return {
          success: true,
          message: `Project "${project.name}" has ${formatted.length} members.`,
          data: formatted,
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
