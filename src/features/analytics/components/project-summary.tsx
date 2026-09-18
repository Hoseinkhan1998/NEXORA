import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";
import type { ProjectAnalyticsSummary } from "../types";

interface ProjectSummaryProps {
  summaries: ProjectAnalyticsSummary[];
}

export function ProjectSummary({ summaries }: ProjectSummaryProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Project Overview</CardTitle>
          <Badge variant="outline" className="font-mono text-xs">
            {summaries.length} Projects
          </Badge>
        </div>
        <CardDescription>
          Operational progress and task metrics across accessible projects
        </CardDescription>
      </CardHeader>

      <CardContent>
        {summaries.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No projects available in this workspace.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-medium">
                  <th className="pb-2.5 font-medium">Project</th>
                  <th className="pb-2.5 font-medium text-right">Tasks</th>
                  <th className="pb-2.5 font-medium text-right">Completed</th>
                  <th className="pb-2.5 font-medium text-center">Progress</th>
                  <th className="pb-2.5 font-medium text-right">Overdue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {summaries.map((proj) => (
                  <tr key={proj.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: proj.color || "#6366f1" }}
                        />
                        <span className="font-medium text-foreground truncate max-w-[200px]">
                          {proj.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-foreground font-semibold">
                      {proj.totalTasks}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-emerald-500 font-semibold">
                      {proj.completedTasks}
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-1.5 w-24 rounded-full bg-muted/60 overflow-hidden shrink-0">
                          <div
                            style={{ width: `${proj.completionRate}%` }}
                            className="h-full bg-emerald-500 transition-all duration-300"
                          />
                        </div>
                        <span className="font-mono text-[11px] text-muted-foreground w-8 text-right">
                          {proj.completionRate}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 pl-3 text-right font-mono">
                      {proj.overdueTasks > 0 ? (
                        <span className="inline-flex items-center gap-1 text-destructive font-semibold">
                          <AlertCircle className="h-3 w-3" />
                          {proj.overdueTasks}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
