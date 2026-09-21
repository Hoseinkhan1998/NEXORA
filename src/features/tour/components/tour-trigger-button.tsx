"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Compass } from "lucide-react";
import { useProductTour } from "./product-tour-provider";
import { cn } from "@/lib/utils";

interface TourTriggerButtonProps {
  className?: string;
  variant?: "outline" | "ghost" | "default" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
}

export function TourTriggerButton({
  className,
  variant = "ghost",
  size = "sm",
  label = "Product Tour",
}: TourTriggerButtonProps) {
  const { startTour, isTourActive } = useProductTour();

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={() => startTour(true)}
      disabled={isTourActive}
      className={cn(
        "gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors",
        className
      )}
      aria-label="Start interactive product tour"
    >
      <Compass className="h-3.5 w-3.5 text-primary" />
      {label && <span>{label}</span>}
    </Button>
  );
}
