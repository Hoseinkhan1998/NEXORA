"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles } from "lucide-react";

const CopilotSheet = dynamic(() => import("./copilot-sheet").then((mod) => mod.CopilotSheet), {
  ssr: false,
});

interface CopilotTriggerProps {
  workspaceSlug?: string;
  workspaceName?: string;
}

export function CopilotTrigger({ workspaceSlug, workspaceName }: CopilotTriggerProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("nexora:open-copilot", handleOpen);
    return () => window.removeEventListener("nexora:open-copilot", handleOpen);
  }, []);

  if (!workspaceSlug) {
    return null;
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(true)}
              aria-label="Open AI Copilot"
              className="h-8 gap-1.5 px-2.5 text-xs font-medium text-foreground hover:bg-muted/70 cursor-pointer border-border/80 shadow-2xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="hidden sm:inline">Copilot</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Ask AI Copilot
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isOpen && (
        <CopilotSheet
          open={isOpen}
          onOpenChange={setIsOpen}
          workspaceSlug={workspaceSlug}
          workspaceName={workspaceName}
        />
      )}
    </>
  );
}
