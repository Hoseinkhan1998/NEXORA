import * as React from "react";
import { Building2, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function WorkspaceSwitcherPlaceholder() {
  return (
    <div className="flex w-full items-center justify-between rounded-lg border border-border/70 bg-card/60 p-2 text-left shadow-xs transition-colors select-none">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold text-xs shadow-xs">
          <Building2 className="h-3.5 w-3.5" />
        </div>
        <div className="flex flex-col min-w-0 leading-none">
          <span className="truncate text-xs font-semibold text-foreground">Main Workspace</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">Default Team</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0 pl-2">
        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-medium">
          Free
        </Badge>
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/70" />
      </div>
    </div>
  );
}
