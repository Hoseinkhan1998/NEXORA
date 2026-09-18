"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import type { CopilotMessage } from "../types";
import { CopilotMessageItem } from "./copilot-message-item";
import { CopilotEmptyState } from "./copilot-empty-state";

interface CopilotMessageListProps {
  messages: CopilotMessage[];
  isLoading: boolean;
  onSelectPrompt: (prompt: string) => void;
}

export function CopilotMessageList({
  messages,
  isLoading,
  onSelectPrompt,
}: CopilotMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or loading change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0) {
    return <CopilotEmptyState onSelectPrompt={onSelectPrompt} />;
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((msg) => (
        <CopilotMessageItem key={msg.id} message={msg} />
      ))}

      {/* Assistant Loading Indicator */}
      {isLoading && (
        <div className="flex gap-3 items-start">
          <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div className="bg-muted/70 border border-border/60 rounded-2xl rounded-tl-xs p-3 shadow-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
              <span className="text-[11px] text-muted-foreground ml-1.5 font-medium">
                Analyzing workspace...
              </span>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} className="h-1" />
    </div>
  );
}
