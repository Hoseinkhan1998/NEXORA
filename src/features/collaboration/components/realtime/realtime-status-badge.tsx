"use client";

import { cn } from "@/lib/utils";
import type { RealtimeConnectionStatus } from "../../types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RealtimeStatusBadgeProps {
  status: RealtimeConnectionStatus;
  className?: string;
}

export function RealtimeStatusBadge({ status, className }: RealtimeStatusBadgeProps) {
  const config = {
    connected: {
      dot: "bg-emerald-500",
      ping: "bg-emerald-400 animate-ping",
      text: "Live",
      tooltip: "Real-time sync active (instant updates)",
    },
    connecting: {
      dot: "bg-amber-500",
      ping: "bg-amber-400 animate-pulse",
      text: "Connecting",
      tooltip: "Establishing real-time connection...",
    },
    disconnected: {
      dot: "bg-slate-400",
      ping: "",
      text: "Offline",
      tooltip: "Real-time disconnected. Changes will sync through standard requests.",
    },
    error: {
      dot: "bg-rose-500",
      ping: "",
      text: "Sync Error",
      tooltip: "Real-time sync unavailable. Normal mutations remain operational.",
    },
  }[status];

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono border border-border/60 bg-background/80 shadow-2xs select-none cursor-default",
              className
            )}
          >
            <span className="relative flex h-2 w-2 items-center justify-center">
              {config.ping && (
                <span
                  className={cn(
                    "absolute inline-flex h-full w-full rounded-full opacity-75",
                    config.ping
                  )}
                />
              )}
              <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", config.dot)} />
            </span>
            <span className="text-muted-foreground font-medium hidden sm:inline">
              {config.text}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {config.tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
