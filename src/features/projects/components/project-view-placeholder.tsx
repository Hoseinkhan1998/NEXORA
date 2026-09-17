import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TableProperties, CalendarDays, Clock, Sparkles } from "lucide-react";
import type { ProjectView } from "../types/views";
import { PROJECT_VIEW_CONFIGS } from "../types/views";

interface ProjectViewPlaceholderProps {
  view: ProjectView;
}

const VIEW_ICONS: Record<ProjectView, React.ComponentType<{ className?: string }>> = {
  list: Sparkles,
  kanban: Sparkles,
  table: TableProperties,
  calendar: CalendarDays,
  timeline: Clock,
};

export function ProjectViewPlaceholder({ view }: ProjectViewPlaceholderProps) {
  const config = PROJECT_VIEW_CONFIGS[view];
  const IconComponent = VIEW_ICONS[view] || Sparkles;

  return (
    <Card className="border-dashed border-border/80 bg-muted/20">
      <CardContent className="flex flex-col items-center justify-center text-center py-16 px-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 ring-8 ring-primary/5">
          <IconComponent className="h-6 w-6" />
        </div>
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-base font-semibold text-foreground">{config.label} View</h3>
          <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider">
            Roadmap
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground max-w-md mb-4">{config.description}</p>
        <p className="text-[11px] text-muted-foreground/80 font-mono bg-muted/60 px-3 py-1 rounded-md border border-border/40">
          This view is scheduled for a future release on the NEXORA product roadmap.
        </p>
      </CardContent>
    </Card>
  );
}
