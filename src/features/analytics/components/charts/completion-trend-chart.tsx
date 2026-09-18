"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Info, TrendingUp } from "lucide-react";
import type { CompletionTrendPoint, DateRangePreset } from "../../types";

interface CompletionTrendChartProps {
  points: CompletionTrendPoint[];
  hasHistory: boolean;
  dateRange: DateRangePreset;
}

export function CompletionTrendChart({ points, hasHistory, dateRange }: CompletionTrendChartProps) {
  const totalPeriodCompleted = points.reduce((acc, p) => acc + p.count, 0);

  // Range text descriptor
  const rangeLabels: Record<DateRangePreset, string> = {
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 90 days",
    all: "All time",
  };

  // Dimensions for SVG coordinate space
  const width = 640;
  const height = 180;
  const paddingLeft = 32;
  const paddingRight = 16;
  const paddingTop = 20;
  const paddingBottom = 28;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxCount = Math.max(...points.map((p) => p.count), 3);

  // Compute point coordinates
  const coords = points.map((p, idx) => {
    const x =
      points.length > 1
        ? paddingLeft + (idx / (points.length - 1)) * chartWidth
        : paddingLeft + chartWidth / 2;
    const y = paddingTop + chartHeight - (p.count / maxCount) * chartHeight;
    return { ...p, x, y };
  });

  // Construct SVG Area and Line paths
  const firstCoord = coords[0];
  const lastCoord = coords[coords.length - 1];

  const linePath = firstCoord
    ? `M ${firstCoord.x} ${firstCoord.y} ` +
      coords
        .slice(1)
        .map((c) => `L ${c.x} ${c.y}`)
        .join(" ")
    : "";

  const areaPath =
    firstCoord && lastCoord
      ? `${linePath} L ${lastCoord.x} ${paddingTop + chartHeight} L ${firstCoord.x} ${paddingTop + chartHeight} Z`
      : "";

  // Select evenly spaced ticks for X-axis (up to 6 ticks)
  const tickStep = Math.max(1, Math.floor(points.length / 5));
  const displayTicks = coords.filter(
    (_, i) => i === 0 || i === coords.length - 1 || i % tickStep === 0
  );

  return (
    <Card className="shadow-xs h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold">Completion Velocity</CardTitle>
            <Badge variant="secondary" className="text-xs font-normal">
              {rangeLabels[dateRange]}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span className="font-semibold text-foreground">{totalPeriodCompleted}</span> completed
          </div>
        </div>
        <CardDescription>
          Daily task resolution frequency derived from project activity logs
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col justify-center pt-2">
        {!hasHistory ? (
          <div className="py-12 px-4 text-center text-sm text-muted-foreground flex flex-col items-center justify-center">
            <div className="h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center mb-2">
              <Info className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">Insufficient completion history</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              As team members transition tasks from In Progress to Done, real-time resolution
              velocity will be charted across your selected timeframe.
            </p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <div className="min-w-[480px]">
              <svg
                viewBox={`0 0 ${width} ${height}`}
                className="w-full h-auto overflow-visible"
                aria-label={`Task completion velocity over time. Total: ${totalPeriodCompleted} tasks resolved.`}
                role="img"
              >
                <defs>
                  <linearGradient id="completion-area-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Y-Axis Gridlines */}
                {[0, Math.round(maxCount / 2), maxCount].map((val) => {
                  const y = paddingTop + chartHeight - (val / maxCount) * chartHeight;
                  return (
                    <g key={val}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={width - paddingRight}
                        y2={y}
                        stroke="currentColor"
                        strokeDasharray="4 4"
                        className="text-border/60"
                      />
                      <text
                        x={paddingLeft - 8}
                        y={y + 3}
                        textAnchor="end"
                        className="fill-muted-foreground text-[10px] font-mono"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Area Gradient */}
                {areaPath && <path d={areaPath} fill="url(#completion-area-gradient)" />}

                {/* Main Line */}
                {linePath && (
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}

                {/* Data Points */}
                {coords.map((pt) => (
                  <g key={pt.date} className="group">
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={pt.count > 0 ? "4" : "2"}
                      className={
                        pt.count > 0
                          ? "fill-emerald-500 stroke-background stroke-2 transition-all hover:r-6 cursor-pointer"
                          : "fill-muted-foreground/40"
                      }
                    >
                      <title>{`${pt.label}: ${pt.count} task${pt.count === 1 ? "" : "s"} completed`}</title>
                    </circle>
                  </g>
                ))}

                {/* X-Axis Labels */}
                {displayTicks.map((tick) => (
                  <text
                    key={tick.date}
                    x={tick.x}
                    y={height - 6}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px] font-medium"
                  >
                    {tick.label}
                  </text>
                ))}
              </svg>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
