import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PriorityDistribution } from "../../types";

interface PriorityChartProps {
  distribution: PriorityDistribution;
}

export function PriorityChart({ distribution }: PriorityChartProps) {
  const { urgent, high, medium, low, total } = distribution;

  const items = [
    {
      ...urgent,
      bgClass: "bg-red-500",
      textClass: "text-red-500",
      badgeVariant: "destructive" as const,
    },
    {
      ...high,
      bgClass: "bg-amber-500",
      textClass: "text-amber-500",
      badgeVariant: "secondary" as const,
    },
    {
      ...medium,
      bgClass: "bg-sky-500",
      textClass: "text-sky-500",
      badgeVariant: "outline" as const,
    },
    {
      ...low,
      bgClass: "bg-slate-400 dark:bg-slate-500",
      textClass: "text-slate-400 dark:text-slate-500",
      badgeVariant: "outline" as const,
    },
  ];

  return (
    <Card className="shadow-xs h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Priority Distribution</CardTitle>
          <Badge variant="outline" className="font-mono text-xs">
            {total} Total
          </Badge>
        </div>
        <CardDescription>Task allocation by severity and priority levels</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-center pt-2">
        {total === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center">
            <div className="h-10 w-10 rounded-full border border-dashed border-border flex items-center justify-center mb-2">
              <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
            </div>
            <p className="font-medium text-foreground">No priority data</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tasks created in this scope will populate this chart.
            </p>
          </div>
        ) : (
          <div className="space-y-5 py-2">
            {/* Proportional Stacked Segment Bar */}
            <div className="space-y-1.5">
              <div className="h-4 w-full rounded-full bg-muted/40 overflow-hidden flex shadow-inner">
                {items.map((item) =>
                  item.count > 0 ? (
                    <div
                      key={item.priority}
                      style={{ width: `${Math.max(item.percentage, 2)}%` }}
                      className={`${item.bgClass} h-full transition-all duration-500 relative group`}
                      title={`${item.label}: ${item.count} tasks (${item.percentage}%)`}
                    />
                  ) : null
                )}
              </div>
            </div>

            {/* Detailed Row Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {items.map((item) => (
                <div
                  key={item.priority}
                  className="border border-border/60 rounded-lg p-2.5 bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-medium text-muted-foreground">{item.label}</span>
                    <span className={`h-2 w-2 rounded-full shrink-0 ${item.bgClass}`} />
                  </div>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-lg font-bold tracking-tight text-foreground">
                      {item.count}
                    </span>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
