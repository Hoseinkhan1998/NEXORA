import type { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

interface AnalyticsPageProps {
  params: Promise<{ workspace: string }>;
}

export const metadata: Metadata = {
  title: "Analytics | NEXORA",
  description: "Workspace analytics and telemetry.",
};

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { workspace } = await params;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Telemetry scoped to workspace{" "}
          <span className="font-mono text-xs font-semibold text-foreground">/{workspace}</span>
        </p>
      </div>

      <Card className="shadow-xs max-w-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Workspace Metrics</CardTitle>
            <Badge variant="outline" className="font-mono text-[10px]">
              TASK 010 Upcoming
            </Badge>
          </div>
          <CardDescription>
            Multi-tenancy foundation is active. Analytics dashboards will be introduced in Task 010.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Metrics and reports will aggregate data exclusively from this tenant.
        </CardContent>
      </Card>
    </div>
  );
}
