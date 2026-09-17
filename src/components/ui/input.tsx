import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "error" | "success";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type = "text", variant = "default", "aria-invalid": ariaInvalid, ...props },
    ref
  ) => {
    const isError = variant === "error" || ariaInvalid === true || ariaInvalid === "true";
    const isSuccess = variant === "success" && !isError;

    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
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
Input.displayName = "Input";

export { Input };
