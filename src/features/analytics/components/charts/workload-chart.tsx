import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { UserMinus } from "lucide-react";
import type { AssigneeWorkloadItem } from "../../types";

interface WorkloadChartProps {
  workload: AssigneeWorkloadItem[];
}

export function WorkloadChart({ workload }: WorkloadChartProps) {
  const totalTasks = workload.reduce((acc, item) => acc + item.total, 0);

  return (
    <Card className="shadow-xs h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Assignee Workload</CardTitle>
          <Badge variant="outline" className="font-mono text-xs">
            {workload.length} Contributors
          </Badge>
        </div>
        <CardDescription>
          Distribution of assigned, completed, and pending tasks across team members
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 pt-2">
        {workload.length === 0 || totalTasks === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center">
            <div className="h-10 w-10 rounded-full border border-dashed border-border flex items-center justify-center mb-2">
              <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
            </div>
            <p className="font-medium text-foreground">No active assignments</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tasks assigned to workspace members will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header Legend */}
            <div className="flex items-center justify-end gap-4 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Done</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span>Incomplete</span>
              </div>
            </div>

            <div className="divide-y divide-border/50">
              {workload.map((item) => {
                const initials = item.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                const isUnassigned = item.userId === null;
                const completedPct = item.total > 0 ? (item.completed / item.total) * 100 : 0;
                const incompletePct = 100 - completedPct;

                return (
                  <div key={item.userId ?? "unassigned"} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isUnassigned ? (
                          <div className="h-7 w-7 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                            <UserMinus className="h-3.5 w-3.5 text-amber-500" />
                          </div>
                        ) : (
                          <Avatar className="h-7 w-7 shrink-0">
                            {item.avatarUrl && <AvatarImage src={item.avatarUrl} alt={item.name} />}
                            <AvatarFallback className="text-[10px] font-medium bg-muted">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {item.name}
                          </p>
                          {item.email && (
                            <p className="text-[10px] text-muted-foreground truncate">
                              {item.email}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
                        <span className="text-emerald-500 font-semibold">{item.completed}</span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-foreground font-semibold">{item.total}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                          {item.completionRate}%
                        </Badge>
                      </div>
                    </div>

                    {/* Proportional Workload Bar */}
                    <div className="h-2 w-full rounded-full bg-muted/40 overflow-hidden flex shadow-inner">
                      {item.completed > 0 && (
                        <div
                          style={{ width: `${completedPct}%` }}
                          className="h-full bg-emerald-500 transition-all duration-300"
                          title={`${item.completed} completed`}
                        />
                      )}
                      {item.incomplete > 0 && (
                        <div
                          style={{ width: `${incompletePct}%` }}
                          className="h-full bg-blue-500 transition-all duration-300"
                          title={`${item.incomplete} incomplete`}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
