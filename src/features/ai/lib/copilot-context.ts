import { createClient } from "@/lib/supabase/server";
import type {
  CopilotContextActivity,
  CopilotContextMember,
  CopilotContextProject,
  CopilotContextTask,
  WorkspaceContextData,
} from "../types";

/**
 * Truncates a string to maxLength and appends an ellipsis if truncated.
 */
export function truncate(str: string | null | undefined, maxLength: number): string | null {
  if (!str) return null;
  const trimmed = str.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.slice(0, maxLength).trimEnd() + "...";
}

/**
 * Retrieves and bounds workspace context for the AI Copilot.
 * Operates strictly with Row Level Security (RLS) under the current authenticated user.
 */
export async function getWorkspaceCopilotContext(
  workspaceId: string,
  workspaceSlug: string,
  workspaceName: string
): Promise<WorkspaceContextData> {
  const supabase = await createClient();

  // 1. Fetch accessible projects (limit 20)
  const { data: projectsData, error: projectsError } = await supabase
    .from("projects")
    .select("id, name, status, description")
    .eq("workspace_id", workspaceId)
    .order("status", { ascending: true }) // active first
    .order("created_at", { ascending: false })
    .limit(20);

  if (projectsError) {
    console.error("[copilot-context] Error loading projects:", projectsError);
  }

  // 2. Fetch accessible tasks (limit 50, prioritizing incomplete)
  const { data: tasksData, error: tasksError } = await supabase
    .from("tasks")
    .select(
      `
      id,
      project_id,
      title,
      description,
      status,
      priority,
      due_date,
      created_at,
      assignee:profiles!tasks_assignee_id_fkey(full_name, email),
      project:projects(name)
    `
    )
    .eq("workspace_id", workspaceId)
    .order("status", { ascending: true }) // todo & in_progress first
    .order("due_date", { ascending: true, nullsFirst: false })
    .limit(50);

  if (tasksError) {
    console.error("[copilot-context] Error loading tasks:", tasksError);
  }

  // 3. Fetch recent project activity (limit 15)
  const { data: activitiesData, error: activitiesError } = await supabase
    .from("project_activity")
    .select(
      `
      id,
      action,
      metadata,
      created_at,
      actor:profiles(full_name, email)
    `
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(15);

  if (activitiesError) {
    console.error("[copilot-context] Error loading activity:", activitiesError);
  }

  // Map and bound projects with task counts
  const projects: CopilotContextProject[] = (projectsData || []).map((p) => {
    const projTasks = (tasksData || []).filter((t) => t.project_id === p.id);
    const completed = projTasks.filter((t) => t.status === "done").length;
    return {
      id: p.id,
      name: p.name,
      status: p.status,
      description: truncate(p.description, 200),
      totalTasks: projTasks.length,
      completedTasks: completed,
    };
  });

  // Map and bound tasks
  const tasks: CopilotContextTask[] = (tasksData || []).map((t) => {
    const assignee = Array.isArray(t.assignee) ? t.assignee[0] : t.assignee;
    const project = Array.isArray(t.project) ? t.project[0] : t.project;

    return {
      id: t.id,
      projectName: project?.name || "Unknown Project",
      title: t.title,
      description: truncate(t.description, 200),
      status: t.status,
      priority: t.priority,
      assigneeName: assignee?.full_name || assignee?.email?.split("@")[0] || null,
      dueDate: t.due_date ? (t.due_date.split("T")[0] ?? null) : null,
    };
  });

  // Map and bound activities
  const recentActivities: CopilotContextActivity[] = (activitiesData || []).map((a) => {
    const actor = Array.isArray(a.actor) ? a.actor[0] : a.actor;
    const meta = a.metadata as Record<string, unknown> | null;
    const taskTitle = typeof meta?.task_title === "string" ? meta.task_title : null;

    return {
      id: a.id,
      action: a.action,
      taskTitle: truncate(taskTitle, 100),
      actorName: actor?.full_name || actor?.email?.split("@")[0] || null,
      createdAt: a.created_at,
    };
  });

  // 4. Fetch team members (limit 30)
  const { data: membersData, error: membersError } = await supabase
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
    .eq("workspace_id", workspaceId)
    .limit(30);

  if (membersError) {
    console.error("[copilot-context] Error loading members:", membersError);
  }

  const members: CopilotContextMember[] = (membersData || []).map((m) => {
    const prof = Array.isArray(m.profile) ? m.profile[0] : m.profile;
    return {
      id: m.user_id,
      name: prof?.full_name || prof?.email?.split("@")[0] || "Member",
      email: prof?.email || "",
      role: m.role,
    };
  });

  return {
    workspace: {
      id: workspaceId,
      name: workspaceName,
      slug: workspaceSlug,
    },
    projects,
    tasks,
    recentActivities,
    members,
  };
}

/**
 * Serializes workspace context data into a safe, bounded markdown/XML string for the system prompt.
 */
export function formatWorkspaceContextString(data: WorkspaceContextData): string {
  const { workspace, projects, tasks, recentActivities, members } = data;

  const projectLines =
    projects.length > 0
      ? projects
          .map(
            (p) =>
              `- [id: ${p.id}] [${p.status.toUpperCase()}] "${p.name}" (Tasks: ${p.completedTasks}/${p.totalTasks} done)${p.description ? `: ${p.description}` : ""}`
          )
          .join("\n")
      : "No projects in this workspace.";

  const taskLines =
    tasks.length > 0
      ? tasks
          .map(
            (t) =>
              `- [id: ${t.id}] [${t.status.toUpperCase()}] [${t.priority.toUpperCase()}] "${t.title}" (Project: ${t.projectName}${t.assigneeName ? `, Assignee: ${t.assigneeName}` : ", Unassigned"}${t.dueDate ? `, Due: ${t.dueDate}` : ", No due date"})${t.description ? ` — ${t.description}` : ""}`
          )
          .join("\n")
      : "No tasks in this workspace.";

  const activityLines =
    recentActivities.length > 0
      ? recentActivities
          .map(
            (a) =>
              `- ${a.createdAt.split("T")[0]}: ${a.actorName || "Someone"} performed "${a.action}"${a.taskTitle ? ` on task "${a.taskTitle}"` : ""}`
          )
          .join("\n")
      : "No recent activity recorded.";

  const memberLines =
    members && members.length > 0
      ? members
          .map(
            (m) =>
              `- ${m.name} (${m.email}) [Role: ${m.role}, UserID: ${m.id}]`
          )
          .join("\n")
      : "No member roster details.";

  return `
<workspace_context>
Workspace: ${workspace.name} (/${workspace.slug})

Team Members (${members?.length || 0} members):
${memberLines}

Projects (${projects.length} accessible):
${projectLines}

Tasks (${tasks.length} active/recent):
${taskLines}

Recent Activity (${recentActivities.length} events):
${activityLines}
</workspace_context>
`.trim();
}
