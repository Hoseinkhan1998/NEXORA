import type { ProjectActivity, ActivityAction } from "../types";

export function formatStatusLabel(status: string | undefined): string {
  if (!status) return "";
  switch (status) {
    case "todo":
      return "To Do";
    case "in_progress":
      return "In Progress";
    case "done":
      return "Done";
    default:
      return status.replace("_", " ");
  }
}

export function formatPriorityLabel(priority: string | undefined): string {
  if (!priority) return "";
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

/**
 * Generates a clean human-readable narrative description of what occurred in an activity item.
 */
export function formatActivityNarrative(activity: ProjectActivity): {
  verb: string;
  details?: string;
} {
  const meta = activity.metadata;
  const title = meta.task_title ? `"${meta.task_title}"` : "a task";

  switch (activity.action) {
    case "task_created":
      return {
        verb: `created ${title}`,
      };

    case "task_status_changed": {
      const oldStatus = formatStatusLabel(meta.old_status as string);
      const newStatus = formatStatusLabel(meta.new_status as string);
      return {
        verb: `moved ${title} to ${newStatus}`,
        details: oldStatus ? `from ${oldStatus}` : undefined,
      };
    }

    case "task_moved": {
      const newStatus = formatStatusLabel(meta.new_status as string);
      return {
        verb: `reordered ${title}`,
        details: newStatus ? `in ${newStatus}` : undefined,
      };
    }

    case "task_priority_changed": {
      const oldPriority = formatPriorityLabel(meta.old_priority as string);
      const newPriority = formatPriorityLabel(meta.new_priority as string);
      return {
        verb: `changed priority of ${title} to ${newPriority}`,
        details: oldPriority ? `from ${oldPriority}` : undefined,
      };
    }

    case "task_assigned": {
      const assignee = (meta.assignee_name as string) || "someone";
      return {
        verb: `assigned ${title} to ${assignee}`,
      };
    }

    case "task_due_date_changed": {
      const newDate = meta.new_due_date as string;
      return {
        verb: newDate ? `scheduled ${title} for ${newDate}` : `removed due date from ${title}`,
      };
    }

    case "task_deleted":
      return {
        verb: `deleted ${title}`,
      };

    case "task_updated":
      return {
        verb: `updated details for ${title}`,
      };

    case "project_updated":
      return {
        verb: "updated project details",
      };

    case "project_archived":
      return {
        verb: "archived this project",
      };

    default:
      return {
        verb: `mutated ${title}`,
      };
  }
}

/**
 * Returns theme-tailored accent colors for activity icons and badges.
 */
export function getActivityVisualVariant(action: ActivityAction): {
  iconType: "create" | "status" | "priority" | "assign" | "calendar" | "delete" | "edit";
  badgeClass: string;
} {
  switch (action) {
    case "task_created":
      return {
        iconType: "create",
        badgeClass:
          "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      };
    case "task_status_changed":
    case "task_moved":
      return {
        iconType: "status",
        badgeClass: "text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20",
      };
    case "task_priority_changed":
      return {
        iconType: "priority",
        badgeClass: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
      };
    case "task_assigned":
      return {
        iconType: "assign",
        badgeClass: "text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20",
      };
    case "task_due_date_changed":
      return {
        iconType: "calendar",
        badgeClass: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      };
    case "task_deleted":
      return {
        iconType: "delete",
        badgeClass: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
      };
    default:
      return {
        iconType: "edit",
        badgeClass: "text-muted-foreground bg-muted border-border",
      };
  }
}
