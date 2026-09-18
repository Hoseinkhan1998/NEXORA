"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";

interface CopilotInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
}

export function CopilotInput({ onSend, disabled = false }: CopilotInputProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setContent("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  // Adjust textarea height dynamically
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= 2000) {
      setContent(val);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
      }
    }
  };

  return (
    <div className="p-3 border-t border-border bg-background/95 backdrop-blur-xs">
      <div className="relative rounded-xl border border-border/80 bg-muted/30 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all p-2 flex flex-col gap-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about this workspace..."
          disabled={disabled}
          rows={1}
          aria-label="Message to NEXORA Copilot"
          className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground resize-none focus:outline-hidden min-h-[36px] max-h-[120px] py-1 leading-relaxed"
        />

        <div className="flex items-center justify-between pt-1 border-t border-border/40">
          <span className="text-[10px] text-muted-foreground select-none">
            {content.length > 1500 && `${content.length}/2,000`}
            {content.length <= 1500 && "Enter to send, Shift+Enter for new line"}
          </span>

          <Button
            type="button"
            size="icon"
            onClick={handleSubmit}
            disabled={!content.trim() || disabled}
            aria-label="Send message"
            className="h-7 w-7 rounded-lg shrink-0 cursor-pointer"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
