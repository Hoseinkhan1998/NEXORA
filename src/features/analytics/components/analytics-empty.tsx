import { Card, CardContent } from "@/components/ui/card";
import { FolderKanban, CheckSquare } from "lucide-react";

interface AnalyticsEmptyProps {
  type: "no-projects" | "no-tasks";
}

export function AnalyticsEmpty({ type }: AnalyticsEmptyProps) {
  if (type === "no-projects") {
    return (
      <Card className="shadow-xs border-dashed">
        <CardContent className="py-16 text-center flex flex-col items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
            <FolderKanban className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold text-foreground">No projects found</h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Create your first project in this workspace to unlock full task analytics, completion
            trends, and workload intelligence.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-xs border-dashed">
      <CardContent className="py-16 text-center flex flex-col items-center justify-center">
        <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3">
          <CheckSquare className="h-6 w-6" />
        </div>
        <h2 className="text-base font-semibold text-foreground">No tasks in this workspace</h2>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Analytics will automatically synthesize task distributions, completion rates, and workload
          allocations as tasks are added to your projects.
        </p>
      </CardContent>
    </Card>
  );
}
