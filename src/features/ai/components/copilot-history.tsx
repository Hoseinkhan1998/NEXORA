"use client";

import { MessageSquare, Plus, Trash2, X, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CopilotSession } from "../lib/copilot-storage";

interface CopilotHistoryProps {
  sessions: CopilotSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export function CopilotHistory({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onClearAll,
  onClose,
}: CopilotHistoryProps) {
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.round(diffMs / 60000);
      const diffHours = Math.round(diffMs / 3600000);
      const diffDays = Math.round(diffMs / 86400000);

      if (diffMins < 2) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  return (
    <div className="absolute inset-0 z-30 bg-background/95 backdrop-blur-md flex flex-col border-r border-border animate-in fade-in-0 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/80 bg-muted/20">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-semibold text-foreground">Chat History</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-mono">
            {sessions.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
          aria-label="Close history"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* New Chat Button */}
      <div className="p-3 border-b border-border/60">
        <Button
          onClick={() => {
            onNewChat();
            onClose();
          }}
          className="w-full h-8 text-xs font-medium justify-center gap-2 cursor-pointer shadow-xs"
        >
          <Plus className="h-3.5 w-3.5" />
          New Conversation
        </Button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center p-4">
            <MessageSquare className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-xs font-medium text-muted-foreground">No conversations yet</p>
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">
              Start chatting with AI Copilot to save your history.
            </p>
          </div>
        ) : (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            return (
              <div
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  onClose();
                }}
                className={`group relative flex items-center justify-between p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                  isActive
                    ? "border-primary/40 bg-primary/5 text-foreground shadow-xs"
                    : "border-transparent hover:border-border hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  <MessageSquare
                    className={`h-3.5 w-3.5 shrink-0 ${
                      isActive ? "text-primary" : "text-muted-foreground/60"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate leading-tight">
                      {session.title || "Untitled Conversation"}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {formatTime(session.updatedAt)}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">·</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {session.messages.length} msg{session.messages.length === 1 ? "" : "s"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    title="Delete conversation"
                    aria-label="Delete conversation"
                    className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Clear All */}
      {sessions.length > 0 && (
        <div className="p-3 border-t border-border/60 bg-muted/10 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-[11px] text-muted-foreground hover:text-destructive h-7 px-2 cursor-pointer"
          >
            <Trash2 className="h-3 w-3 mr-1.5" />
            Clear All History
          </Button>
          <span className="text-[10px] text-muted-foreground/70 font-mono">
            Stored locally
          </span>
        </div>
      )}
    </div>
  );
}
