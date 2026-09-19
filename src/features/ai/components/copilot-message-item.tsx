import { Sparkles, User } from "lucide-react";
import type { CopilotMessage } from "../types";

interface CopilotMessageItemProps {
  message: CopilotMessage;
}

/**
 * Lightweight safe markdown renderer for bold text, bullet points, and code spans.
 */
function FormattedContent({ text }: { text: string }) {
  // Split into lines to render paragraphs and lists
  const lines = text.split("\n");

  return (
    <div className="space-y-1.5 text-xs leading-relaxed break-words" dir="auto">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Bullet lists
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span className="text-primary select-none shrink-0">•</span>
              <span>{renderInlineStyles(trimmed.slice(2))}</span>
            </div>
          );
        }

        // Numbered lists
        const matchNumber = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (matchNumber) {
          const num = matchNumber[1];
          const content = matchNumber[2] ?? "";
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span className="font-mono text-muted-foreground select-none shrink-0">{num}.</span>
              <span>{renderInlineStyles(content)}</span>
            </div>
          );
        }

        // Heading lines (e.g. ### Heading)
        if (trimmed.startsWith("### ")) {
          return (
            <div key={idx} className="font-semibold text-foreground pt-1">
              {renderInlineStyles(trimmed.slice(4))}
            </div>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <div key={idx} className="font-bold text-foreground text-sm pt-1.5 pb-0.5">
              {renderInlineStyles(trimmed.slice(3))}
            </div>
          );
        }

        return <p key={idx}>{renderInlineStyles(line)}</p>;
      })}
    </div>
  );
}

/**
 * Parses bold (**text**) and code (`code`) inline spans safely.
 */
function renderInlineStyles(text: string) {
  const parts: Array<{ type: "text" | "bold" | "code"; value: string }> = [];
  let remaining = text;

  while (remaining.length > 0) {
    // Check for bold **...**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Check for code `...`
    const codeMatch = remaining.match(/`([^`]+)`/);

    const boldIndex = boldMatch ? remaining.indexOf(boldMatch[0]) : -1;
    const codeIndex = codeMatch ? remaining.indexOf(codeMatch[0]) : -1;

    let nextMatch: { type: "bold" | "code"; match: RegExpMatchArray; index: number } | null = null;

    if (boldIndex !== -1 && (codeIndex === -1 || boldIndex < codeIndex)) {
      if (boldMatch) {
        nextMatch = { type: "bold", match: boldMatch, index: boldIndex };
      }
    } else if (codeIndex !== -1) {
      if (codeMatch) {
        nextMatch = { type: "code", match: codeMatch, index: codeIndex };
      }
    }

    if (!nextMatch) {
      parts.push({ type: "text", value: remaining });
      break;
    }

    if (nextMatch.index > 0) {
      parts.push({ type: "text", value: remaining.slice(0, nextMatch.index) });
    }

    if (nextMatch.type === "bold") {
      parts.push({ type: "bold", value: nextMatch.match[1] || "" });
    } else {
      parts.push({ type: "code", value: nextMatch.match[1] || "" });
    }

    remaining = remaining.slice(nextMatch.index + nextMatch.match[0].length);
  }

  return parts.map((part, i) => {
    if (part.type === "bold") {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.value}
        </strong>
      );
    }
    if (part.type === "code") {
      return (
        <code
          key={i}
          className="font-mono text-[11px] px-1 py-0.5 rounded bg-muted text-foreground border border-border/60"
        >
          {part.value}
        </code>
      );
    }
    return <span key={i}>{part.value}</span>;
  });
}

export function CopilotMessageItem({ message }: CopilotMessageItemProps) {
  const isUser = message.role === "user";

  const timeString = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} items-start group`}>
      {/* Avatar / Icon */}
      <div
        className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-primary/10 border border-primary/20 text-primary"
        }`}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
      </div>

      {/* Message Bubble */}
      <div className={`max-w-[85%] space-y-1 ${isUser ? "text-right" : "text-left"}`}>
        <div
          className={`p-3 rounded-2xl text-xs ${
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-xs"
              : "bg-muted/70 border border-border/60 text-foreground rounded-tl-xs shadow-xs"
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed" dir="auto">
              {message.content}
            </p>
          ) : (
            <FormattedContent text={message.content} />
          )}
        </div>

        <span className="text-[10px] text-muted-foreground px-1 select-none">{timeString}</span>
      </div>
    </div>
  );
}
