"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Sparkles } from "lucide-react";
import { CopilotChat } from "./copilot-chat";

interface CopilotSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceSlug: string;
  workspaceName?: string;
}

export function CopilotSheet({
  open,
  onOpenChange,
  workspaceSlug,
  workspaceName,
}: CopilotSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl p-0 flex flex-col h-full gap-0 border-l border-border bg-background"
      >
        <SheetHeader className="p-4 border-b border-border text-left">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-primary/10 text-primary">
              <Sparkles className="h-4 w-4" />
            </div>
            <SheetTitle className="text-sm font-semibold text-foreground">AI Copilot</SheetTitle>
            {workspaceName && (
              <span className="text-xs text-muted-foreground font-normal truncate max-w-[200px]">
                · {workspaceName}
              </span>
            )}
          </div>
          <SheetDescription className="text-xs text-muted-foreground">
            Real-time project intelligence and workspace analytics
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          <CopilotChat
            key={workspaceSlug}
            workspaceSlug={workspaceSlug}
            workspaceName={workspaceName}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
