import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CalendarDays, CalendarRange, HelpCircle } from "lucide-react";
import type { DueDatePerformance } from "../types";

interface DueDateSummaryProps {
  performance: DueDatePerformance;
}

export function DueDateSummary({ performance }: DueDateSummaryProps) {
  const { overdue, today, thisWeek, upcoming, noDueDate } = performance;

  const cards = [
    {
      label: "Overdue",
      count: overdue,
      description: "Past deadline & pending",
      icon: AlertTriangle,
      color: overdue > 0 ? "text-destructive" : "text-muted-foreground",
      bgColor: overdue > 0 ? "bg-destructive/10" : "bg-muted/40",
    },
    {
      label: "Due Today",
      count: today,
      description: "Immediate priority",
      icon: Clock,
      color: today > 0 ? "text-amber-500" : "text-muted-foreground",
      bgColor: today > 0 ? "bg-amber-500/10" : "bg-muted/40",
    },
    {
      label: "Due This Week",
      count: thisWeek,
      description: "Next 7 days",
      icon: CalendarDays,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: "Upcoming",
      count: upcoming,
      description: "Beyond 7 days",
      icon: CalendarRange,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
    {
      label: "No Due Date",
      count: noDueDate,
      description: "Unscheduled tasks",
      icon: HelpCircle,
      color: "text-slate-400 dark:text-slate-500",
      bgColor: "bg-slate-500/10",
    },
  ];

  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Due-Date Performance</CardTitle>
          <Badge variant="outline" className="font-mono text-xs">
            Schedule Health
          </Badge>
        </div>
        <CardDescription>
          Upcoming deadlines and overdue risks across incomplete tasks
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {cards.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="border border-border/60 rounded-lg p-3 bg-card/60 hover:bg-muted/30 transition-colors flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                  <div className={`p-1 rounded-md ${item.bgColor}`}>
                    <Icon className={`h-3.5 w-3.5 ${item.color}`} />
                  </div>
                </div>

                <div className="mt-3">
                  <div className="text-xl font-bold tracking-tight text-foreground">
                    {item.count}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
