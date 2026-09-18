"useclient";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { StatusDistribution } from "../../types";

interface TaskStatusChartProps {
  distribution: StatusDistribution;
}

export function TaskStatusChart({ distribution }: TaskStatusChartProps) {
  const { todo, inProgress, done, total } = distribution;

  const items = [
    { ...done, bgClass: "bg-emerald-500", strokeClass: "stroke-emerald-500" },
    { ...inProgress, bgClass: "bg-blue-500", strokeClass: "stroke-blue-500" },
    {
      ...todo,
      bgClass: "bg-slate-400 dark:bg-slate-500",
      strokeClass: "stroke-slate-400 dark:stroke-slate-500",
    },
  ];

  // Calculate SVG donut segments
  const size = 160;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Compute stroke dash offsets
  let accumulatedPercent = 0;
  const segments = items.map((item) => {
    const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
    accumulatedPercent += item.percentage;
    return {
      ...item,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <Card className="shadow-xs h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Status Breakdown</CardTitle>
          <Badge variant="outline" className="font-mono text-xs">
            {total} Total
          </Badge>
        </div>
        <CardDescription>Task distribution by operational stage</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-center pt-2">
        {total === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground flex flex-col items-center justify-center">
            <div className="h-10 w-10 rounded-full border border-dashed border-border flex items-center justify-center mb-2">
              <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
            </div>
            <p className="font-medium text-foreground">No tasks to display</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tasks created in this scope will populate this chart.
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-2">
            {/* SVG Donut */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className="rotate-[-90deg] transition-all duration-500"
                aria-label={`Status distribution donut chart: ${done.count} Done, ${inProgress.count} In Progress, ${todo.count} To Do.`}
                role="img"
              >
                {/* Background Track */}
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  className="text-muted/30"
                />

                {/* Segments */}
                {segments.map((seg) => (
                  <circle
                    key={seg.status}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeDasharray={seg.strokeDasharray}
                    strokeDashoffset={seg.strokeDashoffset}
                    strokeLinecap="round"
                    className={`${seg.strokeClass} transition-all duration-500`}
                  />
                ))}
              </svg>

              {/* Center Metrics */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {done.percentage}%
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">
                  Completed
                </span>
              </div>
            </div>

            {/* Legend & Breakdown List */}
            <div className="w-full sm:w-44 space-y-2.5">
              {items.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between text-xs p-1.5 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${item.bgClass}`} />
                    <span className="font-medium text-foreground">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="font-semibold text-foreground">{item.count}</span>
                    <span className="text-muted-foreground text-[11px]">({item.percentage}%)</span>
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
