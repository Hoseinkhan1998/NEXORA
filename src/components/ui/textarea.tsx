import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  variant?: "default" | "error" | "success";
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant = "default", "aria-invalid": ariaInvalid, ...props }, ref) => {
    const isError = variant === "error" || ariaInvalid === true || ariaInvalid === "true";
    const isSuccess = variant === "success" && !isError;

    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          !isError && !isSuccess && "border-input focus-visible:ring-ring",
          isError &&
            "border-destructive text-destructive-foreground focus-visible:ring-destructive",
          isSuccess && "border-emerald-600 focus-visible:ring-emerald-600",
          className
        )}
        ref={ref}
        aria-invalid={isError ? "true" : undefined}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
