"use client";

import { useSyncExternalStore } from "react";
import { Search } from "lucide-react";
import { formatShortcut } from "../lib/platform";

interface CommandTriggerProps {
  onClick: () => void;
}

const emptySubscribe = () => () => {};

export function CommandTrigger({ onClick }: CommandTriggerProps) {
  const shortcutText = useSyncExternalStore(
    emptySubscribe,
    () => formatShortcut("K"),
    () => "⌘K"
  );

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open Command Palette"
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/70 bg-muted/30 hover:bg-muted/60 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none"
    >
      <Search className="h-3.5 w-3.5 shrink-0 opacity-70" />
      <span className="hidden md:inline text-xs font-normal">Search or jump to...</span>
      <kbd className="hidden sm:inline-flex items-center justify-center font-mono text-[10px] px-1.5 py-0.5 rounded bg-background border border-border/80 font-medium text-muted-foreground shadow-2xs">
        {shortcutText}
      </kbd>
    </button>
  );
}
