import { driver, type Driver, type DriveStep } from "driver.js";
import type { TourRole } from "../types";
import { getTourStepsForRole } from "./tour-steps";
import { markTourCompleted } from "./tour-storage";

export interface CreateTourDriverOptions {
  workspaceId: string;
  userId: string;
  role: TourRole;
  onFinish?: () => void;
}

export function createTourDriver(options: CreateTourDriverOptions): Driver {
  const steps = getTourStepsForRole(options.role);

  const driveSteps: DriveStep[] = steps.map((step, index) => {
    const isLast = index === steps.length - 1;
    const badgeHtml = step.badge
      ? `<div class="nexora-tour-badge-wrapper"><span class="nexora-tour-badge">${step.badge}</span></div>`
      : "";

    return {
      element: step.element,
      popover: {
        title: `${badgeHtml}<div class="nexora-tour-title">${step.title}</div>`,
        description: step.description,
        side: step.side || "bottom",
        align: step.align || "start",
        showButtons: ["next", "previous", "close"],
        nextBtnText: isLast ? "Finish Tour ✓" : "Next →",
        prevBtnText: "← Back",
      },
    };
  });

  const tourDriver = driver({
    animate: true,
    smoothScroll: true,
    allowClose: true,
    overlayColor: "#000000",
    overlayOpacity: 0.5,
    stagePadding: 8,
    stageRadius: 8,
    popoverOffset: 12,
    showProgress: true,
    progressText: "{{current}} of {{total}}",
    steps: driveSteps,
    onDestroyed: () => {
      markTourCompleted(options.workspaceId, options.userId, options.role);
      options.onFinish?.();
    },
  });

  return tourDriver;
}
