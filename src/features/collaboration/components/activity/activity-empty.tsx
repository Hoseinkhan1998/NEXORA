import { History } from "lucide-react";

export function ActivityEmpty() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground ring-4 ring-muted/30">
        <History className="h-5 w-5" />
      </div>
      <p className="mt-3 text-xs font-semibold text-foreground">No activity recorded yet</p>
      <p className="mt-1 text-[11px] text-muted-foreground max-w-xs leading-normal">
        Changes to tasks and project milestones will appear here in real time as your team
        collaborates.
      </p>
    </div>
  );
}
