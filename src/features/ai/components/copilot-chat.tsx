"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, AlertCircle, Plus, Clock } from "lucide-react";
import type { CopilotMessage } from "../types";
import { sendCopilotMessage } from "../actions/send-copilot-message";
import { CopilotMessageList } from "./copilot-message-list";
import { CopilotInput } from "./copilot-input";
import { CopilotHistory } from "./copilot-history";
import {
  type CopilotSession,
  getWorkspaceSessions,
  saveWorkspaceSessions,
  getActiveSessionId,
  setActiveSessionId,
  createNewSession,
  deleteSession,
  clearAllSessions,
  deriveSessionTitle,
} from "../lib/copilot-storage";

interface CopilotChatProps {
  workspaceSlug: string;
  workspaceName?: string;
}

export function CopilotChat({ workspaceSlug }: CopilotChatProps) {
  const router = useRouter();
  const [sessions, setSessions] = useState<CopilotSession[]>(() => {
    if (typeof window === "undefined") return [];
    const loaded = getWorkspaceSessions(workspaceSlug);
    if (loaded.length > 0) return loaded;
    const fresh = createNewSession(workspaceSlug, "New Conversation");
    return [fresh];
  });

  const [activeSessionId, setCurrentActiveId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const loaded = getWorkspaceSessions(workspaceSlug);
    const savedActiveId = getActiveSessionId(workspaceSlug);
    const matched = loaded.find((s) => s.id === savedActiveId) || loaded[0];
    return matched?.id ?? null;
  });

  const [messages, setMessages] = useState<CopilotMessage[]>(() => {
    if (typeof window === "undefined") return [];
    const loaded = getWorkspaceSessions(workspaceSlug);
    const savedActiveId = getActiveSessionId(workspaceSlug);
    const matched = loaded.find((s) => s.id === savedActiveId) || loaded[0];
    return matched?.messages || [];
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Sync messages into the active session
  const updateSessionMessages = (
    updater: (prevMessages: CopilotMessage[]) => CopilotMessage[],
    userFirstPrompt?: string
  ) => {
    setMessages((prev) => {
      const next = updater(prev);

      setSessions((prevSessions) => {
        const targetId = activeSessionId;
        const updatedSessions = prevSessions.map((session) => {
          if (session.id === targetId) {
            const isFirst = session.messages.length === 0 && userFirstPrompt;
            const title = isFirst
              ? deriveSessionTitle(userFirstPrompt)
              : session.title;

            return {
              ...session,
              title,
              messages: next,
              updatedAt: new Date().toISOString(),
            };
          }
          return session;
        });

        saveWorkspaceSessions(workspaceSlug, updatedSessions);
        return updatedSessions;
      });

      return next;
    });
  };

  const handleSend = (userText: string) => {
    const userMessage: CopilotMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userText,
      createdAt: new Date().toISOString(),
    };

    updateSessionMessages((prev) => [...prev, userMessage], userText);
    setErrorMessage(null);

    const nextMessagesPayload = [...messages, userMessage].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    startTransition(async () => {
      try {
        const payload = {
          workspaceSlug,
          messages: nextMessagesPayload,
        };

        const res = await sendCopilotMessage(payload);

        if (!res.success) {
          setErrorMessage(res.error.message);
          return;
        }

        updateSessionMessages((prev) => [...prev, res.message]);

        // If the AI performed real mutations (created/updated tasks or projects),
        // refresh server components so views (Kanban, Table, Projects list) update immediately
        if (res.hasMutations) {
          router.refresh();
          window.dispatchEvent(new CustomEvent("nexora:workspace-mutated"));
        }
      } catch (err) {
        console.error("[CopilotChat] Error communicating with copilot:", err);
        setErrorMessage("An unexpected network error occurred. Please try again.");
      }
    });
  };

  const handleNewChat = () => {
    const fresh = createNewSession(workspaceSlug, "New Conversation");
    setSessions((prev) => [fresh, ...prev]);
    setCurrentActiveId(fresh.id);
    setMessages([]);
    setErrorMessage(null);
  };

  const handleSelectSession = (sessionId: string) => {
    const target = sessions.find((s) => s.id === sessionId);
    if (!target) return;

    setCurrentActiveId(target.id);
    setActiveSessionId(workspaceSlug, target.id);
    setMessages(target.messages || []);
    setErrorMessage(null);
  };

  const handleDeleteSession = (sessionId: string) => {
    const remaining = deleteSession(workspaceSlug, sessionId);
    setSessions(remaining);

    if (activeSessionId === sessionId) {
      const nextActive = remaining[0];
      if (nextActive) {
        setCurrentActiveId(nextActive.id);
        setMessages(nextActive.messages || []);
      } else {
        const fresh = createNewSession(workspaceSlug, "New Conversation");
        setSessions([fresh]);
        setCurrentActiveId(fresh.id);
        setMessages([]);
      }
    }
  };

  const handleClearAllHistory = () => {
    clearAllSessions(workspaceSlug);
    const fresh = createNewSession(workspaceSlug, "New Conversation");
    setSessions([fresh]);
    setCurrentActiveId(fresh.id);
    setMessages([]);
    setErrorMessage(null);
    setShowHistory(false);
  };

  const handleClearCurrentChat = () => {
    updateSessionMessages(() => []);
    setErrorMessage(null);
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Top Action & Navigation Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/70 bg-muted/20 text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory((prev) => !prev)}
            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer gap-1.5"
            title="View chat history"
          >
            <Clock className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">History</span>
            <span className="px-1.5 py-0.2 rounded-full bg-muted font-mono text-[10px]">
              {sessions.length}
            </span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNewChat}
            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer gap-1"
            title="Start new conversation"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Chat</span>
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {activeSession && activeSession.title && activeSession.title !== "New Conversation" && (
            <span className="text-[11px] text-muted-foreground truncate max-w-[130px] font-medium hidden md:inline">
              {activeSession.title}
            </span>
          )}

          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCurrentChat}
              className="h-7 px-2 text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
              title="Clear current messages"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* History Slide-in Overlay */}
      {showHistory && (
        <CopilotHistory
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          onClearAll={handleClearAllHistory}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* Messages Scroll Area */}
      <CopilotMessageList
        messages={messages}
        isLoading={isPending}
        onSelectPrompt={handleSend}
      />

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="mx-4 mb-2 p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-start gap-2 animate-in fade-in-50">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">
            <p className="font-semibold">Unable to process inquiry</p>
            <p className="text-[11px] opacity-90 mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Input Area */}
      <CopilotInput onSend={handleSend} disabled={isPending} />
    </div>
  );
}
