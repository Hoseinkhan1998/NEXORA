import { Sparkles, ArrowRight } from "lucide-react";

interface CopilotEmptyStateProps {
  onSelectPrompt: (prompt: string) => void;
}

export function CopilotEmptyState({ onSelectPrompt }: CopilotEmptyStateProps) {
  const suggestions = [
    "Summarize active projects and pending tasks",
    "Create a new task named 'Review performance'",
    "Which high-priority tasks are overdue or unassigned?",
    "What tasks are currently in progress?",
  ];

  return (
    <div className="flex flex-col items-center justify-center text-center p-6 space-y-6 my-auto">
      <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
        <Sparkles className="h-7 w-7" />
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h3 className="text-base font-semibold tracking-tight text-foreground">
          NEXORA AI Copilot
        </h3>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Ask questions about your projects, tasks, deadlines, and workload. Grounded in real
          workspace intelligence.
        </p>
      </div>

      <div className="w-full space-y-2 max-w-sm text-left">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-1">
          Suggested Questions
        </span>
        <div className="space-y-1.5">
          {suggestions.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => onSelectPrompt(prompt)}
              className="w-full flex items-center justify-between p-2.5 rounded-lg border border-border/70 bg-card/60 hover:bg-muted/50 hover:border-primary/40 text-xs text-foreground text-left transition-colors group cursor-pointer"
            >
              <span className="truncate pr-2">{prompt}</span>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
