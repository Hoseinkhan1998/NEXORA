import type { RoleTourConfig, TourRole, TourStep } from "../types";

export const ROLE_TOUR_STEPS: RoleTourConfig = {
  owner: [
    {
      id: "owner-welcome",
      title: "Welcome to NEXORA Workspace",
      description:
        "You are the Workspace Owner with full administrative authority. This tour introduces your tools to manage multi-tenancy, team permissions, projects, and AI intelligence.",
      badge: "Owner Access",
      icon: "Crown",
    },
    {
      id: "owner-workspace-switcher",
      element: "#tour-workspace-switcher",
      title: "Multi-Tenant Workspaces",
      description:
        "Quickly switch between your organizations or provision new workspaces. Your data is isolated with PostgreSQL Row-Level Security at the database kernel.",
      side: "right",
      align: "start",
      badge: "Tenancy",
      icon: "Layers",
    },
    {
      id: "owner-projects",
      element: "#tour-nav-projects",
      title: "Projects & 5 Perspectives",
      description:
        "Manage your software initiatives across 5 synchronized perspectives: Kanban with $O(1)$ fractional drag-and-drop, dense Table, Calendar, Gantt Timeline, and Linear List.",
      side: "right",
      align: "start",
      badge: "Core Workflow",
      icon: "Kanban",
    },
    {
      id: "owner-analytics",
      element: "#tour-nav-analytics",
      title: "Mathematical SVG Analytics",
      description:
        "Track sprint velocity, backlog distribution, and delivery throughput powered by lightweight SVG charts with zero bundle bloat.",
      side: "right",
      align: "start",
      badge: "Metrics",
      icon: "BarChart3",
    },
    {
      id: "owner-settings",
      element: "#tour-nav-settings",
      title: "Team Members & RBAC Settings",
      description:
        "Invite teammates via secure email or shareable links, assign roles (Admin, Member, Viewer), and manage organization security policies.",
      side: "right",
      align: "start",
      badge: "Administration",
      icon: "Users",
    },
    {
      id: "owner-command-bar",
      element: "#tour-command-bar",
      title: "Command-First Navigation (⌘K)",
      description:
        "Jump anywhere instantaneously using cmdk fuzzy search. Switch projects, open settings, or toggle themes in sub-millisecond response time.",
      side: "bottom",
      align: "center",
      badge: "Shortcut: ⌘K",
      icon: "Command",
    },
    {
      id: "owner-copilot",
      element: "#tour-copilot-trigger",
      title: "Autonomous AI Copilot (⌘J)",
      description:
        "Your contextual AI partner can autonomously create projects, decompose tasks, query team progress, and predict sprint blockers.",
      side: "bottom",
      align: "end",
      badge: "AI Powered",
      icon: "Sparkles",
    },
    {
      id: "owner-notifications",
      element: "#tour-notifications",
      title: "Real-Time Notifications",
      description:
        "Receive instant WebSocket alerts for task assignments, member invitations, and mentions without page refreshes.",
      side: "bottom",
      align: "end",
      badge: "Live Sync",
      icon: "Bell",
    },
    {
      id: "owner-user-menu",
      element: "#tour-user-menu",
      title: "Profile & Tour Replay",
      description:
        "Manage your account credentials, security sessions, and replay this tour whenever you need a quick refresher.",
      side: "bottom",
      align: "end",
      badge: "Account",
      icon: "User",
    },
  ],

  admin: [
    {
      id: "admin-welcome",
      title: "Welcome, Administrator",
      description:
        "As an Administrator, you coordinate software delivery, manage team access, configure projects, and leverage AI intelligence.",
      badge: "Admin Privileges",
      icon: "ShieldCheck",
    },
    {
      id: "admin-workspace-switcher",
      element: "#tour-workspace-switcher",
      title: "Workspace Context",
      description:
        "Seamlessly switch between accessible workspaces. All team data is protected by strict PostgreSQL RLS policies.",
      side: "right",
      align: "start",
      badge: "Navigation",
      icon: "Layers",
    },
    {
      id: "admin-projects",
      element: "#tour-nav-projects",
      title: "Sprint Management",
      description:
        "Create, update, and manage sprint projects. Utilize Kanban drag-and-drop, high-density Table sorting, and Gantt timeline scheduling.",
      side: "right",
      align: "start",
      badge: "Delivery",
      icon: "Kanban",
    },
    {
      id: "admin-analytics",
      element: "#tour-nav-analytics",
      title: "Velocity & Throughput",
      description:
        "Review sprint burnup rates, completion distributions, and identify project bottlenecks in real time.",
      side: "right",
      align: "start",
      badge: "Performance",
      icon: "BarChart3",
    },
    {
      id: "admin-settings",
      element: "#tour-nav-settings",
      title: "Team Invitations & Roles",
      description:
        "Invite collaborators to the team, update permissions for Members and Viewers, and maintain team directory hygiene.",
      side: "right",
      align: "start",
      badge: "Team Management",
      icon: "Users",
    },
    {
      id: "admin-command-bar",
      element: "#tour-command-bar",
      title: "Command Palette (⌘K)",
      description:
        "Use universal keyboard shortcuts to locate tasks, switch views, or navigate across projects without leaving your keyboard.",
      side: "bottom",
      align: "center",
      badge: "Shortcut: ⌘K",
      icon: "Command",
    },
    {
      id: "admin-copilot",
      element: "#tour-copilot-trigger",
      title: "AI Copilot (⌘J)",
      description:
        "Accelerate project planning by asking the AI copilot to break down epic milestones and analyze active sprint risks.",
      side: "bottom",
      align: "end",
      badge: "AI Powered",
      icon: "Sparkles",
    },
    {
      id: "admin-notifications",
      element: "#tour-notifications",
      title: "Activity Alerts",
      description:
        "Stay informed with real-time audit notifications and alerts when tasks move across columns or milestones change.",
      side: "bottom",
      align: "end",
      badge: "Realtime",
      icon: "Bell",
    },
    {
      id: "admin-user-menu",
      element: "#tour-user-menu",
      title: "Preferences & Support",
      description:
        "Update your profile photo, adjust theme settings, or restart this guide anytime.",
      side: "bottom",
      align: "end",
      badge: "Account",
      icon: "User",
    },
  ],

  member: [
    {
      id: "member-welcome",
      title: "Welcome to Your Workspace",
      description:
        "NEXORA empowers you to build with velocity. Let's explore your daily workflow tools, views, and keyboard shortcuts.",
      badge: "Contributor",
      icon: "Rocket",
    },
    {
      id: "member-projects",
      element: "#tour-nav-projects",
      title: "Dynamic Project Views",
      description:
        "View and execute tasks with 5 synchronized views: Drag cards on Kanban with instant optimistic updates, filter in Table, and track sprint deadlines on Timeline.",
      side: "right",
      align: "start",
      badge: "Execution",
      icon: "Kanban",
    },
    {
      id: "member-analytics",
      element: "#tour-nav-analytics",
      title: "Personal & Sprint Metrics",
      description:
        "Monitor project velocity, track completed items, and keep an eye on upcoming sprint deadlines.",
      side: "right",
      align: "start",
      badge: "Insights",
      icon: "BarChart3",
    },
    {
      id: "member-settings",
      element: "#tour-nav-settings",
      title: "Team Directory",
      description:
        "View your team members, check active workspace roles, and inspect project collaborators.",
      side: "right",
      align: "start",
      badge: "Team",
      icon: "Users",
    },
    {
      id: "member-command-bar",
      element: "#tour-command-bar",
      title: "Fast Command Palette (⌘K)",
      description:
        "Press ⌘K (Ctrl+K) to search any task. Use quick keybindings like pressing 'C' to create a new task instantly.",
      side: "bottom",
      align: "center",
      badge: "Shortcut: ⌘K",
      icon: "Command",
    },
    {
      id: "member-copilot",
      element: "#tour-copilot-trigger",
      title: "In-App AI Copilot (⌘J)",
      description:
        "Ask the AI copilot to write task descriptions, draft acceptance criteria, or summarize sprint blockers in seconds.",
      side: "bottom",
      align: "end",
      badge: "AI Assistant",
      icon: "Sparkles",
    },
    {
      id: "member-notifications",
      element: "#tour-notifications",
      title: "Instant Collaboration Alerts",
      description:
        "Never miss a beat with live notifications when teammates assign tasks to you or update shared project items.",
      side: "bottom",
      align: "end",
      badge: "Live",
      icon: "Bell",
    },
    {
      id: "member-user-menu",
      element: "#tour-user-menu",
      title: "Account & Tour Replay",
      description:
        "Customize your display name, upload an avatar, and replay this tour whenever you want.",
      side: "bottom",
      align: "end",
      badge: "Profile",
      icon: "User",
    },
  ],

  viewer: [
    {
      id: "viewer-welcome",
      title: "Welcome to NEXORA (Stakeholder View)",
      description:
        "You have Viewer access to observe and track progress across projects, delivery milestones, and team velocity in real time.",
      badge: "Read-Only Access",
      icon: "Eye",
    },
    {
      id: "viewer-projects",
      element: "#tour-nav-projects",
      title: "Transparent Project Progress",
      description:
        "Follow development milestones across 5 perspectives: inspect Kanban columns, filter dense Tables, and check delivery timelines on the Gantt chart.",
      side: "right",
      align: "start",
      badge: "Observability",
      icon: "Kanban",
    },
    {
      id: "viewer-analytics",
      element: "#tour-nav-analytics",
      title: "Sprint Analytics & Health",
      description:
        "Explore real-time velocity graphs and status distributions to review overall team momentum without editing permissions.",
      side: "right",
      align: "start",
      badge: "Transparency",
      icon: "BarChart3",
    },
    {
      id: "viewer-command-bar",
      element: "#tour-command-bar",
      title: "Universal Search (⌘K)",
      description:
        "Search through all tasks and projects quickly with fuzzy text search to find any roadmap item.",
      side: "bottom",
      align: "center",
      badge: "Shortcut: ⌘K",
      icon: "Command",
    },
    {
      id: "viewer-copilot",
      element: "#tour-copilot-trigger",
      title: "Project Intelligence Copilot (⌘J)",
      description:
        "Ask the AI Copilot questions about active sprint goals, task statuses, or roadmap progress.",
      side: "bottom",
      align: "end",
      badge: "Q&A Assistant",
      icon: "Sparkles",
    },
    {
      id: "viewer-notifications",
      element: "#tour-notifications",
      title: "Updates & Alerts",
      description:
        "Receive real-time notifications about workspace activity and relevant status changes.",
      side: "bottom",
      align: "end",
      badge: "Updates",
      icon: "Bell",
    },
    {
      id: "viewer-user-menu",
      element: "#tour-user-menu",
      title: "Profile & Tour Replay",
      description: "Adjust your theme preferences (Dark/Light mode) or replay this tour anytime.",
      side: "bottom",
      align: "end",
      badge: "Account",
      icon: "User",
    },
  ],
};

export function getTourStepsForRole(role: TourRole): TourStep[] {
  return ROLE_TOUR_STEPS[role] || ROLE_TOUR_STEPS.member;
}
