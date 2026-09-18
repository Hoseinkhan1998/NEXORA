import { BellOff } from "lucide-react";

interface NotificationEmptyProps {
  filter: "all" | "unread";
}

export function NotificationEmpty({ filter }: NotificationEmptyProps) {
  return (
    <div className="py-12 px-4 text-center flex flex-col items-center justify-center text-muted-foreground">
      <div className="h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center mb-2">
        <BellOff className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-xs font-medium text-foreground">
        {filter === "unread" ? "No unread notifications" : "No notifications yet"}
      </p>
      <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[200px]">
        {filter === "unread"
          ? "You are completely caught up!"
          : "Actions directed at you will appear in your notification feed."}
      </p>
    </div>
  );
}
