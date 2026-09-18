import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban,
  CheckSquare,
  CheckCircle2,
  TrendingUp,
  AlertCircle,
  UserMinus,
} from "lucide-react";
import type { KpiMetrics } from "../types";

interface AnalyticsKpiGridProps {
  kpis: KpiMetrics;
}

export function AnalyticsKpiGrid({ kpis }: AnalyticsKpiGridProps) {
  const cards = [
    {
      title: "Total Projects",
      value: kpis.totalProjects,
      description: "Active projects in scope",
      icon: FolderKanban,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      badge: null,
    },
    {
      title: "Total Tasks",
      value: kpis.totalTasks,
      description: `${kpis.incompleteTasks} remaining`,
      icon: CheckSquare,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      badge: null,
    },
    {
      title: "Completed Tasks",
      value: kpis.completedTasks,
      description: "Resolved to Done",
      icon: CheckCircle2,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      badge: null,
    },
    {
      title: "Completion Rate",
      value: `${kpis.completionRate}%`,
      description: `${kpis.completedTasks} of ${kpis.totalTasks} tasks`,
      icon: TrendingUp,
      color: "text-teal-500",
      bgColor: "bg-teal-500/10",
      badge:
        kpis.completionRate >= 80
          ? { text: "High", variant: "default" as const }
          : kpis.completionRate >= 40
            ? { text: "Pacing", variant: "secondary" as const }
            : { text: "In Progress", variant: "outline" as const },
    },
    {
      title: "Overdue Tasks",
      value: kpis.overdueTasks,
      description: kpis.overdueTasks === 0 ? "All caught up" : "Requires attention",
      icon: AlertCircle,
      color: kpis.overdueTasks > 0 ? "text-destructive" : "text-muted-foreground",
      bgColor: kpis.overdueTasks > 0 ? "bg-destructive/10" : "bg-muted",
      badge:
        kpis.overdueTasks > 0
          ? { text: "Action Needed", variant: "destructive" as const }
          : { text: "Clean", variant: "outline" as const },
    },
    {
      title: "Unassigned Tasks",
      value: kpis.unassignedTasks,
      description: "Need team owner",
      icon: UserMinus,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
      badge: kpis.unassignedTasks > 0 ? { text: "Unclaimed", variant: "outline" as const } : null,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title} className="shadow-xs hover:border-border/80 transition-colors">
            <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{card.title}</span>
                <div className={`p-1.5 rounded-md ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </div>

              <div>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {card.value}
                </div>
                <div className="flex items-center justify-between gap-1 mt-1">
                  <p className="text-[11px] text-muted-foreground truncate">{card.description}</p>
                  {card.badge && (
                    <Badge
                      variant={card.badge.variant}
                      className="text-[10px] px-1.5 py-0 font-medium shrink-0"
                    >
                      {card.badge.text}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
