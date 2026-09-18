"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { History } from "lucide-react";
import { ActivityFeed } from "./activity-feed";
import type { ProjectActivityWithActor } from "../../types";

interface ActivitySheetProps {
  projectId: string;
  projectName: string;
  initialActivities: ProjectActivityWithActor[];
}

export function ActivitySheet({ projectId, projectName, initialActivities }: ActivitySheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium">
          <History className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Activity</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col gap-0">
        <SheetHeader className="p-4 border-b border-border/60">
          <SheetTitle className="text-base font-semibold flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <span>Project Activity</span>
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Live chronological stream of changes and updates for {projectName}.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          <ActivityFeed projectId={projectId} initialActivities={initialActivities} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
