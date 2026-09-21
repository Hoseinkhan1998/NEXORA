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
      ? `<span style="display:inline-block; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; padding:2px 8px; border-radius:9999px; background:rgba(99,102,241,0.18); color:#818cf8; border:1px solid rgba(99,102,241,0.3); margin-bottom:8px;">${step.badge}</span>`
      : "";

    return {
      element: step.element,
      popover: {
        title: `${badgeHtml}<div style="font-weight:700; font-size:15px; line-height:1.3; color:#f8fafc;">${step.title}</div>`,
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
    overlayColor: "black",
    overlayOpacity: 0.72,
    stagePadding: 6,
    stageRadius: 10,
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
