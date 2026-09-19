"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, AlertCircle } from "lucide-react";
import type { CopilotMessage } from "../types";
import { sendCopilotMessage } from "../actions/send-copilot-message";
import { CopilotMessageList } from "./copilot-message-list";
import { CopilotInput } from "./copilot-input";

interface CopilotChatProps {
  workspaceSlug: string;
  workspaceName?: string;
}

export function CopilotChat({ workspaceSlug }: CopilotChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSend = (userText: string) => {
    const userMessage: CopilotMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userText,
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const payload = {
          workspaceSlug,
          messages: nextMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        };

        const res = await sendCopilotMessage(payload);

        if (!res.success) {
          setErrorMessage(res.error.message);
          return;
        }

        setMessages((prev) => [...prev, res.message]);

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

  const handleClear = () => {
    setMessages([]);
    setErrorMessage(null);
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Action bar if messages exist */}
      {messages.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 bg-muted/20 text-xs">
          <span className="text-[11px] text-muted-foreground font-mono">
            {messages.length} message{messages.length === 1 ? "" : "s"}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Clear
          </Button>
        </div>
      )}

      {/* Messages Scroll Area */}
      <CopilotMessageList messages={messages} isLoading={isPending} onSelectPrompt={handleSend} />

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
