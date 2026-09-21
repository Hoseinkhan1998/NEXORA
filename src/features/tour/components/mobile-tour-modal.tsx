"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { TourRole } from "../types";
import { getTourStepsForRole } from "../lib/tour-steps";
import { markTourCompleted } from "../lib/tour-storage";
import {
  Crown,
  ShieldCheck,
  Rocket,
  Eye,
  Layers,
  Kanban,
  BarChart3,
  Users,
  Command,
  Sparkles,
  Bell,
  User,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface MobileTourModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: TourRole;
  workspaceId: string;
  userId: string;
}

const STEP_ICONS: Record<string, React.ElementType> = {
  Crown,
  ShieldCheck,
  Rocket,
  Eye,
  Layers,
  Kanban,
  BarChart3,
  Users,
  Command,
  Sparkles,
  Bell,
  User,
};

export function MobileTourModal({
  open,
  onOpenChange,
  role,
  workspaceId,
  userId,
}: MobileTourModalProps) {
  const steps = React.useMemo(() => getTourStepsForRole(role), [role]);
  const [currentIndex, setCurrentIndex] = React.useState(0);

  // Reset to first slide whenever modal transitions from closed to open
  const [prevOpen, setPrevOpen] = React.useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setCurrentIndex(0);
    }
  }

  const currentStep = steps[currentIndex] ?? steps[0];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === steps.length - 1;

  function handleNext() {
    if (isLast) {
      handleComplete();
    } else {
      setCurrentIndex((prev) => Math.min(prev + 1, steps.length - 1));
    }
  }

  function handlePrev() {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }

  function handleComplete() {
    markTourCompleted(workspaceId, userId, role);
    onOpenChange(false);
  }

  if (!currentStep) return null;

  const IconComponent = (currentStep.icon && STEP_ICONS[currentStep.icon]) || Sparkles;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[92vw] max-w-[92vw] rounded-2xl p-6 bg-card/95 backdrop-blur-xl border border-border/80 shadow-2xl">
        <DialogHeader className="text-left space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <IconComponent className="h-5 w-5" />
            </div>
            {currentStep.badge && (
              <Badge
                variant="outline"
                className="text-[11px] font-semibold tracking-wide whitespace-nowrap shrink-0"
              >
                {currentStep.badge}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-lg font-bold tracking-tight">
            {currentStep.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {currentStep.description}
          </DialogDescription>
        </DialogHeader>

        {/* Carousel Pagination Dots */}
        <div className="flex items-center justify-between py-3 border-t border-border/50 my-1">
          <div className="flex gap-1.5 items-center">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {currentIndex + 1} of {steps.length}
          </span>
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePrev}
            disabled={isFirst}
            className="text-xs h-9 px-3"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleComplete}
              className="text-xs h-9"
            >
              Skip
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleNext}
              className="text-xs h-9 font-semibold"
            >
              {isLast ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  Done
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
